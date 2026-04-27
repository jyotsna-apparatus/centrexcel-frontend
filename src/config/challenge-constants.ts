/**
 * Challenge module constants — mirror backend validation.
 */
export const CHALLENGE_CONSTANTS = {
  TEAM_SIZE: { MIN: 1, MAX: 4 },
  JUDGE_COUNT: { MIN: 1, MAX: 5 },
  WINNER_POSITIONS: { FIRST: 1, SECOND: 2, THIRD: 3, MAX: 3 },
  SCORE_RANGE: { MIN: 0, MAX: 100 },
  STARTUP_DURATION: { MIN: 1, MAX: 90 },
  DISCOUNT_RANGE: { MIN: 0, MAX: 100 },
  TEXT_LIMITS: {
    TITLE: 200,
    SHORT_DESCRIPTION: 500,
    INSTRUCTIONS: 10_000,
    DESCRIPTION: 5_000,
    FEEDBACK: 5_000,
    DAILY_INSTRUCTION: 1_000,
  },
  FILE_LIMITS: {
    MAX_SUBMISSION_SIZE: 134_217_728,
    MAX_IMAGE_SIZE: 2_097_152,
    MAX_IMAGE_WIDTH: 3000,
    MAX_IMAGE_HEIGHT: 2000,
    ALLOWED_IMAGE_TYPES: ["image/webp", "image/png", "image/jpeg", "image/jpg"],
  },
  BANNER_ASPECT_RATIO: "5:3",
} as const;

export const CHALLENGE_TYPE_LABELS: Record<string, string> = {
  hackathon: "Hackathon Challenge",
  startup: "Startup Challenge",
};

export const CHALLENGE_TYPE_DESCRIPTIONS: Record<string, string> = {
  hackathon:
    "3 fixed stages (Ideation → Concept → Project). Participants submit a ZIP at each stage; admin/sponsor shortlists; judges score the final stage.",
  startup:
    "Daily-entry sprint for N days. Participants post one update per day following daily instructions — no final submission.",
};

export const CHALLENGE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  submission_closed: "Submission closed",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const CHALLENGE_APPROVAL_LABELS: Record<string, string> = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes requested",
};

export const STAGE_TYPE_LABELS: Record<string, string> = {
  ideation: "Ideation",
  concept: "Concept",
  project: "Project",
};

export const STAGE_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  shortlisting: "Shortlisting",
  completed: "Completed",
};

export const PARTICIPATION_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  active: "Active",
  eliminated: "Eliminated",
  withdrawn: "Withdrawn",
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  stage_shortlisted: "Shortlisted",
  stage_not_shortlisted: "Not shortlisted",
  stage_promoted: "Promoted to next stage",
  stage_eliminated: "Eliminated",
  challenge_winner_announced: "Winner announced",
  challenge_approval_updated: "Approval updated",
  enrollment_payment_captured: "Payment captured",
  enrollment_team_joined: "Teammate joined",
};

export const DEFAULT_PRICING_TIERS = [
  { teamSize: 1, discountPercent: 0 },
  { teamSize: 2, discountPercent: 10 },
  { teamSize: 3, discountPercent: 20 },
  { teamSize: 4, discountPercent: 25 },
] as const;
