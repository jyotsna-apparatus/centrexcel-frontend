import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Trophy,
  FileUp,
  Award,
  Gavel,
  Building2,
  UsersRound,
  Settings,
} from 'lucide-react';
import type { Role } from '@/types/roles';
import { ROLES, isRole } from '@/types/roles';

export type SidebarNavChild = {
  label: string;
  href: string;
};

export type SidebarNavItem = {
  label: string;
  /** Optional when children is set (dropdown has no direct link). */
  href?: string;
  icon: LucideIcon;
  /** Roles that can see this item. Empty = no one (don't use). */
  roles: Role[];
  /** When set, item is a dropdown; child pages use same roles as parent. */
  children?: SidebarNavChild[];
};

/**
 * Central sidebar navigation config. Same structure can be reused for
 * route protection / middleware (e.g. map href → required roles).
 */
export const SIDEBAR_NAV_CONFIG: SidebarNavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN, ROLES.SPONSOR, ROLES.PARTICIPANT, ROLES.JUDGE],
  },
  {
    label: 'Hackathons',
    href: '/hackathons',
    icon: Trophy,
    roles: [ROLES.ADMIN, ROLES.SPONSOR, ROLES.PARTICIPANT, ROLES.JUDGE],
  },
  {
    label: 'Submissions',
    href: '/submissions',
    icon: FileUp,
    roles: [ROLES.ADMIN, ROLES.SPONSOR, ROLES.PARTICIPANT, ROLES.JUDGE],
  },
  {
    label: 'Winners',
    href: '/winners',
    icon: Award,
    roles: [ROLES.ADMIN, ROLES.SPONSOR, ROLES.PARTICIPANT, ROLES.JUDGE],
  },
 
  {
    label: 'Users',
    icon: UsersRound,
    roles: [ROLES.ADMIN],
    children: [
      { label: 'Participants', href: '/users/participants' },
      { label: 'Judges', href: '/users/judges' },
      { label: 'Sponsors', href: '/users/sponsors' },
      { label: 'Teams', href: '/users/teams' },
    ],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: [ROLES.ADMIN, ROLES.SPONSOR, ROLES.PARTICIPANT, ROLES.JUDGE],
  },
];

/**
 * Filter sidebar items by user role. Use in sidebar and optionally in middleware.
 * Accepts API role string; invalid roles get no items.
 */
export function getSidebarItemsForRole(role: Role | string | null | undefined): SidebarNavItem[] {
  if (!role || !isRole(role)) return [];
  return SIDEBAR_NAV_CONFIG.filter((item) => item.roles.includes(role));
}

/**
 * Map of path (href) → roles allowed. Reuse for route protection / middleware.
 * e.g. middleware can check pathname and allow only if user.role is in routeRoles[path].
 */
export function getRouteRolesMap(): Map<string, Role[]> {
  const map = new Map<string, Role[]>();
  for (const item of SIDEBAR_NAV_CONFIG) {
    if (item.href) map.set(item.href, item.roles);
    if (item.children?.length) {
      const basePath = item.children[0].href.replace(/\/[^/]+$/, '');
      map.set(basePath, item.roles);
    }
    for (const child of item.children ?? []) {
      map.set(child.href, item.roles);
    }
  }
  return map;
}

/** Check if a role can access a path (exact or prefix). For middleware / route protection. */
export function canAccessPath(pathname: string, role: Role | string | null | undefined): boolean {
  if (!role || !isRole(role)) return false;
  const map = getRouteRolesMap();
  if (map.has(pathname)) return map.get(pathname)!.includes(role);
  for (const [path, roles] of map) {
    if (pathname === path || pathname.startsWith(path + '/')) return roles.includes(role);
  }
  return false;
}
