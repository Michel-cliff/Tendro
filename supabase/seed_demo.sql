-- =============================================================================
-- TENDRO — Demo seed data
-- 2 companies with full profiles + cron_config optimised for high BOAMP results
--
-- HOW TO USE:
--   1. Go to your Supabase project → SQL Editor
--   2. Replace 'YOUR_USER_ID_HERE' below with your real auth user ID
--      (find it in Authentication → Users tab in Supabase dashboard)
--   3. Run the script
-- =============================================================================

DO $$
DECLARE
  v_user_id      uuid := '32f7fd36-31de-462d-a339-a728e4a0caf8';  -- ← replace this
  v_company1_id  uuid := uuid_generate_v4();
  v_company2_id  uuid := uuid_generate_v4();
BEGIN

-- ─────────────────────────────────────────────────────────────────────────────
-- COMPANY 1 — Nexatech Solutions
-- ESN (IT/numérique) basée à Paris, spécialisée marchés publics
-- Secteur + région à très fort volume BOAMP : ~1 100 appels d'offres actifs
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO companies (
  id, user_id, name, siret, address,
  sector, region, revenue, employees,
  description, legal_representative, representative_title
) VALUES (
  v_company1_id,
  v_user_id,
  'Nexatech Solutions',
  '89234156100027',
  '12 Rue de Rivoli, 75004 Paris',
  'Informatique & Digital',
  'Île-de-France',
  4200000,
  38,
  'Nexatech Solutions est une ESN spécialisée dans la transformation numérique '
  'des organismes publics et para-publics. Nous intervenons sur le développement '
  'd''applications métier sur mesure, la gestion de systèmes d''information, '
  'l''infogérance et la cybersécurité. Certifiés ISO 27001 et référencés sur le '
  'marché UGAP, nous accompagnons ministères, collectivités territoriales et '
  'établissements hospitaliers dans leurs projets de modernisation digitale. '
  'Expertise principale : Java/Spring, React, infrastructure cloud AWS/Azure, '
  'RGPD, intégration de solutions ERP/GRH pour le secteur public.',
  'Thomas Renard',
  'Directeur Général'
);

-- cron_config : mots-clés couvrant tous les intitulés fréquents BOAMP en IT
INSERT INTO cron_config (
  company_id, frequency, keywords, sectors, regions, active
) VALUES (
  v_company1_id,
  'daily',
  ARRAY[
    'informatique',
    'numérique',
    'système d''information',
    'développement logiciel',
    'cloud',
    'cybersécurité',
    'infogérance',
    'infrastructure',
    'maintenance applicative',
    'transformation digitale'
  ],
  ARRAY['Informatique & Digital'],
  ARRAY['Île-de-France'],
  true
);

-- ─────────────────────────────────────────────────────────────────────────────
-- COMPANY 2 — Méditerranée BTP
-- Entreprise générale de bâtiment basée à Marseille
-- BTP public est le 1er secteur BOAMP en volume : plusieurs milliers d'avis/mois
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO companies (
  id, user_id, name, siret, address,
  sector, region, revenue, employees,
  description, legal_representative, representative_title
) VALUES (
  v_company2_id,
  v_user_id,
  'Méditerranée BTP',
  '41258963700015',
  '47 Avenue du Prado, 13006 Marseille',
  'Construction & BTP',
  'Provence-Alpes-Côte d''Azur',
  8700000,
  62,
  'Méditerranée BTP est une entreprise générale de bâtiment intervenant '
  'exclusivement sur des marchés publics de travaux : construction neuve, '
  'réhabilitation lourde, rénovation thermique (isolation, menuiseries, '
  'couverture) et mise aux normes accessibilité PMR. Agréée RGE QualiPAC et '
  'certifiée Qualibat 7111, nous intervenons pour les collectivités locales, '
  'bailleurs sociaux (OPH, ESH), établissements scolaires et hospitaliers de '
  'la région PACA. Notre bureau d''études intégré (4 ingénieurs) nous permet '
  'de répondre aux marchés conception-réalisation et aux CREM (Contrats de '
  'performance énergétique). CA marchés publics : 100 % du chiffre d''affaires.',
  'Isabelle Fontaine',
  'Présidente'
);

-- cron_config : mots-clés couvrant les principales familles de travaux publics
INSERT INTO cron_config (
  company_id, frequency, keywords, sectors, regions, active
) VALUES (
  v_company2_id,
  'daily',
  ARRAY[
    'travaux',
    'bâtiment',
    'construction',
    'rénovation',
    'réhabilitation',
    'accessibilité',
    'rénovation thermique',
    'isolation',
    'génie civil',
    'gros œuvre'
  ],
  ARRAY['Construction & BTP'],
  ARRAY['Provence-Alpes-Côte d''Azur'],
  true
);

END $$;
