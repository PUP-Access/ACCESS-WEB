import type { Database } from "@/lib/supabase/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];

/** Roles that get some amount of access to /admin/*. Every other role (Organization, Pending) gets none. */
export const ADMIN_ROLES = ["Admin", "Tech", "SponsorsPartners", "Govs"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** One entry per distinct permission boundary inside the admin dashboard. */
export const ADMIN_AREAS = [
  "dashboard",
  "landing",
  "about",
  "about-images",
  "sponsors-partners",
  "officers",
  "officers-section",
  "faqs",
  "events",
  "borrow-requests",
  "inventory",
  "contact-messages",
  "users",
  "audit-logs",
] as const;
export type AdminArea = (typeof ADMIN_AREAS)[number];

/** "all" means every area; otherwise the explicit list of areas that role may access. */
const ROLE_AREAS: Record<AdminRole, "all" | AdminArea[]> = {
  Admin: "all",
  Tech: ["borrow-requests", "inventory", "contact-messages"],
  SponsorsPartners: ["sponsors-partners", "contact-messages"],
  Govs: [
    "landing",
    "about",
    "about-images",
    "officers",
    "officers-section",
    "faqs",
    "events",
    "contact-messages",
  ],
};

/** Longest/most-specific prefixes should be listed first only where one path is a literal prefix of another (none currently are, since matching requires an exact segment boundary). */
const AREA_BY_PATH_PREFIX: [string, AdminArea][] = [
  ["/admin/content/landing", "landing"],
  ["/admin/content/about-images", "about-images"],
  ["/admin/content/about", "about"],
  ["/admin/content/sponsors-partners", "sponsors-partners"],
  ["/admin/content/officers-template", "officers-section"],
  ["/admin/content/officers-roster", "officers"],
  ["/admin/content/faqs", "faqs"],
  ["/admin/officers", "officers"],
  ["/admin/events", "events"],
  ["/admin/borrow-requests", "borrow-requests"],
  ["/admin/inventory", "inventory"],
  ["/admin/contact-messages", "contact-messages"],
  ["/admin/users", "users"],
  ["/admin/audit-logs", "audit-logs"],
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Resolves an /admin/* pathname to the area that gates it. Returns null for unrecognized admin paths (denied to everyone but Admin, by default). */
export function getAdminAreaForPath(pathname: string): AdminArea | null {
  if (pathname === "/admin") return "dashboard";
  for (const [prefix, area] of AREA_BY_PATH_PREFIX) {
    if (matchesPrefix(pathname, prefix)) return area;
  }
  return null;
}

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role ?? "");
}

/** Whether a role can access a given admin area. `area: null` (unrecognized path) is Admin-only. */
export function canAccessArea(role: string | null | undefined, area: AdminArea | null): boolean {
  if (!isAdminRole(role)) return false;
  const areas = ROLE_AREAS[role];
  if (areas === "all") return true;
  if (area === null) return false;
  return areas.includes(area);
}

export function canAccessAdmin(role: string | null | undefined): boolean {
  return isAdminRole(role);
}

/** All roles allowed to access a given area — the value to pass straight into checkRole({ roles }). */
export function rolesForArea(area: AdminArea): AdminRole[] {
  return ADMIN_ROLES.filter((role) => canAccessArea(role, area));
}

/** Where to send a role after login / when it hits a page outside its allowed areas. */
export function getDefaultAdminPath(role: string | null | undefined): string {
  switch (role) {
    case "Admin":
      return "/admin";
    case "Tech":
      return "/admin/borrow-requests";
    case "SponsorsPartners":
      return "/admin/content/sponsors-partners";
    case "Govs":
      return "/admin/content/landing";
    default:
      return "/404";
  }
}
