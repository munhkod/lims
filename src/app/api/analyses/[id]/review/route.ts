// @ts-nocheck

import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendRejectionEmail } from "@/lib/email/notifications";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "lab_manager"].includes(profile?.role || "")) {
    return NextResponse.json({ error: "Forbidden — only Lab Manager or Admin can approve" }, { status: 403 });
  }

  const { action, reason } = await req.json() as { action: "approve" | "reject"; reason?: string };

  if (action === "approve") {
    const { data, error } = await supabase
      .from("analyses")
      .update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() })
      .eq("id", params.id)
      .select("*, samples(*, organizations(email, contact_name, name))")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update sample status to approved
    await supabase.from("samples").update({ status: "approved" }).eq("id", data.sample_id);

    // Send email notification to client
    const org = (data.samples as any)?.organizations;
    if (org?.email) {
      try {
        await sendResultReadyEmail({
          to: org.email,
          clientName: org.contact_name || org.name,
          sampleId: (data.samples as any).sample_id,
          reportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reports`,
        });
      } catch (e) {
        console.error("Email send failed:", e);
      }
    }

    await supabase.from("audit_logs").insert({
      action: "analysis.approved", user_id: user.id,
      target_id: params.id, target_type: "analysis",
    });

    return NextResponse.json(data);
  }

  if (action === "reject") {
    if (!reason) return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });

    const { data, error } = await supabase
      .from("analyses")
      .update({ status: "in_progress", reject_reason: reason })
      .eq("id", params.id)
      .select("*, profiles!analyst_id(name, email)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const analyst = (data.profiles as any);
    if (analyst?.email) {
      try {
        await sendAnalysisRejectedEmail({
          to: analyst.email,
          analystName: analyst.name,
          sampleId: data.sample_id,
          reason,
        });
      } catch (e) {
        console.error("Email send failed:", e);
      }
    }

    await supabase.from("audit_logs").insert({
      action: "analysis.rejected", user_id: user.id,
      target_id: params.id, target_type: "analysis",
      details: { reason },
    });

    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
