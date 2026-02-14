/**
 * Hackathon module constants — mirror backend validation (HACKATHON_FRONTEND_INTEGRATION.md)
 */
export const HACKATHON_CONSTANTS = {
  TEAM_SIZE: { MIN: 1, MAX: 5 },
  JUDGE_COUNT: { MIN: 1, MAX: 5 },
  WINNER_POSITIONS: { FIRST: 1, SECOND: 2, THIRD: 3, MAX: 3 },
  SCORE_RANGE: { MIN: 0, MAX: 100 },
  TEXT_LIMITS: {
    TITLE: 200,
    SHORT_DESCRIPTION: 500,
    INSTRUCTIONS: 10_000,
    DESCRIPTION: 5_000,
    FEEDBACK: 5_000,
  },
  FILE_LIMITS: {
    MAX_SUBMISSION_SIZE: 134_217_728, // 128 MB
    MAX_IMAGE_SIZE: 2_097_152, // 2 MB
    MAX_IMAGE_WIDTH: 3000,
    MAX_IMAGE_HEIGHT: 2000,
    ALLOWED_IMAGE_TYPES: ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'],
  },
  /** Banner image must be 5:3 aspect ratio (e.g. 500×300, 1000×600) */
  BANNER_ASPECT_RATIO: '5:3',
} as const

export const HACKATHON_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  submission_closed: 'Submission closed',
  closed: 'Closed',
  cancelled: 'Cancelled',
}
