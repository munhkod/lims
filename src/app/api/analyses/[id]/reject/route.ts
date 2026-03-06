import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "lab_manager"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reason } = await req.json();
  if (!reason?.trim()) return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });

  const { data, error } = await supabase.from("analyses")
    .update({ status: "in_progress", reject_reason: reason })
    .eq("id", params.id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("audit_logs").insert({
    action: "Analysis rejected", user_id: user.id, target_id: params.id,
    target_type: "analysis", details: { reason },
  });
  return NextResponse.json(data);
}
