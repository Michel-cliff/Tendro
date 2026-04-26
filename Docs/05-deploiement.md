# Déploiement

## Accès demo

| | |
|---|---|
| **URL** | [https://tendro-seven.vercel.app/](https://tendro-seven.vercel.app/) |
| **Email** | `trendofintech@gmail.com` |
| **Mot de passe** | `Fintech123` |

---

## Variables d'environnement

### Obligatoires

| Variable | Description | Où la trouver |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (bypass RLS) | Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | Clé API Anthropic Claude | console.anthropic.com |
| `CRON_SECRET` | Secret pour sécuriser le cron Vercel | Générer (ex. `openssl rand -hex 32`) |

### Gmail (optionnel — requis pour le Stream 2)

| Variable | Description |
|---|---|
| `GMAIL_CLIENT_ID` | OAuth2 Client ID (Google Cloud Console) |
| `GMAIL_CLIENT_SECRET` | OAuth2 Client Secret |
| `GMAIL_REFRESH_TOKEN` | Refresh token (OAuth Playground) |
| `GMAIL_DEMO_EMAIL` | Adresse Gmail utilisée pour l'envoi |

### Seed emails (développement)

| Variable | Description |
|---|---|
| `GMAIL_TEST_ADDRESS` | Adresse Gmail de destination pour le seed |
| `GMAIL_APP_PASSWORD` | Mot de passe d'application Gmail (16 caractères) |

---

## Fichier `.env.local` (développement)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Cron (local : n'importe quelle valeur)
CRON_SECRET=dev-secret-local

# Gmail (optionnel)
GMAIL_CLIENT_ID=xxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxx
GMAIL_REFRESH_TOKEN=1//xxxx
GMAIL_DEMO_EMAIL=tonemail@gmail.com

# Seed emails
GMAIL_TEST_ADDRESS=tonemail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

---

## Installation locale

```bash
# 1. Cloner et installer
git clone <repo>
cd tendro
npm install

# 2. Configurer l'environnement
cp .env.example .env.local
# Remplir les variables ci-dessus

# 3. Initialiser la base de données
# → Supabase SQL Editor → coller supabase/schema.sql

# 4. (Optionnel) Injecter les données de démo
# → Supabase SQL Editor → coller supabase/seed_demo.sql
#   (remplacer YOUR_USER_ID_HERE par l'UUID de ton compte)

# 5. Lancer
npm run dev
# → http://localhost:3000
```

---

## Déploiement Vercel

### Configuration `vercel.json`

```json
{
  "framework": "nextjs",
  "buildCommand": "npx rimraf next.config.ts && npm run build",
  "installCommand": "npm install",
  "crons": [
    { "path": "/api/cron/agent", "schedule": "0 8 * * *" }
  ]
}
```

> Le `buildCommand` supprime `next.config.ts` avant le build car Vercel ne supporte qu'un seul fichier de config Next.js.

### Étapes de déploiement

1. **Pusher le code** sur GitHub / GitLab
2. **Connecter le repo** sur [vercel.com](https://vercel.com)
3. **Ajouter les variables d'environnement** dans Vercel → Settings → Environment Variables (toutes les variables listées ci-dessus)
4. **Déployer** — Vercel détecte Next.js automatiquement
5. **Vérifier le cron** dans Vercel → Cron Jobs (déclenché chaque jour à 08h UTC)

### Variables Vercel supplémentaires

Sur Vercel, ajouter également :
```
VERCEL_URL=ton-projet.vercel.app
```

---

## Supabase Storage — Création des buckets

À faire une seule fois dans Supabase → Storage :

| Bucket | Accès public | Usage |
|---|---|---|
| `generated-docs` | ✅ Oui | PDFs DC1 et Mémoire générés |
| `rejection-docs` | ✅ Oui | PDFs de notation uploadés |

---

## Gmail OAuth2 — Obtenir le refresh token

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créer un projet → **APIs & Services → Enable APIs** → activer **Gmail API**
3. **Credentials → Create → OAuth 2.0 Client ID**
   - Type : **Web application**
   - Redirect URI : `https://developers.google.com/oauthplayground`
4. Aller sur [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
   - ⚙️ Settings → cocher **"Use your own OAuth credentials"**
   - Coller Client ID + Secret
   - Scope : `https://mail.google.com/`
   - **Authorize APIs** → se connecter
   - **Exchange authorization code for tokens** → copier le `refresh_token`

---

## Seed emails de test

Pour injecter 60 emails d'appels d'offres fictifs dans un compte Gmail de test :

```bash
# Après avoir configuré GMAIL_TEST_ADDRESS et GMAIL_APP_PASSWORD dans .env
node scripts/seed-emails.mjs
```

Le **mot de passe d'application** Gmail se génère dans :
`myaccount.google.com → Sécurité → Validation en 2 étapes → Mots de passe des applications`

---

## Architecture de déploiement

```
┌──────────────────────────────────────────────────────┐
│                     Vercel (Edge)                    │
│                                                      │
│  Next.js 14 App Router                               │
│  ├── Pages (SSR / Client)                            │
│  ├── API Routes (Node.js serverless)                 │
│  └── Cron → /api/cron/agent (daily 08:00 UTC)        │
│                                                      │
│  ┌──────────────┐  ┌─────────────────┐               │
│  │   Supabase   │  │  Anthropic API  │               │
│  │  PostgreSQL  │  │  Claude Sonnet  │               │
│  │  Auth        │  │  claude-sonnet  │               │
│  │  Storage     │  │  -4-6           │               │
│  └──────────────┘  └─────────────────┘               │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  APIs externes                               │    │
│  │  • BOAMP OpenDataSoft (sans auth)            │    │
│  │  • Gmail API (OAuth2)                        │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```
