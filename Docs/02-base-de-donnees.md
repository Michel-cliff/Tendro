# Base de données

Tendro utilise **Supabase** (PostgreSQL hébergé) avec Row Level Security (RLS) activée sur toutes les tables.

---

## Schéma

### `companies`
Profil de l'entreprise utilisatrice.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK, default uuid_generate_v4() | Identifiant |
| `user_id` | uuid | FK → auth.users, NOT NULL | Propriétaire |
| `name` | text | NOT NULL | Raison sociale |
| `siret` | text | NOT NULL, UNIQUE | Numéro SIRET (14 chiffres) |
| `address` | text | — | Adresse complète |
| `sector` | text | — | Secteur d'activité |
| `region` | text | — | Région principale d'intervention |
| `revenue` | numeric | — | Chiffre d'affaires annuel (€) |
| `employees` | integer | — | Nombre de salariés |
| `description` | text | — | Description de l'activité |
| `legal_representative` | text | — | Nom du représentant légal |
| `representative_title` | text | — | Titre / fonction |
| `signature_url` | text | — | URL signature (Supabase Storage) |
| `logo_url` | text | — | URL logo (Supabase Storage) |
| `created_at` | timestamptz | default now() | Date de création |

---

### `tenders`
Appels d'offres découverts (BOAMP ou email).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK | Identifiant |
| `source` | text | CHECK IN ('online','email') | Origine |
| `title` | text | NOT NULL | Objet du marché |
| `description` | text | — | Descripteurs / résumé |
| `contracting_authority` | text | — | Nom de l'acheteur |
| `authority_email` | text | — | Email de contact de l'acheteur |
| `deadline` | timestamptz | — | Date limite de remise |
| `budget` | numeric | — | Montant estimé (€ HT) |
| `sector` | text | — | Secteur détecté |
| `region` | text | — | Région |
| `raw_data` | jsonb | — | Données brutes BOAMP (`{id, url, createdAt}`) |
| `created_at` | timestamptz | default now() | Date d'insertion |

> **Déduplication** : l'agent compare `raw_data->>'id'` avant insertion pour éviter les doublons BOAMP.

---

### `matches`
Association entreprise ↔ appel d'offres avec score IA.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK | Identifiant |
| `company_id` | uuid | FK → companies | Entreprise |
| `tender_id` | uuid | FK → tenders | Appel d'offres |
| `score` | numeric | CHECK 0–100 | Score de pertinence (IA) |
| `reasoning` | text | — | Justification du score (1 phrase) |
| `source` | text | CHECK IN ('online','email') | Origine du match |
| `status` | text | CHECK, default 'new' | Statut de traitement |
| `created_at` | timestamptz | default now() | — |

**Valeurs de `status` :**

| Valeur | Signification | Section sidebar |
|---|---|---|
| `new` | Nouveau match non traité | Matched Tenders |
| `reviewing` | En cours d'étude | Matched Tenders |
| `submitted` | Candidature envoyée | Archived |
| `rejected` | Rejeté par l'acheteur | Dismissed |
| `won` | Marché remporté | Archived |

> Les matches avec `score < 30` sont silencieusement ignorés lors de l'insertion.

---

### `submissions`
Dossier de candidature en cours de constitution.

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant |
| `company_id` | uuid | Entreprise |
| `tender_id` | uuid | Appel d'offres |
| `dc1_content` | jsonb | Champs DC1 pré-remplis par IA |
| `memoire_content` | text | Mémoire technique (Markdown) |
| `bid_price` | numeric | Prix de la soumission (€ HT) |
| `email_subject` | text | Objet de l'email de candidature |
| `email_body` | text | Corps de l'email |
| `sent_at` | timestamptz | Date d'envoi effectif |
| `dc1_pdf_url` | text | URL PDF DC1 (Supabase Storage) |
| `memoire_pdf_url` | text | URL PDF Mémoire (Supabase Storage) |

> Utilise `UPSERT ON CONFLICT (company_id, tender_id)` — une seule soumission par couple.

---

### `rejections`
Analyse d'un document de rejet (grille de notation).

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant |
| `company_id` | uuid | Entreprise |
| `tender_id` | uuid | Appel d'offres |
| `rejection_doc_url` | text | PDF uploadé (Supabase Storage) |
| `score_breakdown` | jsonb | `{ "critère": { score, max } }` |
| `improvement_plan` | jsonb | Tableau de recommandations |

---

### `cron_config`
Configuration de la veille automatique par entreprise.

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant |
| `company_id` | uuid | Entreprise (UNIQUE — 1 config max) |
| `frequency` | text | `'hourly'` \| `'daily'` \| `'weekly'` |
| `keywords` | text[] | Mots-clés de recherche BOAMP |
| `sectors` | text[] | Secteurs filtrés |
| `regions` | text[] | Régions filtrées |
| `active` | boolean | Activation (default true) |
| `last_run` | timestamptz | Dernier déclenchement |

---

## Politiques RLS

| Table | Politique | Condition |
|---|---|---|
| `tenders` | SELECT pour tous | `true` (données publiques) |
| `tenders` | INSERT service role | `true` |
| `companies` | Toutes opérations | `auth.uid() = user_id` |
| `matches` | Toutes opérations | `company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())` |
| `submissions` | Toutes opérations | idem matches |
| `rejections` | Toutes opérations | idem matches |
| `cron_config` | Toutes opérations | idem matches |

> Les routes API utilisent `supabaseAdmin` (service role) qui bypasse le RLS pour les opérations serveur, après avoir vérifié l'identité via `getUserFromRequest()`.

---

## Supabase Storage

| Bucket | Contenu | Accès |
|---|---|---|
| `generated-docs` | PDFs générés (DC1, Mémoire) | Public URL |
| `rejection-docs` | PDFs de notation uploadés | Public URL |

Chemin des fichiers : `{company_id}/{tender_id}/dc1.pdf` et `memoire.pdf`.

---

## Initialisation

```bash
# Appliquer le schéma dans Supabase SQL Editor
supabase/schema.sql

# Injecter les données de démo (remplacer YOUR_USER_ID_HERE)
supabase/seed_demo.sql
```
