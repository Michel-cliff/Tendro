# Documentation Tendro

Bienvenue dans la documentation technique de **Tendro**, une plateforme SaaS d'aide à la réponse aux appels d'offres publics français.

---

## Accès demo

> **Site web** → [https://tendro-seven.vercel.app/](https://tendro-seven.vercel.app/)

| Champ | Valeur |
|---|---|
| **Email** | `trendofintech@gmail.com` |
| **Mot de passe** | `Fintech123` |

---

## Index

| Document | Contenu |
|---|---|
| [01-architecture.md](01-architecture.md) | Vue d'ensemble, stack technique, structure du projet |
| [02-base-de-donnees.md](02-base-de-donnees.md) | Schéma Supabase, tables, politiques RLS |
| [03-api.md](03-api.md) | Référence complète de toutes les routes API |
| [04-agent-ia.md](04-agent-ia.md) | Fonctionnement de l'agent de veille automatique |
| [05-deploiement.md](05-deploiement.md) | Variables d'environnement, déploiement Vercel, cron |

## Présentation

Tendro automatise la veille des marchés publics français et accompagne les PME dans la constitution de leur dossier de candidature.

**Fonctionnalités principales :**
- Veille automatique sur le BOAMP (Bulletin Officiel des Annonces de Marchés Publics)
- Détection d'appels d'offres dans les emails entrants (Gmail)
- Scoring de pertinence par IA (Claude Sonnet)
- Génération automatique des documents DC1 et Mémoire Technique
- Estimation de prix par IA avec données historiques
- Analyse des rejections avec plan d'amélioration
- Envoi de la candidature par email avec pièces jointes PDF
