import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UsersClient } from "./UsersClient";

export const revalidate = 0;

export default async function UsersPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!["admin", "lab_manager"].includes(profile?.role ?? "")) redirect("/dashboard");

  const [{ data: users }, { data: orgs }] = await Promise.all([
    supabase.from("profiles").select("*, organization:organizations(name)").order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, name").order("name"),
  ]);

  return <UsersClient currentUser={profile!} users={users ?? []} orgs={orgs ?? []} />;
}
