import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SampleSchema = z.object({
  org_id: z.string().uuid(),
  sample_type: z.string().min(1),
  analysis_type: z.string().min(1),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  date_required: z.string().optional(),
  notes: z.string().optional(),
  quantity: z.string().optional(),
  temperature: z.number().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, org_id").eq("id", user.id).single();

  let query = supabase.from("samples")
    .select("*, organization:organizations(*), analyst:profiles!assigned_analyst(name, id)")
    .order("created_at", { ascending: false });

  if (profile?.role === "client") query = query.eq("org_id", profile.org_id ?? "");
  if (searchParams.get("status")) query = query.eq("status", searchParams.get("status")!);
  if (searchParams.get("org_id")) query = query.eq("org_id", searchParams.get("org_id")!);

  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "lab_manager", "analyst"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = SampleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase.from("samples")
    .insert({ ...parsed.data, registered_by: user.id })
    .select("*, organization:organizations(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await supabase.from("audit_logs").insert({
    action: "Sample registered",
    user_id: user.id,
    target_id: data.id,
    target_type: "sample",
    details: { sample_id: data.sample_id, org: data.org_id },
  });

  return NextResponse.json(data, { status: 201 });
}
