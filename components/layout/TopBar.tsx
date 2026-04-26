"use client";
import { useState } from "react";
import { Search, Radar, Loader2, Bell, ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useLanguage } from "@/lib/i18n";

export interface TopBarFilters {
  region: string;
  sector: string;
  deadline: string;
  value: string;
}

interface TopBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filters?: TopBarFilters;
  onFiltersChange?: (f: TopBarFilters) => void;
  onScan?: () => Promise<void>;
  hasNotifications?: boolean;
}

const REGIONS = ["Toutes les régions", "Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Occitanie", "Hauts-de-France", "Grand Est", "Provence-Alpes-Côte d'Azur", "Pays de la Loire", "Normandie", "National"];
const SECTORS = ["Tous les secteurs", "Informatique & Digital", "Construction & BTP", "Conseil & Formation", "Santé & Social", "Facilités & Nettoyage", "Communication & Marketing", "Ingénierie & Études", "Transport & Logistique"];
const DEADLINES = ["Toutes les échéances", "Moins de 7 jours", "Moins de 14 jours", "Moins de 30 jours"];
const VALUES = ["Toute valeur", "< 100k €", "100k – 500k €", "500k – 1M €", "> 1M €"];

const DEFAULT_FILTERS: TopBarFilters = {
  region: "Toutes les régions",
  sector: "Tous les secteurs",
  deadline: "Toutes les échéances",
  value: "Toute valeur",
};

export function TopBar({ search, onSearchChange, filters, onFiltersChange, onScan, hasNotifications }: TopBarProps) {
  const [scanning, setScanning] = useState(false);
  const [scanUsed, setScanUsed] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const f = filters ?? DEFAULT_FILTERS;

  function setFilter(key: keyof TopBarFilters, value: string) {
    onFiltersChange?.({ ...f, [key]: value });
  }

  const isDisabled = scanUsed || scanning;

  async function handleScan() {
    if (isDisabled) return;
    setScanning(true);
    toast(t("scan_toast"), { duration: 3000 });
    try {
      if (onScan) await onScan();
      setScanUsed(true);
      toast.success(t("scan_success"));
    } catch {
      toast.error(t("scan_error"));
    } finally {
      setScanning(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-auto min-h-16 flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-3">
      {/* Search */}
      <div className="relative min-w-0 flex-1 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("search_ph")}
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Filter dropdowns — hidden on small screens */}
      {onFiltersChange && (
        <div className="hidden items-center gap-1.5 xl:flex">
          <FilterSelect value={f.region} options={REGIONS} onChange={(v) => setFilter("region", v)} />
          <FilterSelect value={f.sector} options={SECTORS} onChange={(v) => setFilter("sector", v)} />
          <FilterSelect value={f.deadline} options={DEADLINES} onChange={(v) => setFilter("deadline", v)} />
          <FilterSelect value={f.value} options={VALUES} onChange={(v) => setFilter("value", v)} />
        </div>
      )}

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Language toggle */}
        <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5">
          {(["fr", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                lang === l
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe className="h-3 w-3" />
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Scanner */}
        <button
          type="button"
          onClick={handleScan}
          disabled={isDisabled}
          title={scanUsed ? t("scan_used_tip") : t("scan_tooltip")}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
            isDisabled
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          {scanning ? t("scanning_btn") : t("scan_btn")}
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-md text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
        >
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          )}
        </button>
      </div>
    </header>
  );
}

function FilterSelect({ value, options, onChange }: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const isActive = value !== options[0];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-36 appearance-none rounded-md border py-0 pl-3 pr-7 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
          isActive
            ? "border-primary/40 bg-primary/5 text-primary font-medium"
            : "border-border bg-background text-muted-foreground hover:text-foreground"
        )}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
