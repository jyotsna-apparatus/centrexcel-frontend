import type { LucideIcon } from "lucide-react";
import {
  Award,
  ClipboardCheck,
  CreditCard,
  FileUp,
  Gavel,
  LayoutDashboard,
  Settings,
  Trophy,
  UserCheck,
  UserCircle,
  UsersRound,
} from "lucide-react";
import type { Role } from "@/types/roles";
import { isRole, ROLES } from "@/types/roles";

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
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN, ROLES.SPONSOR, ROLES.PARTICIPANT, ROLES.JUDGE],
  },
  {
    label: "Challenges",
    href: "/hackathons",
    icon: Trophy,
    roles: [ROLES.ADMIN, ROLES.SPONSOR, ROLES.PARTICIPANT, ROLES.JUDGE],
  },
  {
    label: "Approvals",
    href: "/hackathons/approvals",
    icon: ClipboardCheck,
    roles: [ROLES.ADMIN],
  },
  {
    label: "My participations",
    href: "/participations",
    icon: UserCheck,
    roles: [ROLES.PARTICIPANT],
  },
  {
    label: "Score submissions",
    href: "/judge/hackathons",
    icon: Gavel,
    roles: [ROLES.JUDGE],
  },
  {
    label: "Submissions",
    href: "/submissions",
    icon: FileUp,
    roles: [ROLES.PARTICIPANT],
  },
  {
    label: "Winnings",
    href: "/winners",
    icon: Award,
    roles: [ROLES.PARTICIPANT],
  },
  {
    label: "Transactions",
    href: "/payments",
    icon: CreditCard,
    roles: [ROLES.ADMIN],
  },
  {
    label: "Users",
    icon: UsersRound,
    roles: [ROLES.ADMIN],
    children: [
      { label: "Participants", href: "/users/participants" },
      { label: "Judges", href: "/users/judges" },
      { label: "Sponsors", href: "/users/sponsors" },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: [ROLES.ADMIN, ROLES.SPONSOR, ROLES.PARTICIPANT, ROLES.JUDGE],
  },
];

/** Shown while logged in but profile onboarding is incomplete (all other routes redirect to /onboarding). */
export const ONBOARDING_ONLY_NAV: SidebarNavItem[] = [
  {
    label: "Complete profile",
    href: "/onboarding",
    icon: UserCircle,
    roles: [ROLES.ADMIN, ROLES.SPONSOR, ROLES.PARTICIPANT, ROLES.JUDGE],
  },
];

/**
 * Filter sidebar items by user role. Use in sidebar and optionally in middleware.
 * Accepts API role string; invalid roles get no items.
 */
const PARTICIPANT_NAV_ORDER: string[] = [
  "Challenges",
  "My participations",
  "Submissions",
  "Winnings",
  "Dashboard",
  "Settings",
];

function sortSidebarForParticipant(
  items: SidebarNavItem[],
): SidebarNavItem[] {
  const index = (label: string) => {
    const i = PARTICIPANT_NAV_ORDER.indexOf(label);
    return i === -1 ? PARTICIPANT_NAV_ORDER.length + 1 : i;
  };
  return [...items].sort((a, b) => index(a.label) - index(b.label));
}

export function getSidebarItemsForRole(
  role: Role | string | null | undefined,
): SidebarNavItem[] {
  if (!role || !isRole(role)) return [];
  const items = SIDEBAR_NAV_CONFIG.filter((item) => item.roles.includes(role));
  if (role === ROLES.PARTICIPANT) {
    return sortSidebarForParticipant(items);
  }
  return items;
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
      const basePath = item.children[0].href.replace(/\/[^/]+$/, "");
      map.set(basePath, item.roles);
    }
    for (const child of item.children ?? []) {
      map.set(child.href, item.roles);
    }
  }
  // Entry-fee checkout (e.g. from /hackathons/[id]/apply); list page is admin-only above.
  map.set("/payments/checkout", [ROLES.ADMIN, ROLES.PARTICIPANT]);
  return map;
}

/** Check if a role can access a path (exact or prefix). For middleware / route protection. */
export function canAccessPath(
  pathname: string,
  role: Role | string | null | undefined,
): boolean {
  if (!role || !isRole(role)) return false;
  const map = getRouteRolesMap();
  if (map.has(pathname)) return map.get(pathname)?.includes(role) ?? false;
  for (const [path, roles] of map) {
    if (pathname === path || pathname.startsWith(`${path}/`))
      return roles.includes(role);
  }
  return false;
}
