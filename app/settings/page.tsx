"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Company } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Settings, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const SECTORS = [
  { value: "", label: "Sélectionner" },
  { value: "informatique", label: "Informatique & Numérique" },
  { value: "btp", label: "BTP & Construction" },
  { value: "sante", label: "Santé" },
  { value: "conseil", label: "Conseil & Services" },
  { value: "formation", label: "Formation" },
  { value: "autre", label: "Autre" },
];

export default function SettingsPage() {
  const [company, setCompany] = useState<Partial<Company>>({});
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadCompany(); }, []);

  async function loadCompany() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("companies").select("*").eq("user_id", user.id).single();
    if (data) { setCompany(data); setCompanyId(data.id); }
  }

  async function save() {
    if (!companyId) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("companies").update(company).eq("id", companyId);
      if (error) throw error;
      toast.success("Profil mis à jour !");
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  }

  const update = (key: keyof Company, value: unknown) => setCompany((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"><Settings className="w-5 h-5 text-gray-600" /></div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres de l&apos;entreprise</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
        <Input label="Nom de l'entreprise" value={company.name ?? ""} onChange={(e) => update("name", e.target.value)} />
        <Input label="SIRET" value={company.siret ?? ""} onChange={(e) => update("siret", e.target.value)} />
        <Input label="Adresse" value={company.address ?? ""} onChange={(e) => update("address", e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Secteur" options={SECTORS} value={company.sector ?? ""} onChange={(e) => update("sector", e.target.value)} />
          <Input label="Région" value={company.region ?? ""} onChange={(e) => update("region", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Chiffre d'affaires (€)" type="number" value={company.revenue?.toString() ?? ""} onChange={(e) => update("revenue", parseFloat(e.target.value))} />
          <Input label="Employés" type="number" value={company.employees?.toString() ?? ""} onChange={(e) => update("employees", parseInt(e.target.value))} />
        </div>
        <Textarea label="Description" value={company.description ?? ""} onChange={(e) => update("description", e.target.value)} rows={4} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Représentant légal" value={company.legal_representative ?? ""} onChange={(e) => update("legal_representative", e.target.value)} />
          <Input label="Qualité" value={company.representative_title ?? ""} onChange={(e) => update("representative_title", e.target.value)} />
        </div>
        <Button onClick={save} loading={loading}><CheckCircle className="w-4 h-4" /> Sauvegarder</Button>
      </div>
    </div>
  );
}
