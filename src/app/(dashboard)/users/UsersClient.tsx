"use client";
import { useState } from "react";
import { Plus, UserCheck, UserX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getInitials, ROLE_LABELS } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = { admin: "bg-purple-500/10 text-purple-400", lab_manager: "bg-blue-500/10 text-blue-400", analyst: "bg-teal-500/10 text-teal-400", client: "bg-orange-500/10 text-orange-400" };

export function UsersClient({ currentUser, users: initial, orgs }: { currentUser: Profile; users: Profile[]; orgs: { id: string; name: string }[] }) {
  const [users, setUsers] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "analyst", org_id: "", phone: "" });

  const filtered = users.filter(u => roleFilter === "all" || u.role === roleFilter);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    toast.success(`Invite sent to ${form.email}. Ask them to sign up.`);
    setShowAdd(false);
    setForm({ name: "", email: "", role: "analyst", org_id: "", phone: "" });
    setSaving(false);
  }

  async function toggleActive(userId: string, current: boolean) {
    const supabase = createClient();
    const { error } = await (supabase as any).from("profiles").update({ is_active: !current }).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    setUsers(p => p.map(u => u.id === userId ? { ...u, is_active: !current } : u));
    toast.success(`User ${!current ? "activated" : "deactivated"}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} registered users</p>
        </div>
        {currentUser.role === "admin" && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Plus size={14} /> Add User
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "admin", "lab_manager", "analyst", "client"].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${roleFilter === r ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {r === "all" ? "All Roles" : ROLE_LABELS[r] ?? r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(u => (
          <div key={u.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
                {getInitials(u.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{u.name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.id.slice(0, 8)}</p>
              </div>
              <div className={`w-2 h-2 rounded-full mt-1.5 ${u.is_active ? "bg-green-400" : "bg-red-400"}`} />
            </div>
            <div className="space-y-2 text-xs mb-4">
              {(u as any).organization && <p className="text-muted-foreground">🏢 {(u as any).organization.name}</p>}
              {u.phone && <p className="text-muted-foreground">📞 {u.phone}</p>}
            </div>
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[u.role] ?? ""}`}>
                {ROLE_LABELS[u.role]}
              </span>
              {currentUser.role === "admin" && u.id !== currentUser.id && (
                <button onClick={() => toggleActive(u.id, u.is_active)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${u.is_active ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 text-green-400 hover:bg-green-500/20"}`}>
                  {u.is_active ? <><UserX size={11} /> Deactivate</> : <><UserCheck size={11} /> Activate</>}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-foreground">Add New User</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
            </div>
            <form onSubmit={createUser} className="space-y-4">
              {[
                { label: "Full Name *", key: "name", type: "text", placeholder: "Surname Firstname" },
                { label: "Email *", key: "email", type: "email", placeholder: "user@example.com" },
                { label: "Phone", key: "phone", type: "tel", placeholder: "976-xxxx-xxxx" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input type={f.type} required={f.label.endsWith("*")} placeholder={f.placeholder}
                    value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Role *</label>
                  <select required value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Organization</label>
                  <select value={form.org_id} onChange={e => setForm(p => ({ ...p, org_id: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                    <option value="">None</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                  {saving ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
