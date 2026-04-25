"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Upload, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const SECTORS = [
  { value: "", label: "Sélectionner un secteur" },
  { value: "informatique", label: "Informatique & Numérique" },
  { value: "btp", label: "BTP & Construction" },
  { value: "sante", label: "Santé" },
  { value: "conseil", label: "Conseil & Services" },
  { value: "formation", label: "Formation" },
  { value: "nettoyage", label: "Nettoyage & Hygiène" },
  { value: "securite", label: "Sécurité" },
  { value: "transport", label: "Transport & Logistique" },
  { value: "autre", label: "Autre" },
];

const REGIONS = [
  { value: "", label: "Sélectionner une région" },
  { value: "ile-de-france", label: "Île-de-France" },
  { value: "auvergne-rhone-alpes", label: "Auvergne-Rhône-Alpes" },
  { value: "nouvelle-aquitaine", label: "Nouvelle-Aquitaine" },
  { value: "occitanie", label: "Occitanie" },
  { value: "hauts-de-france", label: "Hauts-de-France" },
  { value: "grand-est", label: "Grand Est" },
  { value: "bretagne", label: "Bretagne" },
  { value: "pays-de-la-loire", label: "Pays de la Loire" },
  { value: "normandie", label: "Normandie" },
  { value: "paca", label: "PACA" },
];

const STEPS = [
  "Informations entreprise",
  "Données financières",
  "Signature",
  "Logo",
  "Configuration agent",
];

interface FormData {
  name: string;
  siret: string;
  address: string;
  sector: string;
  region: string;
  revenue: string;
  employees: string;
  description: string;
  legal_representative: string;
  representative_title: string;
  signatureFile: File | null;
  logoFile: File | null;
  frequency: "hourly" | "daily" | "weekly";
  keywords: string;
  agentSectors: string[];
  agentRegions: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "", siret: "", address: "", sector: "", region: "",
    revenue: "", employees: "", description: "",
    legal_representative: "", representative_title: "",
    signatureFile: null, logoFile: null,
    frequency: "daily", keywords: "", agentSectors: [], agentRegions: [],
  });

  function update(key: keyof FormData, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadFile(file: File, bucket: string, userId: string, filename: string): Promise<string> {
    const path = `${userId}/${filename}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      let signatureUrl = "";
      let logoUrl = "";

      if (form.signatureFile) {
        signatureUrl = await uploadFile(form.signatureFile, "signatures", user.id, "signature.png");
      }
      if (form.logoFile) {
        logoUrl = await uploadFile(form.logoFile, "logos", user.id, "logo.png");
      }

      const { data: company, error: companyErr } = await supabase.from("companies").insert({
        user_id: user.id,
        name: form.name,
        siret: form.siret,
        address: form.address,
        sector: form.sector,
        region: form.region,
        revenue: form.revenue ? parseFloat(form.revenue) : null,
        employees: form.employees ? parseInt(form.employees) : null,
        description: form.description,
        legal_representative: form.legal_representative,
        representative_title: form.representative_title,
        signature_url: signatureUrl,
        logo_url: logoUrl,
      }).select().single();

      if (companyErr) throw companyErr;

      await supabase.from("cron_config").insert({
        company_id: company.id,
        frequency: form.frequency,
        keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        sectors: form.agentSectors,
        regions: form.agentRegions,
        active: true,
      });

      toast.success("Profil créé avec succès !");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la création du profil");
    } finally {
      setLoading(false);
    }
  }

  function nextStep() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleFinish();
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl overflow-hidden">
        {/* Progress */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-xl font-bold text-gray-900">Configuration de votre compte</h1>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                  i < step ? "bg-green-500 text-white" : i === step ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"
                )}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={cn("text-xs hidden sm:block", i === step ? "text-primary-600 font-medium" : "text-gray-400")}>
                  {s}
                </span>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations entreprise</h2>
              <Input label="Nom de l'entreprise *" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="TechSolutions SAS" />
              <Input label="SIRET *" value={form.siret} onChange={(e) => update("siret", e.target.value)} placeholder="12345678901234" maxLength={14} />
              <Input label="Adresse du siège social" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="12 rue de la Paix, 75001 Paris" />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Secteur d'activité" options={SECTORS} value={form.sector} onChange={(e) => update("sector", e.target.value)} />
                <Select label="Région" options={REGIONS} value={form.region} onChange={(e) => update("region", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nom du représentant légal" value={form.legal_representative} onChange={(e) => update("legal_representative", e.target.value)} placeholder="Jean Dupont" />
                <Input label="Qualité du représentant" value={form.representative_title} onChange={(e) => update("representative_title", e.target.value)} placeholder="Gérant" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Données financières</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Chiffre d'affaires annuel (€)" type="number" value={form.revenue} onChange={(e) => update("revenue", e.target.value)} placeholder="500000" />
                <Input label="Nombre d'employés" type="number" value={form.employees} onChange={(e) => update("employees", e.target.value)} placeholder="10" />
              </div>
              <Textarea label="Description de l'entreprise" value={form.description} onChange={(e) => update("description", e.target.value)} rows={5} placeholder="Décrivez votre entreprise, vos expertises, vos références..." />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Signature électronique</h2>
              <p className="text-sm text-gray-500">Importez votre signature en PNG. Elle sera utilisée pour la génération automatique des DC1.</p>
              <FileUploadZone
                accept="image/png,image/jpeg"
                onFile={(f) => update("signatureFile", f)}
                current={form.signatureFile}
                label="Signature (PNG recommandé)"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Logo de l&apos;entreprise</h2>
              <p className="text-sm text-gray-500">Importez votre logo. Il apparaîtra dans l&apos;en-tête de vos mémoires techniques.</p>
              <FileUploadZone
                accept="image/png,image/jpeg"
                onFile={(f) => update("logoFile", f)}
                current={form.logoFile}
                label="Logo (PNG recommandé)"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuration de l&apos;agent IA</h2>
              <Select
                label="Fréquence de surveillance"
                options={[
                  { value: "hourly", label: "Toutes les heures" },
                  { value: "daily", label: "Quotidienne" },
                  { value: "weekly", label: "Hebdomadaire" },
                ]}
                value={form.frequency}
                onChange={(e) => update("frequency", e.target.value as "hourly" | "daily" | "weekly")}
              />
              <Input
                label="Mots-clés (séparés par des virgules)"
                value={form.keywords}
                onChange={(e) => update("keywords", e.target.value)}
                placeholder="développement logiciel, cloud, cybersécurité"
              />
              <p className="text-xs text-gray-400">L&apos;agent cherchera les appels d&apos;offres correspondant à ces mots-clés sur les plateformes publiques et dans votre boîte email.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-8 pb-8 flex justify-between">
          <Button variant="secondary" onClick={prevStep} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4" /> Précédent
          </Button>
          <Button onClick={nextStep} loading={loading}>
            {step === STEPS.length - 1 ? "Terminer" : "Suivant"}
            {step < STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FileUploadZone({ accept, onFile, current, label }: {
  accept: string;
  onFile: (f: File) => void;
  current: File | null;
  label: string;
}) {
  return (
    <label className="block cursor-pointer">
      <div className={cn(
        "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
        current ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-primary-400 hover:bg-primary-50"
      )}>
        {current ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-10 h-10 text-green-500" />
            <p className="text-sm font-medium text-green-700">{current.name}</p>
            <p className="text-xs text-gray-500">Cliquez pour changer</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-10 h-10 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-400">PNG, JPG jusqu&apos;à 2MB</p>
          </div>
        )}
      </div>
      <input type="file" accept={accept} className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
      }} />
    </label>
  );
}
