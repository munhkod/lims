"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/database";
import { hasPermission } from "@/lib/auth/permissions";
import { getInitials, ROLE_LABELS } from "@/lib/utils";
import {
  LayoutDashboard, FlaskConical, Microscope, CheckSquare,
  FileText, FolderOpen, Cpu, Users, Settings, LogOut,
  ChevronLeft, ChevronRight, Building2
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: null, roles: null },
  { href: "/organizations", label: "Organizations", icon: Building2, permission: null, roles: ["admin", "lab_manager"] },
  { href: "/samples", label: "Samples", icon: FlaskConical, permission: "samples:read", roles: null },
  { href: "/analysis", label: "Analysis", icon: Microscope, permission: "analyses:read", roles: null },
  { href: "/results", label: "Review", icon: CheckSquare, permission: "results:approve", roles: null },
  { href: "/reports", label: "Reports", icon: FileText, permission: "results:read", roles: null },
  { href: "/files", label: "Files", icon: FolderOpen, permission: "files:read", roles: null },
  { href: "/equipment", label: "Equipment", icon: Cpu, permission: "equipment:read", roles: null },
  { href: "/users", label: "Users", icon: Users, permission: "users:read", roles: null },
  { href: "/settings", label: "Settings", icon: Settings, permission: null, roles: null },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const visible = NAV_ITEMS.filter(item => {
    if (item.roles) return item.roles.includes(profile.role);
    if (item.permission) return hasPermission(profile.role, item.permission as any);
    return true;
  });

  return (
    <aside className={`${collapsed ? "w-16" : "w-56"} flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200 h-screen sticky top-0`}>
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? "justify-center px-3" : "justify-between px-4"} py-4 border-b border-sidebar-border`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-lg">🔬</div>
            <span className="font-black text-foreground text-base tracking-tight">LIMS</span>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {visible.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group
                ${active ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary" : "text-sidebar-foreground hover:bg-muted/40 hover:text-foreground border-l-2 border-transparent"}`}
              title={collapsed ? item.label : undefined}>
              <Icon size={16} className={active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className={`border-t border-sidebar-border p-3 ${collapsed ? "flex justify-center" : ""}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
              {getInitials(profile.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{profile.name}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[profile.role]}</p>
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="text-muted-foreground hover:text-destructive transition-colors p-1">
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout}
            className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">
            {getInitials(profile.name)}
          </button>
        )}
      </div>
    </aside>
  );
}
