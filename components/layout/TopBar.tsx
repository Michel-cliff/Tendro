"use client";
import { useState } from "react";
import { Search, Radar, Loader2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface TopBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  onScan?: () => Promise<void>;
  hasNotifications?: boolean;
}

export function TopBar({ search, onSearchChange, onScan, hasNotifications }: TopBarProps) {
  const [scanning, setScanning] = useState(false);
  const [scanUsed, setScanUsed] = useState(false);

  const isDisabled = scanUsed || scanning;

  async function handleScan() {
    if (isDisabled) return;
    setScanning(true);
    toast("BidSafe analyse les appels d'offres...", { duration: 3000 });
    try {
      if (onScan) await onScan();
      setScanUsed(true);
      toast.success("Analyse terminée. Nouveaux résultats disponibles.");
    } catch {
      toast.error("Erreur lors de l'analyse");
    } finally {
      setScanning(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background px-6">
      {/* Search */}
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par mot-clé, autorité ou région..."
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={handleScan}
          disabled={isDisabled}
          title={scanUsed ? "Analyse déjà effectuée aujourd'hui" : "Lancer l'analyse"}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
            isDisabled
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          {scanning ? "Analyse..." : "Scanner"}
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
