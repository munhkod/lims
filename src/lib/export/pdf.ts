import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Analysis, Sample, Result } from "@/types/database";

export interface ReportData {
  analysis: Analysis;
  sample: Sample;
  result: Result;
  analystName: string;
  approverName: string;
  labName?: string;
}

export function generateCertificatePDF(data: ReportData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const { analysis, sample, result, analystName, approverName, labName = "Central Laboratory" } = data;
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(0, 212, 170);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(10, 15, 26);
  doc.text("LIMS — CERTIFICATE OF ANALYSIS", pageW / 2, 12, { align: "center" });
  doc.setFontSize(9);
  doc.text("СОРИЛТЫН ДҮНГИЙН ХУУДАС", pageW / 2, 20, { align: "center" });

  // Lab name
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(labName, pageW / 2, 38, { align: "center" });

  // Sample info table
  autoTable(doc, {
    startY: 44,
    head: [["Field / Талбар", "Value / Утга"]],
    body: [
      ["Registration No. / Бүртгэлийн дугаар", sample.sample_id],
      ["Sample Type / Дээжийн төрөл", sample.sample_type],
      ["Analysis Type / Шинжилгээний төрөл", sample.analysis_type],
      ["Date Received / Хүлээн авсан огноо", sample.date_received],
      ["Client Organization / Захиалагч байгууллага", sample.organization?.name ?? "—"],
      ["Analysis Method / Аргачлал", analysis.method],
      ["Analysis Start / Шинжилгээ эхэлсэн", analysis.start_time ?? "—"],
      ["Analysis End / Шинжилгээ дууссан", analysis.end_time ?? "—"],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
  });

  // Results table
  const resultY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("ДЭЭЖИЙН МЭДЭЭЛЭЛ / SAMPLE RESULTS", 14, resultY);

  autoTable(doc, {
    startY: resultY + 4,
    head: [["Parameter", "Standard", "Limit", "Result", "Unit", "Compliant"]],
    body: [[
      result.parameter,
      result.standard ?? "—",
      result.limit_value ?? "—",
      result.value,
      result.unit ?? "—",
      result.is_compliant ? "✓ YES" : "✗ NO",
    ]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255] },
    bodyStyles: { textColor: [50, 50, 50] },
    columnStyles: { 5: { textColor: result.is_compliant ? [16, 185, 129] : [239, 68, 68], fontStyle: "bold" } },
  });

  if (result.remarks) {
    const remarksY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Remarks: ${result.remarks}`, 14, remarksY);
  }

  // Signatures
  const sigY = (doc as any).lastAutoTable.finalY + 24;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, sigY, 80, sigY);
  doc.line(pageW - 80, sigY, pageW - 14, sigY);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Шинжээч / Analyst", 14, sigY + 5);
  doc.text(analystName, 14, sigY + 10);
  doc.text("Хянасан / Approved by", pageW - 80, sigY + 5);
  doc.text(approverName, pageW - 80, sigY + 10);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFillColor(17, 24, 39);
  doc.rect(0, footerY - 4, pageW, 16, "F");
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text("Digital Medic LLC · Сүхбаатар дүүрэг, Улаанбаатар · info@digitalmedic.mn · 976-7800-0044", pageW / 2, footerY + 4, { align: "center" });

  return doc;
}
