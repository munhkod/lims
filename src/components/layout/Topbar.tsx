"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Notification } from "@/types/database";
import { ROLE_LABELS, getInitials } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/samples": "Sample Management",
  "/analysis": "Analysis Module",
  "/results": "Result Review & Approval",
  "/reports": "Final Reports",
  "/files": "File Archive",
  "/equipment": "Equipment Log",
  "/users": "User Management",
  "/settings": "Settings",
  "/logs": "Audit Logs",
};

export function Topbar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("notifications").select("*").eq("user_id", profile.id).eq("is_read", false).order("created_at", { ascending: false })
      .then(({ data }) => setNotifications(data ?? []));
  }, [profile.id]);

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? "LIMS";

  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-base font-bold text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifs(v => !v)}
            className="relative p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={16} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Notifications</p>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No new notifications</p>
              ) : (
                notifications.slice(0, 5).map(n => (
                  <div key={n.id} className="px-4 py-3 border-b border-border/50 hover:bg-muted/30">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-muted/40">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">
            {getInitials(profile.name)}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-foreground leading-none">{profile.name.split(" ")[0]}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{ROLE_LABELS[profile.role]}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
