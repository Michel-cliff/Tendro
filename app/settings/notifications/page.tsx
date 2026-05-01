"use client";
import { useState } from "react";
import { Bell, Save } from "lucide-react";
import toast from "react-hot-toast";

const NAVY = "#0A1F44";
const N05 = "rgba(10,31,68,.05)";

type Toggle = { id: string; label: string; description: string; on: boolean };

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
      style={{ backgroundColor: on ? NAVY : "#D1D5DB" }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200"
        style={{ transform: on ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

const SECTIONS = [
  {
    title: "Tender Activity",
    items: [
      { id: "new_matches",     label: "New tender matches",        description: "Get notified when new tenders match your profile",   on: true  },
      { id: "scan_results",    label: "Scan results",              description: "Receive a summary after each AI scan completes",      on: true  },
      { id: "deadline_7",      label: "Deadline reminders (7 days)", description: "Alert 7 days before a tender deadline",             on: true  },
      { id: "deadline_48h",    label: "Deadline reminders (48 h)", description: "Final reminder 48 hours before deadline",             on: false },
    ],
  },
  {
    title: "Analysis & Reports",
    items: [
      { id: "rejection_ready", label: "Rejection analysis ready",  description: "Notify when a new rejection report is available",     on: true  },
      { id: "authority_alert", label: "Authority watchlist alerts", description: "Updates on authorities you are monitoring",           on: false },
      { id: "weekly_digest",   label: "Weekly digest",             description: "A weekly summary of your tender activity",            on: true  },
    ],
  },
  {
    title: "Account & Billing",
    items: [
      { id: "billing_alerts",  label: "Billing alerts",            description: "Invoices, renewal reminders, and payment issues",     on: true  },
      { id: "team_activity",   label: "Team activity",             description: "When teammates save, dismiss, or comment on tenders", on: false },
      { id: "product_updates", label: "Product updates",           description: "New features and improvements to Tendro",             on: true  },
    ],
  },
];

export default function NotificationsPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    SECTIONS.forEach((s) => s.items.forEach((i) => { init[i.id] = i.on; }));
    return init;
  });

  function set(id: string, val: boolean) {
    setToggles((p) => ({ ...p, [id]: val }));
  }

  function handleSave() {
    toast.success("Notification preferences saved.");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border bg-background px-6 pt-6 pb-5">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: NAVY }}>Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose which alerts and updates you receive</p>
      </div>

      <main className="flex-1 px-6 py-6">
        <div className="max-w-2xl space-y-6">

          {/* Delivery channel */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold" style={{ color: NAVY }}>Delivery Channels</h2>
            <div className="space-y-3">
              {[
                { id: "ch_email", label: "Email", desc: "nathalie@altea-ingenierie.fr", on: true },
                { id: "ch_browser", label: "Browser push", desc: "In-app and desktop notifications", on: false },
              ].map((ch) => (
                <div key={ch.id} className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: N05 }}>
                  <div>
                    <p className="text-sm font-medium text-foreground">{ch.label}</p>
                    <p className="text-xs text-muted-foreground">{ch.desc}</p>
                  </div>
                  <Toggle on={toggles[ch.id] ?? ch.on} onChange={(v) => set(ch.id, v)} />
                </div>
              ))}
            </div>
          </section>

          {/* Grouped toggles */}
          {SECTIONS.map((section) => (
            <section key={section.title} className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold" style={{ color: NAVY }}>{section.title}</h2>
              <div className="divide-y divide-border">
                {section.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3">
                    <div className="pr-4">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <Toggle on={toggles[item.id] ?? item.on} onChange={(v) => set(item.id, v)} />
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="flex justify-end">
            <button type="button" onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: NAVY }}>
              <Save className="h-4 w-4" />
              Save preferences
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
