"use client";
import { useState } from "react";
import { Download, Search, FileText } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Profile, Analysis } from "@/types/database";
import { generateCertificatePDF } from "@/lib/export/pdf";

export function ReportsClient({ profile, analyses }: { profile: Profile; analyses: Analysis[] }) {
  const [search, setSearch] = useState("");

  const filtered = analyses.filter(a => {
    if (!search) return true;
    const s = (a as any).sample;
    return s?.sample_id.toLowerCase().includes(search.toLowerCase()) || s?.organization?.name.toLowerCase().includes(search.toLowerCase());
  });

  function exportPDF(analysis: Analysis) {
    if (!analysis.result) return;
    const doc = generateCertificatePDF({
      analysis,
      sample: (analysis as any).sample,
      result: analysis.result,
      analystName: (analysis as any).analyst?.name ?? "—",
      approverName: (analysis as any).approver?.name ?? "—",
    });
    doc.save(`COA_${(analysis as any).sample?.sample_id}.pdf`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-foreground">Final Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Approved results — Certificate of Analysis</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by sample ID or client…"
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(analysis => {
          const sample = (analysis as any).sample;
          const result = analysis.result;
          return (
            <div key={analysis.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="font-mono font-black text-primary text-base">{sample?.sample_id}</span>
                    <StatusBadge status="approved" />
                    {result && <StatusBadge status={result.is_compliant ? "approved" : "rejected"} />}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                    {[
                      ["Client", sample?.organization?.name],
                      ["Sample Type", sample?.sample_type],
                      ["Analysis", sample?.analysis_type],
                      ["Analyst", (analysis as any).analyst?.name],
                      ["Approved By", (analysis as any).approver?.name],
                      ["Date", formatDate(analysis.approved_at)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-muted-foreground/60 uppercase tracking-wider text-[9px] font-semibold">{k}</p>
                        <p className="text-muted-foreground mt-0.5">{v ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                  {result && (
                    <div className="mt-3 inline-flex items-center gap-3 bg-background rounded-lg px-3 py-2 text-xs">
                      <span className="text-muted-foreground">Result:</span>
                      <span className="text-foreground font-medium">{result.parameter}</span>
                      <span className="font-mono font-bold text-primary">{result.value} {result.unit}</span>
                      {result.standard && <span className="text-muted-foreground font-mono">({result.standard})</span>}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => exportPDF(analysis)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
                    <Download size={12} /> PDF
                  </button>
                  <button onClick={() => alert("Excel export requires ExcelJS — available in full production build.")}
                    className="flex items-center gap-2 px-4 py-2 bg-muted/50 text-muted-foreground rounded-lg text-xs font-semibold hover:text-foreground hover:bg-muted transition-colors border border-border">
                    <FileText size={12} /> Excel
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-muted-foreground">No approved reports found{search ? " matching your search" : ""}</p>
          </div>
        )}
      </div>
    </div>
  );
}
