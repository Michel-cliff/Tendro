# Référence API

Toutes les routes sont préfixées `/api/`. Elles retournent du JSON.

## Authentification

Toutes les routes protégées lisent le token JWT dans le header HTTP :

```
Authorization: Bearer <supabase_access_token>
```

Le client récupère le token avec :
```typescript
const { data: { session } } = await supabase.auth.getSession();
// session.access_token
```

---

## Companies

### `POST /api/companies`
Crée le profil entreprise de l'utilisateur connecté.

**Body :**
```json
{
  "name": "Nexatech Solutions",
  "siret": "89234156100027",
  "address": "12 Rue de Rivoli, 75004 Paris",
  "sector": "Informatique & Digital",
  "region": "Île-de-France",
  "revenue": 4200000,
  "employees": 38,
  "description": "...",
  "legal_representative": "Thomas Renard",
  "representative_title": "Directeur Général"
}
```

**Réponse 200 :** Objet `Company` créé.

---

## Matches

### `GET /api/matches`
Retourne tous les matches de l'entreprise connectée, avec les données du tender imbriqué.

**Réponse 200 :**
```json
[
  {
    "id": "uuid",
    "score": 87,
    "status": "new",
    "reasoning": "...",
    "tender": { "id": "...", "title": "...", ... }
  }
]
```

### `PATCH /api/matches/:id`
Met à jour un match (typiquement le `status`).

**Body :** Champs partiels de `Match`, ex. `{ "status": "reviewing" }`.

**Réponse 200 :** Objet `Match` mis à jour.

---

## Cron Config

### `GET /api/cron-config`
Retourne la configuration de veille de l'entreprise connectée.

**Réponse 200 :** Objet `CronConfig` ou `{}` si non configuré.

### `POST /api/cron-config`
Crée ou met à jour la configuration de veille (UPSERT).

**Body :**
```json
{
  "company_id": "uuid",
  "frequency": "daily",
  "keywords": ["informatique", "cloud", "cybersécurité"],
  "sectors": ["Informatique & Digital"],
  "regions": ["Île-de-France"],
  "active": true
}
```

---

## Agent IA

### `POST /api/cron/agent`
Déclenche manuellement l'agent de veille pour l'entreprise connectée.

**Body :**
```json
{ "company_id": "uuid" }
```

**Réponse 200 :**
```json
{
  "success": true,
  "results": [
    {
      "company_id": "uuid",
      "company_name": "Nexatech Solutions",
      "tenders_fetched": 28,
      "online_matches": 5,
      "email_matches": 2,
      "errors": []
    }
  ]
}
```

### `GET /api/cron/agent`
Déclenchement automatique par Vercel Cron (daily 08:00 UTC).
Requiert le header : `Authorization: Bearer <CRON_SECRET>`.

---

## Documents

### `POST /api/documents/dc1`
Génère les champs DC1 pré-remplis par IA à partir du profil entreprise et du marché.

**Body :** `{ "tender_id": "uuid" }`

**Réponse 200 :**
```json
{
  "objetMarche": "Refonte SIRH pour 55 000 agents",
  "denominationSociale": "Nexatech Solutions",
  "siret": "89234156100027",
  "adresse": "12 Rue de Rivoli, 75004 Paris",
  "nomRepresentant": "Thomas Renard",
  "qualiteRepresentant": "Directeur Général",
  "date": "26/04/2025"
}
```

### `POST /api/documents/memoire`
Génère le Mémoire Technique en Markdown (6 sections structurées) par IA.

**Body :** `{ "tender_id": "uuid" }`

**Réponse 200 :** `{ "content": "# Mémoire Technique\n..." }`

### `POST /api/documents/generate-pdf`
Génère les PDFs DC1 et Mémoire, les uploade dans Supabase Storage.

**Body :**
```json
{
  "tender_id": "uuid",
  "dc1_fields": { ... },
  "memoire_content": "# Mémoire Technique\n..."
}
```

**Réponse 200 :**
```json
{
  "dc1": "https://xxx.supabase.co/storage/v1/object/public/generated-docs/.../dc1.pdf",
  "memoire": "https://..."
}
```

---

## Email

### `POST /api/email/generate`
Rédige un email de candidature professionnel par IA (objet + corps).

**Body :** `{ "tender_id": "uuid" }`

**Réponse 200 :**
```json
{
  "subject": "Candidature — Refonte SIRH — Nexatech Solutions",
  "body": "Madame, Monsieur,\n\nNous avons l'honneur de..."
}
```

### `POST /api/email/send`
Envoie l'email de candidature via Gmail avec les PDFs en pièces jointes.

**Body :**
```json
{
  "tender_id": "uuid",
  "to": "acheteur@collectivite.fr",
  "subject": "Candidature — ...",
  "body": "..."
}
```

**Réponse 200 :** `{ "success": true }`

> Met aussi à jour le statut du match → `"submitted"`.

---

## Pricing

### `POST /api/pricing`
Calcule un prix de soumission optimisé par IA.

**Body :**
```json
{
  "tender_id": "uuid",
  "labor": 20000,
  "materials": 5000,
  "overhead": 3000,
  "margin": 15
}
```

**Réponse 200 :**
```json
{
  "floor_price": 32200,
  "market_price": 41000,
  "recommended_price": 38500,
  "confidence": 72,
  "reasoning": "Les marchés similaires en Île-de-France se situent entre 35k et 45k €..."
}
```

---

## Rejection Analysis

### `POST /api/rejection/analyze`
Analyse un PDF de notation de rejet et génère un plan d'amélioration.

**Body :** `multipart/form-data`
- `file` : fichier PDF de la grille de notation
- `tender_id` : UUID du marché

**Réponse 200 :**
```json
{
  "score_breakdown": {
    "Valeur technique": { "score": 12, "max": 20 },
    "Prix": { "score": 8, "max": 10 }
  },
  "estimated_winner_score": 87,
  "key_weaknesses": [
    "Références insuffisantes sur des marchés similaires",
    "Méthodologie peu détaillée",
    "Prix trop élevé de 15 % vs gagnant"
  ],
  "improvement_plan": [
    "Documenter 3 références > 500k€ en informatique publique",
    "Détailler la méthodologie sur 2 pages minimum",
    "Revoir la structure de coûts pour viser -10 %"
  ]
}
```

---

## Codes d'erreur communs

| Code | Cause |
|---|---|
| `401` | Token absent, expiré ou invalide |
| `404` | Entreprise ou appel d'offres introuvable |
| `400` | Erreur de validation Supabase |
| `500` | Erreur interne (Claude API, Gmail, PDF…) |
