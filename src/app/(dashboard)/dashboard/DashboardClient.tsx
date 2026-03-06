"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatRelative, ROLE_LABELS } from "@/lib/utils";
import type { Profile, Sample, Analysis, AuditLog } from "@/types/database";

const PIE_COLORS = { approved: "#10b981", in_progress: "#3b82f6", pending: "#f59e0b", completed: "#00d4aa", rejected: "#ef4444" };

export function DashboardClient({ profile, samples, analyses, logs, monthly }: {
  profile: Profile;
  samples: Sample[];
  analyses: Analysis[];
  logs: AuditLog[];
  monthly: { month: string; samples: number; approved: number }[];
}) {
  const statusCounts = samples.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusCounts).map(([k, v]) => ({ name: k, value: v, color: PIE_COLORS[k as keyof typeof PIE_COLORS] ?? "#64748b" }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, <span className="text-foreground font-semibold">{profile.name}</span> ·{" "}
          <span className="text-primary text-xs font-medium">{ROLE_LABELS[profile.role]}</span>
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <StatCard label="Total Samples" value={samples.length} icon={CheckCircle} color="green" />
        <StatCard label="Approved" value={statusCounts.approved ?? 0} icon={CheckCircle} color="green" />
        <StatCard label="Pending" value={statusCounts.pending ?? 0} icon={Clock} color="yellow" />
        <StatCard label="In Progress" value={statusCounts.in_progress ?? 0} icon={TrendingUp} color="blue" />
        <StatCard label="Rejected" value={statusCounts.rejected ?? 0} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Monthly Sample Volume</p>
          {monthly.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No data yet — add your first sample!</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly}>
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1e2d45", borderRadius: 8, color: "#f1f5f9", fontSize: 12 }} />
                <Bar dataKey="samples" fill="#00d4aa" radius={[4, 4, 0, 0]} opacity={0.8} name="Total" />
                <Bar dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.6} name="Approved" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Status Distribution</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[130px] text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1e2d45", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 space-y-1.5">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                  <span className="text-muted-foreground capitalize">{d.name.replace("_", " ")}</span>
                </div>
                <span className="font-semibold text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Samples</p>
          </div>
          <div className="divide-y divide-border/50">
            {samples.slice(0, 5).map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                <div>
                  <p className="text-sm font-mono font-bold text-primary">{s.sample_id}</p>
                  <p className="text-xs text-muted-foreground">{(s as any).organization?.name ?? "—"} · {s.analysis_type}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
            {samples.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No samples yet</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</p>
          </div>
          <div className="divide-y divide-border/50">
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="px-5 py-3 flex gap-3 items-start hover:bg-muted/20 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">
                  {log.action.includes("approved") ? "✅" : log.action.includes("Sample") ? "🧪" : log.action.includes("export") ? "📄" : "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{log.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{JSON.stringify(log.details)}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatRelative(log.created_at)}</span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
