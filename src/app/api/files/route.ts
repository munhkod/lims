import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateFileSchema = z.object({
  name:         z.string().min(1),
  storage_path: z.string().min(1),
  file_type:    z.enum(["document","image","report","certificate","other"]).default("document"),
  mime_type:    z.string().optional(),
  size_bytes:   z.number().optional(),
  sample_id:    z.string().uuid().optional(),
  analysis_id:  z.string().uuid().optional(),
  is_public:    z.boolean().default(false),
  tags:         z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, org_id").eq("id", user.id).single();
  const { searchParams } = new URL(req.url);
  const sampleId = searchParams.get("sample_id");
  const search   = searchParams.get("search");

  let query = supabase
    .from("files")
    .select("*, profiles!uploaded_by(name)")
    .order("created_at", { ascending: false });

  // Clients only see their own org files
  if (profile?.role === "client") {
    query = query.eq("is_public", true);
  }
  if (sampleId) query = query.eq("sample_id", sampleId);
  if (search)   query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateFileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("files")
    .insert({ ...parsed.data, uploaded_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
