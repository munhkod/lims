import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EquipmentClient } from "./EquipmentClient";

export const revalidate = 0;

export default async function EquipmentPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: equipment }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("equipment").select("*").order("name"),
  ]);

  return <EquipmentClient profile={profile!} equipment={equipment ?? []} />;
}
