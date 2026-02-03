import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/auth'

const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not configured')
  return url
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) return false
  const accessToken =
    (result as { accessToken?: string }).accessToken ??
    (result as { access_token?: string }).access_token
  const newRefresh =
    (result as { refreshToken?: string }).refreshToken ??
    (result as { refresh_token?: string }).refresh_token
  if (typeof accessToken === 'string' && typeof newRefresh === 'string') {
    setTokens(accessToken, newRefresh)
    return true
  }
  return false
}

function redirectToLogin(): void {
  clearTokens()
  if (typeof window !== 'undefined') window.location.href = '/auth/login'
}

async function isTokenExpiredResponse(response: Response): Promise<boolean> {
  if (response.status !== 401) return false
  const result = await response.clone().json().catch(() => ({}))
  const msg = String((result as { message?: string }).message ?? '').toLowerCase()
  return msg.includes('expired') || msg.includes('token')
}

export type AuthFetchOptions = RequestInit & { skipAuth?: boolean }

/**
 * Fetch with Authorization: Bearer &lt;accessToken&gt;. On 401 (token expired),
 * calls refresh-token, retries once, or clears tokens and redirects to /auth/login.
 * Use for all authenticated API requests.
 */
export async function authFetch(
  input: RequestInfo | URL,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const { skipAuth, ...init } = options
  const token = getAccessToken()
  const headers = new Headers(init.headers)
  if (!skipAuth && token) headers.set('Authorization', `Bearer ${token}`)

  let response = await fetch(input, { ...init, headers })

  if (response.status === 401 && (await isTokenExpiredResponse(response))) {
    const refreshed = await doRefresh()
    if (refreshed) {
      const newToken = getAccessToken()
      if (newToken) headers.set('Authorization', `Bearer ${newToken}`)
      response = await fetch(input, { ...init, headers })
    }
    if (response.status === 401) {
      redirectToLogin()
      return response
    }
  }

  return response
}
