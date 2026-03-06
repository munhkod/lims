import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FilesClient } from "./FilesClient";

export const revalidate = 0;

export default async function FilesPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: files }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("files").select("*, uploader:profiles!uploaded_by(name)").order("created_at", { ascending: false }),
  ]);

  return <FilesClient profile={profile!} files={files ?? []} />;
}
