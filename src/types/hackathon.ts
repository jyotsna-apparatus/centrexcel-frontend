/**
 * Hackathon module types — aligned with HACKATHON_FRONTEND_INTEGRATION.md
 */

export type HackathonStatus = 'open' | 'submission_closed' | 'closed' | 'cancelled'

export interface UserSummary {
  id: string
  email: string
  username: string
}

export interface HackathonJudge {
  id: string
  hackathonId: string
  judgeId: string
  createdAt: string
  judge: UserSummary
}

export interface JudgeScore {
  id: string
  submissionId: string
  judgeId: string
  score: number
  feedback: string | null
  createdAt: string
  judge: UserSummary
}

export interface Winner {
  id: string
  hackathonId: string
  submissionId: string
  position: 1 | 2 | 3
  selectedBy: string
  createdAt: string
  submission: {
    id: string
    title: string
    description?: string
    teamId?: string | null
    userId: string
    averageScore?: number | null
    team?: { id: string; name: string } | null
    user?: UserSummary
  }
  selector: UserSummary
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}
