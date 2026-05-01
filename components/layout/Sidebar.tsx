"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search, Crosshair, BarChart3, Shield,
  HelpCircle, X, ChevronLeft, ChevronRight, ChevronUp,
  Radar, UploadCloud, Building2, Lightbulb, LayoutDashboard,
  CreditCard, Bell, Users, Lock, LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ensureDemoSession } from "@/lib/demo-auth";
import { useEffect, useRef, useState } from "react";
import { useLanguage, TKey } from "@/lib/i18n";

// ── Nav config ────────────────────────────────────────────────────────────────

const TENDERS_NAV: { href: string; labelKey: TKey; icon: React.ElementType }[] = [
  { href: "/dashboard/search",     labelKey: "nav_search",     icon: Search },
  { href: "/dashboard/my-tenders", labelKey: "nav_my_tenders", icon: Crosshair },
];

const ANALYTICS_NAV: { href: string; labelKey: TKey; icon: React.ElementType }[] = [
  { href: "/dashboard/rejection-analysis",  labelKey: "nav_rejection", icon: BarChart3 },
  { href: "/dashboard/authority-profiles",  labelKey: "nav_authority", icon: Shield },
];

// ── Avatar dropdown items ─────────────────────────────────────────────────────

const MENU_ITEMS = [
  { icon: Building2,  label: "Company Profile",        sub: "Edit your company information and services", href: "/settings/company" },
  { icon: CreditCard, label: "Subscription & Billing", sub: "Manage your plan and invoices",             href: "/settings/billing" },
  { icon: Bell,       label: "Notifications",          sub: "Configure your alert preferences",          href: "/settings/notifications" },
  { icon: Users,      label: "Team Members",           sub: "Invite and manage your team",               href: "/settings/team", proOnly: true },
  { icon: Lock,       label: "Security",               sub: "Password and 2FA settings",                 href: "/settings/security" },
] as const;

// ── Help panel ────────────────────────────────────────────────────────────────

const HELP_SLIDES: { icon: React.ElementType; titleKey: TKey; descKey: TKey }[] = [
  { icon: LayoutDashboard, titleKey: "help_s1_title", descKey: "help_s1_desc" },
  { icon: Radar,           titleKey: "help_s2_title", descKey: "help_s2_desc" },
  { icon: Search,          titleKey: "help_s3_title", descKey: "help_s3_desc" },
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
      <div className="absolute -left-2 bottom-6 h-4 w-4 rotate-45 rounded-sm border-b border-l border-border bg-white" />
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold" style={{ color: "#0A1F44" }}>{t("help_panel_title")}</span>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors" aria-label="Fermer">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-5 py-5">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(10,31,68,.08)" }}>
          <Icon className="h-5 w-5" style={{ color: "#0A1F44" }} />
        </div>
        <h3 className="mb-1.5 text-sm font-semibold text-foreground">{t(slide.titleKey)}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{t(slide.descKey)}</p>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <div className="flex gap-1.5">
          {HELP_SLIDES.map((_, i) => (
            <button key={i} type="button" onClick={() => setIndex(i)} className="h-1.5 rounded-full transition-all"
              style={{ width: i === index ? 20 : 6, backgroundColor: i === index ? "#0A1F44" : "#D1D5DB" }} />
          ))}
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => setIndex((p) => Math.max(0, p - 1))} disabled={index === 0}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setIndex((p) => Math.min(HELP_SLIDES.length - 1, p + 1))} disabled={index === HELP_SLIDES.length - 1}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors">
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureDemoSession().then((user) => {
      if (!user) return;
      supabase.from("companies").select("name").eq("user_id", user.id).single().then(({ data: co }) => {
        if (co?.name) setCompanyName(co.name);
      });
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowLogoutConfirm(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const initials = companyName.slice(0, 2).toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-primary text-primary-foreground md:flex">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-5">
        <span className="text-lg font-semibold tracking-tight">Tendro</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* TENDERS section */}
        <div>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/40">
            {t("section_tenders")}
          </p>
          <ul className="space-y-0.5">
            {TENDERS_NAV.map((item) => (
              <SidebarItem key={item.href} href={item.href} label={t(item.labelKey)} icon={item.icon} active={isActive(item.href)} />
            ))}
          </ul>
        </div>

        {/* ANALYTICS & INSIGHTS section */}
        <div>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/40">
            {t("section_analytics")}
          </p>
          <ul className="space-y-0.5">
            {ANALYTICS_NAV.map((item) => (
              <SidebarItem key={item.href} href={item.href} label={t(item.labelKey)} icon={item.icon} active={isActive(item.href)} />
            ))}
          </ul>
        </div>
      </nav>

      {/* Help button */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => setHelpOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            helpOpen ? "bg-primary-foreground text-primary" : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          )}
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          <span>{t("nav_help")}</span>
        </button>
      </div>

      {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}

      {/* Avatar row + upward dropdown */}
      <div ref={menuRef} className="relative border-t border-primary-foreground/15 p-3">
        {/* Dropdown menu — opens upward */}
        {menuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-1 mx-0 rounded-xl border border-border bg-white shadow-2xl overflow-hidden"
            style={{ boxShadow: "0 -8px 40px rgba(10,31,68,.15)" }}>

            {showLogoutConfirm ? (
              <div className="p-4">
                <p className="mb-3 text-sm font-medium text-foreground">Are you sure you want to log out?</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 rounded-md border border-border py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <button type="button" onClick={handleLogout}
                    className="flex-1 rounded-md bg-red-500 py-1.5 text-sm font-medium text-white hover:bg-red-600 transition-colors">
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-[rgba(10,31,68,0.06)] transition-colors"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{item.label}</span>
                          {"proOnly" in item && item.proOnly && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Pro</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.sub}</p>
                      </div>
                    </Link>
                  );
                })}
                <div className="mx-4 my-1 h-px bg-border" />
                <button type="button" onClick={() => setShowLogoutConfirm(true)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors">
                  <LogOut className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="text-sm font-medium text-red-500">Log Out</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Avatar row button */}
        <button
          type="button"
          onClick={() => { setMenuOpen((o) => !o); setShowLogoutConfirm(false); }}
          className="flex w-full items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-primary-foreground/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-sm font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-primary-foreground">{companyName}</p>
            <p className="truncate text-xs text-primary-foreground/60">Admin</p>
          </div>
          <ChevronUp className={cn("h-4 w-4 shrink-0 text-primary-foreground/50 transition-transform", menuOpen && "rotate-180")} />
        </button>
      </div>
    </aside>
  );
}

// ── SidebarItem ───────────────────────────────────────────────────────────────

function SidebarItem({ href, label, icon: Icon, active }: {
  href: string; label: string; icon: React.ElementType; active: boolean;
}) {
  return (
    <li>
      <Link href={href} className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary-foreground text-primary" : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
      )}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}
