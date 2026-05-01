"use client";
import { useState } from "react";
import { Building2, Save, Upload } from "lucide-react";
import toast from "react-hot-toast";

const NAVY = "#0A1F44";
const N05 = "rgba(10,31,68,.05)";

function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="border-b border-border bg-background px-6 pt-6 pb-5">
      <h1 className="text-2xl font-bold tracking-tight" style={{ color: NAVY }}>{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

const input = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/30";
const textarea = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/30 resize-none";

export default function CompanyProfilePage() {
  const [form, setForm] = useState({
    name: "Altéa Ingénierie",
    siret: "75312489600043",
    address: "24 Rue de la République, 69002 Lyon",
    sector: "Ingénierie & Études",
    region: "Auvergne-Rhône-Alpes",
    revenue: "3600000",
    employees: "29",
    legal_representative: "Nathalie Cordier",
    representative_title: "Directrice Générale",
    description: "Bureau d'études pluridisciplinaire spécialisé dans l'ingénierie urbaine, les infrastructures VRD, l'environnement et la transition énergétique.",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function handleSave() {
    toast.success("Company profile saved.");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader title="Company Profile" sub="Edit your company information and services" />

      <main className="flex-1 px-6 py-6">
        <div className="max-w-2xl space-y-6">

          {/* Logo upload */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold" style={{ color: NAVY }}>Company Logo</h2>
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl text-white text-lg font-bold" style={{ backgroundColor: NAVY }}>
                AI
              </div>
              <div>
                <button type="button" className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  Upload logo
                </button>
                <p className="mt-1 text-xs text-muted-foreground">PNG or JPG, max 2 MB</p>
              </div>
            </div>
          </section>

          {/* General info */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold" style={{ color: NAVY }}>General Information</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name">
                  <input className={input} value={form.name} onChange={(e) => update("name", e.target.value)} />
                </Field>
                <Field label="SIRET">
                  <input className={input} value={form.siret} onChange={(e) => update("siret", e.target.value)} />
                </Field>
              </div>
              <Field label="Address">
                <input className={input} value={form.address} onChange={(e) => update("address", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sector">
                  <select className={input} value={form.sector} onChange={(e) => update("sector", e.target.value)}>
                    {["Ingénierie & Études", "Informatique & Digital", "Construction & BTP", "Conseil & Formation", "Santé & Social", "Transport & Logistique"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Region">
                  <select className={input} value={form.region} onChange={(e) => update("region", e.target.value)}>
                    {["Auvergne-Rhône-Alpes", "Île-de-France", "Nouvelle-Aquitaine", "Occitanie", "Hauts-de-France", "Grand Est", "Normandie", "National"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Description">
                <textarea className={textarea} rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Financial */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold" style={{ color: NAVY }}>Financial Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Annual revenue (€)">
                <input className={input} type="number" value={form.revenue} onChange={(e) => update("revenue", e.target.value)} />
              </Field>
              <Field label="Employees">
                <input className={input} type="number" value={form.employees} onChange={(e) => update("employees", e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Legal representative */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold" style={{ color: NAVY }}>Legal Representative</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input className={input} value={form.legal_representative} onChange={(e) => update("legal_representative", e.target.value)} />
              </Field>
              <Field label="Title">
                <input className={input} value={form.representative_title} onChange={(e) => update("representative_title", e.target.value)} />
              </Field>
            </div>
          </section>

          <div className="flex justify-end">
            <button type="button" onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: NAVY }}>
              <Save className="h-4 w-4" />
              Save changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
