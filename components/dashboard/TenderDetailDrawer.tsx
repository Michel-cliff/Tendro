"use client";
import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import { Match } from "@/types";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Building2, Calendar, Euro, MapPin, Tag, ExternalLink,
  Bookmark, Ban, Archive, Undo2, Star,
} from "lucide-react";

interface Props {
  match: Match | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (matchId: string, newStatus: string) => void;
}

export function TenderDetailDrawer({ match, open, onClose, onStatusChange }: Props) {
  if (!match?.tender) return null;
  const tender = match.tender;

  const days = tender.deadline ? daysUntil(tender.deadline) : null;
  const isUrgent = days !== null && days <= 7;
  const isSoon = days !== null && days > 7 && days <= 14;
  const isDismissed = match.status === "rejected";
  const isArchived = match.status === "submitted" || match.status === "won";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {tender.source === "email" ? "Source Email" : "Source En ligne"} · {tender.sector ?? "—"}
          </p>
          <h2 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
            {tender.title}
          </h2>
        </div>
      }
    >
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Key details grid */}
        <div className="grid grid-cols-2 gap-4">
          <Detail icon={Building2} label="Pouvoir adjudicateur" value={tender.contracting_authority ?? "—"} />
          <Detail
            icon={Calendar}
            label="Date limite"
            value={tender.deadline ? formatDate(tender.deadline) : "—"}
            valueClass={isUrgent ? "text-destructive" : isSoon ? "text-amber-600" : undefined}
            sub={days !== null ? `${days} jour${days > 1 ? "s" : ""}` : undefined}
          />
          <Detail icon={Euro} label="Budget estimé" value={tender.budget ? formatCurrency(tender.budget) : "—"} />
          <Detail icon={MapPin} label="Région" value={tender.region ?? "—"} />
        </div>

        {/* Match score */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Compatibilité</span>
            <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {match.score}%
            </span>
          </div>
          {match.reasoning && (
            <p className="text-sm text-muted-foreground leading-relaxed">{match.reasoning}</p>
          )}
        </div>

        {/* Description */}
        {tender.description && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Description</h3>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap line-clamp-[12]">
              {tender.description}
            </p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-border px-6 py-4 space-y-3">
        <Link
          href={`/dashboard/tenders/${tender.id}`}
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Voir le détail complet
        </Link>

        <div className="flex gap-2">
          {isDismissed || isArchived ? (
            <ActionBtn
              icon={Undo2}
              label="Restaurer"
              onClick={() => { onStatusChange(match.id, "new"); onClose(); }}
              className="flex-1"
            />
          ) : (
            <>
              <ActionBtn
                icon={Bookmark}
                label="Sauvegarder"
                active={match.status === "reviewing"}
                onClick={() => { onStatusChange(match.id, "reviewing"); onClose(); }}
                className="flex-1"
              />
              <ActionBtn
                icon={Ban}
                label="Ignorer"
                onClick={() => { onStatusChange(match.id, "rejected"); onClose(); }}
                className="flex-1"
              />
              <ActionBtn
                icon={Archive}
                label="Archiver"
                onClick={() => { onStatusChange(match.id, "submitted"); onClose(); }}
                className="flex-1"
              />
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function Detail({
  icon: Icon, label, value, valueClass, sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-medium text-foreground", valueClass)}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function ActionBtn({
  icon: Icon, label, onClick, className, active,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  className?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-background text-foreground hover:bg-muted",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
