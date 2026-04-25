"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Match, Company } from "@/types";
import { TenderRow } from "@/components/dashboard/TenderRow";
import { TopBar } from "@/components/layout/TopBar";
import { Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type SortKey = "newest" | "deadline" | "match" | "value";
type StatusFilter = "all" | "new" | "reviewing" | "submitted" | "rejected";

export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }

    const { data: co } = await supabase.from("companies").select("*").eq("user_id", user.id).single();
    if (!co) { window.location.href = "/onboarding"; return; }
    setCompany(co);

    const { data: m } = await supabase
      .from("matches")
      .select("*, tender:tenders(*)")
      .eq("company_id", co.id)
      .order("created_at", { ascending: false });

    setMatches(m ?? []);
    setLoading(false);
  }

  async function handleScan() {
    if (!company) return;
    const res = await fetch("/api/cron/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cron-secret": process.env.NEXT_PUBLIC_CRON_SECRET ?? "secret" },
      body: JSON.stringify({ company_id: company.id }),
    });
    if (!res.ok) throw new Error("Erreur lors de l'analyse");
    await loadData();
  }

  async function handleStatusChange(matchId: string, status: string) {
    await supabase.from("matches").update({ status }).eq("id", matchId);
    setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, status: status as Match["status"] } : m));
  }

  const filtered = useMemo(() => {
    let arr = [...matches];

    if (statusFilter !== "all") arr = arr.filter((m) => m.status === statusFilter);

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
  }, [matches, statusFilter, search, sort]);

  const newCount = matches.filter((m) => m.status === "new").length;
  const hasNotifications = newCount > 0;

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "new", label: "Nouveaux" },
    { key: "reviewing", label: "En cours" },
    { key: "submitted", label: "Soumis" },
    { key: "rejected", label: "Ignorés" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        search={search}
        onSearchChange={setSearch}
        onScan={handleScan}
        hasNotifications={hasNotifications}
      />

      <main className="flex flex-1 flex-col">
        {/* Inbox header */}
        <div className="border-b border-border bg-background px-6 pt-6 pb-0">
          <div className="flex items-center gap-3 pb-4">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Appels d&apos;offres
            </h1>
            {newCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {newCount} nouveau{newCount > 1 ? "x" : ""}
              </span>
            )}
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {STATUS_TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "shrink-0 border-b-2 px-3 pb-3 text-sm font-medium transition-colors",
                  statusFilter === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                {key === "new" && newCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {newCount}
                  </span>
                )}
              </button>
            ))}
          </div>
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

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-background">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
              <Bot className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">Aucun appel d&apos;offres trouvé</p>
              <p className="text-xs">Lancez un scan pour découvrir de nouvelles opportunités</p>
            </div>
          ) : (
            <ul>
              {filtered.map((match) => (
                <TenderRow key={match.id} match={match} onStatusChange={handleStatusChange} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
