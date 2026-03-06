"use client";
import { useState } from "react";
import { Plus, Wrench, CheckCircle, XCircle, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Profile, Equipment } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function EquipmentClient({ profile, equipment: initial }: { profile: Profile; equipment: Equipment[] }) {
  const [equipment, setEquipment] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", equipment_type: "", manufacturer: "", model: "", serial_number: "" });
  const [saving, setSaving] = useState(false);

  const canManage = ["admin", "lab_manager"].includes(profile.role);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await (supabase as any).from("equipment").insert({ ...form, status: "active" }).select().single();
    if (error) toast.error(error.message);
    else { setEquipment(p => [data, ...p]); toast.success("Equipment added"); setShowAdd(false); setForm({ name: "", code: "", equipment_type: "", manufacturer: "", model: "", serial_number: "" }); }
    setSaving(false);
  }

  async function updateStatus(id: string, status: Equipment["status"]) {
    const supabase = createClient();
    await (supabase as any).from("equipment").update({ status }).eq("id", id);
    setEquipment(p => p.map(e => e.id === id ? { ...e, status } : e));
    toast.success(`Equipment status updated to ${status}`);
  }

  const statusCounts = {
    active: equipment.filter(e => e.status === "active").length,
    maintenance: equipment.filter(e => e.status === "maintenance").length,
    retired: equipment.filter(e => e.status === "retired").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-foreground">Equipment Log</h1>
          <p className="text-sm text-muted-foreground mt-1">{equipment.length} instruments registered</p>
        </div>
        {canManage && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Plus size={14} /> Add Equipment
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Active", count: statusCounts.active, icon: CheckCircle, color: "text-green-400" },
          { label: "Maintenance", count: statusCounts.maintenance, icon: Wrench, color: "text-yellow-400" },
          { label: "Retired", count: statusCounts.retired, icon: XCircle, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-5 py-3 flex items-center gap-3">
            <s.icon size={16} className={s.color} />
            <span className={`text-xl font-black font-mono ${s.color}`}>{s.count}</span>
            <span className="text-sm text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map(eq => (
          <div key={eq.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl flex-shrink-0">⚗️</div>
              <StatusBadge status={eq.status} />
            </div>
            <p className="font-semibold text-foreground text-sm mb-1">{eq.name}</p>
            <p className="text-xs text-muted-foreground font-mono mb-3">{eq.code} · {eq.equipment_type}</p>
            <div className="space-y-1 text-xs mb-4">
              {eq.manufacturer && <p className="text-muted-foreground">🏭 {eq.manufacturer} {eq.model}</p>}
              {eq.serial_number && <p className="text-muted-foreground font-mono">S/N: {eq.serial_number}</p>}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar size={11} />
                <span>Last calibrated: {formatDate(eq.last_calibrated)}</span>
              </div>
              {eq.next_calibration && (
                <div className={`flex items-center gap-1.5 ${new Date(eq.next_calibration) < new Date() ? "text-red-400" : "text-muted-foreground"}`}>
                  <Calendar size={11} />
                  <span>Next: {formatDate(eq.next_calibration)}</span>
                </div>
              )}
            </div>
            {canManage && (
              <div className="flex gap-2 pt-3 border-t border-border/50">
                {eq.status !== "active" && (
                  <button onClick={() => updateStatus(eq.id, "active")}
                    className="flex-1 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-colors">Active</button>
                )}
                {eq.status !== "maintenance" && (
                  <button onClick={() => updateStatus(eq.id, "maintenance")}
                    className="flex-1 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/20 transition-colors">Maintenance</button>
                )}
                {eq.status !== "retired" && (
                  <button onClick={() => updateStatus(eq.id, "retired")}
                    className="flex-1 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors">Retire</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-foreground">Add Equipment</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              {[
                { label: "Equipment Name *", key: "name", placeholder: "e.g. SYSMEX CHEMIX-180" },
                { label: "Equipment Code *", key: "code", placeholder: "e.g. EQ-005" },
                { label: "Type *", key: "equipment_type", placeholder: "e.g. Chemistry Analyzer" },
                { label: "Manufacturer", key: "manufacturer", placeholder: "e.g. Sysmex" },
                { label: "Model", key: "model", placeholder: "Model number" },
                { label: "Serial Number", key: "serial_number", placeholder: "S/N" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input required={f.label.endsWith("*")} placeholder={f.placeholder}
                    value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50">
                  {saving ? "Adding…" : "Add Equipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
