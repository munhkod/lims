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
    supabase.from("samples").select("*, organization:organizations(name)").order("created_at", { ascending: false }),
    supabase.from("analyses").select("*, sample:samples(sample_id, sample_type), analyst:profiles!analyst_id(name)").order("created_at", { ascending: false }).limit(50),
    supabase.from("audit_logs").select("*, user:profiles(name)").order("created_at", { ascending: false }).limit(10),
  ]);

  // Build real monthly data from actual samples
  const monthlyMap: Record<string, { month: string; samples: number; approved: number }> = {};
  (samples ?? []).forEach((s: any) => {
    const date = new Date(s.created_at);
    const key = date.toLocaleString("en-US", { month: "short" });
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, samples: 0, approved: 0 };
    monthlyMap[key].samples += 1;
    if (s.status === "approved") monthlyMap[key].approved += 1;
  });
  const monthly = Object.values(monthlyMap).slice(-6);

  return (
    <DashboardClient
      profile={profile!}
      samples={samples ?? []}
      analyses={analyses ?? []}
      logs={recentLogs ?? []}
      monthly={monthly}
    />
  );
}