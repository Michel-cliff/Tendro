-- =============================================================================
-- TENDRO — Demo seed — Company 3
-- Altéa Ingénierie : bureau d'études en ingénierie urbaine, infrastructure
-- et environnement, basé à Lyon (Auvergne-Rhône-Alpes)
--
-- Secteur à très fort volume BOAMP : Ingénierie & Études + Environnement
-- Région : Auvergne-Rhône-Alpes (~900 AO actifs / mois)
--
-- HOW TO USE :
--   1. Supabase → SQL Editor
--   2. Remplacer 'YOUR_USER_ID_HERE' par ton UUID (Authentication → Users)
--   3. Exécuter
-- =============================================================================

DO $$
DECLARE
  v_user_id     uuid := 'c397d2b5-1147-4236-b107-53c339d9442b';  -- ← ton user ID
  v_company_id  uuid := uuid_generate_v4();
BEGIN

-- ─────────────────────────────────────────────────────────────────────────────
-- COMPANY — Altéa Ingénierie
-- Bureau d'études pluridisciplinaire : VRD, environnement, énergie, urbanisme
-- Secteur très actif BOAMP : collectivités, EPCI, DREAL, agences de l'eau
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO companies (
  id, user_id, name, siret, address,
  sector, region, revenue, employees,
  description, legal_representative, representative_title
) VALUES (
  v_company_id,
  v_user_id,
  'Altéa Ingénierie',
  '75312489600043',
  '24 Rue de la République, 69002 Lyon',
  'Ingénierie & Études',
  'Auvergne-Rhône-Alpes',
  3600000,
  29,
  'Altéa Ingénierie est un bureau d''études pluridisciplinaire spécialisé dans '
  'l''ingénierie urbaine, les infrastructures de voirie et réseaux divers (VRD), '
  'l''environnement et la transition énergétique. Nous accompagnons les '
  'collectivités territoriales, EPCI, Conseils Départementaux et établissements '
  'publics (ADEME, agences de l''eau, DREAL) dans leurs études de maîtrise '
  'd''œuvre, diagnostics territoriaux et missions AMO. '
  'Compétences clés : études d''impact environnemental, audits énergétiques '
  'réglementaires (DPE tertiaire, BEPOS), hydraulique urbaine et gestion des '
  'eaux pluviales, études de mobilité douce et Plans de Déplacements Urbains '
  '(PDU), assistance à maîtrise d''ouvrage (AMO) marchés publics complexes, '
  'schémas directeurs eau et assainissement. Certifiés RGE et accrédités '
  'COFRAC pour les mesures acoustiques et la qualité de l''air intérieur.',
  'Nathalie Cordier',
  'Directrice Générale'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- CRON CONFIG — mots-clés couvrant toutes les familles d'études publiques BOAMP
-- Ingénierie + Environnement = 2e secteur par volume après le BTP
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO cron_config (
  company_id, frequency, keywords, sectors, regions, active
) VALUES (
  v_company_id,
  'daily',
  ARRAY[
    'maîtrise d''œuvre',
    'étude',
    'ingénierie',
    'AMO',
    'assistance à maîtrise d''ouvrage',
    'audit énergétique',
    'environnement',
    'VRD',
    'assainissement',
    'hydraulique'
  ],
  ARRAY['Ingénierie & Études'],
  ARRAY['Auvergne-Rhône-Alpes'],
  true
);

RAISE NOTICE 'Altéa Ingénierie créée avec succès (id: %)', v_company_id;

END $$;
