"use client";
import { Archive, Ban, Bookmark, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Match } from "@/types";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";

interface TenderRowProps {
  match: Match;
  selected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  onOpen?: () => void;
  onStatusChange?: (matchId: string, status: string) => void;
}

export function TenderRow({ match, selected, onSelectChange, onOpen, onStatusChange }: TenderRowProps) {
  const tender = match.tender;
  if (!tender) return null;

  const days = tender.deadline ? daysUntil(tender.deadline) : null;
  const isUrgent = days !== null && days <= 7;
  const isSoon = days !== null && days > 7 && days <= 14;
  const muted = match.status === "rejected";
  const isSelectable = !!onSelectChange;

  return (
    <li className={cn(
      "group relative flex items-center gap-3 border-b border-border bg-card px-4 py-3 transition-colors",
      muted ? "text-muted-foreground hover:bg-muted/40" : "hover:bg-muted/50",
      selected && "bg-primary/5",
    )}>
      {/* Checkbox (visible on hover or when any item is selected) */}
      <div className="flex w-6 shrink-0 items-center justify-center">
        {isSelectable ? (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={(e) => onSelectChange(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "h-4 w-4 rounded border-border accent-primary transition-opacity",
              selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          />
        ) : (
          /* Unread dot when no selection mode */
          match.status === "new" && (
            <span className="h-2 w-2 rounded-full bg-primary" aria-label="Nouveau" />
          )
        )}
      </div>

      {/* Unread dot when selection mode is on */}
      {isSelectable && match.status === "new" && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}

      {/* Clickable content area */}
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 items-center gap-4 text-left min-w-0"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "shrink-0 text-sm font-semibold",
              muted ? "text-muted-foreground" : "text-primary"
            )}>
              {tender.contracting_authority ?? "—"}
            </span>
            <span className="truncate text-sm text-foreground/90">{tender.title}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {tender.sector && <Tag>{tender.sector}</Tag>}
            {tender.region && <Tag>{tender.region}</Tag>}
            <Tag>{tender.source === "email" ? "Email" : "En ligne"}</Tag>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-4 text-right sm:flex">
          <span className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            muted ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          )}>
            {match.score}% match
          </span>
          {tender.budget && (
            <span className="w-24 text-xs tabular-nums text-muted-foreground">
              {formatCurrency(tender.budget)}
            </span>
          )}
          {tender.deadline && (
            <span className={cn(
              "w-28 text-xs font-medium tabular-nums",
              muted ? "text-muted-foreground" : isUrgent ? "text-destructive" : isSoon ? "text-amber-600" : "text-muted-foreground"
            )}>
              {formatDate(tender.deadline)}
            </span>
          )}
        </div>
      </button>

      {/* Hover actions */}
      <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-background p-1 shadow-card group-hover:flex">
        {match.status === "rejected" ? (
          <RowAction icon={Undo2} label="Restaurer" onClick={() => onStatusChange?.(match.id, "new")} />
        ) : (
          <>
            <RowAction icon={Bookmark} label="Sauvegarder" onClick={() => onStatusChange?.(match.id, "reviewing")} />
            <RowAction icon={Ban} label="Ignorer" onClick={() => onStatusChange?.(match.id, "rejected")} />
            <RowAction icon={Archive} label="Archiver" onClick={() => onStatusChange?.(match.id, "submitted")} />
          </>
        )}
      </div>
    </li>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-tag px-1.5 py-0.5 text-[11px] font-medium text-tag-foreground">
      {children}
    </span>
  );
}

function RowAction({ icon: Icon, label, onClick }: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className="flex h-7 w-7 items-center justify-center rounded text-foreground/70 hover:bg-muted hover:text-primary transition-colors"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
