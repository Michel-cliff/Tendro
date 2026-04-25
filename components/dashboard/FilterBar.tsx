"use client";

interface FilterBarProps {
  statusFilter: string;
  sourceFilter: string;
  onStatusChange: (v: string) => void;
  onSourceChange: (v: string) => void;
}

export function FilterBar({ statusFilter, sourceFilter, onStatusChange, onSourceChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-2">
      <div className="flex gap-2">
        {["all", "new", "reviewing", "submitted", "won", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-primary-300"
            }`}
          >
            {s === "all" ? "Tous" : s === "new" ? "Nouveau" : s === "reviewing" ? "En révision" : s === "submitted" ? "Soumis" : s === "won" ? "Gagné" : "Rejeté"}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {["all", "online", "email"].map((src) => (
          <button
            key={src}
            onClick={() => onSourceChange(src)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              sourceFilter === src
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
            }`}
          >
            {src === "all" ? "Toutes sources" : src === "email" ? "Email" : "En ligne"}
          </button>
        ))}
      </div>
    </div>
  );
}
