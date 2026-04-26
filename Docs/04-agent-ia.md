# Agent IA de veille

L'agent est le cœur de Tendro. Il tourne automatiquement chaque jour et peut aussi être déclenché manuellement depuis les paramètres.

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    /api/cron/agent                           │
│                                                              │
│  Pour chaque cron_config active :                            │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │  Stream 1        │    │  Stream 2                    │   │
│  │  BOAMP (online)  │    │  Gmail (email)               │   │
│  └────────┬─────────┘    └──────────────┬───────────────┘   │
│           │                             │                    │
│    fetchBoampTenders()         fetchUnreadEmails()           │
│           │                             │                    │
│    Déduplication BD              Claude : is_tender ?        │
│           │                             │                    │
│    scoreTenders() [batch]        scoreTenders() [unitaire]   │
│           │                             │                    │
│    score ≥ 30 ?                  score ≥ 30 ?                │
│           │                             │                    │
│    INSERT tenders               INSERT tenders               │
│    INSERT matches               INSERT matches               │
└─────────────────────────────────────────────────────────────┘
```

---

## Stream 1 — BOAMP (Bulletin Officiel des Annonces de Marchés Publics)

### Source de données
L'API publique **BOAMP OpenDataSoft** (sans clé API) :
```
https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records
```

### Filtres appliqués
```typescript
// lib/datagouvfr.ts — fetchBoampTenders()

conditions = [
  `dateparution > date'${isoDateDaysAgo(60)}'`,       // 60 derniers jours
  `nature in ("APPEL_OFFRE","MARCHE_NEGOCIE")`,        // Opportunités uniquement
  `(search(objet,"${kw}") OR search(descripteur_libelle,"${kw}"))`,  // Mots-clés
  `code_departement in ("75","77","78","91","92","93","94","95")`,    // Région
]
```

### Champs récupérés
| Champ BOAMP | Mappé vers |
|---|---|
| `idweb` | `raw_data.id` (déduplication) |
| `objet` | `tenders.title` |
| `descripteur_libelle` | `tenders.description` |
| `nomacheteur` | `tenders.contracting_authority` |
| `code_departement` | → résolution région |
| `datelimitereponse` | `tenders.deadline` |
| `url_avis` | `raw_data.url` |

**Limite :** 30 résultats par appel. Le budget (`montant`) n'est pas disponible dans l'API publique.

### Déduplication
Avant scoring, l'agent vérifie quels `idweb` sont déjà présents en base :
```typescript
const { data: existing } = await supabaseAdmin
  .from("tenders")
  .select("raw_data")
  .in("raw_data->>id", ids);  // Requête sur champ JSONB
```

### Scoring en batch (Claude)
Les appels d'offres nouveaux sont envoyés en **un seul appel Claude** pour limiter les coûts :

```typescript
// Prompt envoyé à Claude
`Score each of the following ${n} tender notices from 0 to 100
 based on how well they match the company's sector, region, keywords, and capacity.
 Return a JSON array: [{ "index": 0, "score": 85, "reasoning": "..." }, ...]`
```

Claude retourne un tableau indexé. L'agent reconstruit la correspondance via un `Map<index, score>`.

**Seuil d'insertion :** score `< 30` → ignoré.

---

## Stream 2 — Gmail

### Prérequis
Variables d'environnement requises : `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`.

Si ces variables sont absentes, le stream Gmail est ignoré silencieusement.

### Fonctionnement
```typescript
// lib/gmail.ts
const emails = await fetchUnreadEmails(10);  // 10 derniers non lus

for (const email of emails) {
  // Étape 1 : Classification
  const { is_tender, tender_data } = await callClaude(classifyPrompt);

  if (is_tender) {
    // Étape 2 : Scoring individuel
    const { score, reasoning } = await callClaude(scorePrompt);

    // Insertion si score ≥ 30
    await supabaseAdmin.from("tenders").insert({ source: "email", ...tender_data });
    await supabaseAdmin.from("matches").insert({ score, reasoning });
  }
}
```

### Champs extraits par Claude
```json
{
  "is_tender": true,
  "tender_data": {
    "title": "...",
    "contracting_authority": "...",
    "authority_email": "...",
    "deadline": "2025-06-14",
    "budget": 2400000,
    "sector": "Informatique & Digital",
    "region": "Île-de-France",
    "description": "..."
  }
}
```

---

## Profil entreprise utilisé pour le scoring

L'agent construit ce profil à partir de la table `companies` + `cron_config` :

```typescript
const companyProfile = {
  name: company.name,
  sector: company.sector,          // Ex. "Informatique & Digital"
  region: company.region,          // Ex. "Île-de-France"
  description: company.description,
  keywords: config.keywords,       // Ex. ["cloud", "cybersécurité"]
};
```

Ce profil est inclus dans chaque prompt de scoring pour que Claude évalue la pertinence.

---

## Déclenchement

### Automatique (Vercel Cron)
Configuré dans `vercel.json` :
```json
{
  "crons": [{ "path": "/api/cron/agent", "schedule": "0 8 * * *" }]
}
```
Exécution quotidienne à **08h00 UTC**. Vercel envoie le header `Authorization: Bearer <CRON_SECRET>`.

### Manuel (dashboard)
Le bouton **Scanner** dans la TopBar appelle :
```typescript
// app/dashboard/[folder]/page.tsx
const res = await fetch("/api/cron/agent", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({ company_id }),
});
```

---

## Mapping régions → codes département INSEE

```typescript
// lib/datagouvfr.ts
const REGION_DEPARTMENTS = {
  "Île-de-France":           ["75","77","78","91","92","93","94","95"],
  "Auvergne-Rhône-Alpes":    ["01","03","07","15","26","38","42","43","63","69","73","74"],
  "Nouvelle-Aquitaine":      ["16","17","19","23","24","33","40","47","64","79","86","87"],
  "Occitanie":               ["09","11","12","30","31","32","34","46","48","65","66","81","82"],
  "Hauts-de-France":         ["02","59","60","62","80"],
  "Grand Est":               ["08","10","51","52","54","55","57","67","68","88"],
  "Provence-Alpes-Côte d'Azur": ["04","05","06","13","83","84"],
  "Pays de la Loire":        ["44","49","53","72","85"],
  "Normandie":               ["14","27","50","61","76"],
  "Bretagne":                ["22","29","35","56"],
  "Centre-Val de Loire":     ["18","28","36","37","41","45"],
  "Bourgogne-Franche-Comté": ["21","25","39","58","70","71","89","90"],
}
```

---

## Optimisation des coûts Claude

| Opération | Appels Claude | Stratégie |
|---|---|---|
| Scoring BOAMP | 1 appel pour N tenders | Batch prompt indexé |
| Classification email | 1 appel par email | Individuel (max 10/run) |
| Scoring email | 1 appel par email tendeur | Individuel |
| Génération DC1 | 1 appel | Prompt structuré JSON |
| Génération Mémoire | 1 appel | Prompt Markdown 6 sections |
| Email candidature | 1 appel | Prompt JSON `{subject, body}` |
| Pricing | 1 appel | Prompt JSON 5 champs |
| Analyse rejet | 1 appel | Prompt JSON 4 champs |

Le modèle utilisé dans tous les cas : `claude-sonnet-4-6` (`lib/claude.ts`).
