import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  trend?: "up" | "down" | "neutral";
  color?: "green" | "blue" | "yellow" | "red" | "purple" | "teal";
  className?: string;
}

const COLOR_MAP = {
  teal: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
  green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
};

export function StatCard({ label, value, icon: Icon, change, trend = "up", color = "teal", className }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={cn("bg-card border border-border rounded-xl p-5 flex-1 min-w-36", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-black text-foreground font-mono">{value}</p>
          {change && (
            <p className={cn("text-xs mt-1.5 font-medium", trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-muted-foreground")}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {change}
            </p>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c.bg, "border", c.border)}>
          <Icon size={18} className={c.text} />
        </div>
      </div>
    </div>
  );
}
