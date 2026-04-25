"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Match, Company } from "@/types";
import { TenderCard } from "@/components/dashboard/TenderCard";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { Button } from "@/components/ui/Button";
import { Bot, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

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

  async function runAgent() {
    if (!company) return;
    setRunningAgent(true);
    try {
      const res = await fetch("/api/cron/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cron-secret": process.env.NEXT_PUBLIC_CRON_SECRET ?? "secret" },
        body: JSON.stringify({ company_id: company.id }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'exécution de l'agent");
      toast.success("Agent exécuté ! Nouveaux appels d'offres chargés.");
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRunningAgent(false);
    }
  }

  const filtered = matches.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (sourceFilter !== "all" && m.source !== sourceFilter) return false;
    return true;
  });

  const stats = {
    total: matches.length,
    newToday: matches.filter((m) => new Date(m.created_at).toDateString() === new Date().toDateString()).length,
    submitted: matches.filter((m) => m.status === "submitted").length,
    won: matches.filter((m) => m.status === "won").length,
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">{company ? `${company.name} · ${company.sector}` : "Chargement..."}</p>
        </div>
        <Button onClick={runAgent} loading={runningAgent}>
          <Bot className="w-4 h-4" /> Lancer l&apos;agent
        </Button>
      </div>

      <StatsBar stats={stats} />
      <FilterBar statusFilter={statusFilter} sourceFilter={sourceFilter} onStatusChange={setStatusFilter} onSourceChange={setSourceFilter} />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun appel d&apos;offres trouvé</p>
          <p className="text-sm mt-1">Lancez l&apos;agent pour découvrir de nouvelles opportunités</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {filtered.map((match) => <TenderCard key={match.id} match={match} />)}
        </div>
      )}
    </div>
  );
}
