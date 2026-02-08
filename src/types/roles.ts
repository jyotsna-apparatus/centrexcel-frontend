/**
 * Role type – single source of truth, aligned with backend (utils/constants.ts).
 * Use for sidebar visibility, route protection, and middleware.
 */
export const ROLES = {
  ADMIN: 'admin',
  SPONSOR: 'sponsor',
  PARTICIPANT: 'participant',
  JUDGE: 'judge',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.SPONSOR,
  ROLES.PARTICIPANT,
  ROLES.JUDGE,
];

/** Check if a string is a valid Role (for use with API/user payloads). */
export function isRole(value: string): value is Role {
  return ALL_ROLES.includes(value as Role);
}
