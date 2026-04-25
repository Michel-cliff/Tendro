"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Bot,
  LogOut,
  BarChart3,
  Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const TOP_NAV = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/settings/agent", label: "Agent IA", icon: Bot },
];

const BOTTOM_NAV = [
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("Mon entreprise");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("companies").select("name").eq("user_id", user.id).single().then(({ data }) => {
        if (data?.name) setCompanyName(data.name);
      });
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-primary text-primary-foreground md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-primary-foreground/15">
        <span className="text-lg font-semibold tracking-tight">BidSafe</span>
      </div>

      {/* Top nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {TOP_NAV.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href, item.exact)}
            />
          ))}
        </ul>

        <div className="my-3 h-px bg-primary-foreground/15" />

        <ul className="space-y-0.5">
          {BOTTOM_NAV.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
            />
          ))}
        </ul>
      </nav>

      {/* User block */}
      <div className="border-t border-primary-foreground/15 p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15 text-sm font-semibold shrink-0">
            {companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{companyName}</p>
            <p className="truncate text-xs text-primary-foreground/60">Pro plan</p>
          </div>
          <button
            type="button"
            aria-label="Déconnexion"
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

function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary-foreground text-primary"
            : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{label}</span>
      </Link>
    </li>
  );
}
