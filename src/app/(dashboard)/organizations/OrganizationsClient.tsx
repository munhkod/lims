"use client";
import { useState } from "react";
import { Plus, Building2, Mail, Phone, User, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type Org = {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
};

const EMPTY_FORM = { name: "", contact_name: "", email: "", phone: "", address: "" };

export function OrganizationsClient({ orgs: initial }: { orgs: Org[] }) {
  const [orgs, setOrgs] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Org | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase()) ||
    o.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(org: Org) {
    setEditing(org);
    setForm({
      name: org.name,
      contact_name: org.contact_name ?? "",
      email: org.email ?? "",
      phone: org.phone ?? "",
      address: org.address ?? "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Organization name is required"); return; }
    setSaving(true);
    const supabase = createClient();

    if (editing) {
      const { data, error } = await (supabase as any).from("organizations").update(form).eq("id", editing.id).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      setOrgs(p => p.map(o => o.id === editing.id ? data : o));
      toast.success("Organization updated");
    } else {
      const { data, error } = await (supabase as any).from("organizations").insert(form).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      setOrgs(p => [data, ...p]);
      toast.success("Organization added");
    }

    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditing(null);
    setSaving(false);
  }

  async function handleDelete(org: Org) {
    if (!confirm(`Delete "${org.name}"? This cannot be undone.`)) return;
    const supabase = createClient();
    const { error } = await (supabase as any).from("organizations").delete().eq("id", org.id);
    if (error) { toast.error(error.message); return; }
    setOrgs(p => p.filter(o => o.id !== org.id));
    toast.success("Organization deleted");
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">{orgs.length} registered clients & organizations</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={14} /> Add Organization
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 Search organizations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No organizations yet</p>
          <p className="text-sm mt-1">Click "Add Organization" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(org => (
            <div key={org.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-primary" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(org)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(org)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <p className="font-bold text-foreground text-sm mb-3">{org.name}</p>

              <div className="space-y-1.5 text-xs">
                {org.contact_name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User size={11} className="flex-shrink-0" />
                    <span>{org.contact_name}</span>
                  </div>
                )}
                {org.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail size={11} className="flex-shrink-0" />
                    <span className="truncate">{org.email}</span>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={11} className="flex-shrink-0" />
                    <span>{org.phone}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground/50">Added {formatDate(org.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-foreground">
                {editing ? "Edit Organization" : "Add Organization"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { label: "Organization Name *", key: "name", placeholder: "e.g. MF Food Company", type: "text" },
                { label: "Contact Person", key: "contact_name", placeholder: "e.g. Bat-Erdene", type: "text" },
                { label: "Email", key: "email", placeholder: "contact@company.mn", type: "email" },
                { label: "Phone", key: "phone", placeholder: "+976-9911-1111", type: "tel" },
                { label: "Address", key: "address", placeholder: "Ulaanbaatar, Mongolia", type: "text" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {saving ? "Saving…" : editing ? "Update" : "Add Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}