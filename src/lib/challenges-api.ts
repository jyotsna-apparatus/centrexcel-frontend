/**
 * Challenges API — client for the rewritten backend (/api/challenges).
 *
 * Keeps a thin layer; auth/header handling is inherited from auth-api's fetch
 * helpers via a shared authenticatedGetJson util. We deliberately keep this
 * module free of heavy dependencies so it can be pulled into any page.
 */
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/auth";
import { refresh } from "@/lib/auth-api";
import type {
  Challenge,
  ChallengeParticipation,
  ChallengeType,
  ChallengeStatus,
  ChallengeApprovalStatus,
  DailyChallengeEntry,
  HackathonStage,
  Notification,
  PaginationMeta,
  PricingPreview,
  StageSubmission,
  Winner,
} from "@/types/challenge";

/** GET /challenges/:challengeId/my-daily-history */
export interface MyDailyHistoryPayload {
  challenge: Challenge;
  participation?: ChallengeParticipation | null;
  entries: DailyChallengeEntry[];
  currentDay: number;
  canSubmit: boolean;
}

const DEFAULT_BACKEND_BASE_URL = "http://localhost:5080/api";
export const getBaseUrl = (): string => {
  if (typeof window !== "undefined") return "/api";
  const raw = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  return (raw ?? DEFAULT_BACKEND_BASE_URL).replace(/\/$/, "");
};

async function doFetch(path: string, init: RequestInit): Promise<Response> {
  const url = `${getBaseUrl()}${path}`;
  try {
    return await fetch(url, init);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg === "Failed to fetch" ||
      msg.includes("NetworkError") ||
      msg.includes("Load failed")
    ) {
      throw new Error(
        "Cannot reach the server. Check that the backend is running.",
      );
    }
    throw err;
  }
}

export async function authedFetch(
  path: string,
  init: RequestInit = {},
  { retry = true }: { retry?: boolean } = {},
): Promise<Response> {
  const token = getAccessToken();
  const headers = {
    ...(init.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res = await doFetch(path, { ...init, headers });
  if (res.status === 401 && retry) {
    const rt = getRefreshToken();
    if (rt) {
      try {
        const refreshed = await refresh(rt);
        setTokens(refreshed.data.accessToken, refreshed.data.refreshToken);
        const retryHeaders = {
          ...(init.headers as Record<string, string> | undefined),
          Authorization: `Bearer ${refreshed.data.accessToken}`,
        };
        res = await doFetch(path, { ...init, headers: retryHeaders });
      } catch {
        clearTokens();
      }
    }
  }
  return res;
}

export async function parseJson<T>(res: Response, label: string): Promise<T> {
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-json body */
  }
  if (!res.ok) {
    const msg =
      (json as { message?: string } | null)?.message ??
      text.slice(0, 200) ??
      `${label} failed (${res.status})`;
    throw new Error(msg);
  }
  return (json as { data?: T; success?: boolean })?.data as T;
}

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  const usp = new URLSearchParams();
  for (const [k, v] of entries) {
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, String(x)));
    else usp.append(k, String(v));
  }
  return `?${usp.toString()}`;
}

// =============================================================================
// Challenges: list / get / featured
// =============================================================================

export interface ListChallengesParams {
  page?: number; // 1-based for API
  limit?: number;
  search?: string;
  status?: ChallengeStatus;
  challengeType?: ChallengeType;
  approvalStatus?: ChallengeApprovalStatus;
  mine?: boolean; // sponsor: only own; judge: only assigned
  /** Admin: filter challenges by sponsor */
  sponsorId?: string;
  /** Admin: filter challenges where user is assigned judge */
  judgeId?: string;
}

export interface PaginatedChallenges {
  data: Challenge[];
  pagination: PaginationMeta;
}

export async function listChallenges(
  params: ListChallengesParams = {},
): Promise<PaginatedChallenges> {
  const path = `/challenges${qs({ ...params })}`;
  const res = await authedFetch(path, { method: "GET" });
  const payload = await parseJson<Partial<PaginatedChallenges>>(
    res,
    "List challenges",
  );
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    pagination:
      payload?.pagination ?? {
        page: 1,
        limit: params.limit ?? 12,
        total: 0,
        totalPages: 0,
      },
  };
}

export async function getFeaturedChallenges(limit = 3): Promise<Challenge[]> {
  const res = await doFetch(`/challenges/featured${qs({ limit })}`, {
    method: "GET",
  });
  return parseJson<Challenge[]>(res, "Get featured challenges");
}

export async function getChallenge(id: string): Promise<Challenge> {
  const res = await authedFetch(`/challenges/${id}`, { method: "GET" });
  return parseJson<Challenge>(res, "Get challenge");
}

export async function deleteChallenge(id: string): Promise<void> {
  const res = await authedFetch(`/challenges/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Delete failed (${res.status})`);
  }
}

// =============================================================================
// Admin review
// =============================================================================

export type ReviewAction = "approve" | "reject" | "request_changes";

export async function reviewChallenge(
  id: string,
  action: ReviewAction,
  feedback?: string,
): Promise<Challenge> {
  const res = await authedFetch(`/challenges/${id}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, adminFeedback: feedback }),
  });
  return parseJson<Challenge>(res, "Review challenge");
}

// =============================================================================
// Pricing preview
// =============================================================================

export async function getPricingPreview(challengeId: string): Promise<PricingPreview> {
  const res = await authedFetch(`/challenges/${challengeId}/pricing`, {
    method: "GET",
  });
  return parseJson<PricingPreview>(res, "Get pricing");
}

// =============================================================================
// Enrollment
// =============================================================================

export interface StartEnrollmentFreeResult {
  kind: "free";
  participationId: string;
  teamId: string;
  inviteCode: string;
}

export interface StartEnrollmentPaidResult {
  kind: "paid";
  teamId: string;
  inviteCode: string;
  merchantOrderId: string;
  redirectUrl: string;
  amountPaisa: number;
}

export type StartEnrollmentResult =
  | StartEnrollmentFreeResult
  | StartEnrollmentPaidResult;

export async function startEnrollment(
  challengeId: string,
  input: { teamSize: number; teamName: string },
): Promise<StartEnrollmentResult> {
  const res = await authedFetch(`/challenges/${challengeId}/enroll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<StartEnrollmentResult>(res, "Start enrollment");
}

export async function confirmEnrollment(
  challengeId: string,
  merchantOrderId: string,
): Promise<ChallengeParticipation> {
  const res = await authedFetch(`/challenges/${challengeId}/enroll/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantOrderId }),
  });
  return parseJson<ChallengeParticipation>(res, "Confirm enrollment");
}

export async function joinTeamByInvite(
  inviteCode: string,
): Promise<ChallengeParticipation> {
  const res = await authedFetch(`/participations/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inviteCode }),
  });
  return parseJson<ChallengeParticipation>(res, "Join team");
}

// =============================================================================
// Participations
// =============================================================================

export interface PaginatedParticipations {
  data: ChallengeParticipation[];
  pagination: PaginationMeta;
}

export async function getMyParticipations(params: {
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedParticipations> {
  const res = await authedFetch(`/participations${qs(params)}`, {
    method: "GET",
  });
  const payload = await parseJson<{
    data?: ChallengeParticipation[];
    pagination?: PaginationMeta;
  }>(res, "Participations");
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    pagination:
      payload?.pagination ?? {
        page: 1,
        limit: params.limit ?? 10,
        total: 0,
        totalPages: 0,
      },
  };
}

export async function getMyChallengeParticipation(
  challengeId: string,
): Promise<ChallengeParticipation | null> {
  const res = await authedFetch(`/challenges/${challengeId}/my-participation`, {
    method: "GET",
  });
  if (res.status === 404) return null;
  const raw = await parseJson<ChallengeParticipation | Record<string, never> | null>(
    res,
    "Get my participation",
  );
  if (raw == null || typeof raw !== "object") return null;
  // Legacy / bug: API used to coerce null → {} so clients saw "participation" with no fields.
  if (!("id" in raw) || !raw.id || !("status" in raw) || raw.status == null) {
    return null;
  }
  return raw as ChallengeParticipation;
}

/** Admin / sponsor: all participations for a challenge (sponsor must own it). */
export async function listChallengeParticipations(
  challengeId: string,
): Promise<ChallengeParticipation[]> {
  const res = await authedFetch(`/challenges/${challengeId}/participations`, {
    method: "GET",
  });
  return parseJson<ChallengeParticipation[]>(res, "Challenge participations");
}

// =============================================================================
// Hackathon stages
// =============================================================================

export async function listChallengeStages(
  challengeId: string,
): Promise<HackathonStage[]> {
  const res = await authedFetch(`/challenges/${challengeId}/stages`, {
    method: "GET",
  });
  return parseJson<HackathonStage[]>(res, "List stages");
}

export async function getChallengeStage(
  challengeId: string,
  stageId: string,
): Promise<HackathonStage> {
  const res = await authedFetch(`/challenges/${challengeId}/stages/${stageId}`, {
    method: "GET",
  });
  return parseJson<HackathonStage>(res, "Get stage");
}

export async function closeStage(
  challengeId: string,
  stageId: string,
): Promise<HackathonStage> {
  const res = await authedFetch(
    `/challenges/${challengeId}/stages/${stageId}/close`,
    { method: "POST" },
  );
  return parseJson<HackathonStage>(res, "Close stage");
}

export interface UpdateStageInput {
  instructions?: string;
  applyDeadline?: string;
  submissionDeadline?: string;
  reviewDeadline?: string;
}

export async function updateStage(
  challengeId: string,
  stageId: string,
  input: UpdateStageInput,
): Promise<HackathonStage> {
  const res = await authedFetch(
    `/challenges/${challengeId}/stages/${stageId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return parseJson<HackathonStage>(res, "Update stage");
}

export async function shortlistStage(
  challengeId: string,
  stageId: string,
  participationIds: string[],
): Promise<{
  shortlistedCount: number;
  stageId: string;
  nextStageId: string;
}> {
  const res = await authedFetch(
    `/challenges/${challengeId}/stages/${stageId}/shortlist`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participationIds }),
    },
  );
  return parseJson(res, "Shortlist");
}

export async function getMyStageEligibility(
  challengeId: string,
  stageId: string,
): Promise<{
  canSubmit: boolean;
  alreadySubmitted: boolean;
  wasShortlisted: boolean;
  stage: HackathonStage;
}> {
  const res = await authedFetch(
    `/challenges/${challengeId}/stages/${stageId}/my-eligibility`,
    { method: "GET" },
  );
  return parseJson(res, "Stage eligibility");
}

export async function listChallengeStageSubmissions(
  challengeId: string,
  stageId?: string,
): Promise<StageSubmission[]> {
  const path = stageId
    ? `/challenges/${challengeId}/stages/${stageId}/submissions`
    : `/challenges/${challengeId}/submissions`;
  const res = await authedFetch(path, { method: "GET" });
  return parseJson<StageSubmission[]>(res, "List submissions");
}

// =============================================================================
// Daily entries (startup challenges)
// =============================================================================

export async function getMyDailyHistory(
  challengeId: string,
): Promise<MyDailyHistoryPayload> {
  const res = await authedFetch(
    `/challenges/${challengeId}/my-daily-history`,
    { method: "GET" },
  );
  return parseJson<MyDailyHistoryPayload>(res, "Daily history");
}

export async function listChallengeDailyEntries(
  challengeId: string,
): Promise<DailyChallengeEntry[]> {
  const res = await authedFetch(
    `/challenges/${challengeId}/daily-entries`,
    { method: "GET" },
  );
  return parseJson<DailyChallengeEntry[]>(res, "Daily entries");
}

// =============================================================================
// Winners
// =============================================================================

export async function getChallengeWinners(
  challengeId: string,
): Promise<Winner[]> {
  const res = await authedFetch(`/winners/challenge/${challengeId}`, {
    method: "GET",
  });
  return parseJson<Winner[]>(res, "Get winners");
}

export async function selectWinner(input: {
  challengeId: string;
  stageSubmissionId: string;
  position: 1 | 2 | 3;
}): Promise<Winner> {
  const res = await authedFetch("/winners", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<Winner>(res, "Select winner");
}

export async function removeWinner(winnerId: string): Promise<void> {
  const res = await authedFetch(`/winners/${winnerId}`, { method: "DELETE" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Remove winner failed (${res.status})`);
  }
}

// =============================================================================
// Teams
// =============================================================================

export async function patchTeamName(teamId: string, name: string): Promise<unknown> {
  const res = await authedFetch(`/teams/${teamId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return parseJson(res, "Update team");
}

export async function deleteTeamById(teamId: string): Promise<void> {
  const res = await authedFetch(`/teams/${teamId}`, { method: "DELETE" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Delete team failed (${res.status})`);
  }
}

export async function removeTeamMemberById(
  teamId: string,
  userId: string,
): Promise<void> {
  const res = await authedFetch(`/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Remove member failed (${res.status})`);
  }
}

export async function leaveTeam(teamId: string): Promise<void> {
  const res = await authedFetch(`/teams/${teamId}/members/me`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Leave team failed (${res.status})`);
  }
}

// =============================================================================
// Notifications
// =============================================================================

export async function listNotifications(params: {
  page?: number;
  limit?: number;
} = {}): Promise<{ data: Notification[]; pagination: PaginationMeta }> {
  const res = await authedFetch(`/notifications${qs(params)}`, {
    method: "GET",
  });
  const payload = await parseJson<{
    data?: Notification[];
    pagination?: PaginationMeta;
  }>(res, "Notifications");
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    pagination:
      payload?.pagination ?? {
        page: 1,
        limit: params.limit ?? 20,
        total: 0,
        totalPages: 0,
      },
  };
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await authedFetch(`/notifications/unread-count`, {
    method: "GET",
  });
  const data = await parseJson<{ count: number }>(res, "Unread count");
  return data.count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await authedFetch(`/notifications/${id}/read`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Mark read failed (${res.status})`);
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await authedFetch(`/notifications/read-all`, { method: "POST" });
  if (!res.ok) throw new Error(`Mark all read failed (${res.status})`);
}

// =============================================================================
// Create / update (multipart)
// =============================================================================

export interface CreateHackathonChallengeInput {
  title: string;
  shortDescription: string;
  instructions: string;
  challengeType: "hackathon";
  sponsorId?: string;
  judgeIds?: string[];
  isPaid?: boolean;
  priceOfEntry?: number;
  pricingTiers?: Array<{ teamSize: number; discountPercent: number }>;
  stages: Array<{
    stageType: "ideation" | "concept" | "project";
    stageOrder: 1 | 2 | 3;
    instructions: string;
    applyDeadline: string; // ISO
    submissionDeadline: string;
    reviewDeadline: string;
  }>;
  status?: "open" | "draft";
  image?: File | null;
}

export interface CreateStartupChallengeInput {
  title: string;
  shortDescription: string;
  instructions: string;
  challengeType: "startup";
  sponsorId?: string;
  judgeIds?: string[];
  isPaid?: boolean;
  priceOfEntry?: number;
  pricingTiers?: Array<{ teamSize: number; discountPercent: number }>;
  startupDurationDays: number;
  startupStartAt: string; // ISO
  dailyInstructions: Array<{ dayNumber: number; instruction: string }>;
  status?: "open" | "draft";
  image?: File | null;
}

export type CreateChallengeInput =
  | CreateHackathonChallengeInput
  | CreateStartupChallengeInput;

function buildChallengeFormData(input: CreateChallengeInput): FormData {
  const fd = new FormData();
  fd.set("title", input.title);
  fd.set("shortDescription", input.shortDescription);
  fd.set("instructions", input.instructions);
  fd.set("challengeType", input.challengeType);
  if (input.sponsorId) fd.set("sponsorId", input.sponsorId);
  if (input.judgeIds?.length) fd.set("judgeIds", JSON.stringify(input.judgeIds));
  if (typeof input.isPaid === "boolean") fd.set("isPaid", String(input.isPaid));
  if (typeof input.priceOfEntry === "number")
    fd.set("priceOfEntry", String(input.priceOfEntry));
  if (input.pricingTiers?.length)
    fd.set("pricingTiers", JSON.stringify(input.pricingTiers));
  if (input.status) fd.set("status", input.status);
  if (input.challengeType === "hackathon") {
    fd.set("stages", JSON.stringify(input.stages));
  } else {
    fd.set("startupDurationDays", String(input.startupDurationDays));
    fd.set("startupStartAt", input.startupStartAt);
    fd.set("dailyInstructions", JSON.stringify(input.dailyInstructions));
  }
  if (input.image) fd.set("image", input.image);
  return fd;
}

export async function createChallenge(
  input: CreateChallengeInput,
): Promise<Challenge> {
  const fd = buildChallengeFormData(input);
  const res = await authedFetch(`/challenges`, { method: "POST", body: fd });
  return parseJson<Challenge>(res, "Create challenge");
}

/**
 * Fields editable via PUT /challenges/:id. Excludes `challengeType` (immutable),
 * hackathon `stages` (edited per-stage via stage endpoints) and
 * `startupDurationDays` (locked after create).
 */
export interface UpdateChallengeInput {
  title?: string;
  shortDescription?: string;
  instructions?: string;
  sponsorId?: string;
  judgeIds?: string[];
  isPaid?: boolean;
  priceOfEntry?: number | null;
  pricingTiers?: Array<{ teamSize: number; discountPercent: number }>;
  status?: "open" | "draft" | "submission_closed" | "closed" | "cancelled";
  startupStartAt?: string; // ISO
  dailyInstructions?: Array<{ dayNumber: number; instruction: string }>;
  image?: File | null;
}

function buildUpdateChallengeFormData(input: UpdateChallengeInput): FormData {
  const fd = new FormData();
  if (input.title !== undefined) fd.set("title", input.title);
  if (input.shortDescription !== undefined)
    fd.set("shortDescription", input.shortDescription);
  if (input.instructions !== undefined)
    fd.set("instructions", input.instructions);
  if (input.sponsorId) fd.set("sponsorId", input.sponsorId);
  if (input.judgeIds !== undefined)
    fd.set("judgeIds", JSON.stringify(input.judgeIds));
  if (typeof input.isPaid === "boolean") fd.set("isPaid", String(input.isPaid));
  if (input.priceOfEntry !== undefined && input.priceOfEntry !== null)
    fd.set("priceOfEntry", String(input.priceOfEntry));
  if (input.pricingTiers !== undefined)
    fd.set("pricingTiers", JSON.stringify(input.pricingTiers));
  if (input.status) fd.set("status", input.status);
  if (input.startupStartAt) fd.set("startupStartAt", input.startupStartAt);
  if (input.dailyInstructions !== undefined)
    fd.set("dailyInstructions", JSON.stringify(input.dailyInstructions));
  if (input.image) fd.set("image", input.image);
  return fd;
}

export async function updateChallenge(
  id: string,
  input: UpdateChallengeInput,
): Promise<Challenge> {
  const fd = buildUpdateChallengeFormData(input);
  const res = await authedFetch(`/challenges/${id}`, {
    method: "PUT",
    body: fd,
  });
  return parseJson<Challenge>(res, "Update challenge");
}
