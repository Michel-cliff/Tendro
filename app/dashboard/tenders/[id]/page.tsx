"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tender, Match } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge, SourceBadge, ScoreBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { ArrowLeft, Clock, Euro, Building2, FileText, Calculator, Send, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function TenderDetailPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const [tender, setTender] = useState<Tender | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { loadData(); }, [tenderId]);

  async function loadData() {
    const { data: t } = await supabase.from("tenders").select("*").eq("id", tenderId).single();
    setTender(t);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: co } = await supabase.from("companies").select("id").eq("user_id", user.id).single();
      if (co) {
        const { data: m } = await supabase.from("matches").select("*").eq("tender_id", tenderId).eq("company_id", co.id).single();
        setMatch(m);
      }
    }
    setLoading(false);
  }

  async function updateStatus(status: string) {
    if (!match) return;
    setUpdating(true);
    const { error } = await supabase.from("matches").update({ status }).eq("id", match.id);
    if (error) toast.error("Erreur lors de la mise à jour");
    else { setMatch({ ...match, status: status as Match["status"] }); toast.success("Statut mis à jour"); }
    setUpdating(false);
  }

  if (loading) return <div className="p-8 text-gray-400">Chargement...</div>;
  if (!tender) return <div className="p-8 text-gray-400">Appel d&apos;offres introuvable</div>;
  const days = tender.deadline ? daysUntil(tender.deadline) : null;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{tender.title}</h1>
          {match && <ScoreBadge score={match.score} />}
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {match && <StatusBadge status={match.status} />}
          <SourceBadge source={tender.source} />
          {tender.sector && <Badge variant="gray">{tender.sector}</Badge>}
          {tender.region && <Badge variant="gray">{tender.region}</Badge>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {tender.contracting_authority && (
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
              <div><p className="text-xs text-gray-400">Pouvoir adjudicateur</p><p className="font-medium text-gray-700">{tender.contracting_authority}</p></div>
            </div>
          )}
          {tender.deadline && (
            <div className="flex items-start gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
              <div><p className="text-xs text-gray-400">Date limite</p><p className={`font-medium ${days !== null && days <= 7 ? "text-orange-600" : "text-gray-700"}`}>{formatDate(tender.deadline)} {days !== null && `(${days}j)`}</p></div>
            </div>
          )}
          {tender.budget && (
            <div className="flex items-start gap-2 text-sm">
              <Euro className="w-4 h-4 text-gray-400 mt-0.5" />
              <div><p className="text-xs text-gray-400">Budget estimé</p><p className="font-medium text-gray-700">{formatCurrency(tender.budget)}</p></div>
            </div>
          )}
        </div>
        {tender.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{tender.description}</p>
          </div>
        )}
        {match?.reasoning && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Analyse de compatibilité</h3>
            <p className="text-sm text-blue-700">{match.reasoning}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { href: "pricing", icon: <Calculator className="w-6 h-6 text-primary" />, label: "Estimer le prix", sub: "Calculer votre offre" },
          { href: "documents", icon: <FileText className="w-6 h-6 text-green-600" />, label: "Générer les docs", sub: "DC1 + Mémoire technique" },
          { href: "send", icon: <Send className="w-6 h-6 text-blue-600" />, label: "Envoyer", sub: "Email + pièces jointes" },
          { href: "rejection", icon: <AlertTriangle className="w-6 h-6 text-red-500" />, label: "Analyser le rejet", sub: "Plan d'amélioration" },
        ].map((a) => (
          <Link key={a.href} href={`/dashboard/tenders/${tenderId}/${a.href}`}>
            <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
              {a.icon}
              <p className="text-sm font-semibold text-gray-800 mt-2">{a.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {match && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-3">Mettre à jour le statut</p>
          <div className="flex flex-wrap gap-2">
            {(["new", "reviewing", "submitted", "won", "rejected"] as const).map((s) => (
              <Button key={s} variant={match.status === s ? "primary" : "secondary"} size="sm" onClick={() => updateStatus(s)} loading={updating}>
                {s === "new" ? "Nouveau" : s === "reviewing" ? "En révision" : s === "submitted" ? "Soumis" : s === "won" ? "Gagné" : "Rejeté"}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
