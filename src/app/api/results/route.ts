import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SubmitResultSchema = z.object({
  parameter:   z.string().min(1),
  value:       z.string().min(1),
  unit:        z.string().optional(),
  standard:    z.string().optional(),
  limit_value: z.string().optional(),
  is_compliant: z.boolean(),
  remarks:     z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check analyst owns this analysis
  const { data: analysis } = await supabase
    .from("analyses").select("analyst_id, status, sample_id").eq("id", params.id).single();

  if (!analysis) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isOwner = analysis.analyst_id === user.id;
  const isAdmin = ["admin", "lab_manager"].includes(profile?.role || "");

  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (analysis.status === "approved") return NextResponse.json({ error: "Analysis already approved — read only" }, { status: 400 });

  const body = await req.json();
  const parsed = SubmitResultSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Upsert result (one result per analysis)
  const { data: result, error: rErr } = await supabase
    .from("results")
    .upsert({ analysis_id: params.id, ...parsed.data }, { onConflict: "analysis_id" })
    .select()
    .single();

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  // Mark analysis as completed + set end time
  const { error: aErr } = await supabase
    .from("analyses")
    .update({
      status: "completed",
      end_time: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  await supabase.from("audit_logs").insert({
    action: "result.submitted",
    user_id: user.id,
    target_id: params.id,
    target_type: "analysis",
    details: { parameter: parsed.data.parameter, compliant: parsed.data.is_compliant },
  });

  return NextResponse.json(result, { status: 201 });
}
