import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "LIMS <noreply@lims.mn>";

export interface EmailPayload {
  to: string;
  sampleId: string;
  clientName: string;
  reportUrl?: string;
}

export async function sendResultReadyEmail({ to, sampleId, clientName, reportUrl }: EmailPayload) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Сорилтын дүн бэлэн боллоо — ${sampleId} / Analysis Result Ready`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;background:#f9fafb;padding:32px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="width:40px;height:40px;background:#00d4aa;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;">🔬</div>
      <span style="font-size:20px;font-weight:800;color:#111827;">LIMS</span>
    </div>
    <h2 style="color:#111827;font-size:18px;margin-bottom:8px;">Сорилтын дүн бэлэн боллоо</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;">
      Сайн байна уу <strong>${clientName}</strong>,<br/>
      Таны <strong style="color:#00d4aa;">${sampleId}</strong> дугаартай дээжийн шинжилгээний хариу бэлэн болж, лабораторийн менежерийн баталгаажуулалт авлаа.
    </p>
    ${reportUrl ? `
    <a href="${reportUrl}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#00d4aa;color:#0a0f1a;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
      📄 Дүн харах / татах
    </a>` : ""}
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6;">
      Digital Medic LLC · LIMS System · Улаанбаатар, Монгол улс
    </p>
  </div>
</body>
</html>`,
  });
}

export async function sendSampleRegisteredEmail({ to, sampleId, analystName }: { to: string; sampleId: string; analystName: string }) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `New Sample Assigned — ${sampleId}`,
    html: `
<body style="font-family:sans-serif;padding:24px;">
  <h2>New Sample Assigned</h2>
  <p>Sample <strong>${sampleId}</strong> has been assigned to you.</p>
  <p>Please log in to LIMS to begin analysis.</p>
  <p style="color:#6b7280;font-size:12px;">Digital Medic LLC · LIMS</p>
</body>`,
  });
}

export async function sendRejectionEmail({ to, sampleId, reason }: { to: string; sampleId: string; reason: string }) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Analysis Returned — ${sampleId}`,
    html: `
<body style="font-family:sans-serif;padding:24px;">
  <h2 style="color:#ef4444;">Analysis Returned for Revision</h2>
  <p>Analysis for sample <strong>${sampleId}</strong> has been returned by the lab manager.</p>
  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="margin:0;color:#b91c1c;"><strong>Reason:</strong> ${reason}</p>
  </div>
  <p>Please log in to LIMS to review and resubmit.</p>
</body>`,
  });
}
