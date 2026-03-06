// @ts-nocheck

import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const { searchParams } = new URL(req.url);

  let query = supabase.from("analyses").select(`
    *, sample:samples(*, organization:organizations(name)),
    analyst:profiles!analyst_id(name, id),
    approver:profiles!approved_by(name),
    result:results(*)
  `).order("created_at", { ascending: false });

  if (profile?.role === "analyst") query = query.eq("analyst_id", user.id);
  if (searchParams.get("status")) query = query.eq("status", searchParams.get("status")!);
  if (searchParams.get("sample_id")) query = query.eq("sample_id", searchParams.get("sample_id")!);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
