"use client";
export const dynamic = "force-dynamic";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ensureDemoSession } from "@/lib/demo-auth";
import { Match, Company } from "@/types";
import { TenderRow } from "@/components/dashboard/TenderRow";
import { TenderDetailDrawer } from "@/components/dashboard/TenderDetailDrawer";
import { TopBar, TopBarFilters } from "@/components/layout/TopBar";
import { Bookmark, Ban, Archive, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { daysUntil } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabKey = "all" | "saved" | "dismissed" | "archived";
type SortKey = "newest" | "deadline" | "match" | "value";

const TAB_STATUSES: Record<TabKey, string[]> = {
  all:       ["new"],
  saved:     ["reviewing"],
  dismissed: ["rejected"],
  archived:  ["submitted", "won"],
};

const TAB_CONFIG: Record<TabKey, {
  label: string;
  icon?: React.ElementType;
  banner?: string;
  emptyMsg: string;
  muted?: boolean;
}> = {
  all: {
    label: "All",
    emptyMsg: "No matched tenders yet. Run a scan to discover new opportunities.",
  },
  saved: {
    label: "Saved",
    icon: Bookmark,
    emptyMsg: "No saved tenders yet. Bookmark tenders from your inbox to find them here.",
  },
  dismissed: {
    label: "Dismissed",
    icon: Ban,
    banner: "Tenders you marked as not relevant. Restore them at any time.",
    emptyMsg: "No dismissed tenders.",
    muted: true,
  },
  archived: {
    label: "Archived",
    icon: Archive,
    banner: "Past and expired tenders, kept for your records.",
    emptyMsg: "No archived tenders.",
    muted: true,
  },
};

const DEFAULT_FILTERS: TopBarFilters = {
  region: "Toutes les régions",
  sector: "Tous les secteurs",
  deadline: "Toutes les échéances",
  value: "Toute valeur",
};

const NAVY = "#0A1F44";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyTendersPage() {
  const [tab, setTab] = useState<TabKey>("all");
  const [matches, setMatches] = useState<Match[]>([]);
  const [tabCounts, setTabCounts] = useState<Record<TabKey, number>>({ all: 0, saved: 0, dismissed: 0, archived: 0 });
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TopBarFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [openMatch, setOpenMatch] = useState<Match | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { loadData(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    setLoading(true);
    setSelected([]);
    setDrawerOpen(false);
    const user = await ensureDemoSession();
    if (!user) { setLoading(false); return; }

    const { data: co } = await supabase.from("companies").select("*").eq("user_id", user.id).single();
    if (!co) { setLoading(false); return; }
    setCompany(co);

    // Load current tab
    const { data: m } = await supabase
      .from("matches")
      .select("*, tender:tenders(*)")
      .eq("company_id", co.id)
      .in("status", TAB_STATUSES[tab])
      .order("created_at", { ascending: false });
    setMatches(m ?? []);

    // Load counts for all tabs
    const { data: all } = await supabase.from("matches").select("status").eq("company_id", co.id);
    if (all) {
      const c: Record<TabKey, number> = { all: 0, saved: 0, dismissed: 0, archived: 0 };
      for (const row of all) {
        if (row.status === "new") c.all++;
        if (row.status === "reviewing") c.saved++;
        if (row.status === "rejected") c.dismissed++;
        if (row.status === "submitted" || row.status === "won") c.archived++;
      }
      setTabCounts(c);
    }

    setLoading(false);
  }

  const handleStatusChange = useCallback(async (matchId: string, newStatus: string) => {
    const original = matches.find((m) => m.id === matchId);
    if (!original) return;
    const originalStatus = original.status;
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    await supabase.from("matches").update({ status: newStatus }).eq("id", matchId);
    const labels: Record<string, string> = {
      reviewing: "Sauvegardé.", rejected: "Ignoré.", submitted: "Archivé.", new: "Restauré.",
    };
    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">{labels[newStatus] ?? "Mis à jour."}</span>
          <button onClick={async () => {
            await supabase.from("matches").update({ status: originalStatus }).eq("id", matchId);
            toast.dismiss(t.id);
            loadData();
          }} className="shrink-0 text-sm font-medium text-primary underline-offset-2 hover:underline">
            Annuler
          </button>
        </div>
      ),
      { duration: 5000 }
    );
  }, [matches]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleScan() {
    if (!company) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/cron/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ company_id: company.id }),
    });
    if (!res.ok) throw new Error("Erreur lors de l'analyse");
    await loadData();
  }

  const sorted = useMemo(() => {
    let arr = [...matches];
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((m) => {
        const t = m.tender;
        if (!t) return false;
        return t.title?.toLowerCase().includes(q) || t.contracting_authority?.toLowerCase().includes(q) || t.region?.toLowerCase().includes(q) || t.sector?.toLowerCase().includes(q);
      });
    }
    if (filters.region !== "Toutes les régions") arr = arr.filter((m) => m.tender?.region === filters.region);
    if (filters.sector !== "Tous les secteurs") arr = arr.filter((m) => m.tender?.sector === filters.sector);
    if (filters.deadline !== "Toutes les échéances") {
      const limit = filters.deadline === "Moins de 7 jours" ? 7 : filters.deadline === "Moins de 14 jours" ? 14 : 30;
      arr = arr.filter((m) => m.tender?.deadline && daysUntil(m.tender.deadline) <= limit);
    }
    if (filters.value !== "Toute valeur") {
      arr = arr.filter((m) => {
        const v = m.tender?.budget ?? 0;
        if (filters.value === "< 100k €") return v < 100_000;
        if (filters.value === "100k – 500k €") return v >= 100_000 && v < 500_000;
        if (filters.value === "500k – 1M €") return v >= 500_000 && v < 1_000_000;
        if (filters.value === "> 1M €") return v >= 1_000_000;
        return true;
      });
    }
    switch (sort) {
      case "deadline": arr.sort((a, b) => { const da = a.tender?.deadline ? new Date(a.tender.deadline).getTime() : Infinity; const db = b.tender?.deadline ? new Date(b.tender.deadline).getTime() : Infinity; return da - db; }); break;
      case "match":   arr.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)); break;
      case "value":   arr.sort((a, b) => (b.tender?.budget ?? 0) - (a.tender?.budget ?? 0)); break;
      default:        arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return arr;
  }, [matches, search, filters, sort]);

  const config = TAB_CONFIG[tab];
  const isRestoreTab = tab === "dismissed" || tab === "archived";
  const allSelected = selected.length > 0 && selected.length === sorted.length;
  const hasNotifications = tabCounts.all > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar search={search} onSearchChange={setSearch} filters={filters} onFiltersChange={setFilters} onScan={handleScan} hasNotifications={hasNotifications} />

      <main className="flex flex-1 flex-col">
        {/* Page header */}
        <div className="border-b border-border bg-background px-6 pt-6 pb-0">
          <h1 className="mb-4 text-2xl font-semibold tracking-tight" style={{ color: NAVY }}>My Tenders</h1>

          {/* Tab bar */}
          <div className="flex gap-0">
            {(Object.keys(TAB_CONFIG) as TabKey[]).map((key) => {
              const cfg = TAB_CONFIG[key];
              const Icon = cfg.icon;
              const count = tabCounts[key];
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 px-4 pb-3 text-sm font-medium transition-colors",
                    active ? "border-[#0A1F44] text-[#0A1F44]" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {cfg.label}
                  {count > 0 && (
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      active ? "bg-[#0A1F44] text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Banner */}
        {config.banner && (
          <div className="border-b border-border bg-muted/30 px-6 py-2.5 text-sm text-muted-foreground">
            {config.banner}
          </div>
        )}

        {/* Sort bar */}
        <div className="flex items-center gap-1 border-b border-border bg-background px-6 py-2">
          <span className="mr-2 text-xs uppercase tracking-wide text-muted-foreground">Sort</span>
          {(["newest", "deadline", "match", "value"] as SortKey[]).map((key) => {
            const labels: Record<SortKey, string> = { newest: "Newest", deadline: "Deadline", match: "Match %", value: "Value" };
            return (
              <button key={key} type="button" onClick={() => setSort(key)}
                className={cn("rounded-md px-2.5 py-1 text-sm transition-colors", sort === key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                {labels[key]}
              </button>
            );
          })}
          <span className="ml-auto text-xs text-muted-foreground">{sorted.length} tender{sorted.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-sm text-muted-foreground">{config.emptyMsg}</p>
          </div>
        ) : (
          <div className={cn("divide-y divide-border", config.muted && "opacity-80")}>
            {sorted.map((match) => (
              <TenderRow
                key={match.id}
                match={match}
                selected={selected.includes(match.id)}
                onSelectChange={(checked) => setSelected((p) => checked ? [...p, match.id] : p.filter((x) => x !== match.id))}
                onStatusChange={handleStatusChange}
                onOpen={() => { setOpenMatch(match); setDrawerOpen(true); }}
              />
            ))}
          </div>
        )}
      </main>

      <TenderDetailDrawer
        match={openMatch}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
