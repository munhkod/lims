"use client";
import { useState } from "react";
import { CheckCircle, XCircle, Download } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAnalyses } from "@/hooks/useAnalyses";
import { formatDate, formatRelative } from "@/lib/utils";
import type { Profile, Analysis } from "@/types/database";
import { generateCertificatePDF } from "@/lib/export/pdf";

export function ResultsClient({ profile, analyses: initial }: { profile: Profile; analyses: Analysis[] }) {
  const { analyses, approveAnalysis, rejectAnalysis } = useAnalyses();
  const data = analyses.filter(a => ["completed", "approved"].includes(a.status));
  const display = data.length > 0 ? data : initial;

  const [selected, setSelected] = useState<Analysis | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [processing, setProcessing] = useState(false);

  const pending = display.filter(a => a.status === "completed");
  const approved = display.filter(a => a.status === "approved");
  const tabData = tab === "pending" ? pending : approved;

  async function handleApprove() {
    if (!selected) return;
    setProcessing(true);
    await approveAnalysis(selected.id);
    setSelected(null);
    setProcessing(false);
  }

  async function handleReject() {
    if (!selected || !rejectNote.trim()) return;
    setProcessing(true);
    await rejectAnalysis(selected.id, rejectNote);
    setSelected(null);
    setRejectNote("");
    setProcessing(false);
  }

  function handleExportPDF(analysis: Analysis) {
    if (!analysis.result) return;
    const doc = generateCertificatePDF({
      analysis,
      sample: (analysis as any).sample,
      result: analysis.result,
      analystName: (analysis as any).analyst?.name ?? "—",
      approverName: (analysis as any).approver?.name ?? profile.name,
    });
    doc.save(`COA_${(analysis as any).sample?.sample_id ?? analysis.id}.pdf`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-foreground">Result Review & Approval</h1>
        <p className="text-sm text-muted-foreground mt-1">Review, approve or return analysis results</p>
      </div>

      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 w-fit">
        {[
          { key: "pending" as const, label: `⏳ Pending Review`, count: pending.length },
          { key: "approved" as const, label: `✅ Approved`, count: approved.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <DataTable
          columns={[
            { key: "id", label: "Reg No.", render: (_, row) => <span className="font-mono font-bold text-primary">{(row as any).sample?.sample_id}</span> },
            { key: "id", label: "Sample Type", render: (_, row) => <span className="text-foreground text-xs">{(row as any).sample?.sample_type}</span> },
            { key: "id", label: "Client", render: (_, row) => <span className="text-xs">{(row as any).sample?.organization?.name}</span> },
            { key: "id", label: "Analyst", render: (_, row) => <span className="text-foreground text-xs">{(row as any).analyst?.name}</span> },
            { key: "submitted_at", label: "Submitted", render: v => <span className="text-xs">{formatRelative(v as string)}</span> },
            { key: "id", label: "Result", render: (_, row) => {
              const r = (row as Analysis).result;
              return r ? <StatusBadge status={r.is_compliant ? "approved" : "rejected"} /> : <span className="text-muted-foreground text-xs">—</span>;
            }},
            { key: "status", label: "Status", render: v => <StatusBadge status={v as string} /> },
            { key: "id", label: "Actions", render: (_, row) => {
              const a = row as Analysis;
              return (
                <div className="flex gap-2">
                  {a.status === "approved" && (
                    <button onClick={e => { e.stopPropagation(); handleExportPDF(a); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-semibold hover:bg-blue-500/20">
                      <Download size={11} /> PDF
                    </button>
                  )}
                </div>
              );
            }},
          ]}
          data={tabData as any[]}
          onRowClick={row => setSelected(row as Analysis)}
        />
      </div>

      {/* Detail / Approval Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-primary">{(selected as any).sample?.sample_id}</span>
                <StatusBadge status={selected.status} />
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
            </div>

            {/* Sample details */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                ["Client", (selected as any).sample?.organization?.name],
                ["Sample Type", (selected as any).sample?.sample_type],
                ["Analyst", (selected as any).analyst?.name],
                ["Method", selected.method],
                ["Start Time", formatDate(selected.start_time, "MMM dd HH:mm")],
                ["End Time", formatDate(selected.end_time, "MMM dd HH:mm")],
              ].map(([k, v]) => (
                <div key={k} className="bg-background rounded-lg p-2.5">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{k}</p>
                  <p className="text-xs text-foreground mt-0.5">{v ?? "—"}</p>
                </div>
              ))}
            </div>

            {/* Result */}
            {selected.result && (
              <div className="bg-background rounded-xl p-4 mb-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Analysis Result</p>
                <table className="w-full text-xs">
                  <thead><tr>{["Parameter","Value","Unit","Standard","Compliant"].map(h => <th key={h} className="text-left text-muted-foreground font-semibold pb-2">{h}</th>)}</tr></thead>
                  <tbody>
                    <tr>
                      <td className="text-foreground pr-3">{selected.result.parameter}</td>
                      <td className="font-mono font-bold text-primary pr-3">{selected.result.value}</td>
                      <td className="pr-3">{selected.result.unit ?? "—"}</td>
                      <td className="pr-3 font-mono text-muted-foreground">{selected.result.standard ?? "—"}</td>
                      <td><StatusBadge status={selected.result.is_compliant ? "approved" : "rejected"} /></td>
                    </tr>
                  </tbody>
                </table>
                {selected.result.remarks && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">Remarks: {selected.result.remarks}</p>}
              </div>
            )}

            {selected.notes && (
              <div className="bg-background rounded-lg p-3 mb-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Analyst Notes</p>
                <p className="text-xs text-muted-foreground mt-1">{selected.notes}</p>
              </div>
            )}

            {/* Approval actions */}
            {selected.status === "completed" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Rejection Reason (required to reject)</label>
                  <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={2}
                    placeholder="Describe reason for returning to analyst…"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleApprove} disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-sm font-semibold hover:bg-green-500/20 disabled:opacity-50 transition-colors">
                    <CheckCircle size={15} /> Approve Result
                  </button>
                  <button onClick={handleReject} disabled={processing || !rejectNote.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm font-semibold hover:bg-red-500/20 disabled:opacity-50 transition-colors">
                    <XCircle size={15} /> Reject & Return
                  </button>
                </div>
              </div>
            )}

            {selected.status === "approved" && (
              <div className="flex gap-3">
                <button onClick={() => handleExportPDF(selected)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                  <Download size={14} /> Export PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
