import { createServerClient } from "@/lib/supabase/server";
import { OrganizationsClient } from "./OrganizationsClient";

export const revalidate = 0;

export default async function OrganizationsPage() {
  const supabase = createServerClient();
  const { data: orgs } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  return <OrganizationsClient orgs={orgs ?? []} />;
}