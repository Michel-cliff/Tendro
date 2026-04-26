"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home, Star, Bookmark, Ban, Archive, BarChart3, Settings, LogOut,
  HelpCircle, X, ChevronLeft, ChevronRight,
  Radar, UploadCloud, Building2, Lightbulb, LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useLanguage, TKey } from "@/lib/i18n";

// ── Nav config ────────────────────────────────────────────────────────────────

const TOP_NAV: { href: string; labelKey: TKey; icon: React.ElementType; exact?: boolean; countKey?: "matched" | "dismissed" | "archived" }[] = [
  { href: "/dashboard",            labelKey: "nav_dashboard", icon: Home, exact: true },
  { href: "/dashboard/matched",    labelKey: "nav_matched",   icon: Star,     countKey: "matched" },
  { href: "/dashboard/saved",      labelKey: "nav_saved",     icon: Bookmark },
  { href: "/dashboard/dismissed",  labelKey: "nav_dismissed", icon: Ban,      countKey: "dismissed" },
  { href: "/dashboard/archived",   labelKey: "nav_archived",  icon: Archive,  countKey: "archived" },
];

const BOTTOM_NAV: { href: string; labelKey: TKey; icon: React.ElementType }[] = [
  { href: "/dashboard/rejection-analysis", labelKey: "nav_rejection", icon: BarChart3 },
  { href: "/settings",                     labelKey: "nav_settings",  icon: Settings },
];

type Counts = { matched: number; dismissed: number; archived: number };

// ── Help panel ────────────────────────────────────────────────────────────────

const HELP_SLIDES: { icon: React.ElementType; titleKey: TKey; descKey: TKey }[] = [
  { icon: LayoutDashboard, titleKey: "help_s1_title", descKey: "help_s1_desc" },
  { icon: Radar,           titleKey: "help_s2_title", descKey: "help_s2_desc" },
  { icon: Star,            titleKey: "help_s3_title", descKey: "help_s3_desc" },
  { icon: UploadCloud,     titleKey: "help_s4_title", descKey: "help_s4_desc" },
  { icon: Building2,       titleKey: "help_s5_title", descKey: "help_s5_desc" },
  { icon: Lightbulb,       titleKey: "help_s6_title", descKey: "help_s6_desc" },
];

function HelpPanel({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const { t } = useLanguage();
  const slide = HELP_SLIDES[index];
  const Icon = slide.icon;

  return (
    <div
      className="fixed z-50 bottom-[88px] left-[248px] w-80 rounded-2xl border border-border bg-white shadow-2xl"
      style={{ boxShadow: "0 8px 40px rgba(10,31,68,.18)" }}
    >
      {/* Arrow pointing left toward sidebar */}
      <div className="absolute -left-2 bottom-6 h-4 w-4 rotate-45 rounded-sm border-b border-l border-border bg-white" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold" style={{ color: "#0A1F44" }}>{t("help_panel_title")}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Slide */}
      <div className="px-5 py-5">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(10,31,68,.08)" }}>
          <Icon className="h-5 w-5" style={{ color: "#0A1F44" }} />
        </div>
        <h3 className="mb-1.5 text-sm font-semibold text-foreground">{t(slide.titleKey)}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{t(slide.descKey)}</p>
      </div>

      {/* Footer — nav */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <div className="flex gap-1.5">
          {HELP_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className="h-1.5 rounded-full transition-all"
              style={{ width: i === index ? 20 : 6, backgroundColor: i === index ? "#0A1F44" : "#D1D5DB" }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIndex((p) => Math.max(0, p - 1))}
            disabled={index === 0}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((p) => Math.min(HELP_SLIDES.length - 1, p + 1))}
            disabled={index === HELP_SLIDES.length - 1}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [companyName, setCompanyName] = useState("My Company");
  const [counts, setCounts] = useState<Counts>({ matched: 0, dismissed: 0, archived: 0 });
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("companies").select("id, name").eq("user_id", user.id).single().then(({ data: co }) => {
        if (!co) return;
        if (co.name) setCompanyName(co.name);
        supabase.from("matches").select("status").eq("company_id", co.id).then(({ data: m }) => {
          if (!m) return;
          const c = { matched: 0, dismissed: 0, archived: 0 };
          for (const row of m) {
            if (row.status === "new") c.matched++;
            if (row.status === "rejected") c.dismissed++;
            if (row.status === "submitted" || row.status === "won") c.archived++;
          }
          setCounts(c);
        });
      });
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-primary text-primary-foreground md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center px-5">
        <span className="text-lg font-semibold tracking-tight">Tendro</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {TOP_NAV.map((item) => {
            const badge = item.countKey ? counts[item.countKey] : undefined;
            return (
              <SidebarItem
                key={item.href}
                href={item.href}
                label={t(item.labelKey)}
                icon={item.icon}
                active={isActive(item.href, item.exact)}
                badge={badge && badge > 0 ? badge : undefined}
              />
            );
          })}
        </ul>

        <div className="my-3 h-px bg-primary-foreground/15" />

        <ul className="space-y-0.5">
          {BOTTOM_NAV.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
              icon={item.icon}
              active={isActive(item.href)}
            />
          ))}
        </ul>
      </nav>

      {/* Help button */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => setHelpOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            helpOpen
              ? "bg-primary-foreground text-primary"
              : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          )}
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          <span>{t("nav_help")}</span>
        </button>
      </div>

      {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}

      {/* User block */}
      <div className="border-t border-primary-foreground/15 p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-sm font-semibold">
            {companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{companyName}</p>
            <p className="truncate text-xs text-primary-foreground/60">{t("user_plan")}</p>
          </div>
          <button
            type="button"
            aria-label="Log out"
            onClick={handleLogout}
            className="rounded-md p-1.5 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ href, label, icon: Icon, active, badge }: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  badge?: number;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary-foreground text-primary"
            : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{label}</span>
        {badge !== undefined && (
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
            active ? "bg-primary/15 text-primary" : "bg-primary-foreground/15 text-primary-foreground/70",
          )}>
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}
