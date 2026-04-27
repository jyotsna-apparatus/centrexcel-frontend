/**
 * Challenge module types — aligned with the new backend schema.
 *
 * A Challenge is either a hackathon (3 embedded stages: ideation → concept → project)
 * or a startup challenge (N-day daily entries, no final submission). Teams are
 * challenge-scoped with a lockedTeamSize chosen at enrollment.
 */

export type ChallengeType = "hackathon" | "startup";

export type ChallengeStatus =
  | "draft"
  | "open"
  | "submission_closed"
  | "closed"
  | "cancelled";

export type ChallengeApprovalStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "changes_requested";

export type HackathonStageType = "ideation" | "concept" | "project";

export type HackathonStageStatus =
  | "pending"
  | "active"
  | "shortlisting"
  | "completed";

export type ChallengeParticipationStatus =
  | "pending_payment"
  | "active"
  | "eliminated"
  | "withdrawn";

export type NotificationType =
  | "stage_shortlisted"
  | "stage_not_shortlisted"
  | "stage_promoted"
  | "stage_eliminated"
  | "challenge_winner_announced"
  | "challenge_approval_updated"
  | "enrollment_payment_captured"
  | "enrollment_team_joined";

export interface UserSummary {
  id: string;
  name?: string | null;
  email: string;
  username?: string | null;
  profilePic?: string | null;
}

export interface ChallengeJudge {
  id: string;
  challengeId: string;
  judgeId: string;
  judge: UserSummary;
}

export interface ChallengePricingTier {
  id?: string;
  challengeId?: string;
  teamSize: number;
  discountPercent: number;
}

export interface PricingTierPreview {
  teamSize: number;
  discountPercent: number;
  fullPriceRupees: number;
  payableRupees: number;
  payablePaisa: number;
  savingsRupees: number;
}

export interface PricingPreview {
  isPaid: boolean;
  priceOfEntry: number | null;
  maxTeamSize: number;
  tiers: PricingTierPreview[];
}

export interface HackathonStage {
  id: string;
  challengeId: string;
  stageType: HackathonStageType;
  stageOrder: number;
  instructions: string;
  applyDeadline: string;
  submissionDeadline: string;
  reviewDeadline: string;
  status: HackathonStageStatus;
  closedAt: string | null;
  closedById: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    submissions: number;
    selections: number;
  };
}

export interface DailyInstruction {
  dayNumber: number;
  instruction: string;
}

export interface Challenge {
  id: string;
  title: string;
  shortDescription: string;
  image: string | null;
  instructions: string;
  challengeType: ChallengeType;
  status: ChallengeStatus;
  approvalStatus: ChallengeApprovalStatus;
  adminFeedback: string | null;
  sponsorId: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  isPaid: boolean;
  priceOfEntry: number | null;
  maxTeamSize: number;
  startupDurationDays: number | null;
  startupStartAt: string | null;
  dailyInstructions: DailyInstruction[] | null;
  createdAt: string;
  updatedAt: string;

  sponsor?: UserSummary;
  reviewedBy?: UserSummary | null;
  judges?: ChallengeJudge[];
  stages?: HackathonStage[];
  pricingTiers?: ChallengePricingTier[];
  _count?: {
    participations?: number;
    teams?: number;
  };
}

export interface TeamSummary {
  id: string;
  name: string;
  inviteCode: string;
  leaderId: string;
  lockedTeamSize: number;
  paidAmount: number;
  challengeId: string;
  members: Array<{
    id: string;
    userId: string;
    role: "leader" | "member";
    user: UserSummary;
  }>;
}

/** Minimal score row returned on stage submission listings */
export interface StageSubmissionScoreSummary {
  id: string;
  judgeId: string;
  score: number;
  feedback: string | null;
}

export interface StageSubmission {
  id: string;
  stageId: string;
  participationId: string;
  userId: string;
  teamId: string;
  title: string;
  description: string;
  filePath: string;
  fileSize: number;
  averageScore: number | null;
  createdAt: string;
  updatedAt: string;
  stage?: HackathonStage;
  team?: TeamSummary;
  user?: UserSummary;
  /** Present on judge/sponsor stage listing when backend includes relations */
  scores?: StageSubmissionScoreSummary[];
}

export interface DailyChallengeEntry {
  id: string;
  challengeId: string;
  participationId: string;
  userId: string;
  teamId?: string | null;
  dayNumber: number;
  entryDate?: string;
  feedbackMessage: string;
  filePath: string;
  fileSize: number;
  createdAt: string;
  user?: UserSummary;
}

export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  userId: string;
  teamId: string;
  status: ChallengeParticipationStatus;
  currentStageOrder: number | null;
  createdAt: string;
  updatedAt: string;
  user?: UserSummary;
  team?: TeamSummary;
  challenge?: Challenge;
  stageSubmissions?: StageSubmission[];
  dailyEntries?: DailyChallengeEntry[];
  stageSelections?: Array<{ id: string; stageId: string }>;
}

export interface JudgeScore {
  id: string;
  stageSubmissionId: string;
  judgeId: string;
  score: number;
  feedback: string | null;
  createdAt: string;
  judge: UserSummary;
}

export interface Winner {
  id: string;
  challengeId: string;
  stageSubmissionId: string;
  position: 1 | 2 | 3;
  selectedBy: string;
  createdAt: string;
  stageSubmission: StageSubmission;
  selector: UserSummary;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
