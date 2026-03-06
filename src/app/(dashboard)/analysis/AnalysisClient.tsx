"use client";
import { useState } from "react";
import { Play, Send, Clock } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAnalyses } from "@/hooks/useAnalyses";
import { formatDate } from "@/lib/utils";
import type { Profile, Analysis, Equipment } from "@/types/database";

export function AnalysisClient({ profile, analyses: initial, equipment }: { profile: Profile; analyses: Analysis[]; equipment: Equipment[] }) {
  const { analyses, submitResult, loading } = useAnalyses(profile.role === "analyst" ? profile.id : undefined);
  const data = analyses.length > 0 ? analyses : initial;

  const [selected, setSelected] = useState<Analysis | null>(null);
  const [form, setForm] = useState({ parameter: "", value: "", unit: "", standard: "", limit_value: "", is_compliant: true, remarks: "", notes: "" });
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canEnterResults = ["admin", "lab_manager", "analyst"].includes(profile.role);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    const { notes, ...resultData } = form;
    await submitResult(selected.id, resultData, notes);
    setSelected(null);
    setForm({ parameter: "", value: "", unit: "", standard: "", limit_value: "", is_compliant: true, remarks: "", notes: "" });
    setSubmitting(false);
  }

  const tabs = [
    { key: "all", label: "All", count: data.length },
    { key: "in_progress", label: "In Progress", count: data.filter(a => a.status === "in_progress").length },
    { key: "completed", label: "Pending Review", count: data.filter(a => a.status === "completed").length },
    { key: "approved", label: "Approved", count: data.filter(a => a.status === "approved").length },
  ];
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? data : data.filter(a => a.status === tab);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-foreground">Analysis Module</h1>
        <p className="text-sm text-muted-foreground mt-1">{profile.role === "analyst" ? "Your assigned analyses" : "All laboratory analyses"}</p>
      </div>

      {/* Summary cards */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "In Progress", count: data.filter(a => a.status === "in_progress").length, color: "text-blue-400" },
          { label: "Awaiting Review", count: data.filter(a => a.status === "completed").length, color: "text-yellow-400" },
          { label: "Approved", count: data.filter(a => a.status === "approved").length, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-5 py-3 flex items-center gap-3">
            <span className={`text-2xl font-black font-mono ${s.color}`}>{s.count}</span>
            <span className="text-sm text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <DataTable
          columns={[
            { key: "id", label: "Reg No.", render: (_, row) => <span className="font-mono font-bold text-primary">{(row as any).sample?.sample_id ?? "—"}</span> },
            { key: "id", label: "Sample Type", render: (_, row) => <span className="text-foreground text-xs">{(row as any).sample?.sample_type ?? "—"}</span> },
            { key: "id", label: "Client", render: (_, row) => <span className="text-xs">{(row as any).sample?.organization?.name ?? "—"}</span> },
            { key: "id", label: "Analyst", render: (_, row) => <span className="text-foreground text-xs">{(row as any).analyst?.name ?? "—"}</span> },
            { key: "start_time", label: "Start", render: v => <span className="text-xs">{v ? formatDate(v as string, "MMM dd HH:mm") : "—"}</span> },
            { key: "end_time", label: "End", render: v => v ? <span className="text-xs">{formatDate(v as string, "MMM dd HH:mm")}</span> : <span className="text-yellow-400 text-xs flex items-center gap-1"><Clock size={10} /> In progress</span> },
            { key: "method", label: "Method", render: v => <span className="text-[11px] text-muted-foreground font-mono">{v as string}</span> },
            { key: "status", label: "Status", render: v => <StatusBadge status={v as string} /> },
            { key: "id", label: "Action", render: (_, row) => {
              const analysis = row as Analysis;
              if (analysis.status === "in_progress" && canEnterResults) {
                return (
                  <button onClick={e => { e.stopPropagation(); setSelected(analysis); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors">
                    <Send size={11} /> Enter Results
                  </button>
                );
              }
              return null;
            }},
          ]}
          data={filtered as any[]}
          loading={loading && data.length === 0}
        />
      </div>

      {/* Result entry modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-base font-bold text-foreground">Enter Analysis Results</h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{(selected as any).sample?.sample_id} — {(selected as any).sample?.sample_type}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
            </div>

            <div className="bg-background rounded-lg p-3 mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Method</p>
              <p className="text-sm text-foreground font-mono">{selected.method}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Parameter Tested *", key: "parameter", placeholder: "e.g. Staphylococcus aureus", span: 2 },
                  { label: "Result Value *", key: "value", placeholder: "e.g. 10", span: 1 },
                  { label: "Unit", key: "unit", placeholder: "e.g. CFU/g", span: 1 },
                  { label: "Reference Standard", key: "standard", placeholder: "e.g. MNS ISO 1841-1:2000", span: 2 },
                  { label: "Limit Value", key: "limit_value", placeholder: "e.g. ≤100", span: 1 },
                ].map(f => (
                  <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{f.label}</label>
                    <input required={f.label.endsWith("*")} placeholder={f.placeholder}
                      value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                ))}
                <div className="col-span-2 flex items-center gap-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compliant with Standard?</label>
                  <div className="flex gap-3">
                    {[true, false].map(v => (
                      <label key={String(v)} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={form.is_compliant === v} onChange={() => setForm(p => ({ ...p, is_compliant: v }))} className="accent-primary" />
                        <span className={`text-sm font-medium ${v ? "text-green-400" : "text-red-400"}`}>{v ? "Yes" : "No"}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Equipment Used</label>
                <div className="flex gap-2 flex-wrap">
                  {equipment.map(eq => (
                    <button key={eq.id} type="button"
                      onClick={() => setSelectedEquipment(p => p.includes(eq.id) ? p.filter(x => x !== eq.id) : [...p, eq.id])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedEquipment.includes(eq.id) ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"}`}>
                      {eq.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Remarks</label>
                <textarea value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} rows={2} placeholder="Observations or notes about the result…"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Analyst Notes (internal)</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Internal notes for the lab manager…"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  <Send size={13} /> {submitting ? "Submitting…" : "Submit for Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
