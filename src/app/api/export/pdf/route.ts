// @ts-nocheck

import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateCertificatePDF } from "@/lib/export/pdf";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { analysisId } = await req.json();
  const { data, error } = await supabase.from("analyses")
    .select("*, sample:samples(*, organization:organizations(*)), analyst:profiles!analyst_id(name), approver:profiles!approved_by(name), result:results(*)")
    .eq("id", analysisId).eq("status", "approved").single();

  if (error || !data) return NextResponse.json({ error: "Analysis not found or not approved" }, { status: 404 });
  if (!data.result) return NextResponse.json({ error: "No results found" }, { status: 404 });

  const doc = generateCertificatePDF({
    analysis: data as any, sample: (data as any).sample, result: data.result as any,
    analystName: (data as any).analyst?.name ?? "—", approverName: (data as any).approver?.name ?? "—",
  });

  const pdfBuffer = doc.output("arraybuffer");
  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="COA_${(data as any).sample?.sample_id ?? analysisId}.pdf"`,
    },
  });
}
