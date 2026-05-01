"use client";
import { createContext, useContext, useState } from "react";

export type Lang = "fr" | "en";

// ── Translation dictionary ────────────────────────────────────────────────────

const T = {
  // Sidebar nav
  nav_dashboard:    { fr: "Dashboard",           en: "Dashboard" },
  nav_matched:      { fr: "Matched Tenders",     en: "Matched Tenders" },
  nav_saved:        { fr: "Saved Tenders",        en: "Saved Tenders" },
  nav_dismissed:    { fr: "Dismissed",            en: "Dismissed" },
  nav_archived:     { fr: "Archived",             en: "Archived" },
  nav_rejection:    { fr: "Rejection Analysis",   en: "Rejection Analysis" },
  nav_settings:     { fr: "Settings",             en: "Settings" },
  nav_help:         { fr: "Aide & guide",         en: "Help & guide" },
  user_plan:        { fr: "Plan Pro",             en: "Pro plan" },

  // TopBar
  search_ph:        { fr: "Rechercher par mot-clé, autorité ou région...", en: "Search by keyword, authority or region..." },
  scan_btn:         { fr: "Scanner",              en: "Scan" },
  scanning_btn:     { fr: "Analyse...",           en: "Scanning..." },
  scan_tooltip:     { fr: "Lancer l'analyse",     en: "Start scan" },
  scan_used_tip:    { fr: "Analyse déjà effectuée aujourd'hui", en: "Scan already performed today" },
  scan_toast:       { fr: "Tendro analyse les appels d'offres...", en: "Tendro is scanning tenders..." },
  scan_success:     { fr: "Analyse terminée. Nouveaux résultats disponibles.", en: "Scan complete. New results available." },
  scan_error:       { fr: "Erreur lors de l'analyse", en: "Error during scan" },

  // Sidebar nav — new structure
  nav_search:         { fr: "Search Tenders",       en: "Search Tenders" },
  nav_my_tenders:     { fr: "My Tenders",           en: "My Tenders" },
  nav_authority:      { fr: "Authority Profiles",   en: "Authority Profiles" },
  section_tenders:    { fr: "Tenders",              en: "Tenders" },
  section_analytics:  { fr: "Analytics & Insights", en: "Analytics & Insights" },

  // Help panel
  help_panel_title: { fr: "Guide Tendro",        en: "Tendro Guide" },
  help_s1_title:    { fr: "Dashboard",           en: "Dashboard" },
  help_s1_desc:     { fr: "Vue d'ensemble de vos appels d'offres actifs, vos scores de performance et les dernières opportunités détectées par Tendro.", en: "Overview of your active tenders, performance scores and the latest opportunities detected by Tendro." },
  help_s2_title:    { fr: "Scanner quotidien",   en: "Daily Scanner" },
  help_s2_desc:     { fr: "Cliquez sur « Scanner » dans la barre du haut pour lancer une analyse BOAMP en temps réel et découvrir de nouveaux marchés.", en: "Click \"Scan\" in the top bar to trigger a real-time BOAMP analysis and discover new matching tenders." },
  help_s3_title:    { fr: "Appels d'offres matchés", en: "Matched Tenders" },
  help_s3_desc:     { fr: "L'IA analyse chaque annonce et propose uniquement les marchés alignés sur votre secteur, votre région et vos capacités.", en: "AI analyses each listing and surfaces only the tenders matching your sector, region and capabilities." },
  help_s4_title:    { fr: "Analyse des rejets",  en: "Rejection Analysis" },
  help_s4_desc:     { fr: "Importez vos rapports de notation pour comprendre pourquoi vous n'avez pas été retenu et améliorer vos prochains dossiers.", en: "Import your scoring reports to understand why you lost bids and improve your future submissions." },
  help_s5_title:    { fr: "Profils d'autorités", en: "Authority Profiles" },
  help_s5_desc:     { fr: "Consultez les profils des acheteurs publics — critères valorisés, raisons de rejet fréquentes — pour personnaliser chaque candidature.", en: "View public buyer profiles — valued criteria, frequent rejection reasons — to tailor each application." },
  help_s6_title:    { fr: "Conseils & améliorations", en: "Tips & Improvements" },
  help_s6_desc:     { fr: "Retrouvez des recommandations priorisées avec des conseils concrets pour renforcer votre prochain dossier critère par critère.", en: "Find prioritised recommendations with concrete tips to strengthen your next bid criterion by criterion." },
} satisfies Record<string, Record<Lang, string>>;

export type TKey = keyof typeof T;

// ── Context ───────────────────────────────────────────────────────────────────

type LangCtx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string };

const LangContext = createContext<LangCtx>({
  lang: "fr",
  setLang: () => {},
  t: (k) => T[k].fr,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");
  const t = (k: TKey) => T[k][lang];
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  return useContext(LangContext);
}
