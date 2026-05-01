"use client";
import { useMemo, useState } from "react";
import { Building2, Search, X, Lightbulb, ExternalLink, FileText, Users, Calendar, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAVY = "#0A1F44";
const N05  = "rgba(10,31,68,.05)";
const N10  = "rgba(10,31,68,.10)";

// ── Types & data ──────────────────────────────────────────────────────────────

type AuthorityProfile = {
  id: string; name: string; type: string; region: string; sector: string;
  lettersAnalysed: number; companiesReviewed: number; activeSince: string;
  openTenders: number;
  ratesHigh: string[]; ratesLow: string[];
  commonRejectionReasons: { reason: string; frequency: number }[];
  tendroInsight: string;
};

const AUTHORITY_PROFILES: AuthorityProfile[] = [
  {
    id: "1", name: "Mairie de Paris", type: "Commune", region: "Île-de-France", sector: "Services généraux",
    lettersAnalysed: 42, companiesReviewed: 130, activeSince: "2019", openTenders: 6,
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
    lettersAnalysed: 28, companiesReviewed: 85, activeSince: "2020", openTenders: 3,
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
    lettersAnalysed: 19, companiesReviewed: 60, activeSince: "2021", openTenders: 2,
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
    lettersAnalysed: 15, companiesReviewed: 45, activeSince: "2022", openTenders: 4,
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

// ── Profile Drawer ────────────────────────────────────────────────────────────

function AuthorityProfileDrawer({ authority, open, onClose }: {
  authority: AuthorityProfile | null; open: boolean; onClose: () => void;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-background shadow-xl transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {authority && (
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <div className="border-b border-border p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ backgroundColor: NAVY }}>
                  {authority.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold leading-tight" style={{ color: NAVY }}>{authority.name}</h2>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium" style={{ borderColor: `${NAVY}30`, backgroundColor: N05, color: NAVY }}>{authority.type}</span>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{authority.region}</span>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Stat blocks row */}
              <div className="mt-4 flex divide-x divide-border border-t border-border">
                {[
                  { value: authority.lettersAnalysed,       label: "Letters Analysed",   link: false },
                  { value: authority.companiesReviewed,     label: "Companies Reviewed", link: false },
                  { value: `Since ${authority.activeSince}`, label: "Active in Tendro",  link: false },
                  { value: authority.openTenders,           label: "Open Tenders",       link: true  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex-1 px-4 pt-3 pb-2 text-center first:pl-0 last:pr-0"
                    style={{ borderTop: `3px solid ${NAVY}` }}
                  >
                    <p className="text-2xl font-bold leading-none tabular-nums" style={{ color: NAVY }}>{stat.value}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">{stat.label}</p>
                    {stat.link && (
                      <a
                        href="/dashboard/my-tenders"
                        className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium underline underline-offset-2"
                        style={{ color: NAVY }}
                      >
                        View <ArrowUpRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
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
              <a
                href="/dashboard/my-tenders"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: NAVY }}
              >
                Voir les appels d&apos;offres ouverts
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuthorityProfilesPage() {
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
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-background px-6 py-6">
        {/* Page header */}
        <div className="mb-6 border-b border-border pb-5">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: NAVY }}>Authority Profiles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Understand how public authorities evaluate and select tender bids.
          </p>
        </div>

        {/* Search + filters */}
        <div className="mb-5 space-y-3">
          <div className="relative max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, region or authority type..."
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": NAVY } as React.CSSProperties}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3 max-w-lg">
            {[
              { value: type,   onChange: setType,   options: ["Tous les types", "Commune", "Région", "Département", "Établissement public"] },
              { value: region, onChange: setRegion, options: ["Toutes les régions", "Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Pays de la Loire"] },
              { value: sector, onChange: setSector, options: ["Tous les secteurs", "Services généraux", "IT & Numérique", "Santé", "Construction"] },
            ].map((sel, i) => (
              <select key={i} value={sel.value} onChange={(e) => sel.onChange(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2">
                {sel.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          {results.length} authorit{results.length !== 1 ? "ies" : "y"} found
        </p>

        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
            No authority matches your filters.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((a) => (
              <article key={a.id} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: N10, color: NAVY }}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{a.name}</h3>
                    <p className="text-xs text-muted-foreground">{a.type} · {a.region}</p>
                  </div>
                </div>

                {/* Stat blocks */}
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {[
                    { icon: FileText, value: a.lettersAnalysed,    label: "Letters Analysed"    },
                    { icon: Users,    value: a.companiesReviewed,   label: "Companies Reviewed"  },
                    { icon: Calendar, value: `Since ${a.activeSince}`, label: "Active in Tendro" },
                  ].map(({ icon: Icon, value, label }) => (
                    <div key={label} className="flex flex-col items-center rounded-lg py-2.5 px-1 text-center" style={{ backgroundColor: N05 }}>
                      <Icon className="mb-1.5 h-3.5 w-3.5" style={{ color: NAVY }} />
                      <p className="text-sm font-bold leading-tight tabular-nums" style={{ color: NAVY }}>{value}</p>
                      <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => { setSelected(a); setDrawerOpen(true); }}
                  className="mt-auto w-full rounded-md border border-border bg-background py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  View Profile
                </button>
              </article>
            ))}
          </div>
        )}
      </main>

      <AuthorityProfileDrawer authority={selected} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
