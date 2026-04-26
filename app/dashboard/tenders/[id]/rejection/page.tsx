"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Tender } from "@/types";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Upload, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface RejectionResult { score_breakdown: Record<string, { score: number; max: number }>; estimated_winner_score: number; key_weaknesses: string[]; improvement_plan: string[]; }

export default function RejectionPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const [tender, setTender] = useState<Tender | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RejectionResult | null>(null);

  useEffect(() => {
    supabase.from("tenders").select("*").eq("id", tenderId).single().then(({ data }) => setTender(data));
  }, [tenderId]);

  async function analyze() {
    if (!file) { toast.error("Importez d'abord le document de rejet"); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tender_id", tenderId);
      const headers: Record<string, string> = {};
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch("/api/rejection/analyze", { method: "POST", headers, body: formData });
      if (!res.ok) throw new Error("Erreur d'analyse");
      setResult(await res.json());
      toast.success("Analyse terminée !");
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link href={`/dashboard/tenders/${tenderId}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Analyse du rejet</h1>
      {tender && <p className="text-gray-500 text-sm mb-6 line-clamp-1">{tender.title}</p>}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Document de notation</h2>
        <label className="block cursor-pointer">
          <div className={cn("border-2 border-dashed rounded-xl p-8 text-center transition-colors", file ? "border-green-400 bg-green-50" : "border-border hover:border-primary hover:bg-primary/5")}>
            {file ? (
              <div className="flex flex-col items-center gap-2"><CheckCircle className="w-10 h-10 text-green-500" /><p className="text-sm font-medium text-green-700">{file.name}</p></div>
            ) : (
              <div className="flex flex-col items-center gap-2"><Upload className="w-10 h-10 text-gray-400" /><p className="text-sm font-medium text-gray-700">Glissez le PDF de notation ici</p><p className="text-xs text-gray-400">PDF jusqu&apos;à 10MB</p></div>
            )}
          </div>
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        </label>
        <Button onClick={analyze} loading={loading} className="mt-4" disabled={!file}><AlertTriangle className="w-4 h-4" /> Analyser avec l&apos;IA</Button>
      </div>
      {result && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Grille de notation</h2>
            <div className="space-y-3">
              {Object.entries(result.score_breakdown).map(([criterion, scores]) => {
                const pct = Math.round((scores.score / scores.max) * 100);
                return (
                  <div key={criterion}>
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{criterion}</span><span className="font-medium">{scores.score}/{scores.max}</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-2"><div className={cn("h-2 rounded-full", pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Score estimé du gagnant</span>
              <span className="font-bold text-gray-900">{result.estimated_winner_score} pts</span>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-100 p-6">
            <h2 className="font-semibold text-red-800 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Points faibles identifiés</h2>
            <ul className="space-y-2">{result.key_weaknesses.map((w, i) => <li key={i} className="text-sm text-red-700 flex items-start gap-2"><span className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>{w}</li>)}</ul>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-100 p-6">
            <h2 className="font-semibold text-green-800 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Plan d&apos;amélioration</h2>
            <ul className="space-y-3">{result.improvement_plan.map((action, i) => <li key={i} className="text-sm text-green-700 flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />{action}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}
