import type { UserRole } from "@/types/database";

type Permission =
  | "samples:create" | "samples:read" | "samples:update" | "samples:delete"
  | "analyses:create" | "analyses:read" | "analyses:submit"
  | "results:approve" | "results:reject" | "results:read"
  | "users:create" | "users:read" | "users:update" | "users:delete"
  | "files:upload" | "files:read" | "files:delete"
  | "equipment:read" | "equipment:update"
  | "reports:export" | "logs:read" | "settings:update";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "samples:create","samples:read","samples:update","samples:delete",
    "analyses:create","analyses:read","analyses:submit",
    "results:approve","results:reject","results:read",
    "users:create","users:read","users:update","users:delete",
    "files:upload","files:read","files:delete",
    "equipment:read","equipment:update",
    "reports:export","logs:read","settings:update",
  ],
  lab_manager: [
    "samples:create","samples:read","samples:update",
    "analyses:create","analyses:read","analyses:submit",
    "results:approve","results:reject","results:read",
    "users:read","users:update",
    "files:upload","files:read","files:delete",
    "equipment:read","equipment:update",
    "reports:export","logs:read","settings:update",
  ],
  analyst: [
    "samples:create","samples:read",
    "analyses:create","analyses:read","analyses:submit",
    "results:read",
    "files:upload","files:read",
    "equipment:read",
    "reports:export",
  ],
  client: [
    "samples:read",
    "results:read",
    "files:read",
    "reports:export",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessPage(role: UserRole, page: string): boolean {
  const pagePermissions: Record<string, Permission> = {
    "/dashboard": "samples:read",
    "/samples": "samples:read",
    "/analysis": "analyses:read",
    "/results": "results:approve",
    "/reports": "results:read",
    "/files": "files:read",
    "/users": "users:read",
    "/equipment": "equipment:read",
    "/settings": "settings:update",
    "/logs": "logs:read",
  };
  const required = pagePermissions[page];
  return required ? hasPermission(role, required) : true;
}
