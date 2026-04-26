# Architecture

## Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2 |
| Langage | TypeScript | 5.x |
| Style | Tailwind CSS | 3.4 |
| Base de données | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth | — |
| IA | Anthropic Claude Sonnet | claude-sonnet-4-6 |
| Email | Gmail API + Nodemailer | googleapis 140 |
| PDF | jsPDF + pdf-parse | 2.5 |
| Éditeur riche | TipTap | 2.4 |
| Graphiques | Recharts | 3.8 |
| Icônes | Lucide React | 0.378 |
| Notifications | react-hot-toast | 2.4 |
| Déploiement | Vercel | — |

---

## Structure du projet

```
tendro/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Layout racine (Toaster, fonts)
│   ├── page.tsx                # Page d'accueil / landing
│   ├── globals.css             # Variables CSS (design tokens)
│   │
│   ├── auth/
│   │   ├── login/page.tsx      # Connexion
│   │   └── register/page.tsx   # Inscription + onboarding
│   │
│   ├── onboarding/page.tsx     # Configuration initiale entreprise
│   │
│   ├── dashboard/
│   │   ├── layout.tsx          # Layout dashboard (Sidebar + TopBar)
│   │   ├── page.tsx            # Vue principale (liste des matches)
│   │   ├── [folder]/page.tsx   # Vues filtrées : matched / saved / dismissed / archived
│   │   ├── rejection-analysis/ # Tableau de bord analyse des rejets
│   │   └── tenders/[id]/
│   │       ├── page.tsx        # Détail d'un appel d'offres
│   │       ├── documents/      # Génération DC1 + Mémoire Technique
│   │       ├── pricing/        # Estimation de prix IA
│   │       ├── rejection/      # Analyse d'un rejet
│   │       └── send/           # Composition et envoi de la candidature
│   │
│   ├── settings/
│   │   ├── layout.tsx          # Layout paramètres (Sidebar + TopBar)
│   │   └── page.tsx            # Paramètres (6 onglets)
│   │
│   └── api/
│       ├── companies/          # CRUD profil entreprise
│       ├── cron-config/        # Config de la veille automatique
│       ├── cron/agent/         # Agent de veille (BOAMP + Gmail)
│       ├── documents/
│       │   ├── dc1/            # Génération DC1 par IA
│       │   ├── memoire/        # Génération Mémoire Technique par IA
│       │   └── generate-pdf/   # Export PDF (DC1 + Mémoire)
│       ├── email/
│       │   ├── generate/       # Rédaction email de candidature par IA
│       │   └── send/           # Envoi Gmail avec pièces jointes
│       ├── matches/            # Liste et mise à jour des matches
│       ├── pricing/            # Estimation de prix par IA
│       └── rejection/analyze/  # Analyse document de rejet par IA
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         # Navigation latérale
│   │   └── TopBar.tsx          # Barre supérieure (recherche, filtres, scan)
│   ├── dashboard/
│   │   ├── TenderCard.tsx      # Carte d'un appel d'offres
│   │   ├── TenderRow.tsx       # Ligne tableau d'un AO
│   │   ├── TenderDetailDrawer.tsx  # Panneau latéral détail
│   │   ├── FilterBar.tsx       # Filtres actifs
│   │   └── StatsBar.tsx        # Compteurs (matched, saved…)
│   └── ui/
│       ├── Button.tsx          # Bouton (variants: primary, secondary, outline)
│       ├── Input.tsx           # Input, Textarea, Select
│       ├── Badge.tsx           # Badge statut
│       └── Sheet.tsx           # Panneau coulissant
│
├── lib/
│   ├── supabase.ts             # Client Supabase côté navigateur
│   ├── supabase-server.ts      # Client Supabase côté serveur + getUserFromRequest()
│   ├── claude.ts               # Wrapper Anthropic SDK (callClaude, parseClaudeJSON)
│   ├── datagouvfr.ts           # Intégration API BOAMP (OpenDataSoft)
│   ├── gmail.ts                # Lecture/envoi Gmail via OAuth2
│   ├── pdf.ts                  # Génération PDF (DC1, Mémoire)
│   └── utils.ts                # Helpers (cn, formatDate, formatCurrency…)
│
├── types/index.ts              # Interfaces TypeScript (Company, Tender, Match…)
├── supabase/
│   ├── schema.sql              # DDL complet (tables + RLS)
│   └── seed_demo.sql           # Données de démo (2 entreprises)
├── scripts/
│   └── seed-emails.mjs         # Injection de 60 emails de test dans Gmail
├── Docs/                       # Documentation technique (ce dossier)
└── vercel.json                 # Config déploiement + cron Vercel
```

---

## Flux de données principaux

### 1. Veille automatique (cron quotidien)

```
Vercel Cron (08h UTC)
  → POST /api/cron/agent
    → fetchBoampTenders()       # BOAMP OpenDataSoft API
    → fetchUnreadEmails()       # Gmail API
    → scoreTenders()            # Claude Sonnet (batch scoring)
    → INSERT tenders            # Supabase
    → INSERT matches            # Supabase (score ≥ 30)
```

### 2. Génération de documents

```
Client (documents/page.tsx)
  → GET session.access_token
  → POST /api/documents/dc1     # Authorization: Bearer <token>
    → getUserFromRequest()      # Vérification JWT Supabase
    → callClaude()              # Remplissage DC1 par IA
    → UPSERT submissions        # Sauvegarde
  → POST /api/documents/memoire # Même pattern
  → POST /api/documents/generate-pdf
    → generateDC1PDF()          # jsPDF
    → storage.upload()          # Supabase Storage
```

### 3. Authentification (pattern Bearer Token)

Tous les Route Handlers utilisent `getUserFromRequest(req)` au lieu des cookies :

```typescript
// lib/supabase-server.ts
export async function getUserFromRequest(req: NextRequest) {
  const token = req.headers.get("Authorization")?.slice(7);
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  return (await client.auth.getUser()).data.user;
}
```

Le client envoie systématiquement `session.access_token` dans le header `Authorization`.

---

## Design système

Les couleurs sont définies via des variables CSS dans `app/globals.css` et mappées dans `tailwind.config.ts` :

| Token | Usage | Valeur (light) |
|---|---|---|
| `--primary` | Navy principal | `222 74% 15%` |
| `--primary-foreground` | Texte sur primary | `0 0% 98%` |
| `--background` | Fond global | `0 0% 100%` |
| `--muted` | Éléments atténués | `210 40% 96%` |
| `--destructive` | Danger / erreur | `0 84% 60%` |
| `--border` | Bordures | `214 32% 91%` |
