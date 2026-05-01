"use client";
export const dynamic = "force-dynamic";
import { useMemo, useState } from "react";
import {
  CartesianGrid, Line, LineChart, ReferenceLine,
  Bar, BarChart, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import {
  Upload, FileText, Trash2, Pencil, Check, X, Building2,
  Search, AlertTriangle, Lightbulb, ArrowUp, ArrowDown, ExternalLink,
  Eye, Download, Sparkles, ChevronDown, ChevronUp, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Design tokens ─────────────────────────────────────────────────────────────
const NAVY = "#0A1F44";
const N10  = "rgba(10,31,68,.10)";
const N05  = "rgba(10,31,68,.05)";

// ── Types ─────────────────────────────────────────────────────────────────────

type Severity = "Excellent" | "Très Bon" | "Bon" | "Moyen" | "Insuffisant" | "Très Insuffisant" | "Non fourni";

type RejectionLetter = {
  id: string;
  filename: string;
  tenderName: string;
  authority: string;
  authorityType: string;
  reference: string;
  submissionDate: string;
  uploadedAt: string;
  outcome: "non_retenu" | "retenu" | "en_attente";
  status: "Analysé" | "En attente" | "Données incomplètes";
  fileSize: string;
  score?: number;
  winnerScore?: number;
  ranking?: number;
  candidates?: number;
  includedInAnalysis: boolean;
};

type ScoreRow = {
  code: string;
  label: string;
  maxPts: number;
  ourScore: number;
  winnerScore: number;
  severity: Severity;
  comment: string;
};

type DrawerData = {
  aiSummary: string;
  rows: ScoreRow[];
  totals: { techRaw: number; techMax: number; priceScore: number; total: number; winnerTotal: number; ranking: number; candidates: number };
  improvements: { label: string; score: string; severity: Severity; tip: string }[];
};

type AuthorityProfile = {
  id: string; name: string; type: string; region: string; sector: string;
  lettersAnalysed: number; companiesReviewed: number; activeSince: string;
  ratesHigh: string[]; ratesLow: string[];
  commonRejectionReasons: { reason: string; frequency: number }[];
  tendroInsight: string;
};

type SubToggle = "individual" | "dashboard";
type Range = "3M" | "6M" | "12M";

// ── Severity config ───────────────────────────────────────────────────────────

const SEV_STYLE: Record<Severity, string> = {
  "Excellent":        "bg-[#064E3B] text-white",
  "Très Bon":         "bg-[#10B981] text-white",
  "Bon":              "bg-[#34D399] text-white",
  "Moyen":            "bg-[#F59E0B] text-white",
  "Insuffisant":      "bg-[#EF4444] text-white",
  "Très Insuffisant": "bg-[#991B1B] text-white",
  "Non fourni":       "bg-[#111827] text-white",
};

function SeverityTag({ s }: { s: Severity }) {
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", SEV_STYLE[s])}>
      {s}
    </span>
  );
}

// ── Sample data ───────────────────────────────────────────────────────────────

const SAMPLE_LETTERS: RejectionLetter[] = [
  {
    id: "1",
    filename: "notation_ECCA_lot2_berlioz.pdf",
    tenderName: "Réhabilitation des postes de refoulement — LOT 2 : Berlioz / Musset",
    authority: "Estérel Côte d'Azur Agglomération",
    authorityType: "Intercommunal",
    reference: "083-200035319-20220707-2021A008_FIN-CC",
    submissionDate: "2022-09-08",
    uploadedAt: "2024-11-05",
    outcome: "non_retenu",
    status: "Analysé",
    fileSize: "2.1 MB",
    score: 83.3,
    winnerScore: 91.2,
    ranking: 2,
    candidates: 4,
    includedInAnalysis: true,
  },
  {
    id: "2",
    filename: "notation_metropole_nice_ep_2023.pdf",
    tenderName: "Renouvellement conduite eau potable DN300 — Secteur Est",
    authority: "Métropole Nice Côte d'Azur",
    authorityType: "Métropole",
    reference: "MCA-2023-EP-0441",
    submissionDate: "2023-04-28",
    uploadedAt: "2024-10-18",
    outcome: "non_retenu",
    status: "Analysé",
    fileSize: "1.4 MB",
    score: 76.5,
    winnerScore: 88.0,
    ranking: 3,
    candidates: 6,
    includedInAnalysis: true,
  },
  {
    id: "3",
    filename: "rejet_cd13_eclairage_2024.pdf",
    tenderName: "Rénovation réseau éclairage public — Tranche 4",
    authority: "Conseil Départemental 13",
    authorityType: "Département",
    reference: "CD13-2024-EP-TRN4",
    submissionDate: "2024-02-15",
    uploadedAt: "2024-09-12",
    outcome: "en_attente",
    status: "Données incomplètes",
    fileSize: "0.6 MB",
    includedInAnalysis: false,
  },
];

const DRAWER_DATA: Record<string, DrawerData> = {
  "1": {
    aiSummary:
      "Your bid was technically competitive, scoring well on environmental prevention, health & safety, and site cleanliness. However, evaluators flagged significant weaknesses in your human resources presentation (SC2.1) and supplier information (SC6.1), both rated Insuffisant. Your pricing was 18.73% below the administrative estimate, earning a perfect price score. The primary gap in future bids is the depth of your site-specific organisational methodology and the completeness of your supplier documentation.",
    rows: [
      { code: "SC1",   label: "Prévention environnementale et nuisances", maxPts: 10.5, ourScore: 8.5,  winnerScore: 9.5,  severity: "Très Bon",  comment: "Mesures bien décrites. Absence d'études acoustiques spécifiques au site." },
      { code: "SC2.1", label: "Ressources humaines — CV & organigramme",   maxPts: 5.0,  ourScore: 2.5,  winnerScore: 5.0,  severity: "Insuffisant", comment: "Les effectifs sont suffisants mais la réponse est très succincte. Absence de CV nominatifs pour les rôles clés." },
      { code: "SC2.2", label: "Moyens matériels et équipements",           maxPts: 4.0,  ourScore: 3.0,  winnerScore: 3.5,  severity: "Bon",        comment: "Liste du matériel complète. Capacité de substitution non précisée." },
      { code: "SC2.3", label: "Méthodologie travaux (3 sous-critères)",    maxPts: 12.0, ourScore: 8.0,  winnerScore: 10.5, severity: "Moyen",      comment: "Méthodologie trop générique pour les travaux sur postes de refoulement." },
      { code: "SC2.4", label: "Planning prévisionnel détaillé",            maxPts: 4.0,  ourScore: 3.5,  winnerScore: 4.0,  severity: "Très Bon",  comment: "Planning détaillé et cohérent avec les délais contractuels." },
      { code: "SC2.5", label: "Installation, stockage, logistique",        maxPts: 7.5,  ourScore: 5.5,  winnerScore: 7.0,  severity: "Bon",        comment: "Emplacements de stockage non localisés sur plan. Organisation logistique correcte." },
      { code: "SC2.6", label: "Propreté et entretien du chantier",         maxPts: 2.5,  ourScore: 2.5,  winnerScore: 2.5,  severity: "Excellent",  comment: "Procédures de propreté exemplaires. Engagement ferme sur les indicateurs qualité." },
      { code: "SC3",   label: "Délais et procédures d'intervention",       maxPts: 4.0,  ourScore: 3.5,  winnerScore: 4.0,  severity: "Très Bon",  comment: "Délais bien dimensionnés. Procédures d'urgence clairement définies." },
      { code: "SC4",   label: "Gestion des contraintes d'accès",           maxPts: 4.0,  ourScore: 3.5,  winnerScore: 3.5,  severity: "Très Bon",  comment: "Bonne maîtrise des contraintes d'accès. Plan de circulation cohérent." },
      { code: "SC5",   label: "Hygiène, sécurité et conditions de travail",maxPts: 2.5,  ourScore: 2.5,  winnerScore: 2.5,  severity: "Excellent",  comment: "PPSPS complet et conforme. Plan de prévention spécifique aux espaces confinés." },
      { code: "SC6",   label: "Fournitures et fiches produits",            maxPts: 5.0,  ourScore: 2.5,  winnerScore: 4.5,  severity: "Insuffisant", comment: "Tableau fournisseurs insuffisant : absence de décomposition par catégorie d'équipement." },
      { code: "SC7",   label: "Contrôle qualité des travaux",              maxPts: 4.0,  ourScore: 3.5,  winnerScore: 4.0,  severity: "Très Bon",  comment: "Plan qualité structuré. Points de contrôle critiques identifiés." },
    ],
    totals: { techRaw: 49.0, techMax: 67.5, priceScore: 38.0, total: 83.3, winnerTotal: 91.2, ranking: 2, candidates: 4 },
    improvements: [
      { label: "SC2.1 — Ressources humaines & CV", score: "2.5 / 5.0", severity: "Insuffisant", tip: "Fournissez des CV nominatifs pour chaque rôle clé du lot, avec affectation de temps. Joignez un organigramme spécifique au chantier, pas un organigramme générique d'entreprise." },
      { label: "SC6 — Fournitures & fiches produits", score: "2.5 / 5.0", severity: "Insuffisant", tip: "Préparez un tableau fournisseurs standard décomposé par catégorie d'équipement avec références produits et fiches techniques en annexe." },
      { label: "SC2.3 — Méthodologie travaux réseaux", score: "8.0 / 12.0", severity: "Moyen", tip: "Développez des templates de méthodologie dédiés aux travaux sur postes de refoulement que vous pouvez adapter par marché. Les évaluateurs attendent une réponse spécifique au site, pas une modus operandi générique." },
    ],
  },
  "2": {
    aiSummary:
      "Technically strong bid (86.2/100 on technical criteria), but your pricing was 4.1% above the administrative estimate, which penalised your price score in a competitive field of 6 candidates. The evaluators noted insufficient depth in your supplier documentation for DN300 equipment. Focus on price calibration for this authority's future tenders.",
    rows: [
      { code: "C1", label: "Valeur Technique (60%)", maxPts: 67.5, ourScore: 58.2, winnerScore: 60.1, severity: "Très Bon", comment: "Score technique solide. Légèrement en retrait sur l'organisation logistique." },
      { code: "C2", label: "Prix des Prestations (40%)", maxPts: 40.0, ourScore: 24.8, winnerScore: 39.2, severity: "Moyen", comment: "Offre 4,1% supérieure à l'estimation administrative. Score prix impacté par rapport aux concurrents moins-disants." },
    ],
    totals: { techRaw: 58.2, techMax: 67.5, priceScore: 24.8, total: 76.5, winnerTotal: 88.0, ranking: 3, candidates: 6 },
    improvements: [
      { label: "C2 — Compétitivité du prix", score: "24.8 / 40.0", severity: "Moyen", tip: "Calibrez votre offre financière par rapport à l'estimation administrative. Pour la MNCA, viser -5% à -15% de l'estimation maximise votre score prix tout en préservant votre marge." },
    ],
  },
};

const REJECTION_TREND = [
  { month: "Jan", applications: 8,  rejections: 5 },
  { month: "Fév", applications: 10, rejections: 6 },
  { month: "Mar", applications: 12, rejections: 7 },
  { month: "Avr", applications: 9,  rejections: 5 },
  { month: "Mai", applications: 14, rejections: 8 },
  { month: "Jun", applications: 11, rejections: 6 },
  { month: "Jul", applications: 7,  rejections: 3 },
  { month: "Aoû", applications: 6,  rejections: 2 },
  { month: "Sep", applications: 13, rejections: 7 },
  { month: "Oct", applications: 15, rejections: 8 },
  { month: "Nov", applications: 12, rejections: 6 },
  { month: "Déc", applications: 10, rejections: 4 },
];

const WIN_RATE_TREND = [
  { month: "Jan", winRate: 38, sectorAverage: 32 },
  { month: "Fév", winRate: 40, sectorAverage: 32 },
  { month: "Mar", winRate: 42, sectorAverage: 33 },
  { month: "Avr", winRate: 44, sectorAverage: 33 },
  { month: "Mai", winRate: 43, sectorAverage: 34 },
  { month: "Jun", winRate: 45, sectorAverage: 34 },
  { month: "Jul", winRate: 57, sectorAverage: 35 },
  { month: "Aoû", winRate: 67, sectorAverage: 35 },
  { month: "Sep", winRate: 46, sectorAverage: 35 },
  { month: "Oct", winRate: 47, sectorAverage: 36 },
  { month: "Nov", winRate: 50, sectorAverage: 36 },
  { month: "Déc", winRate: 60, sectorAverage: 37 },
];

const TOP_REASONS = [
  { reason: "Ressources humaines insuffisantes", count: 14 },
  { reason: "Documentation fournisseurs incomplète", count: 11 },
  { reason: "Méthodologie trop générique", count: 9 },
  { reason: "Prix au-dessus estimation", count: 7 },
  { reason: "Références insuffisantes", count: 5 },
];

const SCORE_DIST = [
  { range: "0–20",  count: 0 },
  { range: "20–40", count: 1 },
  { range: "40–60", count: 4 },
  { range: "60–80", count: 18 },
  { range: "80–100",count: 24 },
];

const RADAR_DATA = [
  { subject: "Prév. env.",   score: 81,  fullMark: 100 },
  { subject: "Organisation", score: 41,  fullMark: 100 },
  { subject: "Délais",       score: 88,  fullMark: 100 },
  { subject: "Accès",        score: 87,  fullMark: 100 },
  { subject: "H&S",          score: 95,  fullMark: 100 },
  { subject: "Fournitures",  score: 48,  fullMark: 100 },
  { subject: "Qualité",      score: 87,  fullMark: 100 },
  { subject: "Prix",         score: 94,  fullMark: 100 },
];

const DONUT_DATA = [
  { type: "Intercommunal", count: 14, color: NAVY      },
  { type: "Commune",       count: 9,  color: "#1e4d8c" },
  { type: "Département",   count: 5,  color: "#3267b3" },
  { type: "Région",        count: 2,  color: "#4d82cb" },
  { type: "État",          count: 1,  color: "#8ab1df" },
];

const STRENGTHS = [
  { id: "1", title: "Compétitivité prix", description: "Vos offres sont systématiquement inférieures à l'estimation administrative, générant d'excellents scores de prix." },
  { id: "2", title: "Hygiène & sécurité", description: "Les acheteurs évaluent constamment vos PPSPS et plans de prévention comme Excellent ou Très Bon." },
  { id: "3", title: "Références solides", description: "Vos références passées et votre expérience sectorielles inspirent confiance aux autorités adjudicatrices." },
];

const WEAKNESSES = [
  { id: "1", title: "Ressources humaines — CV & organigrammes", description: "Évaluateurs récurrents : vos CV et organigrammes sont trop génériques, non adaptés au lot spécifique.", tip: "Préparez des CV nominatifs et un organigramme d'exécution spécifique pour chaque lot soumissionné." },
  { id: "2", title: "Fournitures & fiches produits", description: "La section fournisseurs est systématiquement signalée comme superficielle. Manque de décomposition par catégorie.", tip: "Créez un tableau fournisseurs standard décomposé par type d'équipement, adaptable par marché." },
];

const AUTHORITY_PROFILES: AuthorityProfile[] = [
  {
    id: "1", name: "Mairie de Paris", type: "Commune", region: "Île-de-France", sector: "Services généraux",
    lettersAnalysed: 42, companiesReviewed: 130, activeSince: "2019",
    ratesHigh: ["Innovation", "Développement durable", "Références locales"],
    ratesLow: ["Prix uniquement", "Dossiers génériques"],
    commonRejectionReasons: [
      { reason: "Prix non compétitif", frequency: 65 },
      { reason: "Mémoire non adapté", frequency: 52 },
      { reason: "Manque de références", frequency: 40 },
      { reason: "Délai trop long", frequency: 30 },
      { reason: "Équipe sous-dimensionnée", frequency: 18 },
    ],
    tendroInsight: "La Mairie de Paris valorise fortement l'aspect RSE et l'innovation. Un mémoire citant vos initiatives développement durable augmentera significativement votre score.",
  },
  {
    id: "2", name: "Région Île-de-France", type: "Région", region: "Île-de-France", sector: "IT & Numérique",
    lettersAnalysed: 28, companiesReviewed: 85, activeSince: "2020",
    ratesHigh: ["Expertise technique", "Agilité", "Certifications"],
    ratesLow: ["Offres trop génériques", "Absence de référent dédié"],
    commonRejectionReasons: [
      { reason: "Manque d'expertise spécialisée", frequency: 70 },
      { reason: "Absence de certification", frequency: 58 },
      { reason: "Offre financière élevée", frequency: 45 },
      { reason: "Délai de mise en œuvre", frequency: 35 },
      { reason: "Documentation insuffisante", frequency: 22 },
    ],
    tendroInsight: "La Région IDF exige systématiquement des certifications sectorielles. Obtenez au moins ISO 27001 pour les marchés IT pour passer le premier filtre.",
  },
  {
    id: "3", name: "CHU de Bordeaux", type: "Établissement public", region: "Nouvelle-Aquitaine", sector: "Santé",
    lettersAnalysed: 19, companiesReviewed: 60, activeSince: "2021",
    ratesHigh: ["Sécurité des données", "Conformité RGPD", "Support 24/7"],
    ratesLow: ["Manque de spécialisation santé", "Absence de SLA"],
    commonRejectionReasons: [
      { reason: "Non-conformité RGPD", frequency: 75 },
      { reason: "Absence de SLA défini", frequency: 60 },
      { reason: "Manque références hospitalières", frequency: 50 },
      { reason: "Prix hors enveloppe", frequency: 38 },
      { reason: "Équipe non certifiée", frequency: 25 },
    ],
    tendroInsight: "Le CHU de Bordeaux rejette systématiquement les offres sans référence hospitalière vérifiable. Mettez en avant toute expérience avec des établissements de santé.",
  },
  {
    id: "4", name: "Département de la Gironde", type: "Département", region: "Nouvelle-Aquitaine", sector: "Services généraux",
    lettersAnalysed: 15, companiesReviewed: 45, activeSince: "2022",
    ratesHigh: ["Ancrage local", "Insertion professionnelle", "Développement durable"],
    ratesLow: ["Entreprises hors région", "Offres standardisées"],
    commonRejectionReasons: [
      { reason: "Absence d'ancrage local", frequency: 68 },
      { reason: "Pas de clause d'insertion", frequency: 55 },
      { reason: "Prix au-dessus budget", frequency: 42 },
      { reason: "Délai non respecté", frequency: 28 },
      { reason: "Dossier incomplet", frequency: 15 },
    ],
    tendroInsight: "Le Département de la Gironde valorise fortement l'ancrage territorial. Un partenariat avec un acteur local peut faire la différence si vous n'avez pas de bureau local.",
  },
];

const RANGE_MONTHS: Record<Range, number> = { "3M": 3, "6M": 6, "12M": 12 };

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RejectionAnalysisPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border bg-background px-6 pt-6 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: NAVY }}>
          Analyse des rejets
        </h1>
      </div>
      <main className="flex-1 overflow-y-auto bg-background px-6 py-6">
        <MyAnalysisTab />
      </main>
    </div>
  );
}

// ── Mon Analyse Tab ───────────────────────────────────────────────────────────

function MyAnalysisTab() {
  const [sub, setSub] = useState<SubToggle>("individual");
  const [letters, setLetters] = useState<RejectionLetter[]>(SAMPLE_LETTERS);
  const [processing, setProcessing] = useState<string[]>([]);
  const [drawerLetter, setDrawerLetter] = useState<RejectionLetter | null>(null);

  const handleAdd = (files: File[]) => {
    const names = files.map((f) => f.name);
    setProcessing((p) => [...p, ...names]);
    const today = new Date().toISOString().slice(0, 10);
    window.setTimeout(() => {
      const next: RejectionLetter[] = files.map((f, i) => ({
        id: `new-${Date.now()}-${i}`,
        filename: f.name,
        tenderName: f.name.replace(/\.[^.]+$/, ""),
        authority: "Autorité inconnue",
        authorityType: "Commune",
        reference: "—",
        submissionDate: today,
        uploadedAt: today,
        outcome: "en_attente",
        status: "Analysé",
        fileSize: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        includedInAnalysis: true,
      }));
      setLetters((p) => [...next, ...p]);
      setProcessing((p) => p.filter((n) => !names.includes(n)));
    }, 1800);
  };

  const handleDelete = (id: string) => {
    const removed = letters.find((l) => l.id === id);
    setLetters((p) => p.filter((l) => l.id !== id));
    if (removed) {
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span className="text-sm">Document supprimé.</span>
            <button
              onClick={() => { setLetters((p) => [removed, ...p]); toast.dismiss(t.id); }}
              className="shrink-0 text-sm font-medium underline-offset-2 hover:underline"
              style={{ color: NAVY }}
            >
              Annuler
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    }
  };

  const handleRename = (id: string, authority: string) =>
    setLetters((p) => p.map((l) => (l.id === id ? { ...l, authority } : l)));

  const handleToggle = (id: string, included: boolean) =>
    setLetters((p) => p.map((l) => (l.id === id ? { ...l, includedInAnalysis: included } : l)));

  const includedCount = letters.filter((l) => l.includedInAnalysis).length;

  return (
    <div className="max-w-5xl space-y-5">
      {/* Sub-toggle */}
      <div className="inline-flex rounded-full border border-[#E5E7EB] bg-[#F9FAFB] p-0.5">
        {(["individual", "dashboard"] as SubToggle[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSub(s)}
            className={cn(
              "rounded-full px-5 py-1.5 text-sm font-medium transition-colors",
              sub === s ? "text-white" : "text-muted-foreground hover:text-foreground"
            )}
            style={sub === s ? { backgroundColor: NAVY } : {}}
          >
            {s === "individual" ? "Analyse individuelle" : "Tableau de bord global"}
          </button>
        ))}
      </div>

      {sub === "individual" ? (
        <div className="space-y-6">
          <UploadZone onAdd={handleAdd} processingNames={processing} />
          {letters.length === 0 ? (
            <EmptyState message="Importez votre premier rapport d'analyse pour débloquer vos insights de performance." />
          ) : (
            <section className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rapports importés
                </span>
                <span className="text-xs text-muted-foreground">{letters.length} document{letters.length !== 1 ? "s" : ""}</span>
              </div>
              {letters.map((letter) => (
                <LetterRow
                  key={letter.id}
                  letter={letter}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  onToggle={handleToggle}
                  onOpen={() => setDrawerLetter(letter)}
                />
              ))}
            </section>
          )}
        </div>
      ) : (
        <DashboardView letterCount={includedCount} />
      )}

      <TenderDrawer
        letter={drawerLetter}
        analysis={drawerLetter ? DRAWER_DATA[drawerLetter.id] ?? null : null}
        onClose={() => setDrawerLetter(null)}
      />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: N05 }}>
        <FileText className="h-8 w-8 opacity-40" style={{ color: NAVY }} />
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────

function UploadZone({ onAdd, processingNames }: { onAdd: (f: File[]) => void; processingNames: string[] }) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.type === "application/pdf" || f.name.endsWith(".docx"));
    if (valid.length) onAdd(valid);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      className={cn(
        "rounded-xl border-2 border-dashed px-8 py-10 text-center transition-colors",
        dragging ? "bg-[rgba(10,31,68,.04)]" : "border-border bg-muted/30 hover:border-[#0A1F44]/40"
      )}
      style={dragging ? { borderColor: NAVY } : {}}
    >
      <Upload className="mx-auto mb-3 h-9 w-9" style={{ color: dragging ? NAVY : undefined, opacity: dragging ? 1 : 0.4 }} />
      <p className="text-sm font-medium text-foreground">
        Importez vos rapports d&apos;analyse d&apos;appels d&apos;offres
      </p>
      <p className="mt-1 text-xs text-muted-foreground">PDF ou DOCX · Glissez-déposez ou parcourez vos fichiers</p>
      <label className="mt-4 inline-block cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: NAVY }}>
        Parcourir
        <input type="file" className="sr-only" multiple accept=".pdf,.docx" onChange={(e) => handleFiles(e.target.files)} />
      </label>
      {processingNames.length > 0 && (
        <div className="mt-4 space-y-1">
          {processingNames.map((n) => (
            <div key={n} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: NAVY }} />
              Tendro AI extrait les critères de notation : {n}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Letter Row ────────────────────────────────────────────────────────────────

function LetterRow({ letter, onDelete, onRename, onToggle, onOpen }: {
  letter: RejectionLetter;
  onDelete: (id: string) => void;
  onRename: (id: string, auth: string) => void;
  onToggle: (id: string, included: boolean) => void;
  onOpen: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(letter.authority);

  const save = () => { onRename(letter.id, draft); setEditing(false); };
  const cancel = () => { setDraft(letter.authority); setEditing(false); };

  const outcomeStyle = {
    non_retenu: "bg-red-50 text-red-700 border-red-200",
    retenu: "bg-emerald-50 text-emerald-700 border-emerald-200",
    en_attente: "bg-amber-50 text-amber-700 border-amber-200",
  }[letter.outcome];
  const outcomeLabel = { non_retenu: "Non retenu", retenu: "Retenu", en_attente: "En attente" }[letter.outcome];

  const statusStyle = {
    "Analysé": "bg-emerald-100 text-emerald-700",
    "En attente": "bg-amber-100 text-amber-700",
    "Données incomplètes": "bg-red-100 text-red-700",
  }[letter.status];

  return (
    <div className="group flex items-start gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/30 transition-colors">
      <input
        type="checkbox"
        checked={letter.includedInAnalysis}
        onChange={(e) => onToggle(letter.id, e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded accent-[#0A1F44]"
        title="Inclure dans l'analyse globale"
      />
      <FileText className="mt-0.5 h-5 w-5 shrink-0" style={{ color: NAVY }} />
      <div className="min-w-0 flex-1">
        {/* Tender name */}
        <p className="truncate text-sm font-semibold" style={{ color: NAVY }}>
          {letter.tenderName}
        </p>
        {/* Authority + reference */}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
                className="h-6 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0A1F44]"
              />
              <button type="button" onClick={save}><Check className="h-3.5 w-3.5 text-emerald-600" /></button>
              <button type="button" onClick={cancel}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {letter.authority}
              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <span className="text-xs text-muted-foreground font-mono">{letter.reference}</span>
        </div>
        {/* Meta row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", outcomeStyle)}>
            {outcomeLabel}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusStyle)}>
            {letter.status}
          </span>
          {letter.score !== undefined && (
            <span className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums" style={{ backgroundColor: N10, color: NAVY }}>
              {letter.score} / 100
            </span>
          )}
          {letter.ranking !== undefined && letter.candidates !== undefined && (
            <span className="text-[11px] text-muted-foreground">
              {letter.ranking}e / {letter.candidates} candidats
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">Soumis le {letter.submissionDate}</span>
          <span className="text-[11px] text-muted-foreground">· {letter.fileSize}</span>
        </div>
      </div>
      {/* Hover actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onOpen}
          title="Voir l'analyse"
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Télécharger"
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(letter.id)}
          title="Supprimer"
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Tender Drawer ─────────────────────────────────────────────────────────────

function TenderDrawer({ letter, analysis, onClose }: {
  letter: RejectionLetter | null;
  analysis: DrawerData | null;
  onClose: () => void;
}) {
  const open = !!letter;
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (code: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300",
          "w-full max-w-[60vw]"
        )}
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        {letter && (
          <>
            {/* Drawer header */}
            <div className="flex-none border-b border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold leading-tight" style={{ color: NAVY }}>
                    {letter.tenderName}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {letter.authority}
                    <span className="ml-2 rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {letter.authorityType}
                    </span>
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{letter.reference}</p>
                </div>
                <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* Score summary strip */}
              {letter.score !== undefined && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="rounded-lg px-3 py-2 text-center" style={{ backgroundColor: N05 }}>
                    <p className="text-xl font-bold tabular-nums" style={{ color: NAVY }}>{letter.score}</p>
                    <p className="text-[10px] text-muted-foreground">Votre score</p>
                  </div>
                  {letter.winnerScore !== undefined && (
                    <div className="rounded-lg px-3 py-2 text-center border border-border">
                      <p className="text-xl font-bold tabular-nums text-foreground">{letter.winnerScore}</p>
                      <p className="text-[10px] text-muted-foreground">Score gagnant</p>
                    </div>
                  )}
                  {letter.ranking !== undefined && (
                    <div className="rounded-lg px-3 py-2 text-center border border-border">
                      <p className="text-xl font-bold tabular-nums text-foreground">{letter.ranking}e</p>
                      <p className="text-[10px] text-muted-foreground">/ {letter.candidates} candidats</p>
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                      <Download className="h-3.5 w-3.5" />
                      Document original
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: NAVY }}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Voir en ligne
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">
              {!analysis ? (
                <EmptyState message="Données d'analyse insuffisantes pour ce document. Vérifiez le format du fichier importé." />
              ) : (
                <div className="space-y-6 p-6">

                  {/* AI Summary */}
                  <div className="rounded-lg border-l-4 p-4" style={{ borderLeftColor: NAVY, backgroundColor: N05 }}>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: NAVY }}>
                      <Sparkles className="h-4 w-4" />
                      Synthèse Tendro AI
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{analysis.aiSummary}</p>
                  </div>

                  {/* Scoring breakdown */}
                  <div>
                    <h3 className="mb-1 text-sm font-semibold" style={{ color: NAVY }}>Décomposition du scoring — Vous vs Gagnant</h3>
                    <p className="mb-3 text-xs text-muted-foreground">Extrait du rapport de notation importé</p>
                    <div className="rounded-lg border border-border overflow-hidden">
                      {analysis.rows.map((row) => {
                        const expanded = expandedRows.has(row.code);
                        const pct = Math.round((row.ourScore / row.maxPts) * 100);
                        const winnerPct = Math.round((row.winnerScore / row.maxPts) * 100);
                        const delta = row.ourScore - row.winnerScore;
                        return (
                          <div key={row.code} className="border-b border-border last:border-0">
                            <button
                              type="button"
                              onClick={() => toggleRow(row.code)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                            >
                              <span className="shrink-0 w-12 font-mono text-xs text-muted-foreground">{row.code}</span>
                              <span className="flex-1 min-w-0 text-sm text-foreground truncate">{row.label}</span>
                              <div className="shrink-0 flex items-center gap-3">
                                {/* Score bar */}
                                <div className="flex items-center gap-1.5">
                                  <span className="w-8 text-right font-mono text-xs font-semibold tabular-nums" style={{ color: NAVY }}>{row.ourScore}</span>
                                  <div className="w-20 shrink-0">
                                    <div className="h-1.5 w-full rounded-full bg-[#E5E7EB]">
                                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: NAVY }} />
                                    </div>
                                  </div>
                                  <span className="w-8 font-mono text-xs text-muted-foreground tabular-nums">{row.maxPts}</span>
                                </div>
                                {/* Delta */}
                                <span className={cn("tabular-nums text-xs font-medium w-16 text-right", delta < 0 ? "text-red-600" : "text-emerald-600")}>
                                  {delta < 0 ? "" : "+"}{delta.toFixed(1)} pts
                                </span>
                                <SeverityTag s={row.severity} />
                                {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                              </div>
                            </button>
                            {expanded && (
                              <div className="border-t border-border/50 bg-muted/20 px-4 py-3 pl-[52px]">
                                <p className="text-xs italic text-muted-foreground">{row.comment}</p>
                                <div className="mt-2 flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="mb-0.5 flex justify-between text-[10px] text-muted-foreground">
                                      <span>Gagnant estimé</span>
                                      <span className="font-semibold">{row.winnerScore} / {row.maxPts}</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-[#E5E7EB]">
                                      <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${winnerPct}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total score */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold" style={{ color: NAVY }}>Score final</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Technique (60%)", value: `${analysis.totals.techRaw} / ${analysis.totals.techMax}`, sub: `${Math.round(analysis.totals.techRaw / analysis.totals.techMax * 60)} / 60 pondéré`, pct: analysis.totals.techRaw / analysis.totals.techMax },
                        { label: "Prix (40%)", value: `${analysis.totals.priceScore} / 40`, sub: `${Math.round(analysis.totals.priceScore)} pts pondérés`, pct: analysis.totals.priceScore / 40 },
                        { label: "Total", value: `${analysis.totals.total} / 100`, sub: `Gagnant : ${analysis.totals.winnerTotal}`, pct: analysis.totals.total / 100 },
                      ].map((c) => (
                        <div key={c.label} className="rounded-lg border p-3" style={{ borderColor: c.pct >= 0.75 ? "#10B981" : c.pct >= 0.5 ? "#F59E0B" : "#EF4444", backgroundColor: c.pct >= 0.75 ? "#F0FDF4" : c.pct >= 0.5 ? "#FFFBEB" : "#FEF2F2" }}>
                          <p className="text-xs text-muted-foreground">{c.label}</p>
                          <p className="mt-0.5 text-lg font-bold tabular-nums" style={{ color: NAVY }}>{c.value}</p>
                          <p className="text-[10px] text-muted-foreground">{c.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Improvements */}
                  {analysis.improvements.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold" style={{ color: NAVY }}>Ce qu&apos;il faut améliorer pour le prochain dossier</h3>
                      <div className="space-y-3">
                        {analysis.improvements.map((imp, i) => (
                          <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">{i + 1}</span>
                              <span className="text-sm font-medium text-foreground">{imp.label}</span>
                              <SeverityTag s={imp.severity} />
                              <span className="ml-auto font-mono text-xs text-muted-foreground">{imp.score}</span>
                            </div>
                            <p className="mt-2 flex items-start gap-1.5 pl-7 text-xs italic" style={{ color: NAVY }}>
                              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              {imp.tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

// ── Dashboard View ────────────────────────────────────────────────────────────

function DashboardView({ letterCount }: { letterCount: number }) {
  return (
    <div className="space-y-8">
      <AnalysisSummary letterCount={letterCount} />
      <section className="space-y-4">
        <h2 className="text-base font-semibold" style={{ color: NAVY }}>Analyses complémentaires</h2>
        <RejectionTrendChart />
        <div className="grid gap-4 lg:grid-cols-2">
          <WinRateChart />
          <ScoreDistributionChart />
          <CriteriaRadarChart />
          <TopReasonsCard />
          <AuthorityDonutChart />
        </div>
      </section>
    </div>
  );
}

// ── Analysis Summary ──────────────────────────────────────────────────────────

function AnalysisSummary({ letterCount }: { letterCount: number }) {
  return (
    <section className="space-y-4">
      <div className="border-b pb-3" style={{ borderColor: `${NAVY}20` }}>
        <h2 className="text-base font-semibold" style={{ color: NAVY }}>Profil de rejet agrégé</h2>
        <p className="text-sm text-muted-foreground">
          Synthèse basée sur {letterCount} rapport{letterCount !== 1 ? "s" : ""} inclus dans l&apos;analyse
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">Points forts constants</h3>
          <ul className="space-y-3">
            {STRENGTHS.map((s) => (
              <li key={s.id} className="flex gap-3 rounded-md border border-emerald-100 bg-emerald-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700">Faiblesses récurrentes</h3>
          <ul className="space-y-3">
            {WEAKNESSES.map((w) => (
              <li key={w.id} className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{w.title}</p>
                    <p className="text-sm text-muted-foreground">{w.description}</p>
                  </div>
                </div>
                <p className="mt-2 flex items-start gap-1.5 pl-7 text-xs italic" style={{ color: NAVY }}>
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {w.tip}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ── Rejection Trend Chart ─────────────────────────────────────────────────────

function RejectionTrendChart() {
  const [range, setRange] = useState<Range>("12M");
  const data = useMemo(() => REJECTION_TREND.slice(-RANGE_MONTHS[range]), [range]);
  const totals = useMemo(() => {
    const apps = data.reduce((s, d) => s + d.applications, 0);
    const rejs = data.reduce((s, d) => s + d.rejections, 0);
    return { applications: apps, rejections: rejs, rate: apps ? Math.round((rejs / apps) * 100) : 0 };
  }, [data]);

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Évolution des candidatures et rejets</h3>
          <p className="text-xs text-muted-foreground">Rejets mensuels vs candidatures totales</p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatBox label="Candidatures" value={totals.applications} />
        <StatBox label="Rejets" value={totals.rejections} />
        <StatBox label="Taux de rejet" value={`${totals.rate}%`} />
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line name="Candidatures" type="monotone" dataKey="applications" stroke={NAVY} strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line name="Rejets" type="monotone" dataKey="rejections" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3, fill: "#EF4444" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// ── Win Rate Chart ────────────────────────────────────────────────────────────

function WinRateChart() {
  const [range, setRange] = useState<Range>("12M");
  const data = useMemo(() => WIN_RATE_TREND.slice(-RANGE_MONTHS[range]), [range]);
  const current = data[data.length - 1]?.winRate ?? 0;
  const previous = data[data.length - 2]?.winRate ?? current;
  const trendUp = current >= previous;
  const sectorAvg = Math.round(data.reduce((s, d) => s + d.sectorAverage, 0) / Math.max(data.length, 1));

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Taux de succès</h3>
          <p className="text-xs text-muted-foreground">Part des candidatures remportées</p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums" style={{ color: NAVY }}>{current}%</span>
        <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", trendUp ? "text-emerald-600" : "text-red-600")}>
          {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(current - previous)}%
        </span>
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`]} />
            <ReferenceLine y={sectorAvg} stroke="#9CA3AF" strokeDasharray="4 4" label={{ value: `Moy. secteur ${sectorAvg}%`, position: "insideTopRight", fill: "#9CA3AF", fontSize: 11 }} />
            <Line type="monotone" dataKey="winRate" name="Taux de succès" stroke={NAVY} strokeWidth={2.5} dot={{ r: 3, fill: NAVY }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// ── Score Distribution Chart ──────────────────────────────────────────────────

function ScoreDistributionChart() {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Distribution de vos scores</h3>
      <p className="mb-4 text-xs text-muted-foreground">Répartition de vos scores totaux sur toutes les soumissions évaluées</p>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={SCORE_DIST} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="range" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} AO`]} />
            <ReferenceLine x="60–80" stroke="#EF4444" strokeDasharray="4 4" label={{ value: "Seuil gagnant ~70", position: "top", fill: "#EF4444", fontSize: 10 }} />
            <Bar dataKey="count" name="Appels d'offres" radius={[3, 3, 0, 0]}>
              {SCORE_DIST.map((entry, i) => (
                <Cell key={i} fill={i >= 3 ? NAVY : i === 2 ? "#4d82cb" : "#8ab1df"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs italic text-muted-foreground">
        💡 <span style={{ color: NAVY }}>89% de vos offres scorent au-dessus de 60 / 100 — fort signal de compétitivité technique.</span>
      </p>
    </section>
  );
}

// ── Criteria Radar Chart ──────────────────────────────────────────────────────

function CriteriaRadarChart() {
  return (
    <section className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Performance moyenne par critère d&apos;évaluation</h3>
      <p className="mb-4 text-xs text-muted-foreground">Score normalisé moyen sur l&apos;ensemble des marchés analysés (0–100%)</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6B7280" }} />
            <Radar name="Maximum (100%)" dataKey="fullMark" fill="transparent" stroke="#E5E7EB" strokeWidth={1.5} />
            <Radar name="Votre score moyen" dataKey="score" fill={NAVY} fillOpacity={0.18} stroke={NAVY} strokeWidth={2} dot={{ r: 3, fill: NAVY }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
          ✓ Point fort : Prix (94%)
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-medium text-red-700">
          ✗ Point faible : Organisation chantier (41%)
        </span>
      </div>
    </section>
  );
}

// ── Top Reasons Card ──────────────────────────────────────────────────────────

function TopReasonsCard() {
  const max = Math.max(...TOP_REASONS.map((r) => r.count));
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Sous-critères les plus faibles</h3>
      <p className="mb-4 text-xs text-muted-foreground">Critères où vous perdez le plus de points régulièrement</p>
      <ul className="space-y-3">
        {TOP_REASONS.map((r) => {
          const pct = Math.round((r.count / max) * 100);
          return (
            <li key={r.reason}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{r.reason}</span>
                <span className="text-xs text-muted-foreground">{r.count} AO</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-[#EF4444]" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Authority Donut Chart ─────────────────────────────────────────────────────

function AuthorityDonutChart() {
  const total = DONUT_DATA.reduce((s, d) => s + d.count, 0);
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Rejets par type d&apos;autorité</h3>
      <p className="mb-2 text-xs text-muted-foreground">Répartition des rejets dans le secteur public</p>
      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={DONUT_DATA} cx="50%" cy="50%" innerRadius={52} outerRadius={80} dataKey="count" paddingAngle={2}>
              {DONUT_DATA.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n) => [`${v} rejets`, n]} contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums" style={{ color: NAVY }}>{total}</p>
            <p className="text-[10px] text-muted-foreground">rejets</p>
          </div>
        </div>
      </div>
      <ul className="mt-2 space-y-1">
        {DONUT_DATA.map((d) => (
          <li key={d.type} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
              {d.type}
            </span>
            <span className="text-muted-foreground">{d.count} <span className="text-[10px]">({Math.round(d.count / total * 100)}%)</span></span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-start gap-1.5 text-xs italic" style={{ color: NAVY }}>
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        La majorité de vos rejets proviennent des autorités intercommunales. Consultez leurs profils pour adapter vos prochaines offres.
      </p>
    </section>
  );
}

// ── Authority Profiles Tab ────────────────────────────────────────────────────

function AuthorityProfilesTab() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("Tous les types");
  const [region, setRegion] = useState("Toutes les régions");
  const [sector, setSector] = useState("Tous les secteurs");
  const [selected, setSelected] = useState<AuthorityProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const results = useMemo(() =>
    AUTHORITY_PROFILES.filter((a) => {
      if (type !== "Tous les types" && a.type !== type) return false;
      if (region !== "Toutes les régions" && a.region !== region) return false;
      if (sector !== "Tous les secteurs" && a.sector !== sector) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.region.toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
    }),
    [query, type, region, sector]
  );

  return (
    <div className="max-w-5xl space-y-5">
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une autorité par nom, région ou type..."
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { value: type,   onChange: setType,   options: ["Tous les types", "Commune", "Région", "Département", "Établissement public"] },
            { value: region, onChange: setRegion, options: ["Toutes les régions", "Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Pays de la Loire"] },
            { value: sector, onChange: setSector, options: ["Tous les secteurs", "Services généraux", "IT & Numérique", "Santé", "Construction"] },
          ].map((sel, i) => (
            <select
              key={i}
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
            >
              {sel.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{results.length} autorité{results.length !== 1 ? "s" : ""} trouvée{results.length !== 1 ? "s" : ""}</p>
      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Aucune autorité ne correspond à vos filtres.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((a) => (
            <article key={a.id} className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: N10, color: NAVY }}>
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">{a.name}</h3>
                  <p className="text-xs text-muted-foreground">{a.type} · {a.region}</p>
                </div>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{a.lettersAnalysed}</span> lettres analysées
              </p>
              <button
                type="button"
                onClick={() => { setSelected(a); setDrawerOpen(true); }}
                className="mt-auto w-full rounded-md border border-border bg-background py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Voir le profil
              </button>
            </article>
          ))}
        </div>
      )}
      <AuthorityProfileDrawer authority={selected} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

// ── Authority Profile Drawer ──────────────────────────────────────────────────

function AuthorityProfileDrawer({ authority, open, onClose }: {
  authority: AuthorityProfile | null; open: boolean; onClose: () => void;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-background shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {authority && (
          <div className="flex h-full flex-col overflow-y-auto">
            <div className="flex items-start gap-4 border-b border-border p-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ backgroundColor: NAVY }}>
                {authority.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold leading-tight" style={{ color: NAVY }}>{authority.name}</h2>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium" style={{ borderColor: `${NAVY}30`, backgroundColor: N05, color: NAVY }}>{authority.type}</span>
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{authority.region}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span><span className="font-semibold text-foreground">{authority.lettersAnalysed}</span> lettres analysées</span>
                  <span><span className="font-semibold text-foreground">{authority.companiesReviewed}</span> entreprises examinées</span>
                  <span>Actif depuis <span className="font-semibold text-foreground">{authority.activeSince}</span></span>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-6 p-6">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tendances d&apos;évaluation</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium text-foreground">Note élevée</p>
                    <div className="flex flex-wrap gap-1.5">
                      {authority.ratesHigh.map((tag) => (
                        <span key={tag} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-foreground">Note basse</p>
                    <div className="flex flex-wrap gap-1.5">
                      {authority.ratesLow.map((tag) => (
                        <span key={tag} className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top 5 raisons de rejet</h3>
                <ol className="space-y-2">
                  {authority.commonRejectionReasons.map((item, i) => (
                    <li key={item.reason} className="rounded-md border border-border bg-card px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                          {item.reason}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.frequency}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${item.frequency}%`, backgroundColor: NAVY }} />
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="rounded-lg border-l-4 p-4" style={{ borderLeftColor: NAVY, backgroundColor: N05 }}>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: NAVY }}>
                  <Lightbulb className="h-4 w-4" />
                  Insight Tendro
                </div>
                <p className="text-sm text-foreground">{authority.tendroInsight}</p>
              </div>
              <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: NAVY }}>
                Voir les appels d&apos;offres ouverts
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function RangeSelector({ value, onChange }: { value: Range; onChange: (v: Range) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5 text-xs">
      {(["3M", "6M", "12M"] as Range[]).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className="rounded px-2.5 py-1 font-medium transition-colors"
          style={value === r ? { backgroundColor: NAVY, color: "white" } : { color: "#6B7280" }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <p className="text-xl font-bold tabular-nums" style={{ color: NAVY }}>{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
