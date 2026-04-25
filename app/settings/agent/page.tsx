"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CronConfig } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Bot, Play, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

export default function AgentSettingsPage() {
  const [config, setConfig] = useState<Partial<CronConfig>>({ frequency: "daily", keywords: [], active: true });
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: co } = await supabase.from("companies").select("id").eq("user_id", user.id).single();
    if (!co) return;
    setCompanyId(co.id);
    const { data } = await supabase.from("cron_config").select("*").eq("company_id", co.id).single();
    if (data) { setConfig(data); setConfigId(data.id); setKeywords((data.keywords ?? []).join(", ")); }
  }

  async function save() {
    if (!companyId) return;
    setLoading(true);
    try {
      const payload = { ...config, company_id: companyId, keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean) };
      if (configId) {
        const { error } = await supabase.from("cron_config").update(payload).eq("id", configId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("cron_config").insert(payload).select().single();
        if (error) throw error;
        setConfigId(data.id);
      }
      toast.success("Configuration sauvegardée !");
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  }

  async function runNow() {
    if (!companyId) return;
    setRunning(true);
    try {
      const res = await fetch("/api/cron/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cron-secret": "secret" },
        body: JSON.stringify({ company_id: companyId }),
      });
      if (!res.ok) throw new Error("Erreur d'exécution");
      const data = await res.json();
      const r = data.results?.[0];
      toast.success(`Agent terminé ! ${r?.online ?? 0} en ligne, ${r?.email ?? 0} email`);
      loadConfig();
    } catch (err: any) { toast.error(err.message); } finally { setRunning(false); }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center"><Bot className="w-5 h-5 text-primary-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration de l&apos;agent IA</h1>
          <p className="text-gray-500 text-sm">Surveillance automatique des appels d&apos;offres</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${config.active ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
            <span className="font-medium text-gray-800">Agent {config.active ? "actif" : "inactif"}</span>
          </div>
          <button onClick={() => setConfig({ ...config, active: !config.active })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.active ? "bg-primary-600" : "bg-gray-200"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.active ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <div className="space-y-4">
          <Select
            label="Fréquence de surveillance"
            options={[
              { value: "hourly", label: "Toutes les heures" },
              { value: "daily", label: "Quotidienne (recommandé)" },
              { value: "weekly", label: "Hebdomadaire" },
            ]}
            value={config.frequency ?? "daily"}
            onChange={(e) => setConfig({ ...config, frequency: e.target.value as CronConfig["frequency"] })}
          />
          <Input label="Mots-clés (séparés par des virgules)" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="développement logiciel, cloud, cybersécurité" />
        </div>
        <div className="mt-6 flex gap-3">
          <Button onClick={save} loading={loading}><CheckCircle className="w-4 h-4" /> Sauvegarder</Button>
          <Button variant="secondary" onClick={runNow} loading={running}><Play className="w-4 h-4" /> Lancer maintenant</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> Dernière exécution</h2>
        {config.last_run ? (
          <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm text-gray-600">{formatDate(config.last_run)}</span></div>
        ) : (
          <p className="text-sm text-gray-400">L&apos;agent n&apos;a pas encore été exécuté</p>
        )}
      </div>
    </div>
  );
}
