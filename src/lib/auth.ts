const AUTH_ACCESS_KEY = 'auth_access_token'
const AUTH_REFRESH_KEY = 'auth_refresh_token'

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return localStorage
}

export function getAccessToken(): string | null {
  return getStorage()?.getItem(AUTH_ACCESS_KEY) ?? null
}

export function getRefreshToken(): string | null {
  return getStorage()?.getItem(AUTH_REFRESH_KEY) ?? null
}

/** @deprecated Use getAccessToken. Kept for backward compatibility. */
export function getToken(): string | null {
  return getAccessToken()
}

export function setTokens(accessToken: string, refreshToken: string): void {
  const storage = getStorage()
  if (!storage) return
  storage.setItem(AUTH_ACCESS_KEY, accessToken)
  storage.setItem(AUTH_REFRESH_KEY, refreshToken)
}

export function clearTokens(): void {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(AUTH_ACCESS_KEY)
  storage.removeItem(AUTH_REFRESH_KEY)
}

/** @deprecated Use clearTokens. Kept for backward compatibility. */
export function clearToken(): void {
  clearTokens()
}

export async function logout(): Promise<void> {
  clearTokens()
}
