"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Analysis } from "@/types/database";
import { toast } from "sonner";

export function useAnalyses(analystId?: string) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from("analyses").select(`
      *,
      sample:samples(*, organization:organizations(*)),
      analyst:profiles!analyst_id(*),
      approver:profiles!approved_by(*),
      result:results(*)
    `).order("created_at", { ascending: false });
    if (analystId) q = q.eq("analyst_id", analystId);
    const { data, error } = await q;
    if (error) toast.error("Failed to load analyses");
    else setAnalyses(data ?? []);
    setLoading(false);
  }, [analystId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function submitResult(analysisId: string, resultData: { parameter: string; value: string; unit?: string; standard?: string; is_compliant?: boolean; remarks?: string }, notes?: string) {
    const supabase = createClient();
    const { error: resErr } = await supabase.from("results").upsert({ analysis_id: analysisId, ...resultData });
    if (resErr) { toast.error(resErr.message); return false; }
    const { error: anaErr } = await supabase.from("analyses").update({
      status: "completed",
      end_time: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      notes,
    }).eq("id", analysisId);
    if (anaErr) { toast.error(anaErr.message); return false; }
    toast.success("Results submitted for review");
    await fetch();
    return true;
  }

  async function approveAnalysis(analysisId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("analyses").update({
      status: "approved", approved_by: user!.id, approved_at: new Date().toISOString(),
    }).eq("id", analysisId);
    if (error) { toast.error(error.message); return false; }
    toast.success("Analysis approved");
    await fetch();
    return true;
  }

  async function rejectAnalysis(analysisId: string, reason: string) {
    const supabase = createClient();
    const { error } = await supabase.from("analyses").update({
      status: "in_progress", reject_reason: reason,
    }).eq("id", analysisId);
    if (error) { toast.error(error.message); return false; }
    toast.warning("Analysis returned to analyst");
    await fetch();
    return true;
  }

  return { analyses, loading, refetch: fetch, submitResult, approveAnalysis, rejectAnalysis };
}
