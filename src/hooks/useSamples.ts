// @ts-nocheck

"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Sample, SampleStatus } from "@/types/database";
import { toast } from "sonner";

export function useSamples(filters?: { status?: SampleStatus; orgId?: string }) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from("samples").select("*, organization:organizations(*), analyst:profiles!assigned_analyst(*)").order("created_at", { ascending: false });
    if (filters?.status) q = q.eq("status", filters.status);
    if (filters?.orgId) q = q.eq("org_id", filters.orgId);
    const { data, error } = await q;
    if (error) toast.error("Failed to load samples");
    else setSamples(data ?? []);
    setLoading(false);
  }, [filters?.status, filters?.orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function createSample(input: Partial<Sample>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("samples").insert({ ...input, registered_by: user!.id }).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success(`Sample ${data.sample_id} registered`);
    await fetch();
    return data;
  }

  async function updateSample(id: string, updates: Partial<Sample>) {
    const supabase = createClient();
    const { error } = await supabase.from("samples").update(updates).eq("id", id);
    if (error) { toast.error(error.message); return false; }
    await fetch();
    return true;
  }

  return { samples, loading, refetch: fetch, createSample, updateSample };
}
