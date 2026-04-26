"use client";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import {
  Upload, CheckCircle, ChevronRight, ChevronLeft,
  Search, ChevronDown, Plus, X, Sparkles, Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

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

const SERVICE_CATEGORIES: { name: string; services: string[] }[] = [
  {
    name: "Construction & Infrastructure",
    services: ["Travaux structurels", "Travaux de finition", "Voirie & réseaux divers", "Rénovation énergétique", "Génie civil", "Travaux publics", "Couverture & toiture", "Démolition"],
  },
  {
    name: "Informatique & Digital",
    services: ["Développement logiciel", "Infogérance", "Cybersécurité", "Cloud & hébergement", "Data & IA", "Sites web & applications", "Maintenance informatique", "Télécoms & réseaux"],
  },
  {
    name: "Conseil & Formation",
    services: ["Conseil en stratégie", "Conseil en organisation", "Formation professionnelle", "Coaching", "Audit & conformité", "Support RH"],
  },
  {
    name: "Santé & Social",
    services: ["Aide à domicile", "Assistance médico-sociale", "Restauration collective", "Petite enfance", "Insertion sociale", "Équipements médicaux"],
  },
  {
    name: "Facility & Nettoyage",
    services: ["Nettoyage de bureaux", "Nettoyage industriel", "Maintenance multi-technique", "Espaces verts", "Sécurité & gardiennage", "Gestion des déchets"],
  },
  {
    name: "Communication & Marketing",
    services: ["Stratégie de communication", "Identité visuelle", "Production audiovisuelle", "Relations publiques", "Marketing digital", "Événementiel", "Impression & édition"],
  },
  {
    name: "Ingénierie & Études",
    services: ["Bureau d'études technique", "Maîtrise d'œuvre", "Études géotechniques", "Diagnostics immobiliers", "Études environnementales", "Géomètre"],
  },
  {
    name: "Transport & Logistique",
    services: ["Transport de marchandises", "Transport de personnes", "Logistique & entreposage", "Livraison du dernier kilomètre", "Déménagement", "Affrètement"],
  },
  {
    name: "Environnement & Énergie",
    services: ["Énergies renouvelables", "Efficacité énergétique", "Traitement de l'eau", "Économie circulaire", "Études d'impact", "Dépollution"],
  },
];

const ALL_PREDEFINED = new Set(SERVICE_CATEGORIES.flatMap((c) => c.services));

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 79,
    description: "Pour les PME en croissance",
    features: [
      "Matching d'appels d'offres basique",
      "Jusqu'à 15 analyses / mois",
      "Analyse des rejets",
      "Support par email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    description: "Pour les équipes structurées",
    popular: true,
    features: [
      "Matching avancé avec IA",
      "50 analyses / mois",
      "Analyse détaillée des rejets",
      "Alertes personnalisées",
      "Génération DC1 + Mémoire",
      "Support prioritaire",
    ],
  },
];

const STEPS = [
  "Informations entreprise",
  "Services & Expertises",
  "Données financières",
  "Signature",
  "Logo",
  "Configuration agent",
  "Votre plan",
];

// ── Form types ────────────────────────────────────────────────────────────────

interface FormData {
  // Company
  name: string;
  siret: string;
  address: string;
  sector: string;
  region: string;
  legal_representative: string;
  representative_title: string;
  // Services
  services: string[];
  // Financial
  revenue: string;
  employees: string;
  description: string;
  // Files
  signatureFile: File | null;
  logoFile: File | null;
  // Agent
  frequency: "hourly" | "daily" | "weekly";
  keywords: string;
  // Plan
  plan: string;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "", siret: "", address: "", sector: "", region: "",
    legal_representative: "", representative_title: "",
    services: [],
    revenue: "", employees: "", description: "",
    signatureFile: null, logoFile: null,
    frequency: "daily", keywords: "",
    plan: "pro",
  });

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadFile(file: File, bucket: string, userId: string, filename: string) {
    const path = `${userId}/${filename}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const [signatureUrl, logoUrl] = await Promise.all([
        form.signatureFile ? uploadFile(form.signatureFile, "signatures", user.id, "signature.png") : Promise.resolve(""),
        form.logoFile ? uploadFile(form.logoFile, "logos", user.id, "logo.png") : Promise.resolve(""),
      ]);

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
        signature_url: signatureUrl || null,
        logo_url: logoUrl || null,
      }).select().single();

      if (companyErr) throw companyErr;

      // Merge services + manual keywords as the agent's keyword list
      const allKeywords = [
        ...form.services,
        ...form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      ];

      await supabase.from("cron_config").insert({
        company_id: company.id,
        frequency: form.frequency,
        keywords: allKeywords,
        sectors: form.sector ? [form.sector] : [],
        regions: form.region ? [form.region] : [],
        active: true,
      });

      toast.success("Profil créé avec succès !");
      router.push("/dashboard/matched");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la création du profil");
    } finally {
      setLoading(false);
    }
  }

  function canAdvance() {
    if (step === 0) return !!(form.name && form.siret);
    if (step === 1) return form.services.length > 0;
    return true;
  }

  function nextStep() {
    if (!canAdvance()) {
      toast.error("Veuillez remplir les champs obligatoires.");
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleFinish();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-lg font-semibold tracking-tight text-primary">Tendro</span>
            <span className="text-sm text-muted-foreground">Étape {step + 1} sur {STEPS.length}</span>
          </div>
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-1 items-center gap-2">
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  i < step ? "bg-green-500 text-white"
                    : i === step ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn(
                  "hidden truncate text-xs sm:block",
                  i === step ? "font-medium text-primary" : "text-muted-foreground"
                )}>
                  {s}
                </span>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn("mx-auto w-full flex-1 px-4 py-8", step === 1 ? "max-w-3xl" : "max-w-2xl")}>
        <div className={cn(step === 1 && "pb-20")}>

          {/* Step 0 — Company info */}
          {step === 0 && (
            <div className="space-y-4">
              <StepTitle title="Informations entreprise" subtitle="Ces informations seront utilisées pour personnaliser vos candidatures." />
              <Input label="Nom de l'entreprise *" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="TechSolutions SAS" />
              <Input label="SIRET *" value={form.siret} onChange={(e) => update("siret", e.target.value.replace(/\D/g, ""))} placeholder="12345678901234" maxLength={14} />
              <Input label="Adresse du siège social" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="12 rue de la Paix, 75001 Paris" />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Secteur d'activité" options={SECTORS} value={form.sector} onChange={(e) => update("sector", e.target.value)} />
                <Select label="Région" options={REGIONS} value={form.region} onChange={(e) => update("region", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Représentant légal" value={form.legal_representative} onChange={(e) => update("legal_representative", e.target.value)} placeholder="Jean Dupont" />
                <Input label="Qualité" value={form.representative_title} onChange={(e) => update("representative_title", e.target.value)} placeholder="Gérant" />
              </div>
            </div>
          )}

          {/* Step 1 — Services */}
          {step === 1 && (
            <div className="space-y-4">
              <StepTitle
                title="Services & Expertises"
                subtitle="Sélectionnez les services que vous proposez. L'IA utilisera ces informations pour identifier les appels d'offres les plus pertinents."
              />
              <ServicesSelector
                selected={form.services}
                onChange={(s) => update("services", s)}
              />
            </div>
          )}

          {/* Step 2 — Financial */}
          {step === 2 && (
            <div className="space-y-4">
              <StepTitle title="Données financières" subtitle="Ces informations permettent à l'IA d'évaluer votre capacité à répondre aux marchés." />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Chiffre d'affaires annuel (€)" type="number" value={form.revenue} onChange={(e) => update("revenue", e.target.value)} placeholder="500000" />
                <Input label="Nombre d'employés" type="number" value={form.employees} onChange={(e) => update("employees", e.target.value)} placeholder="10" />
              </div>
              <Textarea label="Description de l'entreprise" value={form.description} onChange={(e) => update("description", e.target.value)} rows={5} placeholder="Décrivez votre entreprise, vos expertises, vos références..." />
            </div>
          )}

          {/* Step 3 — Signature */}
          {step === 3 && (
            <div className="space-y-4">
              <StepTitle title="Signature électronique" subtitle="Votre signature sera automatiquement apposée sur les DC1 générés." />
              <FileUploadZone accept="image/png,image/jpeg" onFile={(f) => update("signatureFile", f)} current={form.signatureFile} label="Signature (PNG recommandé)" />
            </div>
          )}

          {/* Step 4 — Logo */}
          {step === 4 && (
            <div className="space-y-4">
              <StepTitle title="Logo de l'entreprise" subtitle="Votre logo apparaîtra dans l'en-tête de vos mémoires techniques." />
              <FileUploadZone accept="image/png,image/jpeg" onFile={(f) => update("logoFile", f)} current={form.logoFile} label="Logo (PNG recommandé)" />
            </div>
          )}

          {/* Step 5 — Agent config */}
          {step === 5 && (
            <div className="space-y-4">
              <StepTitle title="Configuration de l'agent IA" subtitle="L'agent analysera automatiquement les appels d'offres selon vos critères." />
              <Select
                label="Fréquence de surveillance"
                options={[
                  { value: "hourly", label: "Toutes les heures" },
                  { value: "daily", label: "Quotidienne (recommandé)" },
                  { value: "weekly", label: "Hebdomadaire" },
                ]}
                value={form.frequency}
                onChange={(e) => update("frequency", e.target.value as "hourly" | "daily" | "weekly")}
              />
              <Input
                label="Mots-clés supplémentaires (séparés par des virgules)"
                value={form.keywords}
                onChange={(e) => update("keywords", e.target.value)}
                placeholder="développement logiciel, cloud, cybersécurité"
              />
              <p className="text-xs text-muted-foreground">
                Vos services sélectionnés ({form.services.length}) seront automatiquement inclus comme critères de recherche.
              </p>
            </div>
          )}

          {/* Step 6 — Plan */}
          {step === 6 && (
            <div className="space-y-6">
              <StepTitle title="Choisissez votre plan" subtitle="Commencez avec un essai gratuit de 14 jours. Aucune carte bancaire requise." />

              {/* Demo banner */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Pas sûr du plan idéal ?</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Demandez une démo gratuite avec notre équipe. Sans engagement.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="h-9 w-full shrink-0 rounded-md border border-primary px-4 text-sm font-medium text-primary hover:bg-primary/10 transition-colors sm:w-auto"
                  >
                    Demander une démo
                  </button>
                </div>
              </div>

              {/* Billing pill */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs font-medium text-foreground">Facturation mensuelle</span>
                </div>
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {PLANS.map((plan) => {
                  const isSelected = form.plan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative flex flex-col rounded-xl border bg-card p-6 shadow-card transition-all",
                        plan.popular
                          ? "border-2 border-primary shadow-popular md:-translate-y-2"
                          : "border-border hover:shadow-card-hover",
                        isSelected && !plan.popular && "border-primary"
                      )}
                    >
                      {plan.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                          Le plus populaire
                        </span>
                      )}
                      <div className="mb-5">
                        <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      <div className="mb-6">
                        <span className="text-4xl font-bold tracking-tight text-foreground">€{plan.price}</span>
                        <span className="ml-1 text-sm text-muted-foreground">/ mois</span>
                      </div>
                      <ul className="mb-6 flex-1 space-y-3">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => update("plan", plan.id)}
                        className={cn(
                          "h-11 w-full rounded-md border text-sm font-medium transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border-border bg-background text-foreground hover:bg-secondary"
                        )}
                      >
                        {isSelected ? "Plan sélectionné ✓" : "Choisir ce plan"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation footer */}
      <div className={cn(
        "border-t border-border bg-background px-6 py-4",
        step === 1 ? "fixed inset-x-0 bottom-0 z-10" : "sticky bottom-0"
      )}>
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {step === 1 && form.services.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{form.services.length}</span> service{form.services.length > 1 ? "s" : ""} sélectionné{form.services.length > 1 ? "s" : ""}
            </span>
          ) : (
            <span />
          )}
          <div className="ml-auto flex gap-3">
            <Button variant="outline" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button
              onClick={nextStep}
              loading={loading}
              disabled={!canAdvance()}
            >
              {step === STEPS.length - 1 ? "Commencer →" : <>Suivant <ChevronRight className="h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function ServicesSelector({ selected, onChange }: { selected: string[]; onChange: (s: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SERVICE_CATEGORIES.map((c, i) => [c.name, i === 0]))
  );

  const toggle = (svc: string) =>
    onChange(selected.includes(svc) ? selected.filter((s) => s !== svc) : [...selected, svc]);

  const customServices = selected.filter((s) => !ALL_PREDEFINED.has(s));

  function addCustom() {
    const value = customInput.trim();
    if (!value || selected.some((s) => s.toLowerCase() === value.toLowerCase())) { setCustomInput(""); return; }
    onChange([...selected, value]);
    setCustomInput("");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SERVICE_CATEGORIES;
    return SERVICE_CATEGORIES.map((c) => ({
      ...c,
      services: c.services.filter((s) => s.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)),
    })).filter((c) => c.services.length > 0);
  }, [query]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un service..."
          className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {filtered.map((cat) => {
          const isOpen = query ? true : openCats[cat.name];
          const count = cat.services.filter((s) => selected.includes(s)).length;
          return (
            <div key={cat.name} className="overflow-hidden rounded-lg border border-border bg-card">
              <button
                type="button"
                onClick={() => setOpenCats((p) => ({ ...p, [cat.name]: !isOpen }))}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary/60"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                  {count > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {count} sélectionné{count > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="flex flex-wrap gap-2 border-t border-border bg-background px-4 py-4">
                  {cat.services.map((svc) => {
                    const active = selected.includes(svc);
                    return (
                      <button
                        key={svc}
                        type="button"
                        onClick={() => toggle(svc)}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-tag text-tag-foreground hover:border-primary/40 hover:bg-secondary"
                        )}
                      >
                        {svc}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom input */}
      <div className="rounded-lg border border-dashed border-border bg-card p-4">
        <p className="mb-1 text-sm font-semibold text-foreground">Service introuvable ?</p>
        <p className="mb-3 text-xs text-muted-foreground">Ajoutez vos propres mots-clés. Appuyez sur Entrée ou virgule pour ajouter.</p>
        <div className="flex gap-2">
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addCustom(); } }}
            placeholder="Ex. Inspection par drone, Traduction…"
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </button>
        </div>
        {customServices.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {customServices.map((svc) => (
              <span key={svc} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                {svc}
                <button type="button" onClick={() => toggle(svc)} className="rounded-full hover:opacity-70" aria-label={`Supprimer ${svc}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
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
        "rounded-xl border-2 border-dashed p-10 text-center transition-colors",
        current ? "border-green-400 bg-green-50" : "border-border hover:border-primary hover:bg-primary/5"
      )}>
        {current ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium text-green-700">{current.name}</p>
            <p className="text-xs text-muted-foreground">Cliquez pour changer</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">PNG, JPG jusqu&apos;à 2MB</p>
          </div>
        )}
      </div>
      <input type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </label>
  );
}
