"use client";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { Profile } from "@/types/database";

export function DashboardLayout({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar profile={profile} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}