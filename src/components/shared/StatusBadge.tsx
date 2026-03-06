import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  approved: "bg-green-500/10 text-green-400 border-green-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  active: "bg-green-500/10 text-green-400 border-green-500/30",
  maintenance: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  retired: "bg-red-500/10 text-red-400 border-red-500/30",
  low: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  normal: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/10 text-red-400 border-red-500/30",
  admin: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  lab_manager: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  analyst: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  client: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", in_progress: "In Progress", completed: "Completed",
  approved: "Approved", rejected: "Rejected", active: "Active",
  maintenance: "Maintenance", retired: "Retired",
  low: "Low", normal: "Normal", high: "High",
  admin: "Admin", lab_manager: "Lab Manager", analyst: "Analyst", client: "Client",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
      STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border",
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
