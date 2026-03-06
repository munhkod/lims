// @ts-nocheck

import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateUserSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  name:     z.string().min(1),
  role:     z.enum(["admin", "lab_manager", "analyst", "client"]),
  org_id:   z.string().uuid().optional(),
  phone:    z.string().optional(),
});

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "lab_manager"].includes(profile?.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*, organizations(name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const serviceClient = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, password, name, role, org_id, phone } = parsed.data;

  // Create auth user via service role
  const { data: authUser, error: authErr } = await serviceClient.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

  // Create profile
  const { data: newProfile, error: profileErr } = await serviceClient
    .from("profiles")
    .insert({ id: authUser.user.id, name, role, org_id, phone })
    .select()
    .single();

  if (profileErr) {
    await serviceClient.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    action: "user.created", user_id: user.id,
    target_id: newProfile.id, target_type: "user",
    details: { email, role },
  });

  return NextResponse.json(newProfile, { status: 201 });
}
