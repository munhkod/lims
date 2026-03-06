import { createServerClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: samples },
    { data: analyses },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from("profiles").select("*, organization:organizations(*)").eq("id", user?.id ?? "").single(),
    supabase.from("samples").select("*, organization:organizations(name)").order("created_at", { ascending: false }).limit(50),
    supabase.from("analyses").select("*, sample:samples(sample_id, sample_type), analyst:profiles!analyst_id(name)").order("created_at", { ascending: false }).limit(50),
    supabase.from("audit_logs").select("*, user:profiles(name)").order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <DashboardClient
      profile={profile!}
      samples={samples ?? []}
      analyses={analyses ?? []}
      logs={recentLogs ?? []}
    />
  );
}