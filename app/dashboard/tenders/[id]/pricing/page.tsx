"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Tender } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, TrendingDown, Minus, TrendingUp, Info } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface PricingResult { floor_price: number; market_price: number; recommended_price: number; confidence: number; reasoning: string; }

export default function PricingPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [costs, setCosts] = useState({ labor: "", materials: "", overhead: "", margin: "15" });

  useEffect(() => {
    supabase.from("tenders").select("*").eq("id", tenderId).single().then(({ data }) => setTender(data));
  }, [tenderId]);

  async function calculate() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers,
        body: JSON.stringify({ tender_id: tenderId, labor: parseFloat(costs.labor) || 0, materials: parseFloat(costs.materials) || 0, overhead: parseFloat(costs.overhead) || 0, margin: parseFloat(costs.margin) || 15 }),
      });
      if (!res.ok) throw new Error("Erreur de calcul");
      setResult(await res.json());
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link href={`/dashboard/tenders/${tenderId}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Estimation du prix</h1>
      {tender && <p className="text-gray-500 text-sm mb-6 line-clamp-1">{tender.title}</p>}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Structure de coûts</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Coût main d'œuvre (€)" type="number" value={costs.labor} onChange={(e) => setCosts({ ...costs, labor: e.target.value })} placeholder="20000" />
          <Input label="Coût matériaux (€)" type="number" value={costs.materials} onChange={(e) => setCosts({ ...costs, materials: e.target.value })} placeholder="5000" />
          <Input label="Frais généraux (€)" type="number" value={costs.overhead} onChange={(e) => setCosts({ ...costs, overhead: e.target.value })} placeholder="3000" />
          <Input label="Marge cible (%)" type="number" value={costs.margin} onChange={(e) => setCosts({ ...costs, margin: e.target.value })} placeholder="15" />
        </div>
        <Button onClick={calculate} loading={loading} className="mt-4">Calculer le prix optimal</Button>
      </div>
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <PriceCard icon={<TrendingDown className="w-5 h-5 text-red-500" />} label="Prix plancher" sublabel="Minimum viable" amount={result.floor_price} color="red" />
            <PriceCard icon={<Minus className="w-5 h-5 text-yellow-500" />} label="Prix marché" sublabel="Moyenne historique" amount={result.market_price} color="yellow" />
            <PriceCard icon={<TrendingUp className="w-5 h-5 text-green-500" />} label="Prix recommandé" sublabel="Optimal compétitif" amount={result.recommended_price} color="green" highlighted />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Niveau de confiance</span>
              <span className="text-sm font-bold">{result.confidence}/100</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${result.confidence}%` }} />
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div><p className="text-sm font-medium text-blue-800 mb-1">Analyse IA</p><p className="text-sm text-blue-700">{result.reasoning}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PriceCard({ icon, label, sublabel, amount, color, highlighted }: { icon: React.ReactNode; label: string; sublabel: string; amount: number; color: "red" | "yellow" | "green"; highlighted?: boolean; }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm ${highlighted ? "border-2 border-green-300 shadow-md" : "border border-gray-100"}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-medium text-gray-500">{sublabel}</span></div>
      <p className={`text-xl font-bold ${color === "red" ? "text-red-600" : color === "yellow" ? "text-yellow-600" : "text-green-600"}`}>{formatCurrency(amount)}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
