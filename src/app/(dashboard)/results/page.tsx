import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResultsClient } from "./ResultsClient";

export const revalidate = 0;

export default async function ResultsPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!["admin", "lab_manager"].includes(profile?.role ?? "")) redirect("/dashboard");

  const { data: analyses } = await supabase.from("analyses").select(`
    *, sample:samples(*, organization:organizations(name)),
    analyst:profiles!analyst_id(name, email),
    approver:profiles!approved_by(name),
    result:results(*)
  `).in("status", ["completed", "approved"]).order("submitted_at", { ascending: false });

  return <ResultsClient profile={profile!} analyses={analyses ?? []} />;
}
