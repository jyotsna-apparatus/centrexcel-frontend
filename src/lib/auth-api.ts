import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/lib/auth'

/** Use same-origin /api in the browser (proxied via next.config rewrites) to avoid CORS. */
const getBaseUrl = () =>
  typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(/\/$/, '') ?? '')

export type LoginCredentials = {
  email: string
  password: string
}

export type LoginUser = {
  id: string
  email: string
  username?: string | null
  role: string
  emailVerified?: boolean
}

/** Normalized shape: tokens and user for use after login/verify-email */
export type LoginResponse = {
  success: boolean
  message?: string
  data: {
    accessToken: string
    refreshToken: string
    user: LoginUser
  }
}

async function authFetch(url: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Load failed')) {
      throw new Error(
        'Cannot reach the server. Check that the backend is running and that you are using the same origin (dev proxy).'
      )
    }
    throw err
  }
}

/** Authenticated fetch: adds Bearer token, on 401 tries refresh once and retries. Use for /auth/me, /auth/change-password, etc. */
async function authenticatedFetch(
  url: string,
  options: RequestInit & { skipRetry?: boolean } = {}
): Promise<Response> {
  const { skipRetry, ...fetchOptions } = options
  const token = getAccessToken()
  if (!token) throw new Error('Not authenticated')
  let res = await authFetch(url, {
    ...fetchOptions,
    headers: { ...(fetchOptions.headers as Record<string, string>), Authorization: `Bearer ${token}` },
  })
  if (res.status === 401 && !skipRetry) {
    const refreshTokenValue = getRefreshToken()
    if (refreshTokenValue) {
      try {
        const refreshed = await refresh(refreshTokenValue)
        setTokens(refreshed.data.accessToken, refreshed.data.refreshToken)
        res = await authFetch(url, {
          ...fetchOptions,
          headers: {
            ...(fetchOptions.headers as Record<string, string>),
            Authorization: `Bearer ${refreshed.data.accessToken}`,
          },
        })
      } catch {
        clearTokens()
        throw new Error('Session expired. Please log in again.')
      }
    } else {
      clearTokens()
      throw new Error('Session expired. Please log in again.')
    }
  }
  return res
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  }
  const res = await authFetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })
  const json = (await res.json()) as
    | (LoginResponse & { message?: string; error?: string })
    | ({ accessToken?: string; refreshToken?: string; user?: LoginUser; error?: string; message?: string })
  if (!res.ok) {
    const message =
      typeof (json as { message?: string })?.message === 'string'
        ? (json as { message: string }).message
        : typeof (json as { error?: string })?.error === 'string'
          ? (json as { error: string }).error
          : 'Login failed'
    throw new Error(message)
  }
  const accessToken = (json as LoginResponse).data?.accessToken ?? (json as { accessToken?: string }).accessToken
  const refreshToken = (json as LoginResponse).data?.refreshToken ?? (json as { refreshToken?: string }).refreshToken
  const user = (json as LoginResponse).data?.user ?? (json as { user?: LoginUser }).user
  if (!accessToken || !user) {
    throw new Error((json as { message?: string }).message ?? 'Invalid login response')
  }
  return {
    success: true,
    data: {
      accessToken,
      refreshToken: refreshToken ?? '',
      user: { ...user, id: (user as LoginUser & { id?: string }).id ?? (user as { userId?: string }).userId ?? '' },
    },
  }
}

export type RefreshResponse = {
  success: boolean
  message: string
  data: {
    accessToken: string
    refreshToken: string
    user?: LoginUser
  }
}

export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  }
  const res = await authFetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })
  const json = (await res.json()) as RefreshResponse & { message?: string; error?: string }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string'
        ? json.message
        : typeof (json as { error?: string })?.error === 'string'
          ? (json as { error: string }).error
          : 'Session expired. Please log in again.'
    throw new Error(message)
  }
  if (!json?.success || !json?.data?.accessToken) {
    throw new Error(json?.message ?? 'Invalid refresh response')
  }
  return json
}

export type MeResponse = {
  success: boolean
  message?: string
  data: {
    user: LoginUser
  }
}

export async function getMe(accessToken?: string | null): Promise<MeResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  }
  const token = accessToken ?? getAccessToken()
  if (!token) {
    throw new Error('Not authenticated')
  }
  const res =
    accessToken != null
      ? await authFetch(`${baseUrl}/auth/me`, {
          method: 'GET',
          headers: { accept: '*/*', Authorization: `Bearer ${token}` },
        })
      : await authenticatedFetch(`${baseUrl}/auth/me`, { method: 'GET', headers: { accept: '*/*' } })
  const json = (await res.json()) as MeResponse & { message?: string; error?: string; user?: { userId?: string; id?: string; email: string; role: string } }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string'
        ? json.message
        : typeof (json as { error?: string })?.error === 'string'
          ? (json as { error: string }).error
          : 'Failed to load user'
    throw new Error(message)
  }
  const rawUser = json?.data?.user ?? json?.user
  if (!rawUser) {
    throw new Error((json as { message?: string }).message ?? 'Invalid response')
  }
  const user = {
    ...rawUser,
    id: (rawUser as { userId?: string }).userId ?? (rawUser as { id?: string }).id ?? '',
  }
  return { success: true, data: { user } }
}

export type RegisterCredentials = {
  email: string
  password: string
  role: 'sponsor' | 'judge' | 'participant'
  username?: string
  phone?: string
}

export type CheckUsernameResponse = {
  success: boolean
  data?: { available: boolean }
}

export async function checkUsername(username: string): Promise<CheckUsernameResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  }
  const trimmed = username.trim()
  if (trimmed.length < 3) {
    return { success: true, data: { available: false } }
  }
  const res = await authFetch(`${baseUrl}/auth/check-username/${encodeURIComponent(trimmed)}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as CheckUsernameResponse & { message?: string; data?: { available?: boolean } }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Username check failed')
  }
  return {
    success: true,
    data: { available: json?.data?.available ?? false },
  }
}

/** Normalized shape after register (backend may return { message, userId, email } or wrapped) */
export type RegisterResponse = {
  success: boolean
  message?: string
  data: {
    id: string
    email: string
    role?: string
    message?: string
  }
}

export async function register(credentials: RegisterCredentials): Promise<RegisterResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  }
  const res = await authFetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      role: credentials.role,
      ...(credentials.username != null && credentials.username.trim() !== ''
        ? { username: credentials.username.trim() }
        : {}),
      ...(credentials.phone != null && credentials.phone.trim() !== ''
        ? { phone: credentials.phone.trim() }
        : {}),
    }),
  })
  const json = (await res.json()) as RegisterResponse & { message?: string; error?: string; userId?: string }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string' ? json.message : typeof (json as { error?: string })?.error === 'string' ? (json as { error: string }).error : 'Registration failed'
    throw new Error(message)
  }
  const id = json?.data?.id ?? (json as { userId?: string }).userId ?? ''
  const email = json?.data?.email ?? (json as { email?: string }).email ?? credentials.email
  const msg = json?.data?.message ?? json?.message ?? 'User registered. Please verify your email.'
  return { success: true, message: msg, data: { id, email, message: msg } }
}

export type VerifyEmailCredentials = {
  email: string
  otp: string
}

export type VerifyEmailResponse = {
  success: boolean
  message: string
  data?: {
    accessToken?: string
    refreshToken?: string
    user?: LoginUser
  }
}

export async function verifyEmail(credentials: VerifyEmailCredentials): Promise<VerifyEmailResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  }
  const res = await authFetch(`${baseUrl}/auth/verify-email`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email,
      otp: credentials.otp,
    }),
  })
  const json = (await res.json()) as VerifyEmailResponse & { message?: string; error?: string }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string'
        ? json.message
        : typeof (json as { error?: string })?.error === 'string'
          ? (json as { error: string }).error
          : 'Verification failed'
    throw new Error(message)
  }
  if (!json?.success) {
    throw new Error(json?.message ?? 'Invalid verification response')
  }
  return json
}

export type ResendOtpPayload = {
  email: string
  type: 'registration' | string
}

export type ResendOtpResponse = {
  success?: boolean
  message?: string
}

export async function resendOtp(payload: ResendOtpPayload): Promise<ResendOtpResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  }
  const res = await authFetch(`${baseUrl}/auth/resend-otp`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: payload.email,
      type: payload.type,
    }),
  })
  const json = (await res.json()) as ResendOtpResponse & { message?: string; error?: string }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string'
        ? json.message
        : typeof (json as { error?: string })?.error === 'string'
          ? (json as { error: string }).error
          : 'Resend failed'
    throw new Error(message)
  }
  return { success: true, message: (json as { message?: string })?.message ?? 'OTP sent' }
}

// --- Forgot password (Step 1: request OTP) ---

export type ForgotPasswordResponse = {
  success: boolean
  message?: string
  data?: { message?: string }
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authFetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { accept: '*/*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const json = (await res.json()) as ForgotPasswordResponse & { message?: string; error?: string }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string' ? json.message : (json as { error?: string })?.error ?? 'Request failed'
    throw new Error(message)
  }
  return { success: true, message: json?.message, data: json?.data }
}

// --- Verify reset OTP (Step 2: get short-lived resetToken) ---

export type VerifyResetOtpResponse = {
  success: boolean
  message?: string
  data: { resetToken: string; message?: string }
}

export async function verifyResetOtp(email: string, otp: string): Promise<VerifyResetOtpResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authFetch(`${baseUrl}/auth/verify-reset-otp`, {
    method: 'POST',
    headers: { accept: '*/*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  })
  const json = (await res.json()) as VerifyResetOtpResponse & { message?: string; error?: string; data?: { resetToken?: string } }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string' ? json.message : (json as { error?: string })?.error ?? 'Invalid or expired OTP'
    throw new Error(message)
  }
  const resetToken = json?.data?.resetToken
  if (!resetToken) throw new Error(json?.message ?? 'Invalid response')
  return { success: true, data: { resetToken, message: json?.data?.message } }
}

// --- Reset password (Step 3: set new password with resetToken) ---

export type ResetPasswordPayload = {
  resetToken: string
  newPassword: string
}

export type ResetPasswordResponse = {
  success: boolean
  message?: string
  data?: { message?: string }
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authFetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { accept: '*/*', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resetToken: payload.resetToken,
      newPassword: payload.newPassword,
    }),
  })
  const json = (await res.json()) as ResetPasswordResponse & { message?: string; error?: string }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string' ? json.message : (json as { error?: string })?.error ?? 'Reset failed'
    throw new Error(message)
  }
  return { success: true, message: json?.message, data: json?.data }
}

/** Resend password-reset OTP (uses resend-otp with type "password_reset") */
export async function resendResetOtp(email: string): Promise<ResendOtpResponse> {
  return resendOtp({ email, type: 'password_reset' })
}

// --- Change password (authenticated) ---

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}

export type ChangePasswordResponse = {
  success: boolean
  message: string
  data?: { message?: string }
}

export async function changePassword(
  payload: ChangePasswordPayload,
  accessToken?: string | null
): Promise<ChangePasswordResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const token = accessToken ?? getAccessToken()
  if (!token) throw new Error('Not authenticated')
  const body = JSON.stringify({
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
  })
  const res =
    accessToken != null
      ? await authFetch(`${baseUrl}/auth/change-password`, {
          method: 'POST',
          headers: { accept: '*/*', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body,
        })
      : await authenticatedFetch(`${baseUrl}/auth/change-password`, {
          method: 'POST',
          headers: { accept: '*/*', 'Content-Type': 'application/json' },
          body,
        })
  const json = (await res.json()) as ChangePasswordResponse & { message?: string; error?: string }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string' ? json.message : (json as { error?: string })?.error ?? 'Change failed'
    throw new Error(message)
  }
  return { success: true, message: (json as { message?: string })?.message ?? 'Password changed successfully' }
}

/** User list item from GET /users (admin). */
export type UserListItem = {
  id: string
  email: string
  username: string | null
  role: string
  emailVerified: boolean
  createdAt: string
}

/** Paginated users response from GET /users. */
export type GetUsersResponse = {
  data: UserListItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

/** Fetch users (admin). Supports pagination and optional search + role filter. */
export async function getUsers(params: {
  page: number
  limit: number
  search?: string
  role?: string
}): Promise<GetUsersResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const q = new URLSearchParams()
  q.set('page', String(params.page))
  q.set('limit', String(params.limit))
  if (params.search) q.set('search', params.search)
  if (params.role) q.set('role', params.role)
  const res = await authenticatedFetch(`${baseUrl}/users?${q}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as {
    success?: boolean
    message?: string
    data?: { data?: UserListItem[]; pagination?: GetUsersResponse['pagination'] }
  }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch users')
  }
  const payload = json.data
  const list = Array.isArray(payload?.data) ? payload.data : payload?.data ?? []
  const pagination = payload?.pagination ?? {
    page: params.page,
    limit: params.limit,
    total: list.length,
    totalPages: 1,
  }
  return { data: list, pagination }
}

/** Call backend to blacklist the current access token, then clear tokens locally. */
export async function logoutApi(): Promise<void> {
  const baseUrl = getBaseUrl()
  const token = getAccessToken()
  if (baseUrl && token) {
    try {
      await authFetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { accept: '*/*', Authorization: `Bearer ${token}` },
      })
    } catch {
      // Ignore network errors; still clear local tokens
    }
  }
  clearTokens()
}
