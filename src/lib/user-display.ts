import type { UserListItem } from "@/lib/auth-api";

/**
 * First line in admin user tables: **username**, else **name**, else **email local-part**
 * (never the full email here — email is shown once on the line below).
 */
export function userTablePrimaryLine(
  u: Pick<UserListItem, "name" | "username" | "email">,
): string {
  const un = u.username?.trim();
  if (un) return un;
  const n = u.name?.trim();
  if (n) return n;
  const local = u.email.split("@")[0]?.trim();
  if (local) return local;
  return u.email;
}

/** Same as userTablePrimaryLine (kept for call sites that expect a “display name”). */
export function userListDisplayName(
  u: Pick<UserListItem, "name" | "username" | "email">,
): string {
  return userTablePrimaryLine(u);
}

export function userListInitials(
  u: Pick<UserListItem, "name" | "username" | "email">,
): string {
  const base = userTablePrimaryLine(u);
  const parts = base.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]?.[0] + parts[parts.length - 1]?.[0])
      .toUpperCase()
      .slice(0, 2);
  }
  return base.slice(0, 2).toUpperCase() || "?";
}
