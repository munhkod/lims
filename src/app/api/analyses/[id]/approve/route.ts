// @ts-nocheck

import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendResultReadyEmail } from "@/lib/email/notifications";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "lab_manager"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden: only managers can approve" }, { status: 403 });
  }

  const { data, error } = await supabase.from("analyses")
    .update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() })
    .eq("id", params.id).eq("status", "completed")
    .select("*, sample:samples(*, organization:organizations(email, contact_name, name))").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("audit_logs").insert({
    action: "Analysis approved", user_id: user.id, target_id: params.id,
    target_type: "analysis", details: { sample_id: (data as any).sample?.sample_id },
  });

  const sample = (data as any).sample;
  if (sample?.organization?.email) {
    try {
      await sendResultReadyEmail({
        to: sample.organization.email, sampleId: sample.sample_id,
        clientName: sample.organization.contact_name ?? sample.organization.name,
        reportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reports`,
      });
    } catch (e) { console.error("Email failed:", e); }
  }
  return NextResponse.json(data);
}
