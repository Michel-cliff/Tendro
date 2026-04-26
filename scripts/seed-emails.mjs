/**
 * seed-emails.mjs
 * Envoie 60 faux emails d'appels d'offres vers un compte Gmail de test.
 *
 * Prérequis — 2 minutes de setup :
 *   1. Connecte-toi sur myaccount.google.com → Sécurité
 *   2. Active la validation en 2 étapes (si pas déjà fait)
 *   3. Recherche "Mots de passe des applications" → génère un mot de passe pour "Mail"
 *   4. Configure les 2 variables ci-dessous :
 *
 * Usage :
 *   GMAIL_TEST_ADDRESS=tonemail@gmail.com GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx" node scripts/seed-emails.mjs
 *
 *   Ou place-les dans .env.local et relance.
 */

import nodemailer from "nodemailer";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Charger .env et .env.local ───────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
for (const envFile of ["../.env", "../.env.local"]) {
  try {
    const envLines = readFileSync(resolve(__dirname, envFile), "utf-8").split("\n");
    for (const line of envLines) {
      const eq = line.indexOf("=");
      if (eq > 0) {
        const key = line.slice(0, eq).trim();
        const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch (_) {}
}

const GMAIL_ADDRESS = process.env.GMAIL_TEST_ADDRESS;
// Supprimer les espaces — Google affiche "xxxx xxxx xxxx xxxx" mais il faut "xxxxxxxxxxxxxxxx"
const APP_PASSWORD  = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");

if (!GMAIL_ADDRESS || !APP_PASSWORD) {
  console.error(`
  ✗ Variables manquantes. Ajoute dans .env :
    GMAIL_TEST_ADDRESS=tonemail@gmail.com
    GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
  `);
  process.exit(1);
}

console.log(`  Compte     : ${GMAIL_ADDRESS}`);
console.log(`  Mot de passe app : ${APP_PASSWORD.slice(0, 4)}${"*".repeat(APP_PASSWORD.length - 4)} (${APP_PASSWORD.length} caractères)\n`);

if (APP_PASSWORD.length !== 16) {
  console.warn(`  ⚠ Le mot de passe d'application Google fait toujours 16 caractères (sans espaces). Le tien en fait ${APP_PASSWORD.length} — vérifie-le.\n`);
}

// ── Transporteur SMTP Gmail (paramètres explicites) ───────────────────────────
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: GMAIL_ADDRESS, pass: APP_PASSWORD },
});

// Test de connexion avant d'envoyer
try {
  await transporter.verify();
  console.log("  ✓ Connexion SMTP Gmail OK\n");
} catch (err) {
  console.error(`  ✗ Échec de connexion SMTP : ${err.message}`);
  console.error(`
  Solutions :
  1. Le mot de passe d'application doit être généré sur myaccount.google.com/apppasswords
  2. La validation en 2 étapes doit être activée sur le compte
  3. Copie les 16 caractères SANS espaces dans GMAIL_APP_PASSWORD
  `);
  process.exit(1);
}

// ── 60 emails d'appels d'offres ───────────────────────────────────────────────
const EMAILS = [
  // ── IT / Numérique (20) ──────────────────────────────────────────────────
  {
    from: '"Direction des Achats – Ville de Paris" <marches@mairie-paris.fr>',
    subject: "Appel d'offres – Refonte du système d'information RH – Ville de Paris",
    body: `Madame, Monsieur,

La Ville de Paris lance un appel d'offres ouvert pour la refonte de son système d'information des ressources humaines (SIRH).

Objet : Développement, déploiement et maintenance d'un SIRH pour 55 000 agents (paie, congés, formations, entretiens annuels).

Montant estimé : 2 400 000 € HT
Date limite de remise des offres : 14 juin 2025 à 12h00
Durée : 4 ans

Critères : Valeur technique 60 % — Prix 40 %

Dossier : https://marches.paris.fr/consultation/2025-SIRH-001
Contact : direction.achats@mairie-paris.fr`,
  },
  {
    from: '"DSI – CHU de Bordeaux" <dsi@chu-bordeaux.fr>',
    subject: "Consultation – Infrastructure cloud sécurisée HDS – CHU de Bordeaux",
    body: `Madame, Monsieur,

Le CHU de Bordeaux lance une procédure de consultation pour la mise en place d'une infrastructure cloud hybride sécurisée (HDS).

Prestations :
- Migration de 40 serveurs physiques vers cloud HDS certifié
- PRA avec RTO < 4h
- Formation équipes DSI (10 personnes)
- Support 24/7 pendant 3 ans

Montant estimé : 980 000 € HT
Date limite : 28 mai 2025
Référence : CHU-BDX-2025-CLOUD-007`,
  },
  {
    from: '"Achats Numériques – Région Occitanie" <achats@region-occitanie.fr>',
    subject: "Marché – Développement application mobile citoyenne – Région Occitanie",
    body: `La Région Occitanie souhaite développer une application mobile multiplateforme (iOS / Android) pour les services régionaux.

Périmètre : React Native, backend Node.js, intégration France Connect, géolocalisation, bilingue occitan/français.

Budget : 320 000 € HT
Date limite : 5 juin 2025 à 17h00
Durée : 18 mois

Contact : dsi.consultation@region-occitanie.fr`,
  },
  {
    from: '"Commande Publique – Département du Nord" <commande-publique@departement59.fr>',
    subject: "AO – Infogérance et support informatique – Département du Nord",
    body: `Le Département du Nord (59) consulte pour l'infogérance et le support informatique de 120 sites (4 200 postes).

Lot 1 – Infogérance infrastructure
Lot 2 – Support N1/N2 (astreinte 7j/7)
Lot 3 – Gestion parc (CMDB)

Montant : 1 850 000 € HT / an — Durée : 3 ans + 1
Date limite : 20 juin 2025
Dossier : https://e-marches.nordpas.fr/DEPT59-2025-INFO`,
  },
  {
    from: '"DAJ Numérique – Ministère de l\'Intérieur" <daj@minint.gouv.fr>',
    subject: "Marché – SOC externalisé cybersécurité – Ministère de l'Intérieur",
    body: `Le Ministère de l'Intérieur lance un appel d'offres pour un SOC externalisé (Security Operations Center).

Surveillance 24h/365j — MDR — Threat intelligence — Conformité ANSSI/RGS **

Montant : 3 200 000 € HT sur 4 ans
Date limite : 30 mai 2025 à 14h00
Référence : MI-DGNUM-SOC-2025-001
Dépôt sur PLACE : https://www.marches-publics.gouv.fr`,
  },
  {
    from: '"Achats Numériques – Métropole de Lyon" <marches@metropole-lyon.fr>',
    subject: "Consultation – Solution GED unifiée – Métropole de Lyon",
    body: `La Métropole de Lyon consulte pour une GED unifiée (8 000 agents, 24 communes).

Fonctionnalités : dématérialisation courriers, signature eIDAS, archivage NF Z42-013, connecteurs SI RH et financier.

Budget : 450 000 € HT
Remise des offres : 10 juin 2025
Contact : achats.numerique@grandlyon.com`,
  },
  {
    from: '"DSI – AP-HM Marseille" <dsi@ap-hm.fr>',
    subject: "AO – Maintenance évolutive Dossier Patient Informatisé – AP-HM",
    body: `L'AP-HM lance un AO pour la maintenance corrective et évolutive de son DPI (4 hôpitaux, 11 000 agents soignants).

Environnement Oracle DB / HL7 FHIR — Correction critique < 4h — 2 000 j/h évolutifs/an

Montant : 1 600 000 € HT / an — Durée : 2 ans + 2
Date limite : 25 mai 2025
Référence : APHM-DSI-2025-DPI-MCE`,
  },
  {
    from: '"Direction Achats – SNCF Réseau" <achats@sncf-reseau.fr>',
    subject: "Marché – Data analytics et tableaux de bord opérationnels – SNCF Réseau",
    body: `SNCF Réseau recherche un prestataire pour des outils d'analyse de données (Direction des Infrastructures).

Livrables : pipeline Python/Airflow, dashboards Grafana/Power BI, modèles ML maintenance prédictive.

Enveloppe : 780 000 € HT
Date limite : 3 juin 2025 à 12h00
Référence : SNCFR-DATA-2025-042`,
  },
  {
    from: '"Marchés Publics – Toulouse Métropole" <marches@toulouse-metropole.fr>',
    subject: "AO – Déploiement réseau Wi-Fi public – Toulouse Métropole",
    body: `Toulouse Métropole consulte pour le déploiement et la maintenance d'un Wi-Fi public sur 91 communes.

Lot 1 – 600 points d'accès
Lot 2 – Supervision + maintenance 3 ans
Lot 3 – Portail captif et analytics

Budget : 1 200 000 € HT
Date limite : 18 juin 2025 à 17h00
Dossier : https://consultation.toulouse-metropole.fr/wifi-public-2025`,
  },
  {
    from: '"Commande Publique – Région Île-de-France" <commande-publique@iledefrance.fr>',
    subject: "Marché – Formation cybersécurité 9 000 agents – Région Île-de-France",
    body: `La Région Île-de-France consulte pour des formations cybersécurité (9 000 agents).

Modules : sensibilisation phishing (e-learning), ISO 27001 DSI (présentiel), simulation red team, certification SecNumédu 50 agents.

Montant : 240 000 € HT
Date limite : 8 juin 2025
Référence : IDF-CYBER-FORM-2025`,
  },
  {
    from: '"DAF – OPH Nantes Métropole" <daf@ophlm-nantes.fr>',
    subject: "Consultation – Remplacement ERP gestion financière et locative – OPH Nantes",
    body: `L'OPH Nantes Métropole (20 000 logements) consulte pour le remplacement de son ERP.

Comptabilité M14, gestion locataires/loyers, interface CAF et Trésor Public, reporting RPLS/EPLS.

Budget : 680 000 € HT
Date limite : 15 juin 2025
Contact : daf.marches@nantesmetropole-habitat.fr`,
  },
  {
    from: '"Marchés – Ville de Strasbourg" <achat@ville-strasbourg.fr>',
    subject: "Marché – Migration Active Directory vers Azure – Ville de Strasbourg",
    body: `La Ville de Strasbourg migre son AD vers Azure Entra ID (6 500 comptes, Exchange Online, MFA).

Montant : 185 000 € HT
Date limite : 1er juin 2025 à 12h00
Dossier : https://place.dematerialisation.gouv.fr/stras-AD-2025`,
  },
  {
    from: '"Achats – France Travail" <marches@pole-emploi.fr>',
    subject: "AO – Nouvelle plateforme e-learning – France Travail",
    body: `France Travail consulte pour une LMS (Moodle personnalisé) pour les demandeurs d'emploi.

Parcours adaptatifs IA, 12 langues, RGAA AA, intégration Mon Compte Formation.

Budget : 1 900 000 € HT
Date limite : 12 juin 2025
Référence : FT-LMS-2025-NATIONAL`,
  },
  {
    from: '"DSI – Conseil Départemental 13" <dsi@cg13.fr>',
    subject: "Consultation – Virtualisation postes de travail VDI – CD13",
    body: `Le CD des Bouches-du-Rhône déploie une solution VDI pour 3 200 agents sur 12 sites.

Solution : VMware Horizon ou Citrix sur Nutanix HCI (matériel fourni).

Montant : 420 000 € HT
Date limite : 29 mai 2025
Référence : CD13-VDI-2025-007`,
  },
  {
    from: '"Direction Achats – RTE France" <marches@rte-france.com>',
    subject: "Marché – Cybersécurité systèmes industriels ICS/OT – RTE France",
    body: `RTE consulte pour la cybersécurité de ses systèmes industriels SCADA/OT (postes haute tension).

Lot 3 – Cybersécurité ICS : audit, segmentation réseau OT, détection d'intrusion industrielle.

Montant estimé lot 3 : 560 000 € HT
Date limite : 7 juin 2025
Référence : RTE-SCADA-OT-SEC-2025`,
  },
  {
    from: '"Achats – ONF" <achat@onf.fr>',
    subject: "AO – Refonte Système d'Information Géographique – Office National des Forêts",
    body: `L'ONF consulte pour la refonte de son SIG (10 000 agents forestiers).

QGIS Server / PostGIS, application mobile terrain offline (iOS/Android), API REST partenaires (IGN, DREAL).

Budget : 340 000 € HT
Date limite : 3 juin 2025
Dossier : https://marches.onf.fr/SIG-2025`,
  },
  {
    from: '"Achats Groupe – La Poste" <marches@laposte.fr>',
    subject: "Consultation – Tests de performance et de charge applications – La Poste",
    body: `La Poste consulte pour des tests de charge sur 8 applications critiques e-commerce et bancaires.

JMeter/Gatling, analyse goulets d'étranglement, optimisation Java/Kubernetes.

Budget : 120 000 € HT
Date limite : 19 mai 2025
Référence : LAPOSTE-PERF-2025-Q2`,
  },
  {
    from: '"DAJ – AP-HP" <daj@hopital-lariboisiere.fr>',
    subject: "AO – Plateforme de télémédecine sécurisée HDS – AP-HP",
    body: `L'AP-HP lance un AO pour une plateforme de télémédecine (39 hôpitaux, 9 groupes hospitaliers).

Téléconsultation RGPD, visioconférence inter-hôpitaux, intégration DMP/DPI, prescription électronique.

Budget : 2 100 000 € HT
Date limite : 16 juin 2025
Référence : APHP-TELEMED-2025-001`,
  },
  {
    from: '"Commande Publique – ANSES" <marches@anses.fr>',
    subject: "Marché – Analyse de données épidémiologiques et outils statistiques – ANSES",
    body: `L'ANSES consulte pour des prestations d'analyse de données épidémiologiques (R, Python, PostgreSQL).

3 rapports annuels + outils open source documentés.

Budget : 280 000 € HT
Date limite : 25 mai 2025
Référence : ANSES-DATA-EPID-2025`,
  },
  {
    from: '"DSI – Banque de France" <rh@banque-de-france.fr>',
    subject: "AO – Programme formation culture numérique 9 000 agents – Banque de France",
    body: `La Banque de France consulte pour un programme de formation numérique (Copilot M365, cybersécurité, Power BI).

4 500 agents à former sur 18 mois.

Budget : 860 000 € HT
Date limite : 5 juin 2025
Référence : BDF-FORM-NUM-2025`,
  },

  // ── Construction / BTP (20) ──────────────────────────────────────────────
  {
    from: '"Services Techniques – Ville de Nice" <marches@ville-nice.fr>',
    subject: "AO – Rénovation énergétique groupe scolaire Louis Pasteur – Nice",
    body: `La Ville de Nice lance un AO pour la rénovation thermique du groupe scolaire Pasteur (3 200 m²).

Lot 1 – ITE façades et toiture-terrasse
Lot 2 – Menuiseries PVC triple vitrage
Lot 3 – Pompe à chaleur + plancher chauffant
Lot 4 – VMC double flux

Montant total : 780 000 € HT
Date limite : 6 juin 2025 à 12h00
Référence : NICE-ECO-PASTEUR-2025`,
  },
  {
    from: '"Commande Publique – Ville de Marseille" <commande.publique@mairie-marseille.fr>',
    subject: "Marché – Construction centre sportif quartier nord – Marseille 14e",
    body: `La Ville de Marseille consulte pour la construction d'un centre sportif de proximité dans le 14e arrondissement.

Salle omnisports 1 200 m², tribunes 200 places, parking 80 places, label E+C-.

Montant : 4 800 000 € HT
Date limite : 20 juin 2025
Référence : MRS-SPORT-14E-2025`,
  },
  {
    from: '"Maîtrise d\'Ouvrage – OPAC 38" <maitrise-ouvrage@opac38.fr>',
    subject: "Consultation – Réhabilitation 120 logements sociaux résidence des Géraniums – OPAC 38",
    body: `L'OPAC 38 consulte pour la réhabilitation de 120 logements à Échirolles.

Lot 1 – ITE façades
Lot 2 – Menuiseries et serrurerie
Lot 3 – Électricité et plomberie
Lot 4 – Parties communes

Montant : 2 200 000 € HT
Date limite : 27 mai 2025
Référence : OPAC38-REHAB-GERANIUMS-2025`,
  },
  {
    from: '"Services Techniques – Ville de Rennes" <services-techniques@mairie-rennes.fr>',
    subject: "AO – Mise en accessibilité PMR 18 bâtiments communaux – Rennes",
    body: `La Ville de Rennes consulte pour la mise en accessibilité PMR de 18 bâtiments.

Lot 1 – Rampes d'accès (18 sites)
Lot 2 – Ascenseurs (6 sites)
Lot 3 – Sanitaires PMR (12 sites)
Lot 4 – Signalétique podotactile

Montant : 1 100 000 € HT
Date limite : 9 juin 2025
Référence : RENNES-PMR-2025-BATCH1`,
  },
  {
    from: '"Infrastructure – SNCF Gares" <infra@sncf.fr>',
    subject: "Marché travaux – Rénovation gare Montpellier Saint-Roch",
    body: `SNCF Gares & Connexions consulte pour la rénovation du hall voyageurs et quais de la gare de Montpellier.

Lot 1 – Gros œuvre et démolition
Lot 2 – Revêtements sols et murs
Lot 3 – Charpente métallique et verrière
Lot 4 – Électricité
Lot 5 – Plomberie et sprinklers

Budget total : 6 200 000 € HT
Date limite : 25 juin 2025
Référence : SNCF-GC-MPL-RENOV-2025`,
  },
  {
    from: '"Urbanisme – Montpellier Méditerranée Métropole" <urbanisme@montpellier3m.fr>',
    subject: "AO – Construction crèche 60 berceaux ZAC Port Marianne – Montpellier",
    body: `Montpellier 3M consulte pour la construction d'une crèche de 60 berceaux (900 m², RE2020, structure bois CLT).

Montant : 2 600 000 € HT
Date limite : 4 juin 2025
Contact : construction.creche@montpellier3m.fr`,
  },
  {
    from: '"Patrimoine – Région PACA" <marches@region-paca.fr>',
    subject: "Consultation – Réhabilitation et extension lycée Thiers – Marseille – Région PACA",
    body: `La Région PACA consulte pour la réhabilitation du lycée Thiers à Marseille (bâtiment historique).

Lot 1 – Désamiantage | Lot 2 – Gros œuvre 800 m² | Lot 3 – Étanchéité | Lot 4 – Façades | Lot 5 – Second œuvre | Lot 6 – CVC | Lot 7 – Électricité/SSI

Montant : 5 400 000 € HT
Date limite : 15 juin 2025
Référence : PACA-LYCEE-THIERS-2025`,
  },
  {
    from: '"Services Techniques – Ville de Toulon" <services.techniques@mairie-toulon.fr>',
    subject: "AO – Réfection voirie et trottoirs centre-ville – Toulon",
    body: `La Ville de Toulon consulte pour la réfection complète de 4,2 km de voirie centre-ville historique.

Démontage, terrassement, pavés granit, conformité PMR, bordures et caniveaux.

Montant : 3 100 000 € HT
Date limite : 11 juin 2025
Référence : TOULON-VOIRIE-CV-2025`,
  },
  {
    from: '"Patrimoine Bâti – Conseil Départemental 83" <patrimoine@departement83.fr>',
    subject: "Marché – Entretien maintenance 156 bâtiments départementaux – Var",
    body: `Le CD83 lance un marché à bons de commande pour l'entretien de 156 bâtiments (collèges, routes, services).

5 lots : menuiserie/serrurerie, plomberie, électricité, peinture/revêtements, maçonnerie.

Montant max 4 ans : 8 000 000 € HT
Date limite : 2 juin 2025
Référence : CD83-BATIMT-MAINT-2025`,
  },
  {
    from: '"Maîtrise d\'Ouvrage – Oppidea" <moa@oppidea.fr>',
    subject: "Consultation – Construction immeuble bureaux BBC 3 500 m² – Toulouse Aerospace",
    body: `Oppidea consulte pour un immeuble de bureaux tertiaires BBC (R+4, 3 500 m², BREEAM Very Good, data center 80 m²).

Montant : 7 800 000 € HT
Date limite : 18 juin 2025
Maître d'œuvre : Atelier Cardete & Huet
Référence : OPPIDEA-BUR-AERO-2025`,
  },
  {
    from: '"Direction Technique – EHPAD Les Figuiers" <technique@hm-bayonne.fr>',
    subject: "AO – Rénovation thermique complète EHPAD Les Figuiers – Bayonne",
    body: `L'EHPAD Les Figuiers consulte pour sa rénovation thermique (3 bâtiments, 8 000 m²).

Lot 1 – ITE et enduit | Lot 2 – Toiture et isolation | Lot 3 – Menuiseries ALU double vitrage | Lot 4 – Géothermie / PAC (remplacement chaudière fioul)

Montant : 1 450 000 € HT — Objectif : gain énergétique > 40 %, BBC Rénovation
Date limite : 30 mai 2025`,
  },
  {
    from: '"MOA – Programme ANRU Seine-Saint-Denis" <maitrisedouvrage@anru-stade.fr>',
    subject: "Marché – Réhabilitation 6 équipements sportifs – Programme ANRU – Plaine Commune",
    body: `Plaine Commune consulte pour la réhabilitation de 3 gymnases, 2 piscines et 1 stade dans le cadre du programme ANRU.

Lots communs : charpente/couverture, éclairage LED, traitement eau, accessibilité PMR.

Montant total : 9 200 000 € HT
Date limite : 23 juin 2025
Référence : PC-ANRU-SPORT-2025`,
  },
  {
    from: '"Logistique – CHU de Nice" <logistique@chu-nice.fr>',
    subject: "AO – Extension service urgences R+2 – CHU de Nice",
    body: `Le CHU de Nice consulte pour l'extension de son service urgences (2 800 passages/jour).

Démolition 1 200 m², construction R+2 (2 400 m²), normes sismiques zone 3, salle NRBC, hélipad toiture.

Budget : 12 500 000 € HT
Date limite : 30 juin 2025
Référence : CHU-NICE-URG-EXT-2025`,
  },
  {
    from: '"Marchés – Opievoy" <services@opievoy.fr>',
    subject: "Consultation – Remplacement 800 fenêtres résidences HLM Essonne – Opievoy",
    body: `OPIEVOY consulte pour le remplacement de 800 fenêtres sur 4 résidences HLM en Essonne (PVC blanc triple vitrage Uw ≤ 1,0).

Montant : 680 000 € HT
Date limite : 5 juin 2025 à 12h00
Référence : OPIEVOY-FEN-91-2025-B`,
  },
  {
    from: '"Direction Technique – Ville d\'Avignon" <technique@ville-avignon.fr>',
    subject: "AO – Construction parking silo 450 places intra-muros – Avignon",
    body: `La Ville d'Avignon consulte pour un parking silo de 450 places (6 niveaux béton préfabriqué, 30 bornes VE, toiture végétalisée, patrimoine UNESCO).

Montant : 8 900 000 € HT
Date limite : 28 juin 2025
Référence : AVG-PARKING-SILO-2025`,
  },
  {
    from: '"Marchés – SDIS 13" <marches@sdis13.fr>',
    subject: "Marché – Construction caserne pompiers – SDIS 13 – Vitrolles",
    body: `Le SDIS 13 consulte pour la construction d'un CIS à Vitrolles (2 500 m², aire d'exercice, HQE Excellent).

Montant : 5 600 000 € HT
Date limite : 14 juin 2025
Référence : SDIS13-CIS-VITROLLES-2025`,
  },
  {
    from: '"Pôle Technique – CA Pays d\'Aubagne" <pole.technique@ca-aubagne.fr>',
    subject: "AO – Réhabilitation réseau assainissement collectif – CA Pays d'Aubagne",
    body: `La CA du Pays d'Aubagne consulte pour la réhabilitation de son réseau d'assainissement (Les Paluds).

Inspection télévisée 8 km, chemisage UV 3,2 km, remplacement 2 800 ml, réhabilitation 45 regards.

Montant : 1 850 000 € HT
Date limite : 22 mai 2025
Référence : CAPA-ASSAIN-2025-PALUDS`,
  },
  {
    from: '"Services Culturels – Ville d\'Aix-en-Provence" <marches@ville-aix.fr>',
    subject: "Consultation – Réfection et mise aux normes musée Granet – Aix-en-Provence",
    body: `La Ville d'Aix consulte pour la réfection du musée Granet (classé MH, 5 500 m²).

Lot 1 – Restauration façades pierre de taille | Lot 2 – Étanchéité toitures | Lot 3 – Menuiseries bois restauration | Lot 4 – Éclairage LED muséographique | Lot 5 – Sécurité | Lot 6 – Climatisation

Montant : 3 700 000 € HT
Date limite : 17 juin 2025
Référence : AIX-GRANET-REST-2025`,
  },
  {
    from: '"Marchés – Grand Avignon" <marches@grand-avignon.fr>',
    subject: "AO – Requalification espaces publics ZAC de la Courtine – Avignon",
    body: `Grand Avignon consulte pour les travaux VRD et espaces publics de la ZAC de la Courtine.

Lot 1 – Terrassement et VRD | Lot 2 – Chaussées et trottoirs | Lot 3 – Éclairage LED | Lot 4 – Espaces verts et mobilier urbain

Budget : 4 300 000 € HT
Date limite : 19 juin 2025
Référence : GA-ZAC-COURTINE-2025`,
  },
  {
    from: '"Marchés – CA Sainte-Baume" <marches@saintesbaumemetropole.fr>',
    subject: "Marché – Rénovation complexe aquatique intercommunal – Sainte-Baume (83)",
    body: `La CA de la Sainte-Baume consulte pour la rénovation de son complexe aquatique (bassin 50m + ludique).

Lot 1 – Génie civil et étanchéité | Lot 2 – Traitement eau | Lot 3 – Toiture 2 400 m² | Lot 4 – CVC/déshumidification | Lot 5 – Électricité

Montant : 3 900 000 € HT
Date limite : 26 juin 2025
Référence : CSB-AQUATIQUE-2025`,
  },

  // ── Conseil / Formation (8) ──────────────────────────────────────────────
  {
    from: '"Achats – ANFH" <achats@anfh.fr>',
    subject: "AO – Formations management et leadership cadres de santé – ANFH",
    body: `L'ANFH consulte pour des formations en management pour les cadres de santé (1 050 j/formation sur 3 ans).

Modules : management d'équipe hospitalière, gestion du changement, communication, leadership inclusif.

Budget : 420 000 € HT
Date limite : 20 mai 2025
Référence : ANFH-FORM-MANAGEMENT-2025`,
  },
  {
    from: '"RH – Conseil Départemental 34" <rh@conseil-departemental-34.fr>',
    subject: "Consultation – Accompagnement transformation organisationnelle – CD Hérault",
    body: `Le CD34 consulte pour un accompagnement à la transformation (6 directions, 4 200 agents).

Diagnostic organisationnel, ateliers design thinking, accompagnement changement, formation 80 cadres.

Budget : 180 000 € HT
Date limite : 28 mai 2025
Référence : CD34-TRANSFO-RH-2025`,
  },
  {
    from: '"Formation – DGAFP" <formation@fonction-publique.gouv.fr>',
    subject: "AO national – Formations droit de la commande publique – DGAFP",
    body: `La DGAFP consulte pour des formations en droit de la commande publique pour acheteurs publics.

Modules : marchés publics CCP, rédaction CCAP, dématérialisation, gestion des avenants et contentieux.

Volume : 2 400 stagiaires/an — Budget : 650 000 € HT/an
Date limite : 1er juin 2025
Référence : DGAFP-CCP-FORM-2025`,
  },
  {
    from: '"Achats Formation – France Travail" <achat@pole-emploi-formation.fr>',
    subject: "Marché – Coaching emploi et bilan de compétences – France Travail PACA",
    body: `France Travail consulte pour des prestations de coaching emploi dans les départements 13 et 83.

Lot 1 – Bilan de compétences (36h) | Lot 2 – Coaching emploi intensif (12 séances) | Lot 3 – Orientation VAE > 45 ans

Volume : 1 200 bénéficiaires/an — Budget : 980 000 € HT/an
Date limite : 15 juin 2025
Référence : FT-COACHING-PACA-2025`,
  },
  {
    from: '"Commande Publique – CD Alpes-Maritimes" <commande.publique@departement06.fr>',
    subject: "AO – Audit organisationnel services solidarité – CD des Alpes-Maritimes",
    body: `Le CD06 consulte pour un audit organisationnel et financier de ses services de solidarité (ASE, RSA, PMI).

Cartographie processus, benchmarking national, recommandations + accompagnement 6 mois.

Budget : 95 000 € HT
Date limite : 10 juin 2025
Référence : CD06-AUDIT-SOLIDARITE-2025`,
  },
  {
    from: '"Commande Publique – Santé Publique France" <formation@sante-publique-france.fr>',
    subject: "Consultation – 12 modules e-learning prévention sanitaire – Santé Publique France",
    body: `Santé Publique France consulte pour la conception de 12 modules e-learning (professionnels de santé).

Format SCORM 1.2/Moodle, motion design, RGAA AA, certificats automatisés.

Budget : 240 000 € HT
Date limite : 22 mai 2025
Référence : SPF-ELEARN-PREVENTION-2025`,
  },
  {
    from: '"Achats – CCI Aix-Marseille-Provence" <marches@cci-marseille.fr>',
    subject: "Consultation – Accompagnement export PME régionales – CCI AMP",
    body: `La CCI AMP consulte pour l'accompagnement à l'internationalisation de PME (150 entreprises/an).

Diagnostic export, 20 ateliers collectifs/an, mise en relation acheteurs internationaux, coaching interculturel.

Budget : 320 000 € HT/an
Date limite : 14 juin 2025
Référence : CCI-AMP-EXPORT-2025`,
  },
  {
    from: '"DAF – CH Toulon La Seyne" <daf@ch-toulon.fr>',
    subject: "AO – Fourniture matériel médical consommable – CH Toulon La Seyne",
    body: `Le CH Toulon La Seyne consulte pour la fourniture de matériel médical consommable.

Lot 1 – Perfusion et solutés | Lot 2 – Pansements | Lot 3 – Dispositifs injectables | Lot 4 – Matériel de prélèvement

Volume estimé : 1 400 000 € HT/an — Durée : 4 ans
Date limite : 28 mai 2025
Référence : CHTLS-CONSO-MED-2025`,
  },

  // ── Santé / Social / Environnement (12) ─────────────────────────────────
  {
    from: '"Achats – CPAM du Rhône" <achats@cpam-rhonealpes.fr>',
    subject: "Consultation – Nettoyage et désinfection 24 agences CPAM – Rhône",
    body: `La CPAM du Rhône consulte pour le nettoyage et désinfection de 24 agences.

Nettoyage quotidien, désinfection hebdomadaire ISO 22000, haute pression 2 fois/an, consommables d'hygiène.

Budget : 380 000 € HT/an — Durée : 3 ans
Date limite : 1er juin 2025
Référence : CPAM69-NETTOYAGE-2025`,
  },
  {
    from: '"Marchés – GHT Bouches-du-Rhône" <technique@mapad-aubagne.fr>',
    subject: "AO – Restauration collective 8 EHPAD – Groupement de commandes GHT 13",
    body: `8 EHPAD du GHT13 consultent pour la restauration collective (320 000 repas/an).

Menu 4 temps, régimes spéciaux, ≥ 20 % bio (loi EGALIM), livraison < 3°C, traçabilité allergènes.

Budget : 2 400 000 € HT/an
Date limite : 10 juin 2025
Référence : GHT13-RESTAU-2025`,
  },
  {
    from: '"Logistique – ARS PACA" <logistique@ars-paca.fr>',
    subject: "Consultation – Transport sanitaire spécialisé bariatriques – ARS PACA",
    body: `L'ARS PACA consulte pour le transport sanitaire spécialisé patients bariatriques.

Lot 1 – Ambulances bariatriques (300 kg max) | Lot 2 – VSLA adaptés | Lot 3 – Transport inter-hospitalier 24h/24

8 400 missions/an — Budget : 1 100 000 € HT/an
Date limite : 17 mai 2025
Référence : ARS-PACA-TRANSPORT-BARIA-2025`,
  },
  {
    from: '"Commande Publique – CD du Var" <commande-publique@departement-var.fr>',
    subject: "AO – Aide à domicile personnes âgées et handicapées – CD du Var",
    body: `Le CD83 consulte pour des prestations d'aide à domicile (mission d'intérêt général).

Lot 1 – Toulon (3 200 bénéficiaires) | Lot 2 – Draguignan (1 800) | Lot 3 – Brignoles (1 400)

Budget total : 18 000 000 € HT/an — Durée : 3 ans
Date limite : 20 juin 2025
Référence : CD83-APA-2025`,
  },
  {
    from: '"DAF – CH Sainte-Musse Toulon" <daf@hopital-saint-musse.fr>',
    subject: "Consultation – Blanchisserie hospitalière externalisée – CH Sainte-Musse Toulon",
    body: `Le CH Sainte-Musse consulte pour l'externalisation de sa blanchisserie (4 500 kg/jour, norme EN 14065 RABC, rotation 24h).

Budget : 1 200 000 € HT/an — Durée : 3 ans + 2
Date limite : 29 mai 2025
Référence : CHSM-BLANCHISSERIE-2025`,
  },
  {
    from: '"Direction Achats – Enedis PACA" <marches@enedis.fr>',
    subject: "AO – Maintenance préventive postes HTA/BT – Enedis PACA (13, 83, 84)",
    body: `Enedis PACA consulte pour la maintenance préventive/corrective de 1 400 postes HTA/BT.

Visites annuelles, remplacement disjoncteurs/fusibles, thermographie IR, interventions curatives < 4h.

Montant : 2 800 000 € HT/an — Durée : 2 ans + 2
Date limite : 8 juin 2025
Référence : ENEDIS-PACA-MAINT-HTA-2025`,
  },
  {
    from: '"Commande Publique – ADEME" <marches@ademe.fr>',
    subject: "Consultation – Études impact environnemental zones portuaires méditerranéennes – ADEME",
    body: `L'ADEME consulte pour des études d'impact environnemental sur 5 zones portuaires du littoral méditerranéen.

Cartographie pollutions historiques, bilan carbone, plan d'actions réduction, rapport de synthèse national.

Budget : 450 000 € HT
Date limite : 3 juin 2025
Référence : ADEME-PORT-ENV-MED-2025`,
  },
  {
    from: '"Commande Publique – Cerema Sud-Ouest" <commande@cerema.fr>',
    subject: "AO – Surveillance et auscultation ouvrages d'art réseau routier national – Cerema",
    body: `Le Cerema consulte pour la surveillance d'ouvrages d'art (ponts, tunnels, murs de soutènement).

Lot 1 – IDP 120 ouvrages | Lot 2 – Auscultation spécialisée (GPR, endoscopie) | Lot 3 – Instrumentation permanente

Budget total : 1 600 000 € HT
Date limite : 11 juin 2025
Référence : CEREMA-SO-OA-2025`,
  },
  {
    from: '"Énergie – Métropole Aix-Marseille-Provence" <energie@metropole-aix.fr>',
    subject: "Consultation – Audits énergétiques 340 bâtiments – Métropole Aix-Marseille-Provence",
    body: `La Métropole AMP consulte pour des audits énergétiques réglementaires sur 340 bâtiments (480 000 m²).

Relevés terrain, modélisation thermique dynamique certifiée, scénarios rénovation avec ROI, plan pluriannuel priorisé.

Budget : 780 000 € HT
Date limite : 24 mai 2025
Référence : AMP-AUDIT-ENERG-2025`,
  },
  {
    from: '"Marchés – Eau de Paris" <marches@eau-de-paris.fr>',
    subject: "AO – Réhabilitation réseaux eau potable 10e, 11e, 20e arrondissements – Paris",
    body: `Eau de Paris consulte pour le renouvellement de conduites d'eau potable (12 km, arrondissements 10/11/20).

Remplacement fonte grise Ø100-200, pose PEHD Ø125-250, réhabilitation sans tranchée, branchements particuliers.

Montant : 6 400 000 € HT
Date limite : 13 juin 2025
Référence : EAU-PARIS-RESEAU-2025-LOT4`,
  },
  {
    from: '"Achats – Parc National des Calanques" <achats@parc-naturel-calanques.fr>',
    subject: "Consultation – Entretien sentiers et restauration milieux naturels – Parc des Calanques",
    body: `Le Parc National des Calanques consulte pour l'entretien des sentiers et la restauration écologique.

Lot 1 – Entretien/sécurisation sentiers (balisage, élagage, drainage)
Lot 2 – Restauration zones piétinées (replantation espèces endémiques)
Lot 3 – Gestion déchets et propreté

Budget : 320 000 € HT/an — Durée : 3 ans
Date limite : 19 mai 2025
Référence : PNC-ENTRETIEN-SENTIERS-2025`,
  },
  {
    from: '"Marchés – CPAM Bouches-du-Rhône" <marches@cpam13.fr>',
    subject: "AO – Gardiennage et sécurité physique sites CPAM – Bouches-du-Rhône",
    body: `La CPAM 13 consulte pour des prestations de gardiennage et de sécurité physique sur ses 18 sites.

Agents de sécurité en journée, rondes nocturnes, télésurveillance, gestion des accès.

Budget : 520 000 € HT/an — Durée : 3 ans + 1
Date limite : 7 juin 2025
Référence : CPAM13-GARDIENNAGE-2025`,
  },
];

// ── Envoi ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Envoi de ${EMAILS.length} emails vers ${GMAIL_ADDRESS}…\n`);
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < EMAILS.length; i++) {
    const { from, subject, body } = EMAILS[i];
    // Date aléatoire dans les 14 derniers jours
    const date = new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000));

    try {
      await transporter.sendMail({
        from,
        to: GMAIL_ADDRESS,
        subject,
        text: body,
        date,
      });
      console.log(`  ✓ [${String(i + 1).padStart(2, "0")}] ${subject.slice(0, 68)}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ [${String(i + 1).padStart(2, "0")}] ${subject.slice(0, 60)} — ${err.message}`);
      fail++;
    }
  }

  console.log(`\nTerminé. ${ok} envoyés, ${fail} échoués.`);
}

main().catch(console.error);
