import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "yellow" | "red" | "gray" | "purple";
  className?: string;
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  const variants = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-700",
    purple: "bg-purple-100 text-purple-800",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 70 ? "green" : score >= 40 ? "yellow" : "red";
  return <Badge variant={variant}>{score}/100</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    new: { label: "Nouveau", variant: "blue" },
    reviewing: { label: "En révision", variant: "yellow" },
    submitted: { label: "Soumis", variant: "purple" },
    rejected: { label: "Rejeté", variant: "red" },
    won: { label: "Gagné", variant: "green" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "gray" };
  return <Badge variant={variant}>{label}</Badge>;
}

export function SourceBadge({ source }: { source: "online" | "email" }) {
  return (
    <Badge variant={source === "email" ? "purple" : "blue"}>
      {source === "email" ? "Email" : "En ligne"}
    </Badge>
  );
}
