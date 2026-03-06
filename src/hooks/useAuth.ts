"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("*, organization:organizations(*)")
        .eq("id", user.id)
        .single();
      setProfile(data);
      setLoading(false);
    }
    fetchProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => fetchProfile());
    return () => subscription.unsubscribe();
  }, []);

  return { profile, loading };
}
