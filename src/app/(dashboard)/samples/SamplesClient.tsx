"use client";
import { useState } from "react";
import { Plus, Filter, Eye, UserPlus } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useSamples } from "@/hooks/useSamples";
import { formatDate, PRIORITY_LABELS } from "@/lib/utils";
import type { Profile, Sample } from "@/types/database";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Props {
  profile: Profile;
  samples: Sample[];
  analysts: { id: string; name: string }[];
  orgs: { id: string; name: string }[];
}

const INITIAL_FORM = { org_id: "", sample_type: "", analysis_type: "", priority: "normal" as const, notes: "", quantity: "", date_required: "" };

export function SamplesClient({ profile, samples: initialSamples, analysts, orgs }: Props) {
  const { samples, loading, createSample, updateSample } = useSamples();
  const displaySamples = samples.length > 0 ? samples : initialSamples;

  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<Sample | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const canCreate = ["admin", "lab_manager", "analyst"].includes(profile.role);
  const canAssign = ["admin", "lab_manager"].includes(profile.role);

  const filtered = displaySamples.filter(s => statusFilter === "all" || s.status === statusFilter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createSample(form);
    setSaving(false);
    setShowAdd(false);
    setForm(INITIAL_FORM);
  }

  async function handleAssign(sampleId: string, analystId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("samples").update({ assigned_analyst: analystId, status: "in_progress" }).eq("id", sampleId);
    if (error) toast.error(error.message);
    else { toast.success("Analyst assigned"); setShowDetail(null); }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-foreground">Sample Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} samples · ISO 17025</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Plus size={15} /> Register Sample
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 flex gap-3 flex-wrap items-center">
        <Filter size={14} className="text-muted-foreground" />
        {["all", "pending", "in_progress", "completed", "approved", "rejected"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}>
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <DataTable
          columns={[
            { key: "sample_id", label: "Sample ID", sortable: true, render: v => <span className="font-mono font-bold text-primary">{v as string}</span> },
            { key: "organization", label: "Client", render: (_, row) => <span className="font-medium text-foreground">{(row as any).organization?.name ?? "—"}</span> },
            { key: "sample_type", label: "Sample Type", sortable: true },
            { key: "analysis_type", label: "Analysis" },
            { key: "priority", label: "Priority", render: v => <StatusBadge status={v as string} /> },
            { key: "status", label: "Status", render: v => <StatusBadge status={v as string} /> },
            { key: "date_received", label: "Received", sortable: true, render: v => formatDate(v as string) },
            { key: "assigned_analyst", label: "Analyst", render: (_, row) => (row as any).analyst?.name ? <span className="text-foreground text-xs">{(row as any).analyst.name}</span> : <span className="text-muted-foreground text-xs italic">Unassigned</span> },
          ]}
          data={filtered as any[]}
          onRowClick={(row) => setShowDetail(row as Sample)}
          loading={loading && displaySamples.length === 0}
          emptyMessage="No samples found. Register your first sample."
        />
      </div>

      {/* Add Sample Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-foreground">Register New Sample</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Client Organization *</label>
                  <select required value={form.org_id} onChange={e => setForm(p => ({ ...p, org_id: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Select organization…</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                {[
                  { label: "Sample Type *", key: "sample_type", placeholder: "e.g. Water, Food product" },
                  { label: "Analysis Type *", key: "analysis_type", placeholder: "e.g. Microbiological" },
                  { label: "Quantity", key: "quantity", placeholder: "e.g. 500 mL" },
                  { label: "Required By", key: "date_required", placeholder: "", type: "date" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{f.label}</label>
                    <input type={f.type ?? "text"} placeholder={f.placeholder}
                      required={f.label.endsWith("*")}
                      value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as any }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {["low", "normal", "high"].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    placeholder="Additional notes or special instructions…"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {saving ? "Registering…" : "Register Sample"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-primary text-lg">{showDetail.sample_id}</span>
                <StatusBadge status={showDetail.status} />
                <StatusBadge status={showDetail.priority} />
              </div>
              <button onClick={() => setShowDetail(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                ["Client", (showDetail as any).organization?.name ?? "—"],
                ["Sample Type", showDetail.sample_type],
                ["Analysis Type", showDetail.analysis_type],
                ["Received", formatDate(showDetail.date_received)],
                ["Required By", formatDate(showDetail.date_required)],
                ["Quantity", showDetail.quantity ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="bg-background rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{k}</p>
                  <p className="text-sm text-foreground mt-1">{v}</p>
                </div>
              ))}
            </div>
            {showDetail.notes && (
              <div className="bg-background rounded-lg p-3 mb-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</p>
                <p className="text-sm text-muted-foreground mt-1">{showDetail.notes}</p>
              </div>
            )}
            {canAssign && showDetail.status === "pending" && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assign to Analyst</label>
                <div className="flex gap-2">
                  <select id="analyst-select" className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                    <option value="">Select analyst…</option>
                    {analysts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <button onClick={() => {
                    const sel = (document.getElementById("analyst-select") as HTMLSelectElement).value;
                    if (sel) handleAssign(showDetail.id, sel);
                  }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 flex items-center gap-2">
                    <UserPlus size={14} /> Assign
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
