import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalysisClient } from "./AnalysisClient";

export const revalidate = 0;

export default async function AnalysisPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  let query = supabase.from("analyses").select(`
    *, sample:samples(*, organization:organizations(name)),
    analyst:profiles!analyst_id(name, id),
    approver:profiles!approved_by(name),
    result:results(*)
  `).order("created_at", { ascending: false });

  if (profile?.role === "analyst") query = query.eq("analyst_id", user.id);

  const [{ data: analyses }, { data: equipment }] = await Promise.all([
    query,
    supabase.from("equipment").select("*").eq("status", "active"),
  ]);

  return <AnalysisClient profile={profile!} analyses={analyses ?? []} equipment={equipment ?? []} />;
}
