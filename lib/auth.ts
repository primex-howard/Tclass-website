export type UserRole = "student" | "faculty" | "admin";

export const AUTH_COOKIE_TOKEN = "tclass_token";
export const AUTH_COOKIE_ROLE = "tclass_role";

const ROLE_HOME: Record<UserRole, string> = {
  student: "/student",
  faculty: "/faculty",
  admin: "/admin",
};

export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  const value = role.toLowerCase().trim();
  if (value === "student" || value === "faculty" || value === "admin") {
    return value;
  }
  return null;
}

export function getRoleHome(role: UserRole): string {
  return ROLE_HOME[role];
}

export function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith("/student") || pathname.startsWith("/faculty") || pathname.startsWith("/admin");
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith("/student")) return role === "student";
  if (pathname.startsWith("/faculty")) return role === "faculty";
  if (pathname.startsWith("/admin")) return role === "admin";
  return true;
}
