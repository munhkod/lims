import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SamplesClient } from "./SamplesClient";

export const revalidate = 0;

export default async function SamplesPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: samples }, { data: analysts }, { data: orgs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("samples").select("*, organization:organizations(*), analyst:profiles!assigned_analyst(name, id)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, name").eq("role", "analyst").eq("is_active", true),
    supabase.from("organizations").select("id, name").order("name"),
  ]);

  return <SamplesClient profile={profile!} samples={samples ?? []} analysts={analysts ?? []} orgs={orgs ?? []} />;
}
