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
  name?: string | null
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
    data?:
      | UserListItem[]
      | { data?: UserListItem[]; pagination?: GetUsersResponse['pagination'] }
  }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch users')
  }
  
  // Backend returns: { success: true, message: "...", data: { data: [...], pagination: {...} } }
  const payload = json.data
  
  // Handle different response structures
  let list: UserListItem[] = []
  let pagination: GetUsersResponse['pagination']
  
  if (Array.isArray(payload)) {
    // Direct array response
    list = payload
    pagination = {
      page: params.page,
      limit: params.limit,
      total: list.length,
      totalPages: 1,
    }
  } else if (payload && typeof payload === 'object') {
    // Nested structure: { data: [...], pagination: {...} }
    list = Array.isArray(payload.data) ? payload.data : []
    pagination = payload.pagination || {
      page: params.page,
      limit: params.limit,
      total: list.length,
      totalPages: 1,
    }
  }
  
  return { data: list, pagination }
}

/** Fetch a single user by id (admin). */
export async function getUser(id: string): Promise<UserListItem> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/users/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { data?: UserListItem; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch user')
  }
  const user = json?.data
  if (!user || typeof user.id === 'undefined') throw new Error('Invalid user response')
  return user
}

/** Update a user (admin). */
export type UpdateUserBody = {
  email?: string
  username?: string | null
  role?: string
  emailVerified?: boolean
}

export async function updateUser(id: string, body: UpdateUserBody): Promise<UserListItem> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as { data?: UserListItem; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to update user')
  }
  const user = json?.data
  if (!user || typeof user.id === 'undefined') throw new Error('Invalid user response')
  return user
}

/** Delete a user (admin). */
export async function deleteUser(id: string): Promise<void> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    const json = (await res.json()) as { message?: string }
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to delete user')
  }
}

/** Create a user (admin). Uses same shape as register but authenticated. */
export async function createUser(credentials: RegisterCredentials): Promise<RegisterResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/users`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
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
      typeof json?.message === 'string' ? json.message : typeof (json as { error?: string })?.error === 'string' ? (json as { error: string }).error : 'Failed to create user'
    throw new Error(message)
  }
  const id = json?.data?.id ?? (json as { userId?: string }).userId ?? ''
  const email = json?.data?.email ?? (json as { email?: string }).email ?? credentials.email
  const msg = json?.data?.message ?? json?.message ?? 'User created.'
  return { success: true, message: msg, data: { id, email, message: msg } }
}

// --- Profile / Settings (authenticated) ---

export type UpdateProfileBody = {
  name?: string | null
  username?: string | null
}

export type UpdateProfileResponse = {
  success: boolean
  message?: string
  data?: LoginUser
}

export async function updateProfile(body: UpdateProfileBody): Promise<UpdateProfileResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/auth/me`, {
    method: 'PATCH',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as UpdateProfileResponse & { data?: LoginUser; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to update profile')
  }
  return { success: true, data: json?.data, message: json?.message }
}

export type RequestEmailChangeResponse = { success: boolean; message?: string }
export async function requestEmailChange(newEmail: string): Promise<RequestEmailChangeResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/auth/request-email-change`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ newEmail }),
  })
  const json = (await res.json()) as RequestEmailChangeResponse & { message?: string }
  if (!res.ok) throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to send code')
  return { success: true, message: json?.message }
}

export type ConfirmEmailChangeBody = { newEmail: string; otp: string }
export type ConfirmEmailChangeResponse = { success: boolean; message?: string }
export async function confirmEmailChange(body: ConfirmEmailChangeBody): Promise<ConfirmEmailChangeResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/auth/confirm-email-change`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as ConfirmEmailChangeResponse & { message?: string }
  if (!res.ok) throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to update email')
  return { success: true, message: json?.message }
}

export type RequestPasswordChangeOtpResponse = { success: boolean; message?: string }
export async function requestPasswordChangeOtp(): Promise<RequestPasswordChangeOtpResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/auth/request-password-change-otp`, {
    method: 'POST',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as RequestPasswordChangeOtpResponse & { message?: string }
  if (!res.ok) throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to send code')
  return { success: true, message: json?.message }
}

export type ConfirmPasswordChangeBody = { otp: string; newPassword: string }
export type ConfirmPasswordChangeResponse = { success: boolean; message?: string }
export async function confirmPasswordChange(body: ConfirmPasswordChangeBody): Promise<ConfirmPasswordChangeResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/auth/confirm-password-change`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as ConfirmPasswordChangeResponse & { message?: string }
  if (!res.ok) throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to change password')
  return { success: true, message: json?.message }
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

// --- Favorites API ---

export type FavoriteType = 'judge' | 'sponsor'

export type Favorite = {
  id: string
  adminId: string
  favoriteType: FavoriteType
  favoriteId: string
  createdAt: string
  favoriteUser?: {
    id: string
    email: string
    username: string | null
    role: string
  }
}

export type CreateFavoriteResponse = {
  success: boolean
  message: string
  data: Favorite
}

export type GetFavoritesResponse = {
  success: boolean
  message: string
  data: Favorite[]
}

/** Create a favorite (admin only) */
export async function createFavorite(favoriteType: FavoriteType, favoriteId: string): Promise<CreateFavoriteResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/favorites`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ favoriteType, favoriteId }),
  })
  const json = (await res.json()) as CreateFavoriteResponse & { message?: string; error?: string }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string' ? json.message : (json as { error?: string })?.error ?? 'Failed to create favorite'
    throw new Error(message)
  }
  return json as CreateFavoriteResponse
}

/** Get favorites (admin only) */
export async function getFavorites(favoriteType?: FavoriteType): Promise<GetFavoritesResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const q = new URLSearchParams()
  if (favoriteType) q.set('favoriteType', favoriteType)
  const res = await authenticatedFetch(`${baseUrl}/favorites?${q}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as GetFavoritesResponse & { message?: string; error?: string }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string' ? json.message : (json as { error?: string })?.error ?? 'Failed to fetch favorites'
    throw new Error(message)
  }
  return json as GetFavoritesResponse
}

/** Delete a favorite (admin only) */
export async function deleteFavorite(favoriteId: string): Promise<void> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/favorites/${encodeURIComponent(favoriteId)}`, {
    method: 'DELETE',
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    const json = (await res.json()) as { message?: string }
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to delete favorite')
  }
}

// --- Teams API ---

export type TeamMember = {
  id: string
  userId: string
  role: string
  createdAt: string
  user: {
    id: string
    email: string
    username: string | null
  }
}

export type Team = {
  id: string
  name: string
  inviteCode: string
  isDissolved: boolean
  deletionRequestedAt: string | null
  createdAt: string
  updatedAt: string
  members: TeamMember[]
  participations?: Array<{
    hackathon: { id: string; title: string }
  }>
}

export type TeamListItem = {
  id: string
  name: string
  inviteCode: string
  isDissolved: boolean
  deletionRequestedAt: string | null
  createdAt: string
  updatedAt: string
  members: TeamMember[]
  participations?: Array<{
    hackathon: { id: string; title: string }
  }>
}

export type GetTeamsResponse = {
  data: TeamListItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export type CreateTeamBody = {
  name: string
  hackathonId?: string
}

export type CreateTeamResponse = {
  success: boolean
  message: string
  data: Team
}

/** Get teams with pagination and optional search/hackathon filter */
export async function getTeams(params: {
  page: number
  limit: number
  search?: string
  hackathonId?: string
}): Promise<GetTeamsResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const q = new URLSearchParams()
  q.set('page', String(params.page))
  q.set('limit', String(params.limit))
  if (params.search) q.set('search', params.search)
  if (params.hackathonId) q.set('hackathonId', params.hackathonId)
  const res = await authenticatedFetch(`${baseUrl}/teams?${q}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as {
    success?: boolean
    message?: string
    data?:
      | TeamListItem[]
      | { data?: TeamListItem[]; pagination?: GetTeamsResponse['pagination'] }
  }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch teams')
  }

  const payload = json.data
  let list: TeamListItem[] = []
  let pagination: GetTeamsResponse['pagination']

  if (Array.isArray(payload)) {
    list = payload
    pagination = {
      page: params.page,
      limit: params.limit,
      total: list.length,
      totalPages: 1,
    }
  } else if (payload && typeof payload === 'object') {
    list = Array.isArray(payload.data) ? payload.data : []
    pagination = payload.pagination || {
      page: params.page,
      limit: params.limit,
      total: list.length,
      totalPages: 1,
    }
  }

  return { data: list, pagination }
}

/** Get a single team by ID */
export async function getTeam(id: string): Promise<Team> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/teams/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { data?: Team; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch team')
  }
  const team = json?.data
  if (!team || typeof team.id === 'undefined') throw new Error('Invalid team response')
  return team
}

/** Create a team */
export async function createTeam(body: CreateTeamBody): Promise<CreateTeamResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/teams`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as CreateTeamResponse & { message?: string; error?: string }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string' ? json.message : (json as { error?: string })?.error ?? 'Failed to create team'
    throw new Error(message)
  }
  return json as CreateTeamResponse
}

/** Update team name (leader only). Fails if name is already taken. */
export async function updateTeam(teamId: string, name: string): Promise<Team> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/teams/${encodeURIComponent(teamId)}`, {
    method: 'PATCH',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  const json = (await res.json()) as CreateTeamResponse & { message?: string; data?: Team }
  if (!res.ok) {
    const message =
      typeof json?.message === 'string' ? json.message : 'Failed to update team name'
    throw new Error(message)
  }
  const team = (json as { data?: Team }).data
  if (!team) throw new Error('Invalid update team response')
  return team
}

/** Delete a team */
export async function deleteTeam(id: string): Promise<void> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/teams/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    const json = (await res.json()) as { message?: string }
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to delete team')
  }
}

// --- Hackathons API ---

export type HackathonJudge = {
  id: string
  hackathonId: string
  judgeId: string
  createdAt: string
  judge: { id: string; email: string; username: string | null }
}

export type Hackathon = {
  id: string
  title: string
  shortDescription: string
  image: string | null
  submissionDeadline: string
  scoringDeadline: string
  instructions: string
  sponsorId: string
  isPaid: boolean
  priceOfEntry: number | null
  status: string
  createdAt: string
  updatedAt: string
  sponsor?: {
    id: string
    email: string
    username: string | null
  }
  judges?: HackathonJudge[]
  _count?: {
    submissions: number
    teams: number
  }
}

export type HackathonListItem = Hackathon

export type GetHackathonsResponse = {
  data: HackathonListItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

/** Public: get top 3 featured hackathons for landing page. No auth required. */
export async function getFeaturedHackathons(limit: number = 3): Promise<HackathonListItem[]> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await fetch(`${baseUrl}/hackathons/featured?limit=${Math.min(limit, 10)}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { success?: boolean; message?: string; data?: HackathonListItem[] }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch featured hackathons')
  }
  return Array.isArray(json.data) ? json.data : []
}

/** Get hackathons with pagination and optional filters. forJudge: 'me' returns only hackathons the current user (judge) is assigned to. */
export async function getHackathons(params: {
  page: number
  limit: number
  search?: string
  status?: string
  sponsorId?: string
  forJudge?: 'me'
}): Promise<GetHackathonsResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const q = new URLSearchParams()
  q.set('page', String(params.page))
  q.set('limit', String(params.limit))
  if (params.search) q.set('search', params.search)
  if (params.status) q.set('status', params.status)
  if (params.sponsorId) q.set('sponsorId', params.sponsorId)
  if (params.forJudge === 'me') q.set('forJudge', 'me')
  const res = await authenticatedFetch(`${baseUrl}/hackathons?${q}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as {
    success?: boolean
    message?: string
    data?:
      | HackathonListItem[]
      | { data?: HackathonListItem[]; pagination?: GetHackathonsResponse['pagination'] }
  }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch hackathons')
  }

  const payload = json.data
  let list: HackathonListItem[] = []
  let pagination: GetHackathonsResponse['pagination']

  if (Array.isArray(payload)) {
    list = payload
    pagination = {
      page: params.page,
      limit: params.limit,
      total: list.length,
      totalPages: 1,
    }
  } else if (payload && typeof payload === 'object') {
    list = Array.isArray(payload.data) ? payload.data : []
    pagination = payload.pagination || {
      page: params.page,
      limit: params.limit,
      total: list.length,
      totalPages: 1,
    }
  }

  return { data: list, pagination }
}

// --- Submissions API ---

export type JudgeScore = {
  id: string
  submissionId: string
  judgeId: string
  score: number
  feedback: string | null
  createdAt: string
  judge?: { id: string; email: string; username: string | null }
}

export type Submission = {
  id: string
  hackathonId: string
  teamId: string | null
  userId: string
  title: string
  description: string
  filePath: string
  fileSize: number
  averageScore: number | null
  createdAt: string
  updatedAt: string
  hackathon?: {
    id: string
    title: string
    status?: string
  }
  team?: { id: string; name: string } | null
  user?: { id: string; email: string; username: string | null }
  scores?: JudgeScore[]
}

export type Winner = {
  id: string
  hackathonId: string
  submissionId: string
  position: 1 | 2 | 3
  selectedBy: string
  createdAt: string
  submission?: Submission
  selector?: { id: string; email: string; username: string | null }
}

export type SubmissionListItem = Submission

export type GetSubmissionsResponse = {
  data: SubmissionListItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

/** Get user's submissions (participant sees their own, team submissions) */
export async function getSubmissions(params: {
  page: number
  limit: number
}): Promise<GetSubmissionsResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const q = new URLSearchParams()
  q.set('page', String(params.page))
  q.set('limit', String(params.limit))
  const res = await authenticatedFetch(`${baseUrl}/submissions?${q}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as {
    success?: boolean
    message?: string
    data?:
      | SubmissionListItem[]
      | { data?: SubmissionListItem[]; pagination?: GetSubmissionsResponse['pagination'] }
  }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch submissions')
  }

  const payload = json.data
  let list: SubmissionListItem[] = []
  let pagination: GetSubmissionsResponse['pagination']

  if (Array.isArray(payload)) {
    list = payload
    pagination = {
      page: params.page,
      limit: params.limit,
      total: list.length,
      totalPages: 1,
    }
  } else if (payload && typeof payload === 'object') {
    list = Array.isArray(payload.data) ? payload.data : []
    pagination = payload.pagination || {
      page: params.page,
      limit: params.limit,
      total: list.length,
      totalPages: 1,
    }
  }

  return { data: list, pagination }
}

// --- Hackathon single & CRUD ---

/** Get a single hackathon by ID */
export async function getHackathon(id: string): Promise<Hackathon> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/hackathons/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { data?: Hackathon; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch hackathon')
  }
  const hackathon = json?.data
  if (!hackathon || typeof hackathon.id === 'undefined') throw new Error('Invalid hackathon response')
  return hackathon
}

export type CreateHackathonFormData = {
  title: string
  shortDescription: string
  submissionDeadline: string
  scoringDeadline: string
  instructions: string
  sponsorId: string
  judgeIds: string[]
  isPaid: boolean
  priceOfEntry?: number | null
  image?: File | null
}

/** Create hackathon (Admin only). multipart/form-data. */
export async function createHackathon(form: CreateHackathonFormData): Promise<{ success: boolean; message: string; data: Hackathon }> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const body = new FormData()
  body.append('title', form.title)
  body.append('shortDescription', form.shortDescription)
  body.append('submissionDeadline', form.submissionDeadline)
  body.append('scoringDeadline', form.scoringDeadline)
  body.append('instructions', form.instructions)
  body.append('sponsorId', form.sponsorId)
  body.append('judgeIds', JSON.stringify(form.judgeIds))
  body.append('isPaid', form.isPaid ? 'true' : 'false')
  if (form.isPaid && form.priceOfEntry != null) body.append('priceOfEntry', String(form.priceOfEntry))
  if (form.image) body.append('image', form.image)
  const res = await authenticatedFetch(`${baseUrl}/hackathons`, {
    method: 'POST',
    headers: { accept: 'application/json' },
    body,
  })
  const json = (await res.json()) as { success?: boolean; message?: string; data?: Hackathon }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to create hackathon')
  }
  const data = json?.data
  if (!data) throw new Error('Invalid create hackathon response')
  return { success: true, message: (json as { message?: string })?.message ?? 'Hackathon created successfully', data }
}

export type UpdateHackathonFormData = Partial<CreateHackathonFormData> & { status?: string }

/** Update hackathon (Admin only). multipart/form-data. */
export async function updateHackathon(id: string, form: UpdateHackathonFormData): Promise<Hackathon> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const body = new FormData()
  if (form.title !== undefined) body.append('title', form.title)
  if (form.shortDescription !== undefined) body.append('shortDescription', form.shortDescription)
  if (form.submissionDeadline !== undefined) body.append('submissionDeadline', form.submissionDeadline)
  if (form.scoringDeadline !== undefined) body.append('scoringDeadline', form.scoringDeadline)
  if (form.instructions !== undefined) body.append('instructions', form.instructions)
  if (form.sponsorId !== undefined) body.append('sponsorId', form.sponsorId)
  if (form.judgeIds !== undefined) body.append('judgeIds', JSON.stringify(form.judgeIds))
  if (form.isPaid !== undefined) body.append('isPaid', form.isPaid ? 'true' : 'false')
  if (form.priceOfEntry !== undefined && form.priceOfEntry != null) body.append('priceOfEntry', String(form.priceOfEntry))
  if (form.status !== undefined) body.append('status', form.status)
  if (form.image) body.append('image', form.image)
  const res = await authenticatedFetch(`${baseUrl}/hackathons/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { accept: 'application/json' },
    body,
  })
  const json = (await res.json()) as { data?: Hackathon; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to update hackathon')
  }
  const data = json?.data
  if (!data) throw new Error('Invalid update hackathon response')
  return data
}

/** Delete hackathon (Admin only) */
export async function deleteHackathon(id: string): Promise<void> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/hackathons/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    const json = (await res.json()) as { message?: string }
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to delete hackathon')
  }
}

/** Get all submissions for a hackathon (Admin or Sponsor) */
export async function getHackathonEntries(hackathonId: string): Promise<Submission[]> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/hackathons/${encodeURIComponent(hackathonId)}/entries`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { data?: Submission[]; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch entries')
  }
  return Array.isArray(json?.data) ? json.data : []
}

/** Download all hackathon submissions as ZIP (Admin or Sponsor) */
export async function downloadHackathonEntries(hackathonId: string): Promise<Blob> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/hackathons/${encodeURIComponent(hackathonId)}/download-entries`, {
    method: 'GET',
    headers: { accept: 'application/zip' },
  })
  if (!res.ok) {
    const text = await res.text()
    let msg = 'Failed to download entries'
    try {
      const j = JSON.parse(text) as { message?: string }
      if (typeof j?.message === 'string') msg = j.message
    } catch {
      // ignore
    }
    throw new Error(msg)
  }
  return res.blob()
}

// --- Teams: join, remove member, deletion flow ---

/** Join a team by invite code and register for a hackathon (creates participation). */
export async function joinTeam(inviteCode: string, hackathonId: string): Promise<Team> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/teams/join`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode: inviteCode.trim(), hackathonId }),
  })
  const json = (await res.json()) as { data?: Team; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to join team')
  }
  const data = json?.data
  if (!data) throw new Error('Invalid join team response')
  return data
}

/** Remove a team member (team leader only) */
export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(
    `${baseUrl}/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`,
    { method: 'DELETE', headers: { accept: 'application/json' } }
  )
  if (!res.ok) {
    const json = (await res.json()) as { message?: string }
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to remove member')
  }
}

/** Request team deletion (leader only). All members must confirm. */
export async function requestTeamDeletion(teamId: string): Promise<{ success: boolean; message: string }> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/teams/${encodeURIComponent(teamId)}/request-deletion`, {
    method: 'POST',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { success?: boolean; message?: string; data?: { message?: string } }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to request deletion')
  }
  return { success: true, message: json?.data?.message ?? json?.message ?? 'Deletion requested' }
}

/** Confirm team deletion (any member). When all confirm, team is dissolved. */
export async function confirmTeamDeletion(teamId: string): Promise<{ success: boolean; message: string }> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/teams/${encodeURIComponent(teamId)}/confirm-deletion`, {
    method: 'POST',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { success?: boolean; message?: string; data?: { message?: string } }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to confirm deletion')
  }
  return { success: true, message: json?.data?.message ?? json?.message ?? 'Deletion confirmed' }
}

export type TeamDeletionStatus = {
  deletionRequested: boolean
  confirmations: Array<{
    id: string
    teamId: string
    userId: string
    confirmed: boolean
    confirmedAt: string | null
    createdAt: string
    user: { id: string; email: string; username: string | null }
  }>
  totalMembers: number
  confirmedCount: number
}

/** Get team deletion confirmation status */
export async function getTeamDeletionStatus(teamId: string): Promise<TeamDeletionStatus> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/teams/${encodeURIComponent(teamId)}/deletion-status`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { data?: TeamDeletionStatus; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch deletion status')
  }
  const data = json?.data
  if (!data) throw new Error('Invalid deletion status response')
  return data
}

// --- Participations (participant-only) ---

export type ParticipationListItem = {
  id: string
  userId: string
  hackathonId: string
  teamId: string | null
  createdAt: string
  hackathon: { id: string; title: string; status: string; submissionDeadline: string }
  team: { id: string; name: string } | null
  hasSubmitted: boolean
  submission: { id: string; title: string; createdAt: string } | null
}

export type GetParticipationsResponse = {
  data: ParticipationListItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

/** Create participation for a hackathon (solo or with existing team). */
export async function createParticipation(body: {
  hackathonId: string
  type: 'solo' | 'team'
  teamId?: string
}): Promise<ParticipationListItem> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/participations`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as { data?: ParticipationListItem; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to create participation')
  }
  const data = json?.data
  if (!data) throw new Error('Invalid participation response')
  return data
}

/** Get my participations (paginated) */
export async function getMyParticipations(params?: {
  page?: number
  limit?: number
}): Promise<GetParticipationsResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10
  const res = await authenticatedFetch(`${baseUrl}/participations?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { data?: GetParticipationsResponse; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch participations')
  }
  const payload = json?.data
  if (!payload || !Array.isArray(payload.data)) {
    return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } }
  }
  return payload as GetParticipationsResponse
}

/** Get my participation for a specific hackathon (if any) */
export async function getParticipationForHackathon(
  hackathonId: string
): Promise<ParticipationListItem | null> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(
    `${baseUrl}/participations/hackathon/${encodeURIComponent(hackathonId)}`,
    { method: 'GET', headers: { accept: 'application/json' } }
  )
  const json = (await res.json()) as { data?: ParticipationListItem | null; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch participation')
  }
  return json?.data ?? null
}

export type HackathonParticipationAdmin = {
  id: string
  userId: string
  hackathonId: string
  teamId: string | null
  createdAt: string
  user: { id: string; email: string; username: string | null }
  team: { id: string; name: string } | null
  hasSubmitted: boolean
  submission: { id: string; title: string; createdAt: string } | null
}

/** Get all participations for a hackathon (admin only) */
export async function getHackathonParticipations(
  hackathonId: string
): Promise<HackathonParticipationAdmin[]> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(
    `${baseUrl}/participations/hackathon/${encodeURIComponent(hackathonId)}/all`,
    { method: 'GET', headers: { accept: 'application/json' } }
  )
  const json = (await res.json()) as { data?: HackathonParticipationAdmin[]; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch participations')
  }
  return Array.isArray(json?.data) ? json.data : []
}

/** Withdraw participation (only allowed before submission). For team, also leaves the team. */
export async function withdrawParticipation(participationId: string): Promise<{ message: string; hackathonId: string }> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(
    `${baseUrl}/participations/${encodeURIComponent(participationId)}`,
    { method: 'DELETE', headers: { accept: 'application/json' } }
  )
  const json = (await res.json()) as { data?: { message: string; hackathonId: string }; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to withdraw participation')
  }
  const data = json?.data
  if (!data) throw new Error('Invalid withdraw response')
  return data
}

// --- Submissions: single, by hackathon, create, delete ---

/** Get a single submission by ID */
export async function getSubmission(id: string): Promise<Submission> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/submissions/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { data?: Submission; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch submission')
  }
  const data = json?.data
  if (!data) throw new Error('Invalid submission response')
  return data
}

/** Get all submissions for a hackathon (Admin or Sponsor) */
export async function getSubmissionsByHackathon(hackathonId: string): Promise<Submission[]> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/submissions/hackathon/${encodeURIComponent(hackathonId)}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { data?: Submission[]; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch submissions')
  }
  return Array.isArray(json?.data) ? json.data : []
}

export type CreateSubmissionFormData = {
  hackathonId: string
  title: string
  description: string
  teamId?: string | null
  file: File
}

/** Create submission (multipart/form-data) */
export async function createSubmission(form: CreateSubmissionFormData): Promise<Submission> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const body = new FormData()
  body.append('hackathonId', form.hackathonId)
  body.append('title', form.title)
  body.append('description', form.description)
  if (form.teamId) body.append('teamId', form.teamId)
  body.append('file', form.file)
  const res = await authenticatedFetch(`${baseUrl}/submissions`, {
    method: 'POST',
    headers: { accept: 'application/json' },
    body,
  })
  const json = (await res.json()) as { data?: Submission; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to create submission')
  }
  const data = json?.data
  if (!data) throw new Error('Invalid create submission response')
  return data
}

/** Delete submission (owner, team leader, or admin) */
export async function deleteSubmission(id: string): Promise<void> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/submissions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    const json = (await res.json()) as { message?: string }
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to delete submission')
  }
}

/** Download submission file (Judge assigned to hackathon, Sponsor of hackathon, or Admin) */
export async function downloadSubmission(submissionId: string, filename?: string): Promise<void> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(
    `${baseUrl}/submissions/${encodeURIComponent(submissionId)}/download`,
    { method: 'GET', headers: { accept: 'application/octet-stream' } }
  )
  if (!res.ok) {
    const text = await res.text()
    let msg = 'Failed to download submission'
    try {
      const j = JSON.parse(text) as { message?: string }
      if (typeof j?.message === 'string') msg = j.message
    } catch {
      if (text) msg = text
    }
    throw new Error(msg)
  }
  const disposition = res.headers.get('Content-Disposition')
  const name =
    filename ||
    (disposition?.match(/filename="([^"]+)"/)?.[1] ?? `submission-${submissionId}.zip`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

// --- Scores ---

export type CreateScoreBody = { submissionId: string; score: number; feedback?: string | null }

/** Create judge score (Judge only) */
export async function createScore(body: CreateScoreBody): Promise<JudgeScore> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/scores`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submissionId: body.submissionId,
      score: body.score,
      ...(body.feedback != null ? { feedback: body.feedback } : {}),
    }),
  })
  const json = (await res.json()) as { data?: JudgeScore; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to create score')
  }
  const data = json?.data
  if (!data) throw new Error('Invalid create score response')
  return data
}

/** Get scores for a submission (Judge sees own only; Admin/Sponsor see all) */
export async function getSubmissionScores(submissionId: string): Promise<JudgeScore[]> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/scores/submission/${encodeURIComponent(submissionId)}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { data?: JudgeScore[]; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch scores')
  }
  return Array.isArray(json?.data) ? json.data : []
}

// --- Winners ---

export type CreateWinnerBody = { hackathonId: string; submissionId: string; position: 1 | 2 | 3 }

/** Select winner (Admin or Sponsor) */
export async function createWinner(body: CreateWinnerBody): Promise<Winner> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/winners`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as { data?: Winner; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to select winner')
  }
  const data = json?.data
  if (!data) throw new Error('Invalid create winner response')
  return data
}

/** Get hackathon winners (ordered by position 1, 2, 3) */
export async function getHackathonWinners(hackathonId: string): Promise<Winner[]> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authenticatedFetch(`${baseUrl}/winners/hackathon/${encodeURIComponent(hackathonId)}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { data?: Winner[]; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch winners')
  }
  return Array.isArray(json?.data) ? json.data : []
}

// --- Payments (PhonePe) ---

export type CreatePaymentBody = {
  amount: number
  merchantOrderId?: string
  redirectPath?: string
  userId?: string
  hackathonId?: string
  metaInfo?: Record<string, string>
}

export type CreatePaymentResponse = {
  success: boolean
  message?: string
  data: {
    redirectUrl: string
    merchantOrderId: string
    orderId: string
  }
}

export type PaymentStatusResponse = {
  success: boolean
  message?: string
  data: {
    state: string
    amount: number
    orderId?: string
    merchantOrderId?: string
  }
}

export async function createPayment(body: CreatePaymentBody): Promise<CreatePaymentResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authFetch(`${baseUrl}/payments/create`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as CreatePaymentResponse & { message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Payment initiation failed')
  }
  return json as CreatePaymentResponse
}

export async function getPaymentStatus(merchantOrderId: string): Promise<PaymentStatusResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const res = await authFetch(
    `${baseUrl}/payments/status?${new URLSearchParams({ merchantOrderId })}`,
    { method: 'GET', headers: { accept: 'application/json' } }
  )
  const json = (await res.json()) as PaymentStatusResponse & { message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch payment status')
  }
  return json as PaymentStatusResponse
}

export type TransactionItem = {
  id: string
  merchantOrderId: string
  phonepeOrderId: string | null
  amount: number
  state: string
  userId: string | null
  hackathonId: string | null
  createdAt: string
  user?: { id: string; email: string } | null
  hackathon?: { id: string; title: string } | null
}

export type GetTransactionsResponse = {
  data: TransactionItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export async function getTransactions(params: {
  page?: number
  limit?: number
  state?: string
  userId?: string
}): Promise<GetTransactionsResponse> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not set')
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', String(params.page))
  if (params.limit != null) q.set('limit', String(params.limit))
  if (params.state) q.set('state', params.state)
  if (params.userId) q.set('userId', params.userId)
  const res = await authenticatedFetch(`${baseUrl}/payments?${q}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  const json = (await res.json()) as { data?: GetTransactionsResponse; message?: string }
  if (!res.ok) {
    throw new Error(typeof json?.message === 'string' ? json.message : 'Failed to fetch transactions')
  }
  const out = json?.data
  if (!out || !Array.isArray(out.data)) throw new Error('Invalid transactions response')
  return out
}
