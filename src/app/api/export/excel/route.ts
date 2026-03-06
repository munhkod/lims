import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateSamplesExcel } from "@/lib/export/excel";

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  let query = supabase.from("samples").select("*, organization:organizations(name)").order("created_at", { ascending: false });
  if (searchParams.get("status")) query = query.eq("status", searchParams.get("status")!);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const buffer = await generateSamplesExcel(data ?? []);
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="LIMS_samples_${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}
