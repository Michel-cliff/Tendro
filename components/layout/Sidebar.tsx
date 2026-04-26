"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home, Star, Bookmark, Ban, Archive, BarChart3, Settings, LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const TOP_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home, exact: true },
  { href: "/dashboard/matched", label: "Matched Tenders", icon: Star, countKey: "matched" as const },
  { href: "/dashboard/saved", label: "Saved Tenders", icon: Bookmark },
  { href: "/dashboard/dismissed", label: "Dismissed", icon: Ban, countKey: "dismissed" as const },
  { href: "/dashboard/archived", label: "Archived", icon: Archive, countKey: "archived" as const },
];

const BOTTOM_NAV = [
  { href: "/dashboard/rejection-analysis", label: "Rejection Analysis", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

type Counts = { matched: number; dismissed: number; archived: number };

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("My Company");
  const [counts, setCounts] = useState<Counts>({ matched: 0, dismissed: 0, archived: 0 });

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
                label={item.label}
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
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-sm font-semibold">
            {companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{companyName}</p>
            <p className="truncate text-xs text-primary-foreground/60">Pro plan</p>
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
