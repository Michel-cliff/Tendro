"use client";
import { useState } from "react";
import { Bell, Globe, Mail, Save } from "lucide-react";
import toast from "react-hot-toast";

const NAVY = "#0A1F44";
const N05  = "rgba(10,31,68,.05)";

const CARD: React.CSSProperties = { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
      style={{ backgroundColor: on ? NAVY : "#D1D5DB" }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200"
        style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

const SECTIONS = [
  {
    title: "Tender Activity",
    subtitle: "Alerts about tenders that match your profile",
    items: [
      { id: "new_matches",  label: "New tender matches",          description: "Get notified when new tenders match your profile",   on: true  },
      { id: "scan_results", label: "Scan results",                description: "Receive a summary after each AI scan completes",      on: true  },
      { id: "deadline_7",   label: "Deadline reminders (7 days)", description: "Alert 7 days before a tender deadline",               on: true  },
      { id: "deadline_48h", label: "Deadline reminders (48 h)",   description: "Final reminder 48 hours before deadline",             on: false },
    ],
  },
  {
    title: "Analysis & Reports",
    subtitle: "Updates from your rejection analysis and authority monitoring",
    items: [
      { id: "rejection_ready", label: "Rejection analysis ready",  description: "Notify when a new rejection report is available",     on: true  },
      { id: "authority_alert", label: "Authority watchlist alerts", description: "Updates on authorities you are monitoring",           on: false },
      { id: "weekly_digest",   label: "Weekly digest",             description: "A weekly summary of your tender activity",            on: true  },
    ],
  },
  {
    title: "Account & Billing",
    subtitle: "Important account and workspace notifications",
    items: [
      { id: "billing_alerts",  label: "Billing alerts",    description: "Invoices, renewal reminders, and payment issues",     on: true  },
      { id: "team_activity",   label: "Team activity",     description: "When teammates save, dismiss, or comment on tenders", on: false },
      { id: "product_updates", label: "Product updates",   description: "New features and improvements to Tendro",             on: true  },
    ],
  },
];

const CHANNELS = [
  { id: "ch_email",   icon: Mail,  label: "Email",         desc: "nathalie@altea-ingenierie.fr",   on: true  },
  { id: "ch_browser", icon: Globe, label: "Browser push",  desc: "In-app and desktop notifications", on: false },
];

export default function NotificationsPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    SECTIONS.forEach((s) => s.items.forEach((i) => { init[i.id] = i.on; }));
    CHANNELS.forEach((c) => { init[c.id] = c.on; });
    return init;
  });

  function set(id: string, val: boolean) {
    setToggles((p) => ({ ...p, [id]: val }));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 pt-6 pb-5">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: NAVY }}>Notifications</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Choose which alerts and updates you receive</p>
      </div>

      <main className="flex-1 bg-[#F9FAFB] px-6 py-6">
        <div className="max-w-2xl space-y-6">

          {/* Delivery channels */}
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6" style={CARD}>
            <h2 className="text-base font-bold" style={{ color: NAVY }}>Delivery Channels</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Where you receive your notifications</p>
            <hr className="my-4 border-[#E5E7EB]" />
            <div className="space-y-3">
              {CHANNELS.map(({ id, icon: Icon, label, desc }) => (
                <div key={id} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: N05 }}>
                      <Icon className="h-4 w-4" style={{ color: NAVY }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <Toggle on={toggles[id] ?? false} onChange={(v) => set(id, v)} />
                </div>
              ))}
            </div>
          </section>

          {/* Grouped toggles */}
          {SECTIONS.map((section) => (
            <section key={section.title} className="rounded-xl border border-[#E5E7EB] bg-white p-6" style={CARD}>
              <h2 className="text-base font-bold" style={{ color: NAVY }}>{section.title}</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{section.subtitle}</p>
              <hr className="my-4 border-[#E5E7EB]" />
              <div className="divide-y divide-[#F3F4F6]">
                {section.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3.5">
                    <div className="pr-6">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">{item.description}</p>
                    </div>
                    <Toggle on={toggles[item.id] ?? item.on} onChange={(v) => set(item.id, v)} />
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => toast.success("Notification preferences saved.")}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: NAVY }}
            >
              <Save className="h-4 w-4" />
              Save preferences
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
