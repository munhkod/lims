import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportsClient } from "./ReportsClient";

export const revalidate = 0;

export default async function ReportsPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*, organization:organizations(*)").eq("id", user.id).single();

  let query = supabase.from("analyses").select(`
    *, sample:samples(*, organization:organizations(*)),
    analyst:profiles!analyst_id(name),
    approver:profiles!approved_by(name),
    result:results(*)
  `).eq("status", "approved").order("approved_at", { ascending: false });

  // Clients only see their org's results
if ((profile as any)?.role === "client" && (profile as any)?.org_id) {
    query = query.eq("sample.org_id", (profile as any).org_id);
  }
  
  const { data: analyses } = await query;
  return <ReportsClient profile={profile!} analyses={analyses ?? []} />;
}
