import ExcelJS from "exceljs";
import type { Sample, Analysis } from "@/types/database";

export async function generateSamplesExcel(samples: Sample[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "LIMS Digital Medic";
  wb.created = new Date();

  const ws = wb.addWorksheet("Samples", {
    pageSetup: { paperSize: 9, orientation: "landscape" },
  });

  ws.columns = [
    { header: "Sample ID", key: "sample_id", width: 14 },
    { header: "Client", key: "client", width: 28 },
    { header: "Sample Type", key: "sample_type", width: 32 },
    { header: "Analysis Type", key: "analysis_type", width: 20 },
    { header: "Date Received", key: "date_received", width: 16 },
    { header: "Status", key: "status", width: 14 },
    { header: "Priority", key: "priority", width: 10 },
    { header: "Notes", key: "notes", width: 40 },
  ];

  // Header style
  ws.getRow(1).eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111827" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { bottom: { style: "thin", color: { argb: "FF00D4AA" } } };
  });
  ws.getRow(1).height = 22;

  // Data rows
  samples.forEach((s, i) => {
    const row = ws.addRow({
      sample_id: s.sample_id,
      client: s.organization?.name ?? s.org_id,
      sample_type: s.sample_type,
      analysis_type: s.analysis_type,
      date_received: s.date_received,
      status: s.status.replace("_", " ").toUpperCase(),
      priority: s.priority.toUpperCase(),
      notes: s.notes ?? "",
    });
    row.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF" } };
      cell.font = { size: 9 };
      cell.alignment = { vertical: "middle" };
    });

    // Color-code status
    const statusCell = row.getCell("status");
    const statusColors: Record<string, string> = {
      "PENDING": "FFF59E0B", "IN PROGRESS": "FF3B82F6",
      "COMPLETED": "FF00D4AA", "APPROVED": "FF10B981", "REJECTED": "FFEF4444",
    };
    const color = statusColors[statusCell.value as string];
    if (color) statusCell.font = { bold: true, color: { argb: color }, size: 9 };
  });

  // Summary sheet
  const sumWs = wb.addWorksheet("Summary");
  sumWs.addRow(["Status", "Count"]);
  const statuses = ["pending", "in_progress", "completed", "approved", "rejected"];
  statuses.forEach(s => {
    sumWs.addRow([s.replace("_", " "), samples.filter(x => x.status === s).length]);
  });

  return wb.xlsx.writeBuffer() as Promise<Buffer>;
}

export async function generateAnalysisReportExcel(analyses: Analysis[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Analysis Report");

  ws.columns = [
    { header: "Sample ID", key: "sample_id", width: 14 },
    { header: "Client", key: "client", width: 24 },
    { header: "Parameter", key: "parameter", width: 28 },
    { header: "Value", key: "value", width: 12 },
    { header: "Unit", key: "unit", width: 10 },
    { header: "Standard", key: "standard", width: 24 },
    { header: "Compliant", key: "compliant", width: 12 },
    { header: "Analyst", key: "analyst", width: 20 },
    { header: "Method", key: "method", width: 24 },
    { header: "Approved At", key: "approved_at", width: 18 },
  ];

  ws.getRow(1).eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111827" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  analyses.filter(a => a.status === "approved").forEach((a, i) => {
    const row = ws.addRow({
      sample_id: a.sample?.sample_id ?? "—",
      client: a.sample?.organization?.name ?? "—",
      parameter: a.result?.parameter ?? "—",
      value: a.result?.value ?? "—",
      unit: a.result?.unit ?? "—",
      standard: a.result?.standard ?? "—",
      compliant: a.result?.is_compliant ? "YES" : "NO",
      analyst: a.analyst?.name ?? "—",
      method: a.method,
      approved_at: a.approved_at ?? "—",
    });
    row.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF" } };
      cell.font = { size: 9 };
    });
    const compliantCell = row.getCell("compliant");
    compliantCell.font = {
      bold: true, size: 9,
      color: { argb: a.result?.is_compliant ? "FF10B981" : "FFEF4444" },
    };
  });

  return wb.xlsx.writeBuffer() as Promise<Buffer>;
}
