"use client";
export const dynamic = "force-dynamic";
import { useCallback, useMemo, useState } from "react";
import {
  CartesianGrid, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import {
  Upload, FileText, Trash2, Pencil, Check, X, Building2,
  Search, AlertTriangle, Lightbulb, ArrowUp, ArrowDown, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Types ────────────────────────────────────────────────────────────────────

type RejectionLetter = {
  id: string;
  filename: string;
  uploadedAt: string;
  authority: string;
  authorityType: string;
  status: "Analysé" | "En attente";
  fileSize: string;
  includedInAnalysis: boolean;
};

type AuthorityProfile = {
  id: string;
  name: string;
  type: string;
  region: string;
  sector: string;
  lettersAnalysed: number;
  companiesReviewed: number;
  activeSince: string;
  ratesHigh: string[];
  ratesLow: string[];
  commonRejectionReasons: { reason: string; frequency: number }[];
  tendroInsight: string;
};

type Tab = "analyse" | "profiles";
type Range = "3M" | "6M" | "12M";

// ── Sample Data ───────────────────────────────────────────────────────────────

const SAMPLE_LETTERS: RejectionLetter[] = [
  { id: "1", filename: "rejet_mairie_paris_2024.pdf", uploadedAt: "2024-11-05", authority: "Mairie de Paris", authorityType: "Commune", status: "Analysé", fileSize: "1.2 MB", includedInAnalysis: true },
  { id: "2", filename: "rejet_region_idf.pdf", uploadedAt: "2024-10-18", authority: "Région Île-de-France", authorityType: "Région", status: "Analysé", fileSize: "0.8 MB", includedInAnalysis: true },
  { id: "3", filename: "rejet_chu_bordeaux.pdf", uploadedAt: "2024-09-12", authority: "CHU de Bordeaux", authorityType: "Établissement public", status: "Analysé", fileSize: "2.1 MB", includedInAnalysis: false },
];

const REJECTION_TREND = [
  { month: "Jan", applications: 8, rejections: 5 },
  { month: "Fév", applications: 10, rejections: 6 },
  { month: "Mar", applications: 12, rejections: 7 },
  { month: "Avr", applications: 9, rejections: 5 },
  { month: "Mai", applications: 14, rejections: 8 },
  { month: "Jun", applications: 11, rejections: 6 },
  { month: "Jul", applications: 7, rejections: 3 },
  { month: "Aoû", applications: 6, rejections: 2 },
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
  { reason: "Prix non compétitif", count: 12 },
  { reason: "Dossier incomplet", count: 9 },
  { reason: "Expériences insuffisantes", count: 7 },
  { reason: "Délai de livraison", count: 5 },
  { reason: "Capacité financière", count: 4 },
];

const AUTHORITY_BREAKDOWN = [
  { type: "Commune", count: 18 },
  { type: "Région", count: 11 },
  { type: "Établissement public", count: 8 },
  { type: "Département", count: 6 },
];

const STRENGTHS = [
  { id: "1", title: "Qualité technique", description: "Vos offres sont reconnues pour leur qualité technique et leur approche méthodique." },
  { id: "2", title: "Réactivité", description: "Les acheteurs soulignent votre capacité à répondre rapidement aux demandes." },
  { id: "3", title: "Références solides", description: "Vos références passées inspirent confiance aux autorités adjudicatrices." },
];

const WEAKNESSES = [
  { id: "1", title: "Prix trop élevés", description: "Votre notation prix est systématiquement inférieure à celle des concurrents.", tip: "Analysez la grille de pondération avant de chiffrer : certaines AO notent le prix à 60%." },
  { id: "2", title: "Mémoire technique peu différenciant", description: "Le contenu de votre mémoire technique reprend souvent le cahier des charges sans valeur ajoutée.", tip: "Adaptez chaque mémoire à l'acheteur : citez ses priorités stratégiques et montrez comment vous les adressez." },
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
    tendroInsight: "Le Département de la Gironde valorise fortement l'ancrage territorial. Si vous n'avez pas de bureau local, un partenariat avec un acteur local peut faire la différence.",
  },
];

const RANGE_MONTHS: Record<Range, number> = { "3M": 3, "6M": 6, "12M": 12 };

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RejectionAnalysisPage() {
  const [tab, setTab] = useState<Tab>("analyse");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border bg-background px-6 pt-6 pb-0">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
          Analyse des rejets
        </h1>
        <div className="flex gap-1">
          {(["analyse", "profiles"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "border-b-2 px-4 pb-3 text-sm font-medium transition-colors",
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "analyse" ? "Mon Analyse" : "Profils d'autorités"}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto bg-background px-6 py-6">
        {tab === "analyse" ? <MyAnalysisTab /> : <AuthorityProfilesTab />}
      </main>
    </div>
  );
}

// ── Mon Analyse Tab ───────────────────────────────────────────────────────────

function MyAnalysisTab() {
  const [letters, setLetters] = useState<RejectionLetter[]>(SAMPLE_LETTERS);
  const [processing, setProcessing] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerAuth, setDrawerAuth] = useState<AuthorityProfile | null>(null);

  const handleAdd = (files: File[]) => {
    const names = files.map((f) => f.name);
    setProcessing((prev) => [...prev, ...names]);
    const today = new Date().toISOString().slice(0, 10);
    window.setTimeout(() => {
      const next: RejectionLetter[] = files.map((f, i) => ({
        id: `new-${Date.now()}-${i}`,
        filename: f.name,
        uploadedAt: today,
        authority: "Autorité inconnue",
        authorityType: "Commune",
        status: "Analysé",
        fileSize: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        includedInAnalysis: true,
      }));
      setLetters((prev) => [...next, ...prev]);
      setProcessing((prev) => prev.filter((n) => !names.includes(n)));
    }, 1800);
  };

  const handleDelete = (id: string) => {
    const removed = letters.find((l) => l.id === id);
    setLetters((prev) => prev.filter((l) => l.id !== id));
    if (removed) {
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span className="text-sm">Lettre supprimée.</span>
            <button
              onClick={() => {
                setLetters((prev) => [removed, ...prev]);
                toast.dismiss(t.id);
              }}
              className="shrink-0 text-sm font-medium text-primary underline-offset-2 hover:underline"
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
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, authority } : l)));

  const handleToggle = (id: string, included: boolean) =>
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, includedInAnalysis: included } : l)));

  const includedCount = letters.filter((l) => l.includedInAnalysis).length;

  return (
    <div className="max-w-4xl space-y-8">
      <UploadZone onAdd={handleAdd} processingNames={processing} />

      {letters.length > 0 && (
        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Lettres importées
          </div>
          <div>
            {letters.map((letter) => (
              <LetterRow
                key={letter.id}
                letter={letter}
                onDelete={handleDelete}
                onRename={handleRename}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </section>
      )}

      {letters.length > 0 && (
        <>
          <AnalysisSummary letterCount={includedCount} />
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Analyses complémentaires</h2>
            <RejectionTrendChart />
            <div className="grid gap-4 lg:grid-cols-2">
              <WinRateChart />
              <TopReasonsCard />
              <AuthorityBreakdownCard />
            </div>
          </section>
        </>
      )}
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
        "rounded-xl border-2 border-dashed px-8 py-12 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/50"
      )}
    >
      <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">
        Glissez vos lettres de rejet ici
      </p>
      <p className="mt-1 text-xs text-muted-foreground">PDF ou DOCX · Plusieurs fichiers acceptés</p>
      <label className="mt-4 inline-block cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Parcourir
        <input type="file" className="sr-only" multiple accept=".pdf,.docx" onChange={(e) => handleFiles(e.target.files)} />
      </label>
      {processingNames.length > 0 && (
        <div className="mt-4 space-y-1">
          {processingNames.map((n) => (
            <div key={n} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Analyse en cours : {n}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Letter Row ────────────────────────────────────────────────────────────────

function LetterRow({ letter, onDelete, onRename, onToggle }: {
  letter: RejectionLetter;
  onDelete: (id: string) => void;
  onRename: (id: string, auth: string) => void;
  onToggle: (id: string, included: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(letter.authority);

  const save = () => { onRename(letter.id, draft); setEditing(false); };
  const cancel = () => { setDraft(letter.authority); setEditing(false); };

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
      <input
        type="checkbox"
        checked={letter.includedInAnalysis}
        onChange={(e) => onToggle(letter.id, e.target.checked)}
        className="h-4 w-4 rounded accent-primary"
        title="Inclure dans l'analyse"
      />
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{letter.filename}</p>
        <div className="mt-0.5 flex items-center gap-2">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
                className="h-6 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button type="button" onClick={save} className="text-primary hover:text-primary/80"><Check className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={cancel} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {letter.authority}
              <Pencil className="h-3 w-3" />
            </button>
          )}
          <span className="text-xs text-muted-foreground">· {letter.uploadedAt} · {letter.fileSize}</span>
        </div>
      </div>
      <span className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        letter.status === "Analysé"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"
      )}>
        {letter.status}
      </span>
      <button type="button" onClick={() => onDelete(letter.id)} className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Analysis Summary ──────────────────────────────────────────────────────────

function AnalysisSummary({ letterCount }: { letterCount: number }) {
  return (
    <section className="space-y-4">
      <div className="border-b border-primary/20 pb-3">
        <h2 className="text-lg font-semibold text-foreground">Votre profil de rejet</h2>
        <p className="text-sm text-muted-foreground">
          Analyse agrégée basée sur {letterCount} lettre{letterCount !== 1 ? "s" : ""} importée{letterCount !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Ce que vous faites bien</h3>
          <ul className="space-y-3">
            {STRENGTHS.map((s) => (
              <li key={s.id} className="flex gap-3 rounded-md border border-primary/15 bg-primary/5 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-700">Points à améliorer</h3>
          <ul className="space-y-3">
            {WEAKNESSES.map((w) => (
              <li key={w.id} className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{w.title}</p>
                    <p className="text-sm text-muted-foreground">{w.description}</p>
                  </div>
                </div>
                <p className="mt-2 flex items-start gap-1.5 pl-10 text-xs italic text-primary">
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
          <h3 className="text-base font-semibold text-foreground">Évolution des rejets</h3>
          <p className="text-xs text-muted-foreground">Rejets mensuels vs candidatures totales</p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatBox label="Candidatures" value={totals.applications} />
        <StatBox label="Rejets" value={totals.rejections} />
        <StatBox label="Taux de rejet" value={`${totals.rate}%`} />
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line name="Candidatures" type="monotone" dataKey="applications" stroke="hsl(var(--primary) / 0.4)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            <Line name="Rejets" type="monotone" dataKey="rejections" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
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
          <h3 className="text-base font-semibold text-foreground">Taux de succès</h3>
          <p className="text-xs text-muted-foreground">Part des candidatures remportées</p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">{current}%</span>
        <span className="text-xs text-muted-foreground">Taux de succès</span>
        <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", trendUp ? "text-emerald-600" : "text-red-600")}>
          {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(current - previous)}%
        </span>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, "Taux de succès"]} />
            <ReferenceLine y={sectorAvg} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: `Moy. secteur ${sectorAvg}%`, position: "insideTopRight", fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <Line type="monotone" dataKey="winRate" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// ── Top Reasons Card ──────────────────────────────────────────────────────────

function TopReasonsCard() {
  const max = Math.max(...TOP_REASONS.map((r) => r.count));
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-1 text-base font-semibold text-foreground">Raisons de rejet les plus fréquentes</h3>
      <p className="mb-4 text-xs text-muted-foreground">Top 5 critères sur toutes les lettres importées</p>
      <ul className="space-y-3">
        {TOP_REASONS.map((r) => {
          const pct = Math.round((r.count / max) * 100);
          return (
            <li key={r.reason}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{r.reason}</span>
                <span className="text-muted-foreground">{r.count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Authority Breakdown Card ──────────────────────────────────────────────────

function AuthorityBreakdownCard() {
  const total = AUTHORITY_BREAKDOWN.reduce((s, a) => s + a.count, 0);
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-1 text-base font-semibold text-foreground">Rejets par type d'autorité</h3>
      <p className="mb-4 text-xs text-muted-foreground">Répartition dans le secteur public</p>
      <ul className="space-y-3">
        {AUTHORITY_BREAKDOWN.map((a, i) => {
          const pct = Math.round((a.count / total) * 100);
          const opacity = 1 - i * 0.18;
          return (
            <li key={a.type}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{a.type}</span>
                <span className="text-muted-foreground">{a.count} <span className="text-xs">({pct}%)</span></span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%`, opacity }} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex gap-2 rounded-md border border-primary/15 bg-primary/5 p-3">
        <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs italic text-primary">
          La majorité de vos rejets proviennent des communes. Consultez les profils d&apos;autorités pour comprendre leurs priorités.
        </p>
      </div>
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
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { value: type, onChange: setType, options: ["Tous les types", "Commune", "Région", "Département", "Établissement public"] },
            { value: region, onChange: setRegion, options: ["Toutes les régions", "Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Pays de la Loire"] },
            { value: sector, onChange: setSector, options: ["Tous les secteurs", "Services généraux", "IT & Numérique", "Santé", "Construction"] },
          ].map((sel, i) => (
            <select
              key={i}
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {sel.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {results.length} autorité{results.length !== 1 ? "s" : ""} trouvée{results.length !== 1 ? "s" : ""}
      </p>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Aucune autorité ne correspond à vos filtres.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((a) => (
            <article key={a.id} className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
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

      <AuthorityProfileDrawer
        authority={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

// ── Authority Profile Drawer ──────────────────────────────────────────────────

function AuthorityProfileDrawer({ authority, open, onClose }: {
  authority: AuthorityProfile | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-background shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-modal="true"
      >
        {authority && (
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-start gap-4 border-b border-border p-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {authority.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold leading-tight text-primary">{authority.name}</h2>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">{authority.type}</span>
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

            {/* Body */}
            <div className="flex-1 space-y-6 p-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tendances d'évaluation</h3>
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
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top 5 raisons de rejet</h3>
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
                        <div className="h-full rounded-full bg-primary" style={{ width: `${item.frequency}%` }} />
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-lg border border-primary/20 border-l-4 border-l-primary bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Lightbulb className="h-4 w-4" />
                  Insight BidSafe
                </div>
                <p className="text-sm text-foreground">{authority.tendroInsight}</p>
              </div>

              <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
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
          className={cn(
            "rounded px-2.5 py-1 font-medium transition-colors",
            value === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
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
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
