import { Match } from "@/types";
import { ScoreBadge, StatusBadge, SourceBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { Clock, Euro, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function TenderCard({ match }: { match: Match }) {
  const tender = match.tender;
  if (!tender) return null;

  const days = tender.deadline ? daysUntil(tender.deadline) : null;
  const urgent = days !== null && days <= 7;

  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3",
      urgent ? "border-orange-200" : "border-gray-100"
    )}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
          {tender.title}
        </h3>
        <ScoreBadge score={match.score} />
      </div>

      {tender.contracting_authority && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Building2 className="w-3.5 h-3.5" />
          <span className="truncate">{tender.contracting_authority}</span>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-500">
        {tender.deadline && (
          <div className={cn("flex items-center gap-1", urgent && "text-orange-600 font-medium")}>
            <Clock className="w-3.5 h-3.5" />
            <span>{days !== null && days >= 0 ? `${days}j restants` : "Expiré"} · {formatDate(tender.deadline)}</span>
          </div>
        )}
        {tender.budget && (
          <div className="flex items-center gap-1">
            <Euro className="w-3.5 h-3.5" />
            <span>{formatCurrency(tender.budget)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <StatusBadge status={match.status} />
          <SourceBadge source={match.source} />
        </div>
        <Link
          href={`/dashboard/tenders/${tender.id}`}
          className="flex items-center gap-1 text-xs text-primary-600 font-medium hover:text-primary-700"
        >
          Voir <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
