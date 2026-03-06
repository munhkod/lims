"use client";
import { useState } from "react";
import { Save, Bell, Lock, Globe, Printer, Database } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { toast } from "sonner";

export function SettingsClient({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [saving, setSaving] = useState(false);

  const [notifs, setNotifs] = useState({
    email_result_ready: true,
    email_sample_assigned: true,
    email_rejected: true,
    sms_result_ready: false,
    auto_pdf: true,
    bilingual_reports: true,
    deadline_alerts: true,
    two_factor: false,
  });

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await (supabase as any).from("profiles").update({ name, phone })
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-black text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and system preferences</p>
      </div>

      {/* Profile */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Lock size={14} className="text-primary" /> Profile Information</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="976-xxxx-xxxx"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Role</label>
              <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground">{ROLE_LABELS[profile.role]}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Organization</label>
              <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground">{(profile as any).organization?.name ?? "—"}</div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              <Save size={13} /> {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Bell size={14} className="text-primary" /> Notifications</h2>
        <div className="space-y-3">
          {[
            { key: "email_result_ready", label: "Email when result is approved", desc: "Send email notification to client" },
            { key: "email_sample_assigned", label: "Email when sample assigned", desc: "Notify analyst of new assignment" },
            { key: "email_rejected", label: "Email when analysis rejected", desc: "Notify analyst of return" },
            { key: "sms_result_ready", label: "SMS notifications", desc: "Send SMS for urgent updates" },
            { key: "auto_pdf", label: "Auto-generate PDF on approval", desc: "Automatically create certificate" },
            { key: "bilingual_reports", label: "Bilingual reports (MN/EN)", desc: "Generate reports in both languages" },
            { key: "deadline_alerts", label: "Deadline alerts", desc: "Alert when analysis is overdue" },
            { key: "two_factor", label: "Two-factor authentication", desc: "Additional login security" },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
              <button onClick={() => setNotifs(p => ({ ...p, [s.key]: !p[s.key as keyof typeof p] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifs[s.key as keyof typeof notifs] ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${notifs[s.key as keyof typeof notifs] ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Database size={14} className="text-primary" /> System Information</h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["Version", "LIMS v2.4.1"], ["Standard", "ISO 17025"],
            ["Database", "Supabase PostgreSQL"], ["Storage", "Supabase Storage"],
            ["Authentication", "Supabase Auth"], ["Email", "Resend"],
            ["Framework", "Next.js 14"], ["Deployment", "Vercel"],
            ["Company", "Digital Medic LLC"], ["Location", "Ulaanbaatar, Mongolia"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">{k}</span>
              <span className="text-foreground font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
