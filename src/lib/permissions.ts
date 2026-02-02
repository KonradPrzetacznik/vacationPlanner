/**
 * Role-based access control configuration
 * This file centralizes all permission rules based on user roles as defined in PRD
 */

export type Role = "ADMINISTRATOR" | "HR" | "EMPLOYEE";

export interface RoutePermission {
  path: string;
  allowedRoles: Role[];
}

/**
 * Route access configuration based on PRD requirements:
 *
 * ADMINISTRATOR:
 * - Can manage users (add, edit, delete, change roles)
 * - Cannot access vacation management and teams
 *
 * HR:
 * - Can manage teams (create, delete, assign users)
 * - Can manage vacation requests (approve, reject)
 * - Can configure system settings (vacation days, team capacity threshold)
 * - Can view all team calendars
 * - Can submit own vacation requests if part of a team
 *
 * EMPLOYEE:
 * - Can submit vacation requests
 * - Can view own vacation requests and status
 * - Can view team calendar (on /requests page, not /calendar)
 * - Can cancel pending or approved vacation requests (with constraints)
 */
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Administrator-only routes
  { path: "/admin/users", allowedRoles: ["ADMINISTRATOR"] },

  // HR-only routes
  { path: "/admin/settings", allowedRoles: ["HR"] },
  { path: "/teams", allowedRoles: ["HR"] },
  { path: "/calendar", allowedRoles: ["HR"] },

  // HR and Employee routes
  { path: "/requests", allowedRoles: ["HR", "EMPLOYEE"] },
  { path: "/requests/new", allowedRoles: ["HR", "EMPLOYEE"] },
];

/**
 * Check if user has access to the given path based on their role
 * @param pathname - The path to check access for
 * @param userRole - The role of the current user
 * @returns true if user has access, false otherwise
 */
export function hasAccessToPath(pathname: string, userRole: Role): boolean {
  // Find matching route configuration
  for (const permission of ROUTE_PERMISSIONS) {
    if (pathname === permission.path || pathname.startsWith(`${permission.path}/`)) {
      return permission.allowedRoles.includes(userRole);
    }
  }

  // If no specific route match, allow access (e.g., homepage, public routes)
  return true;
}

/**
 * Get all routes that a user with given role can access
 * @param userRole - The role of the user
 * @returns Array of paths the user can access
 */
export function getAccessibleRoutes(userRole: Role): string[] {
  return ROUTE_PERMISSIONS.filter((permission) => permission.allowedRoles.includes(userRole)).map(
    (permission) => permission.path
  );
}

/**
 * Navigation item definition with role-based access
 */
export interface NavItem {
  href: string;
  label: string;
  roles: Role[];
}

/**
 * Navigation items configuration based on route permissions
 * This ensures the navigation menu only shows links the user can access
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Strona główna", roles: ["ADMINISTRATOR", "HR", "EMPLOYEE"] },
  { href: "/requests", label: "Moje Wnioski", roles: ["HR", "EMPLOYEE"] },
  { href: "/requests/new", label: "Nowy Wniosek", roles: ["HR", "EMPLOYEE"] },
  { href: "/calendar", label: "Kalendarz", roles: ["HR"] },
  { href: "/teams", label: "Zespoły", roles: ["HR"] },
  { href: "/admin/users", label: "Użytkownicy", roles: ["ADMINISTRATOR"] },
  { href: "/admin/settings", label: "Ustawienia", roles: ["HR"] },
];

/**
 * Get navigation items filtered by user role
 * @param userRole - The role of the current user
 * @returns Array of navigation items the user can see
 */
export function getNavItemsForRole(userRole: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(userRole));
}
