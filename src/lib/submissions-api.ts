/**
 * Client for /api/submissions — chunked zip uploads, downloads, scores.
 */
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/auth";
import { authedFetch, getBaseUrl, parseJson } from "@/lib/challenges-api";
import { refresh } from "@/lib/auth-api";
import type { DailyChallengeEntry, JudgeScore, StageSubmission } from "@/types/challenge";

export const SUBMISSION_FILE_LIMITS = {
  MAX_BYTES: 134217728, // 128 MiB
  DEFAULT_CHUNK_BYTES: 5242880, // 5 MiB
  MAX_CHUNK_BYTES: 10485760, // 10 MiB
} as const;

export type ChunkUploadPurpose = "stage_submission" | "daily_entry";

export interface InitUploadSessionResult {
  id: string;
  totalChunks: number;
  chunkSize: number;
  expiresAt: string;
  status: string;
  purpose: string;
}

export interface ChunkProgress {
  sessionId: string;
  receivedChunks: number;
  totalChunks: number;
  progressPercent: number;
}

async function doFetch(path: string, init: RequestInit): Promise<Response> {
  const url = `${getBaseUrl()}${path}`;
  return fetch(url, init);
}

async function authedRawFetch(
  path: string,
  init: RequestInit,
  { retry = true }: { retry?: boolean } = {},
): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
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
        res = await doFetch(path, {
          ...init,
          headers: {
            ...(init.headers as Record<string, string> | undefined),
            Authorization: `Bearer ${refreshed.data.accessToken}`,
          },
        });
      } catch {
        clearTokens();
      }
    }
  }
  return res;
}

export function computeChunkPlan(totalSize: number, chunkSize: number) {
  const totalChunks = Math.ceil(totalSize / chunkSize);
  return { totalChunks, chunkSize };
}

export async function initSubmissionUpload(input: {
  challengeId: string;
  purpose: ChunkUploadPurpose;
  stageId?: string;
  originalFileName: string;
  mimeType: string;
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
}): Promise<InitUploadSessionResult> {
  const res = await authedFetch("/submissions/uploads/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<InitUploadSessionResult>(res, "Init upload");
}

export async function uploadSubmissionChunk(
  sessionId: string,
  chunkIndex: number,
  chunk: Blob,
): Promise<ChunkProgress> {
  const buf = await chunk.arrayBuffer();
  const res = await authedRawFetch(
    `/submissions/uploads/${sessionId}/chunks/${chunkIndex}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: buf,
    },
  );
  return parseJson<ChunkProgress>(res, "Upload chunk");
}

export async function completeStageUpload(
  sessionId: string,
  body: { title: string; description?: string },
): Promise<StageSubmission> {
  const res = await authedFetch(
    `/submissions/uploads/${sessionId}/complete/stage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return parseJson<StageSubmission>(res, "Complete stage upload");
}

export async function completeDailyUpload(
  sessionId: string,
  body: { dayNumber: number; feedbackMessage: string },
): Promise<DailyChallengeEntry> {
  const res = await authedFetch(
    `/submissions/uploads/${sessionId}/complete/daily`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return parseJson<DailyChallengeEntry>(res, "Complete daily upload");
}

export async function abortSubmissionUpload(sessionId: string): Promise<void> {
  const res = await authedFetch(`/submissions/uploads/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Abort upload failed (${res.status})`);
  }
}

export async function getStageSubmissionById(id: string): Promise<StageSubmission> {
  const res = await authedFetch(`/submissions/stage/${id}`, { method: "GET" });
  return parseJson<StageSubmission>(res, "Get stage submission");
}

export async function deleteStageSubmission(id: string): Promise<void> {
  const res = await authedFetch(`/submissions/stage/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Delete submission failed (${res.status})`);
  }
}

export async function deleteDailyEntry(id: string): Promise<void> {
  const res = await authedFetch(`/submissions/daily/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Delete daily entry failed (${res.status})`);
  }
}

function parseFilenameFromDisposition(cd: string | null): string | null {
  if (!cd) return null;
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(cd);
  return m?.[1]?.trim() ?? null;
}

async function downloadAuthedBlob(apiPath: string): Promise<{ blob: Blob; filename: string }> {
  const url = `${getBaseUrl()}${apiPath}`;
  const token = getAccessToken();
  let res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    const rt = getRefreshToken();
    if (rt) {
      try {
        const refreshed = await refresh(rt);
        setTokens(refreshed.data.accessToken, refreshed.data.refreshToken);
        res = await fetch(url, {
          headers: { Authorization: `Bearer ${refreshed.data.accessToken}` },
        });
      } catch {
        clearTokens();
      }
    }
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Download failed (${res.status})`);
  }
  const cd = res.headers.get("Content-Disposition");
  const filename =
    parseFilenameFromDisposition(cd) ?? "download.zip";
  const blob = await res.blob();
  return { blob, filename };
}

export async function downloadStageSubmissionFile(
  submissionId: string,
): Promise<{ blob: Blob; filename: string }> {
  return downloadAuthedBlob(`/submissions/stage/${submissionId}/download`);
}

export async function downloadDailyEntryFile(
  entryId: string,
): Promise<{ blob: Blob; filename: string }> {
  return downloadAuthedBlob(`/submissions/daily/${entryId}/download`);
}

export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// —— Scores (judges) ——
export async function createJudgeScore(input: {
  stageSubmissionId: string;
  score: number;
  feedback?: string | null;
}): Promise<JudgeScore> {
  const res = await authedFetch("/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<JudgeScore>(res, "Create score");
}

export async function getSubmissionScores(
  stageSubmissionId: string,
): Promise<JudgeScore[]> {
  const res = await authedFetch(`/scores/submission/${stageSubmissionId}`, {
    method: "GET",
  });
  return parseJson<JudgeScore[]>(res, "Get scores");
}
