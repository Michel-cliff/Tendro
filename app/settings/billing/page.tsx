"use client";
import { Check, CreditCard, Download, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAVY = "#0A1F44";
const N05 = "rgba(10,31,68,.05)";

const INVOICES = [
  { id: "INV-2026-004", date: "1 May 2026",    amount: "€149.00", status: "Paid" },
  { id: "INV-2026-003", date: "1 Apr 2026",    amount: "€149.00", status: "Paid" },
  { id: "INV-2026-002", date: "1 Mar 2026",    amount: "€149.00", status: "Paid" },
  { id: "INV-2026-001", date: "1 Feb 2026",    amount: "€149.00", status: "Paid" },
];

const PLANS = [
  {
    id: "starter", name: "Starter", price: "€79", period: "/month",
    features: ["Matching basique", "15 analyses / mois", "Analyse des rejets", "Support email"],
    current: false,
  },
  {
    id: "pro", name: "Pro", price: "€149", period: "/month",
    features: ["Matching avancé avec IA", "50 analyses / mois", "Analyse détaillée des rejets", "Alertes personnalisées", "Génération DC1 + Mémoire", "Support prioritaire"],
    current: true,
  },
];

export default function BillingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border bg-background px-6 pt-6 pb-5">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: NAVY }}>Subscription & Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your plan and invoices</p>
      </div>

      <main className="flex-1 px-6 py-6">
        <div className="max-w-2xl space-y-6">

          {/* Current plan */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold" style={{ color: NAVY }}>Current Plan</h2>
            <div className="flex items-center justify-between rounded-lg p-4" style={{ backgroundColor: N05 }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: NAVY }}>
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Pro Plan</p>
                  <p className="text-xs text-muted-foreground">Renews 1 Jun 2026 · €149/month</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span>
            </div>

            {/* Usage */}
            <div className="mt-4 space-y-3">
              {[
                { label: "AI Analyses", used: 23, max: 50 },
                { label: "Tender matches", used: 142, max: 500 },
                { label: "Rejection reports", used: 3, max: 20 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{item.label}</span>
                    <span className="font-medium text-foreground">{item.used} / {item.max}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(item.used / item.max) * 100}%`, backgroundColor: NAVY }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Plans */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold" style={{ color: NAVY }}>Available Plans</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {PLANS.map((plan) => (
                <div key={plan.id} className={cn("flex flex-col rounded-xl border p-4", plan.current ? "border-[#0A1F44]" : "border-border")}
                  style={plan.current ? { backgroundColor: N05 } : {}}>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                      <p className="text-xl font-bold" style={{ color: NAVY }}>{plan.price}<span className="text-xs font-normal text-muted-foreground">{plan.period}</span></p>
                    </div>
                    {plan.current && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: NAVY }}>Current</span>}
                  </div>
                  <ul className="mb-4 flex-1 space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button type="button"
                    className={cn("w-full rounded-md py-2 text-sm font-medium transition-colors", plan.current ? "cursor-default bg-muted text-muted-foreground" : "text-white hover:opacity-90")}
                    style={plan.current ? {} : { backgroundColor: NAVY }}
                    disabled={plan.current}>
                    {plan.current ? "Current plan" : "Switch to Starter"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Payment method */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: NAVY }}>Payment Method</h2>
              <button type="button" className="text-sm font-medium hover:underline" style={{ color: NAVY }}>Update</button>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Visa ending in 4242</p>
                <p className="text-xs text-muted-foreground">Expires 08 / 2028</p>
              </div>
            </div>
          </section>

          {/* Invoice history */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold" style={{ color: NAVY }}>Invoice History</h2>
            <div className="divide-y divide-border">
              {INVOICES.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.id}</p>
                    <p className="text-xs text-muted-foreground">{inv.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{inv.amount}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{inv.status}</span>
                    <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
