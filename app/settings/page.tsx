"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Company } from "@/types";
import { cn } from "@/lib/utils";
import {
  Building2, Tag, CreditCard, Bell, Users, Shield,
  Check, AlertTriangle, Lightbulb, Sparkles, Download,
  UserPlus, Trash2, X, ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

type Tab = "company" | "matching" | "billing" | "notifications" | "team" | "security";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "company",       label: "Company Information",    icon: Building2  },
  { key: "matching",      label: "Services & Matching",    icon: Tag        },
  { key: "billing",       label: "Subscription & Billing", icon: CreditCard },
  { key: "notifications", label: "Notifications",          icon: Bell       },
  { key: "team",          label: "Team Members",           icon: Users      },
  { key: "security",      label: "Security",               icon: Shield     },
];

const REGIONS = [
  "Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Occitanie",
  "Hauts-de-France", "Grand Est", "Provence-Alpes-Côte d'Azur", "Pays de la Loire",
  "Normandie", "Bretagne", "Centre-Val de Loire", "Bourgogne-Franche-Comté", "National",
];

const SECTORS = [
  { value: "", label: "Select…" },
  { value: "informatique", label: "IT & Digital" },
  { value: "btp", label: "Construction & Works" },
  { value: "sante", label: "Healthcare" },
  { value: "conseil", label: "Consulting & Services" },
  { value: "formation", label: "Training" },
  { value: "autre", label: "Other" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("company");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Page header */}
      <div className="border-b border-border bg-background px-8 py-6">
        <h1 className="text-2xl font-semibold text-foreground">Company Profile &amp; Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your company details, matching preferences, billing, and account security.
        </p>
      </div>

      {/* Body: left nav + content */}
      <div className="flex flex-1">
        {/* Left tab sidebar */}
        <aside className="w-56 shrink-0 border-r border-border bg-background">
          <nav className="space-y-0.5 p-3">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                  tab === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl">
            {tab === "company"       && <CompanyTab />}
            {tab === "matching"      && <MatchingTab />}
            {tab === "billing"       && <BillingTab />}
            {tab === "notifications" && <NotificationsTab />}
            {tab === "team"          && <TeamTab />}
            {tab === "security"      && <SecurityTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Company Information ───────────────────────────────────────────────────────

function CompanyTab() {
  const [company, setCompany] = useState<Partial<Company>>({});
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("companies").select("*").eq("user_id", user.id).single().then(({ data }) => {
        if (data) { setCompany(data); setCompanyId(data.id); }
      });
    });
  }, []);

  const completion = useMemo(() => {
    const fields: (keyof Company)[] = ["name", "siret", "sector", "region", "description", "legal_representative", "revenue", "employees"];
    const filled = fields.filter((k) => String(company[k] ?? "").trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [company]);

  const upd = (key: keyof Company, val: unknown) => setCompany((p) => ({ ...p, [key]: val }));

  async function save() {
    if (!companyId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("companies").update(company).eq("id", companyId);
      if (error) throw error;
      toast.success("Company information saved.");
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      {/* Profile completion */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Profile {completion}% complete</p>
          <span className="text-xs text-muted-foreground">
            {completion === 100 ? "All set" : "Improve tender matching"}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} />
        </div>
        {completion < 100 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {!company.description?.trim() ? "Add your company description to improve tender matching." : "Complete your profile to get better matches."}
          </p>
        )}
      </div>

      {/* Form */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">Company Information</h2>
        <p className="mb-6 text-sm text-muted-foreground">Keep your company details up to date — they feed directly into the tender matching algorithm.</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company name">
              <input value={company.name ?? ""} onChange={(e) => upd("name", e.target.value)} className={inputCls} placeholder="Acme SAS" />
            </Field>
            <Field label="SIRET number">
              <input value={company.siret ?? ""} onChange={(e) => upd("siret", e.target.value)} className={inputCls} placeholder="12345678901234" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sector">
              <select value={company.sector ?? ""} onChange={(e) => upd("sector", e.target.value)} className={inputCls}>
                {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Region">
              <select value={company.region ?? ""} onChange={(e) => upd("region", e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Annual revenue (€)">
              <input type="number" value={company.revenue?.toString() ?? ""} onChange={(e) => upd("revenue", parseFloat(e.target.value))} className={inputCls} placeholder="500000" />
            </Field>
            <Field label="Employees">
              <input type="number" value={company.employees?.toString() ?? ""} onChange={(e) => upd("employees", parseInt(e.target.value))} className={inputCls} placeholder="25" />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={company.description ?? ""} onChange={(e) => upd("description", e.target.value)} rows={4} className={inputCls} placeholder="Describe your company's activities and expertise…" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Legal representative">
              <input value={company.legal_representative ?? ""} onChange={(e) => upd("legal_representative", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Title">
              <input value={company.representative_title ?? ""} onChange={(e) => upd("representative_title", e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Btn onClick={save} loading={saving}>Save Changes</Btn>
      </div>
    </div>
  );
}

// ── Services & Matching ───────────────────────────────────────────────────────

function MatchingTab() {
  const [keywords, setKeywords] = useState("");
  const [preferredRegions, setPreferredRegions] = useState<string[]>([]);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(1_000_000);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("companies").select("id").eq("user_id", user.id).single().then(({ data: co }) => {
        if (!co) return;
        supabase.from("cron_config").select("keywords,regions").eq("company_id", co.id).single().then(({ data }) => {
          if (data) {
            setKeywords((data.keywords ?? []).join(", "));
            setPreferredRegions(data.regions ?? []);
          }
        });
      });
    });
  }, []);

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Matching preferences saved.");
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <Section title="Keywords" desc="Terms the AI agent uses to find relevant tenders.">
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          rows={3}
          className={inputCls}
          placeholder="software development, cloud, cybersecurity"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">Separate keywords with commas.</p>
      </Section>

      <Section title="Preferred Regions">
        <select
          className={inputCls}
          onChange={(e) => {
            const r = e.target.value;
            if (r && !preferredRegions.includes(r)) setPreferredRegions((p) => [...p, r]);
            e.target.value = "";
          }}
        >
          <option value="">Add a region…</option>
          {REGIONS.filter((r) => !preferredRegions.includes(r)).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {preferredRegions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {preferredRegions.map((r) => (
              <span key={r} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm">
                {r}
                <button type="button" onClick={() => setPreferredRegions((p) => p.filter((x) => x !== r))} className="text-muted-foreground hover:text-foreground">×</button>
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Contract Value Range">
        <div className="space-y-4">
          <ValueSlider label="Minimum value" value={minValue} max={5_000_000} step={10_000} onChange={(v) => setMinValue(Math.min(v, maxValue))} />
          <ValueSlider label="Maximum value" value={maxValue} max={5_000_000} step={10_000} onChange={(v) => setMaxValue(Math.max(v, minValue))} />
        </div>
      </Section>

      <div className="flex justify-end">
        <Btn onClick={save} loading={saving}>Save Preferences</Btn>
      </div>
    </div>
  );
}

// ── Subscription & Billing ────────────────────────────────────────────────────

const PLAN = { name: "Pro", price: 149, renewal: "May 18, 2026", features: ["Advanced tender matching", "50 scan analyses / month", "Detailed rejection analysis", "Custom alerts", "Priority support"] };

type Invoice = { id: string; date: string; number: string; amount: number; status: "Paid" | "Pending" };
const INVOICES: Invoice[] = [
  { id: "1", date: "Apr 18, 2026", number: "INV-2026-0418", amount: 149, status: "Paid" },
  { id: "2", date: "Mar 18, 2026", number: "INV-2026-0318", amount: 149, status: "Paid" },
  { id: "3", date: "Feb 18, 2026", number: "INV-2026-0218", amount: 149, status: "Paid" },
  { id: "4", date: "Jan 18, 2026", number: "INV-2026-0118", amount: 149, status: "Paid" },
];

function BillingTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-primary bg-primary/5 p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
              <Sparkles className="h-3 w-3" />
              Current plan
            </div>
            <h2 className="text-2xl font-bold text-foreground">{PLAN.name}</h2>
            <p className="text-sm text-muted-foreground">€{PLAN.price}/month · Renews on {PLAN.renewal}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => toast("Plan upgrade coming soon.")}>Upgrade Plan</Btn>
            <BtnOutline onClick={() => toast("Contact support to cancel.")}>Cancel Subscription</BtnOutline>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {PLAN.features.map((f) => (
            <div key={f} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Billing History</h2>
          <p className="text-xs text-muted-foreground">Download invoices for your records.</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Invoice</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">PDF</th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-foreground">{inv.date}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{inv.number}</td>
                <td className="px-5 py-3 font-medium text-foreground">€{inv.amount}</td>
                <td className="px-5 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", inv.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button type="button" onClick={() => toast.success(`Downloading ${inv.number}.pdf`)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary">
                    <Download className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────

const NOTIF_ITEMS = [
  { key: "dailyDigest",        label: "Daily digest",              desc: "Morning summary of new tenders matching your profile" },
  { key: "instantAlert",       label: "Instant alerts",            desc: "Immediate notification for every new matching tender" },
  { key: "deadline7",          label: "Deadline reminder — 7 days", desc: "Alert 7 days before the submission deadline" },
  { key: "deadline3",          label: "Deadline reminder — 3 days", desc: "Alert 3 days before the submission deadline" },
  { key: "rejectionAnalysis",  label: "Rejection analysis ready",  desc: "When a new analysis report is available" },
  { key: "platformUpdates",    label: "Platform updates",          desc: "New features and Tendro news" },
] as const;

type NotifKey = typeof NOTIF_ITEMS[number]["key"];

function NotificationsTab() {
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    dailyDigest: true, instantAlert: false, deadline7: true,
    deadline3: true, rejectionAnalysis: true, platformUpdates: false,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Notification preferences saved.");
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <Section title="Email notifications">
        <div className="space-y-4">
          {NOTIF_ITEMS.map(({ key, label, desc }) => (
            <label key={key} className="flex cursor-pointer items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Toggle checked={notifs[key]} onChange={(v) => setNotifs((p) => ({ ...p, [key]: v }))} />
            </label>
          ))}
        </div>
      </Section>
      <div className="flex justify-end">
        <Btn onClick={save} loading={saving}>Save</Btn>
      </div>
    </div>
  );
}

// ── Team Members ──────────────────────────────────────────────────────────────

type Role = "Admin" | "Viewer";
type MemberStatus = "Active" | "Pending";
type Member = { id: string; name: string; email: string; role: Role; status: MemberStatus };

const INITIAL_MEMBERS: Member[] = [
  { id: "m1", name: "Camille Durand", email: "camille@acme.fr",  role: "Admin",  status: "Active"  },
  { id: "m2", name: "Léo Martin",     email: "leo@acme.fr",      role: "Viewer", status: "Active"  },
  { id: "m3", name: "Ines Petit",     email: "ines@acme.fr",     role: "Viewer", status: "Pending" },
];

function TeamTab() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Viewer");

  function invite() {
    const email = inviteEmail.trim();
    if (!email || !email.includes("@")) { toast.error("Enter a valid email address."); return; }
    const name = email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    setMembers((p) => [...p, { id: `m-${Date.now()}`, name, email, role: inviteRole, status: "Pending" }]);
    toast.success(`Invitation sent to ${email}.`);
    setInviteEmail(""); setInviteRole("Viewer"); setInviteOpen(false);
  }

  function remove(id: string) {
    const gone = members.find((m) => m.id === id);
    setMembers((p) => p.filter((m) => m.id !== id));
    if (gone) toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm">{gone.name} removed.</span>
        <button onClick={() => { setMembers((p) => [...p, gone]); toast.dismiss(t.id); }} className="text-sm font-medium text-primary hover:underline">Undo</button>
      </div>
    ), { duration: 5000 });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Team Members</h2>
            <p className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""} · Pro Plan</p>
          </div>
          <button type="button" onClick={() => setInviteOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <UserPlus className="h-4 w-4" />
            Invite a Team Member
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Remove</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-medium text-foreground">{m.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{m.email}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{m.role}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", m.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{m.status}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button type="button" onClick={() => remove(m.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setInviteOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Invite a team member</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">We'll send them an email invitation to join your Tendro workspace.</p>
              </div>
              <button type="button" onClick={() => setInviteOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <Field label="Email address">
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className={inputCls} placeholder="teammate@company.com" autoFocus />
              </Field>
              <Field label="Role">
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)} className={inputCls}>
                  <option value="Admin">Admin — full access</option>
                  <option value="Viewer">Viewer — read only</option>
                </select>
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <BtnOutline onClick={() => setInviteOpen(false)}>Cancel</BtnOutline>
              <Btn onClick={invite}>Send invitation</Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Security ──────────────────────────────────────────────────────────────────

function SecurityTab() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!newPwd || newPwd.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (newPwd !== confirmPwd) { toast.error("Passwords don't match."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      toast.success("Password updated.");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <Section title="Change Password">
        <div className="space-y-4">
          <Field label="Current password">
            <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className={inputCls} placeholder="••••••••" />
          </Field>
          <Field label="New password">
            <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className={inputCls} placeholder="At least 8 characters" />
          </Field>
          <Field label="Confirm new password">
            <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className={inputCls} placeholder="••••••••" />
          </Field>
          <div className="flex justify-end">
            <Btn onClick={save} loading={saving}>Update Password</Btn>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────

const inputCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring [&[rows]]:h-auto [&[rows]]:py-2";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-1 text-base font-semibold text-foreground">{title}</h2>
      {desc && <p className="mb-4 text-sm text-muted-foreground">{desc}</p>}
      {!desc && <div className="mb-4" />}
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", checked ? "bg-primary" : "bg-muted")}
    >
      <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

function Btn({ onClick, loading, children }: { onClick: () => void; loading?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : null}
      {children}
    </button>
  );
}

function BtnOutline({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
      {children}
    </button>
  );
}

function ValueSlider({ label, value, max, step, onChange }: { label: string; value: number; max: number; step: number; onChange: (v: number) => void }) {
  const fmt = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M €` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k €` : `${v} €`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm text-foreground">{label}</label>
        <span className="text-sm font-medium text-primary">{fmt(value)}</span>
      </div>
      <input type="range" min={0} max={max} step={step} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="h-2 w-full cursor-pointer accent-primary" />
    </div>
  );
}
