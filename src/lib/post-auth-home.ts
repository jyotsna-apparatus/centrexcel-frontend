import type { LoginUser } from "@/lib/auth-api";

type PostAuthUserLike = Pick<LoginUser, "role" | "isOnboarded">;

/**
 * Where to send the user after sign-in, verify-email, or completing onboarding.
 */
export function getPostAuthHomePath(user: PostAuthUserLike): string {
  if (user.isOnboarded !== true) {
    return "/onboarding";
  }
  if (user.role === "participant" || user.role === "sponsor") {
    return "/hackathons";
  }
  return "/dashboard";
}

type JwtPayloadShape = { role?: string };

/**
 * Best-effort decode of JWT payload (no signature verification). Used only for
 * redirect when a token already exists on auth pages.
 */
export function getRoleFromAccessToken(accessToken: string): string | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = JSON.parse(atob(padded)) as JwtPayloadShape;
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

export function getPostAuthHomePathFromToken(accessToken: string): string {
  const role = getRoleFromAccessToken(accessToken);
  if (role === "participant" || role === "sponsor") {
    return "/hackathons";
  }
  return "/dashboard";
}
