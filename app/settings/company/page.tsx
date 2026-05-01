"use client";
import { useState } from "react";
import { Save, Upload } from "lucide-react";
import toast from "react-hot-toast";

const NAVY = "#0A1F44";
const CARD: React.CSSProperties = { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

const input = "h-10 w-full rounded-md border border-[#E5E7EB] bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/30";
const textarea = "w-full rounded-md border border-[#E5E7EB] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/30 resize-none";

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

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 pt-6 pb-5">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: NAVY }}>Company Profile</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Edit your company information and services</p>
      </div>

      <main className="flex-1 bg-[#F9FAFB] px-6 py-6">
        <div className="max-w-2xl space-y-6">

          {/* Logo upload */}
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6" style={CARD}>
            <h2 className="text-base font-bold" style={{ color: NAVY }}>Company Logo</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Displayed on your profile and shared documents</p>
            <hr className="my-4 border-[#E5E7EB]" />
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl text-white text-lg font-bold" style={{ backgroundColor: NAVY }}>
                AI
              </div>
              <div>
                <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F9FAFB] transition-colors">
                  <Upload className="h-4 w-4" />
                  Upload logo
                </button>
                <p className="mt-1 text-xs text-muted-foreground">PNG or JPG, max 2 MB</p>
              </div>
            </div>
          </section>

          {/* General info */}
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6" style={CARD}>
            <h2 className="text-base font-bold" style={{ color: NAVY }}>General Information</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Basic details about your company</p>
            <hr className="my-4 border-[#E5E7EB]" />
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
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6" style={CARD}>
            <h2 className="text-base font-bold" style={{ color: NAVY }}>Financial Information</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Used to assess eligibility thresholds in tender matching</p>
            <hr className="my-4 border-[#E5E7EB]" />
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
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6" style={CARD}>
            <h2 className="text-base font-bold" style={{ color: NAVY }}>Legal Representative</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Person legally authorised to sign on behalf of the company</p>
            <hr className="my-4 border-[#E5E7EB]" />
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
            <button type="button" onClick={() => toast.success("Company profile saved.")}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
