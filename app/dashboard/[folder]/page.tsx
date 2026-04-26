"use client";
export const dynamic = "force-dynamic";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Match, Company } from "@/types";
import { TenderRow } from "@/components/dashboard/TenderRow";
import { TenderDetailDrawer } from "@/components/dashboard/TenderDetailDrawer";
import { TopBar, TopBarFilters } from "@/components/layout/TopBar";
import { Bot, Loader2, Archive, Ban, Bookmark, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { daysUntil } from "@/lib/utils";
import toast from "react-hot-toast";

type FolderKey = "matched" | "saved" | "dismissed" | "archived";
type SortKey = "newest" | "deadline" | "match" | "value";

const VALID_FOLDERS: FolderKey[] = ["matched", "saved", "dismissed", "archived"];

const FOLDER_STATUSES: Record<FolderKey, string[]> = {
  matched: ["new"],
  saved: ["reviewing"],
  dismissed: ["rejected"],
  archived: ["submitted", "won"],
};

const FOLDER_CONFIG: Record<FolderKey, { title: string; banner?: string }> = {
  matched: { title: "Appels d'offres correspondants" },
  saved: { title: "Sauvegardés" },
  dismissed: {
    title: "Ignorés",
    banner: "Appels d'offres que vous avez ignorés. Vous pouvez les restaurer à tout moment.",
  },
  archived: {
    title: "Archivés",
    banner: "Appels d'offres soumis et expirés. Conservés pour vos archives.",
  },
};

const DEFAULT_FILTERS: TopBarFilters = {
  region: "Toutes les régions",
  sector: "Tous les secteurs",
  deadline: "Toutes les échéances",
  value: "Toute valeur",
};

export default function FolderPage() {
  const params = useParams();
  const folder = params.folder as string;

  if (!VALID_FOLDERS.includes(folder as FolderKey)) return notFound();
  const currentFolder = folder as FolderKey;

  const [matches, setMatches] = useState<Match[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TopBarFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [openMatch, setOpenMatch] = useState<Match | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const config = FOLDER_CONFIG[currentFolder];

  useEffect(() => {
    setSelected([]);
    setDrawerOpen(false);
    loadData();
  }, [currentFolder]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }

    const { data: co } = await supabase.from("companies").select("*").eq("user_id", user.id).single();
    if (!co) { window.location.href = "/onboarding"; return; }
    setCompany(co);

    const { data: m } = await supabase
      .from("matches")
      .select("*, tender:tenders(*)")
      .eq("company_id", co.id)
      .in("status", FOLDER_STATUSES[currentFolder])
      .order("created_at", { ascending: false });

    setMatches(m ?? []);
    setLoading(false);
  }

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

  const handleStatusChange = useCallback(async (matchId: string, newStatus: string) => {
    const original = matches.find((m) => m.id === matchId);
    if (!original) return;
    const originalStatus = original.status;

    // Optimistic remove from current folder
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    await supabase.from("matches").update({ status: newStatus }).eq("id", matchId);

    const labels: Record<string, string> = {
      reviewing: "Sauvegardé.",
      rejected: "Ignoré.",
      submitted: "Archivé.",
      new: "Restauré.",
    };

    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">{labels[newStatus] ?? "Mis à jour."}</span>
          <button
            onClick={async () => {
              await supabase.from("matches").update({ status: originalStatus }).eq("id", matchId);
              toast.dismiss(t.id);
              loadData();
            }}
            className="shrink-0 text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Annuler
          </button>
        </div>
      ),
      { duration: 5000 }
    );
  }, [matches]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleBulkAction(newStatus: string) {
    const ids = [...selected];
    const snapshots = matches
      .filter((m) => ids.includes(m.id))
      .map((m) => ({ id: m.id, status: m.status }));

    setMatches((prev) => prev.filter((m) => !ids.includes(m.id)));
    setSelected([]);

    await Promise.all(ids.map((id) => supabase.from("matches").update({ status: newStatus }).eq("id", id)));

    const labels: Record<string, string> = {
      reviewing: `${ids.length} sauvegardé${ids.length > 1 ? "s" : ""}.`,
      rejected: `${ids.length} ignoré${ids.length > 1 ? "s" : ""}.`,
      submitted: `${ids.length} archivé${ids.length > 1 ? "s" : ""}.`,
      new: `${ids.length} restauré${ids.length > 1 ? "s" : ""}.`,
    };

    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">{labels[newStatus] ?? "Mis à jour."}</span>
          <button
            onClick={async () => {
              await Promise.all(snapshots.map((s) => supabase.from("matches").update({ status: s.status }).eq("id", s.id)));
              toast.dismiss(t.id);
              loadData();
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

  function openDrawer(match: Match) {
    setOpenMatch(match);
    setDrawerOpen(true);
  }

  const toggleSelect = (id: string, checked: boolean) =>
    setSelected((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id));

  const newCount = currentFolder === "matched"
    ? matches.filter((m) => m.status === "new").length
    : matches.length;

  const sorted = useMemo(() => {
    let arr = [...matches];

    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((m) => {
        const t = m.tender;
        if (!t) return false;
        return (
          t.title?.toLowerCase().includes(q) ||
          t.contracting_authority?.toLowerCase().includes(q) ||
          t.region?.toLowerCase().includes(q) ||
          t.sector?.toLowerCase().includes(q)
        );
      });
    }

    if (filters.region !== "Toutes les régions")
      arr = arr.filter((m) => m.tender?.region === filters.region);
    if (filters.sector !== "Tous les secteurs")
      arr = arr.filter((m) => m.tender?.sector === filters.sector);
    if (filters.deadline !== "Toutes les échéances") {
      const limit = filters.deadline === "Moins de 7 jours" ? 7 : filters.deadline === "Moins de 14 jours" ? 14 : 30;
      arr = arr.filter((m) => {
        if (!m.tender?.deadline) return false;
        return daysUntil(m.tender.deadline) <= limit;
      });
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
      case "deadline":
        arr.sort((a, b) => {
          const da = a.tender?.deadline ? new Date(a.tender.deadline).getTime() : Infinity;
          const db = b.tender?.deadline ? new Date(b.tender.deadline).getTime() : Infinity;
          return da - db;
        });
        break;
      case "match":
        arr.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        break;
      case "value":
        arr.sort((a, b) => (b.tender?.budget ?? 0) - (a.tender?.budget ?? 0));
        break;
      default:
        arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return arr;
  }, [matches, search, filters, sort]);

  const allSelected = selected.length > 0 && selected.length === sorted.length;
  const toggleAll = (checked: boolean) =>
    setSelected(checked ? sorted.map((m) => m.id) : []);

  const hasNotifications = matches.some((m) => m.status === "new");
  const isRestoreFolder = currentFolder === "dismissed" || currentFolder === "archived";

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        onScan={handleScan}
        hasNotifications={hasNotifications}
      />

      <main className="flex flex-1 flex-col">
        {/* Inbox header */}
        <div className="border-b border-border bg-background px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{config.title}</h1>
            {newCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {newCount}
              </span>
            )}
          </div>
          {config.banner && (
            <p className="mt-2 rounded-md border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
              {config.banner}
            </p>
          )}
        </div>

        {/* Sort bar */}
        <div className="flex items-center gap-1 border-b border-border bg-background px-6 py-2">
          <span className="mr-2 text-xs uppercase tracking-wide text-muted-foreground">Trier</span>
          {(["newest", "deadline", "match", "value"] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-sm transition-colors",
                sort === key
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {key === "newest" ? "Plus récent" : key === "deadline" ? "Échéance" : key === "match" ? "Compatibilité" : "Valeur"}
            </button>
          ))}
        </div>

        {/* Bulk action bar */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-6 py-2 text-sm">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => toggleAll(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="ml-1 mr-2 text-muted-foreground">
              {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
            </span>
            {isRestoreFolder ? (
              <BulkBtn icon={Undo2} label="Restaurer" onClick={() => handleBulkAction("new")} />
            ) : (
              <>
                <BulkBtn icon={Bookmark} label="Sauvegarder" onClick={() => handleBulkAction("reviewing")} />
                <BulkBtn icon={Ban} label="Ignorer" onClick={() => handleBulkAction("rejected")} />
                <BulkBtn icon={Archive} label="Archiver" onClick={() => handleBulkAction("submitted")} />
              </>
            )}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-background">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
              <Bot className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">Aucun appel d&apos;offres ici</p>
              {currentFolder === "matched" && (
                <p className="text-xs">Lancez un scan pour découvrir de nouvelles opportunités</p>
              )}
            </div>
          ) : (
            <ul>
              {sorted.map((match) => (
                <TenderRow
                  key={match.id}
                  match={match}
                  selected={selected.includes(match.id)}
                  onSelectChange={(checked) => toggleSelect(match.id, checked)}
                  onOpen={() => openDrawer(match)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </ul>
          )}
        </div>
      </main>

      <TenderDetailDrawer
        match={openMatch}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={(id, status) => {
          handleStatusChange(id, status);
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}

function BulkBtn({ icon: Icon, label, onClick }: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
