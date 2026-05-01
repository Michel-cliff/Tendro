"use client";
export const dynamic = "force-dynamic";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureDemoSession } from "@/lib/demo-auth";
import { Match, Company } from "@/types";
import { TenderRow } from "@/components/dashboard/TenderRow";
import { TenderDetailDrawer } from "@/components/dashboard/TenderDetailDrawer";
import {
  Search, Radar, Loader2, MapPin, Tag, Building2, Euro, Calendar,
  SlidersHorizontal, X, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const NAVY = "#0A1F44";

// ── Filter config ─────────────────────────────────────────────────────────────

const REGION_OPTIONS = ["Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Occitanie", "Hauts-de-France", "Grand Est", "Provence-Alpes-Côte d'Azur", "Pays de la Loire", "Normandie", "National"];
const SECTOR_OPTIONS = ["Informatique & Digital", "Construction & BTP", "Conseil & Formation", "Santé & Social", "Facilités & Nettoyage", "Communication & Marketing", "Ingénierie & Études", "Transport & Logistique"];
const AUTHORITY_OPTIONS = ["Commune", "Intercommunal", "Département", "Région", "État", "Établissement public"];
const DEADLINE_OPTIONS = ["Less than 7 days", "Less than 14 days", "Less than 30 days"];
const PROCEDURE_OPTIONS = ["Open", "Restricted", "Adapted"];

type Filters = {
  region: string;
  sector: string;
  authorityType: string;
  valueMin: string;
  valueMax: string;
  deadline: string;
  procedureType: string;
  pubDateFrom: string;
  pubDateTo: string;
  excludeKeywords: string;
};

const EMPTY_FILTERS: Filters = {
  region: "", sector: "", authorityType: "", valueMin: "", valueMax: "",
  deadline: "", procedureType: "", pubDateFrom: "", pubDateTo: "", excludeKeywords: "",
};

function hasAnyFilter(f: Filters) {
  return Object.values(f).some((v) => v !== "");
}

// ── Filter chip ───────────────────────────────────────────────────────────────

function FilterChip({
  icon: Icon, label, active, open, onClick, onClear, children,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  open: boolean;
  onClick: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
          active
            ? "border-[#0A1F44] bg-[#0A1F44] text-white"
            : "border-border bg-background text-muted-foreground hover:border-[#0A1F44]/40 hover:text-foreground"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
        {active && onClear ? (
          <span onClick={(e) => { e.stopPropagation(); onClear(); }} className="ml-0.5 rounded-full hover:bg-white/20 p-0.5">
            <X className="h-3 w-3" />
          </span>
        ) : (
          <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 z-20 min-w-48 rounded-xl border border-border bg-white shadow-xl p-2">
          {children}
        </div>
      )}
    </div>
  );
}

function OptionList({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="max-h-52 overflow-y-auto space-y-0.5">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onSelect(o)}
          className={cn("flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors text-left",
            selected === o ? "bg-[#0A1F44] text-white" : "hover:bg-muted text-foreground")}>
          {o}
        </button>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SearchTendersPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openChip, setOpenChip] = useState<string | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanUsed, setScanUsed] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openMatch, setOpenMatch] = useState<Match | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    async function init() {
      const user = await ensureDemoSession();
      if (!user) { setLoading(false); return; }
      const { data: co } = await supabase.from("companies").select("*").eq("user_id", user.id).single();
      if (!co) { setLoading(false); return; }
      setCompany(co);
      const { data: m } = await supabase
        .from("matches")
        .select("*, tender:tenders(*)")
        .eq("company_id", co.id)
        .order("created_at", { ascending: false });
      setAllMatches(m ?? []);
      setLoading(false);
    }
    init();
  }, []);

  // Close chip on outside click
  useEffect(() => {
    if (!openChip) return;
    function handler(e: MouseEvent) {
      if (!(e.target as Element).closest("[data-filter-chip]")) setOpenChip(null);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openChip]);

  const results = useMemo(() => {
    if (!hasSearched) return [];
    return allMatches.filter((m) => {
      const t = m.tender;
      if (!t) return false;
      if (query) {
        const q = query.toLowerCase();
        const match = t.title?.toLowerCase().includes(q) || t.contracting_authority?.toLowerCase().includes(q) || t.sector?.toLowerCase().includes(q) || t.region?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.region && t.region !== filters.region) return false;
      if (filters.sector && t.sector !== filters.sector) return false;
      if (filters.authorityType && !t.contracting_authority?.toLowerCase().includes(filters.authorityType.toLowerCase())) return false;
      if (filters.valueMin && (t.budget ?? 0) < parseFloat(filters.valueMin)) return false;
      if (filters.valueMax && (t.budget ?? 0) > parseFloat(filters.valueMax)) return false;
      if (filters.excludeKeywords) {
        const excluded = filters.excludeKeywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
        if (excluded.some((kw) => t.title?.toLowerCase().includes(kw))) return false;
      }
      return true;
    });
  }, [allMatches, hasSearched, query, filters]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setHasSearched(true);
  }

  async function handleScan() {
    if (scanUsed || scanning || !company) return;
    setScanning(true);
    toast("Tendro is scanning tenders...", { duration: 3000 });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/cron/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ company_id: company.id }),
      });
      if (!res.ok) throw new Error();
      setScanUsed(true);
      toast.success("Scan complete. New results available.");
      setHasSearched(true);
    } catch {
      toast.error("Error during scan");
    } finally {
      setScanning(false);
    }
  }

  function setFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilter(key: keyof Filters) {
    setFilters((prev) => ({ ...prev, [key]: "" }));
  }

  const anyFilter = hasAnyFilter(filters);

  function toggleChip(name: string) {
    setOpenChip((prev) => (prev === name ? null : name));
  }

  const handleStatusChange = async (matchId: string, newStatus: string) => {
    await supabase.from("matches").update({ status: newStatus }).eq("id", matchId);
    setAllMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, status: newStatus as Match["status"] } : m));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col">

        {/* ── Hero search area ── */}
        <div className={cn("flex flex-col items-center px-6 transition-all duration-300", hasSearched ? "pt-8 pb-4" : "pt-[15vh] pb-8")}>
          {/* Wordmark */}
          <p className="mb-4 text-sm font-semibold tracking-wider" style={{ color: NAVY }}>TENDRO</p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="w-full max-w-[680px]">
            <div className="flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm transition-shadow focus-within:shadow-md"
              style={{ borderColor: NAVY }}>
              <Search className="h-5 w-5 shrink-0" style={{ color: NAVY }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for tender offers by keyword, authority, sector or region..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {/* Scan button */}
              <button
                type="button"
                onClick={handleScan}
                disabled={scanUsed || scanning}
                title={scanUsed ? "Daily scan already used. Come back tomorrow." : "Scan Offers"}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  scanUsed || scanning
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "text-white hover:opacity-90"
                )}
                style={scanUsed || scanning ? {} : { backgroundColor: NAVY }}
              >
                {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radar className="h-3.5 w-3.5" />}
                {scanning ? "Scanning..." : "Scan Offers"}
              </button>
            </div>
          </form>

          {/* Filter chips row */}
          <div className="mt-3 flex w-full max-w-[680px] flex-wrap items-center gap-2 overflow-x-auto">
            <div data-filter-chip>
              <FilterChip icon={MapPin} label={filters.region || "Region"} active={!!filters.region}
                open={openChip === "region"} onClick={() => toggleChip("region")} onClear={() => clearFilter("region")}>
                <OptionList options={REGION_OPTIONS} selected={filters.region} onSelect={(v) => { setFilter("region", v); setOpenChip(null); }} />
              </FilterChip>
            </div>
            <div data-filter-chip>
              <FilterChip icon={Tag} label={filters.sector || "Sector"} active={!!filters.sector}
                open={openChip === "sector"} onClick={() => toggleChip("sector")} onClear={() => clearFilter("sector")}>
                <OptionList options={SECTOR_OPTIONS} selected={filters.sector} onSelect={(v) => { setFilter("sector", v); setOpenChip(null); }} />
              </FilterChip>
            </div>
            <div data-filter-chip>
              <FilterChip icon={Building2} label={filters.authorityType || "Authority Type"} active={!!filters.authorityType}
                open={openChip === "authority"} onClick={() => toggleChip("authority")} onClear={() => clearFilter("authorityType")}>
                <OptionList options={AUTHORITY_OPTIONS} selected={filters.authorityType} onSelect={(v) => { setFilter("authorityType", v); setOpenChip(null); }} />
              </FilterChip>
            </div>
            <div data-filter-chip>
              <FilterChip icon={Euro} label={filters.valueMin || filters.valueMax ? `€${filters.valueMin || "0"} – €${filters.valueMax || "∞"}` : "Contract Value"}
                active={!!(filters.valueMin || filters.valueMax)}
                open={openChip === "value"} onClick={() => toggleChip("value")}
                onClear={() => { clearFilter("valueMin"); clearFilter("valueMax"); }}>
                <div className="p-2 space-y-2 w-52">
                  <p className="text-xs font-medium text-muted-foreground px-1">Contract value range (€)</p>
                  <input value={filters.valueMin} onChange={(e) => setFilter("valueMin", e.target.value)} placeholder="Min value" type="number"
                    className="w-full rounded-md border border-input px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <input value={filters.valueMax} onChange={(e) => setFilter("valueMax", e.target.value)} placeholder="Max value" type="number"
                    className="w-full rounded-md border border-input px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button type="button" onClick={() => setOpenChip(null)}
                    className="w-full rounded-md py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: NAVY }}>Apply</button>
                </div>
              </FilterChip>
            </div>
            <div data-filter-chip>
              <FilterChip icon={Calendar} label={filters.deadline || "Deadline"} active={!!filters.deadline}
                open={openChip === "deadline"} onClick={() => toggleChip("deadline")} onClear={() => clearFilter("deadline")}>
                <OptionList options={DEADLINE_OPTIONS} selected={filters.deadline} onSelect={(v) => { setFilter("deadline", v); setOpenChip(null); }} />
              </FilterChip>
            </div>
            <div data-filter-chip>
              <FilterChip icon={SlidersHorizontal} label="More Filters"
                active={!!(filters.procedureType || filters.pubDateFrom || filters.pubDateTo || filters.excludeKeywords)}
                open={openChip === "more"} onClick={() => toggleChip("more")}
                onClear={() => setFilters((p) => ({ ...p, procedureType: "", pubDateFrom: "", pubDateTo: "", excludeKeywords: "" }))}>
                <div className="p-3 w-64 space-y-4">
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Procedure type</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {PROCEDURE_OPTIONS.map((o) => (
                        <button key={o} type="button" onClick={() => setFilter("procedureType", filters.procedureType === o ? "" : o)}
                          className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                            filters.procedureType === o ? "border-[#0A1F44] bg-[#0A1F44] text-white" : "border-border text-muted-foreground hover:border-[#0A1F44]/40")}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Publication date range</p>
                    <div className="space-y-1.5">
                      <input value={filters.pubDateFrom} onChange={(e) => setFilter("pubDateFrom", e.target.value)} type="date"
                        className="w-full rounded-md border border-input px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      <input value={filters.pubDateTo} onChange={(e) => setFilter("pubDateTo", e.target.value)} type="date"
                        className="w-full rounded-md border border-input px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Keywords to exclude</p>
                    <input value={filters.excludeKeywords} onChange={(e) => setFilter("excludeKeywords", e.target.value)}
                      placeholder="e.g. cleaning, catering" className="w-full rounded-md border border-input px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <button type="button" onClick={() => setOpenChip(null)}
                    className="w-full rounded-md py-1.5 text-sm font-medium text-white" style={{ backgroundColor: NAVY }}>Apply</button>
                </div>
              </FilterChip>
            </div>

            {anyFilter && (
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-sm text-muted-foreground underline-offset-2 hover:underline hover:text-foreground transition-colors">
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* ── Results / empty state ── */}
        <div className="flex-1 px-6 pb-8">
          {!hasSearched ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                <Search className="h-9 w-9 text-muted-foreground/40" />
              </div>
              <p className="text-base font-medium text-foreground">Search for tender opportunities</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Use filters to narrow by region, sector, or deadline.
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                {results.length} tender{results.length !== 1 ? "s" : ""} found
              </p>
              {results.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center text-sm text-muted-foreground">
                  No tenders match your search. Try adjusting the filters.
                </div>
              ) : (
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {results.map((match) => (
                    <TenderRow
                      key={match.id}
                      match={match}
                      onStatusChange={handleStatusChange}
                      onOpen={() => { setOpenMatch(match); setDrawerOpen(true); }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <TenderDetailDrawer
        match={openMatch}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
