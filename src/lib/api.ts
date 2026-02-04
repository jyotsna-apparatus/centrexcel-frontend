import { authFetch } from '@/lib/api-client'

export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_BACKEND_BASE_URL is not configured')
  return url.replace(/\/$/, '')
}

// ─── Types (align with API docs) ─────────────────────────────────────────────

export type ChallengeStatus =
  | 'draft'
  | 'upcoming'
  | 'live'
  | 'closed'
  | 'results_published'
export type ChallengeType = 'free' | 'paid' | 'startup_challenge'

export interface Challenge {
  id: string
  title: string
  description: string
  type: ChallengeType
  fee: number
  startDate: string
  endDate: string
  submissionDeadline: string
  rewards?: string
  maxTeamSize: number
  status: ChallengeStatus
  problemStatementUrl?: string | null
  createdBy: string
  createdAt: string
  sponsor?: { id: string; name: string; organization: string }
}

export interface Session {
  id: string
  deviceInfo: string
  ipAddress: string
  lastActive: string
  createdAt: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  mobile?: string | null
  organization?: string | null
  isEmailVerified?: boolean
  isActive?: boolean
  skills?: string[]
  domain?: string | null
  experienceSummary?: string | null
  socialLinks?: Record<string, string>
  createdAt: string
}

export interface Team {
  id: string
  name: string
  description?: string | null
  challengeId: string
  leaderId: string
  status: string
  inviteCode?: string
  inviteLink?: string
  memberCount?: number
  challenge?: { id: string; title: string }
  teamMembers?: Array<{
    id: string
    userId: string
    teamId: string
    joinedAt: string
    user: { id: string; name: string; email: string }
  }>
  createdAt: string
  updatedAt?: string
}

export interface Participation {
  id: string
  challengeId: string
  userId: string
  teamId: string | null
  mode: 'solo' | 'team'
  registeredAt: string
  challenge?: { id: string; title: string; status?: string; submissionDeadline?: string }
  team?: { id: string; name: string }
}

export interface Submission {
  id: string
  challengeId: string
  teamId: string | null
  title: string
  idea: string
  solution: string
  isDraft: boolean
  links?: string[]
  fileUrl?: string | null
  score?: number | null
  feedback?: string | null
  createdAt: string
  updatedAt?: string
  challenge?: { id: string; title: string; status?: string }
  team?: { id: string; name: string }
}

export interface JudgeChallenge {
  id: string
  title: string
  status: string
  submissionDeadline: string
  totalSubmissions?: number
  scoredSubmissions?: number
  pendingSubmissions?: number
}

export interface Invite {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: string
  expiresAt?: string
  acceptedAt?: string
}

// ─── Public (no auth) ───────────────────────────────────────────────────────

export async function fetchChallenges(): Promise<Challenge[]> {
  const res = await fetch(`${getBaseUrl()}/challenges`)
  if (!res.ok) throw new Error('Failed to fetch challenges')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/** GET /challenges/live – challenges with status "live" */
export async function fetchLiveChallenges(): Promise<Challenge[]> {
  const res = await fetch(`${getBaseUrl()}/challenges/live`, {
    headers: { accept: '*/*' },
  })
  if (!res.ok) throw new Error('Failed to fetch live challenges')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/** GET /challenges/upcoming – challenges with status "upcoming" */
export async function fetchUpcomingChallenges(): Promise<Challenge[]> {
  const res = await fetch(`${getBaseUrl()}/challenges/upcoming`, {
    headers: { accept: '*/*' },
  })
  if (!res.ok) throw new Error('Failed to fetch upcoming challenges')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchChallengeById(id: string): Promise<Challenge> {
  const res = await fetch(`${getBaseUrl()}/challenges/${id}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error('Challenge not found')
    throw new Error('Failed to fetch challenge')
  }
  return res.json()
}

// ─── Auth (me, sessions) ────────────────────────────────────────────────────

export async function fetchMe(): Promise<UserProfile> {
  const res = await authFetch(`${getBaseUrl()}/auth/me`)
  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json()
}

export async function fetchSessions(): Promise<Session[]> {
  const res = await authFetch(`${getBaseUrl()}/auth/sessions`)
  if (!res.ok) throw new Error('Failed to fetch sessions')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function revokeSession(sessionId: string): Promise<void> {
  const res = await authFetch(`${getBaseUrl()}/auth/sessions/${sessionId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to revoke session')
}

export async function logoutAll(): Promise<void> {
  const res = await authFetch(`${getBaseUrl()}/auth/logout-all`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to logout all devices')
}

// ─── Teams ──────────────────────────────────────────────────────────────────

/** POST /teams – create a new team (Bearer required). Body: name, challengeId, description (optional). */
export async function createTeam(body: {
  name: string
  challengeId: string
  description?: string
}): Promise<Team> {
  const payload: Record<string, unknown> = {
    name: body.name.trim(),
    challengeId: body.challengeId,
  }
  if (body.description != null && body.description.trim() !== '') {
    payload.description = body.description.trim()
  }
  const res = await authFetch(`${getBaseUrl()}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: '*/*' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to create team')
  }
  return res.json()
}

export async function fetchMyTeams(): Promise<Team[]> {
  const res = await authFetch(`${getBaseUrl()}/teams/my`)
  if (!res.ok) throw new Error('Failed to fetch teams')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/** GET /teams/:id – team details (Bearer required) */
export async function fetchTeamById(id: string): Promise<Team> {
  const res = await authFetch(`${getBaseUrl()}/teams/${id}`, {
    headers: { accept: '*/*' },
  })
  if (!res.ok) {
    if (res.status === 404) throw new Error('Team not found')
    throw new Error('Failed to fetch team')
  }
  return res.json()
}

/** POST /teams/:id/invite – send team invitation by email (Bearer required). Body: { email }. */
export async function inviteToTeam(teamId: string, email: string): Promise<void> {
  const res = await authFetch(`${getBaseUrl()}/teams/${teamId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: '*/*' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to invite')
  }
}

export async function joinTeam(code: string): Promise<{ team: Team }> {
  const res = await authFetch(`${getBaseUrl()}/teams/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to join team')
  }
  return res.json()
}

// ─── Participations ─────────────────────────────────────────────────────────

/** POST /participations – register for a challenge (solo or team). userId from token. */
export async function registerParticipation(body: {
  challengeId: string
  mode: 'solo' | 'team'
  teamId?: string | null
}): Promise<Participation> {
  const payload: Record<string, unknown> = {
    challengeId: body.challengeId,
    mode: body.mode,
    teamId: body.mode === 'team' && body.teamId ? body.teamId : null,
  }
  const res = await authFetch(`${getBaseUrl()}/participations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: '*/*' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to register')
  }
  return res.json()
}

/** GET /participations/my – current user's participations (Bearer required) */
export async function fetchMyParticipations(): Promise<Participation[]> {
  const res = await authFetch(`${getBaseUrl()}/participations/my`, {
    headers: { accept: '*/*' },
  })
  if (!res.ok) throw new Error('Failed to fetch participations')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchParticipationById(id: string): Promise<Participation> {
  const res = await authFetch(`${getBaseUrl()}/participations/${id}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error('Participation not found')
    throw new Error('Failed to fetch participation')
  }
  return res.json()
}

// ─── Submissions ────────────────────────────────────────────────────────────

export async function createSubmission(body: {
  challengeId: string
  teamId?: string | null
  title: string
  idea: string
  solution: string
  isDraft?: boolean
  links?: string[]
}): Promise<Submission> {
  const res = await authFetch(`${getBaseUrl()}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to create submission')
  }
  return res.json()
}

export async function fetchMySubmissions(): Promise<Submission[]> {
  const res = await authFetch(`${getBaseUrl()}/submissions/my`)
  if (!res.ok) throw new Error('Failed to fetch submissions')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchSubmissionById(id: string): Promise<Submission> {
  const res = await authFetch(`${getBaseUrl()}/submissions/${id}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error('Submission not found')
    throw new Error('Failed to fetch submission')
  }
  return res.json()
}

export async function updateSubmission(
  id: string,
  body: { title?: string; idea?: string; solution?: string; links?: string[] }
): Promise<Submission> {
  const res = await authFetch(`${getBaseUrl()}/submissions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to update submission')
  }
  return res.json()
}

export async function uploadSubmissionFile(id: string, file: File): Promise<{ fileUrl: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await authFetch(`${getBaseUrl()}/submissions/${id}/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to upload file')
  }
  return res.json()
}

export async function finalizeSubmission(id: string): Promise<Submission> {
  const res = await authFetch(`${getBaseUrl()}/submissions/${id}/final-submit`, {
    method: 'PATCH',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to finalize submission')
  }
  return res.json()
}

export async function scoreSubmission(
  id: string,
  body: { score: number; feedback?: string }
): Promise<Submission> {
  const res = await authFetch(`${getBaseUrl()}/submissions/${id}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to score submission')
  }
  return res.json()
}

// ─── Judge ──────────────────────────────────────────────────────────────────

export async function fetchJudgeChallenges(): Promise<JudgeChallenge[]> {
  const res = await authFetch(`${getBaseUrl()}/judge/challenges`)
  if (!res.ok) throw new Error('Failed to fetch judge challenges')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchJudgeSubmissions(): Promise<Submission[]> {
  const res = await authFetch(`${getBaseUrl()}/judge/submissions`)
  if (!res.ok) throw new Error('Failed to fetch submissions to judge')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

// ─── Sponsor / Admin (challenges, invites) ───────────────────────────────────

export async function createChallenge(body: {
  title: string
  description: string
  type: ChallengeType
  fee?: number
  startDate: string
  endDate: string
  submissionDeadline: string
  rewards?: string
  maxTeamSize?: number
  status?: ChallengeStatus
}): Promise<Challenge> {
  const res = await authFetch(`${getBaseUrl()}/challenges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to create challenge')
  }
  return res.json()
}

export async function updateChallenge(
  id: string,
  body: Partial<{
    title: string
    description: string
    type: ChallengeType
    fee: number
    startDate: string
    endDate: string
    submissionDeadline: string
    rewards: string
    maxTeamSize: number
    status: ChallengeStatus
  }>
): Promise<Challenge> {
  const res = await authFetch(`${getBaseUrl()}/challenges/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', accept: '*/*' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to update challenge')
  }
  return res.json()
}

export async function deleteChallenge(id: string): Promise<void> {
  const res = await authFetch(`${getBaseUrl()}/challenges/${id}`, {
    method: 'DELETE',
    headers: { accept: '*/*' },
  })
  if (!res.ok) throw new Error('Failed to delete challenge')
}

export async function uploadProblemStatement(
  challengeId: string,
  file: File
): Promise<{ problemStatementUrl: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await authFetch(`${getBaseUrl()}/challenges/${challengeId}/problem-statement`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to upload problem statement')
  }
  return res.json()
}

export async function publishResults(challengeId: string): Promise<Challenge> {
  const res = await authFetch(`${getBaseUrl()}/challenges/${challengeId}/publish-results`, {
    method: 'POST',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to publish results')
  }
  const data = await res.json()
  return (data as { challenge?: Challenge }).challenge ?? data
}

export async function inviteJudge(body: {
  email: string
  name: string
  role: 'judge'
  message?: string
}): Promise<{ inviteId: string }> {
  const res = await authFetch(`${getBaseUrl()}/auth/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to send invitation')
  }
  return res.json()
}

export async function fetchInvites(): Promise<Invite[]> {
  const res = await authFetch(`${getBaseUrl()}/auth/invites`)
  if (!res.ok) throw new Error('Failed to fetch invitations')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const res = await authFetch(`${getBaseUrl()}/auth/invites/${inviteId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to revoke invitation')
}

export async function assignJudge(body: {
  judgeId: string
  challengeId: string
}): Promise<unknown> {
  const res = await authFetch(`${getBaseUrl()}/admin/judges/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to assign judge')
  }
  return res.json()
}

// Invite accept (public POST with token)
export async function acceptInvite(body: {
  token: string
  name: string
  password: string
  organization?: string
}): Promise<{ accessToken: string; refreshToken: string; user: UserProfile }> {
  const res = await fetch(`${getBaseUrl()}/auth/invite/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Failed to accept invitation')
  }
  return res.json()
}
