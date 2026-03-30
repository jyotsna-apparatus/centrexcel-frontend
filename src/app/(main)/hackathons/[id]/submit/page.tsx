"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Download, FileUp } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SUBMISSION_MODE } from "@/config/hackathon-constants";
import { useHackathon } from "@/hooks/use-hackathons";
import { useMySubmissionThread } from "@/hooks/use-submissions";
import {
  abortDailyThreadChunkUpload,
  abortFinalSubmissionChunkUpload,
  completeDailyThreadChunkUpload,
  completeFinalSubmissionChunkUpload,
  downloadThreadEntry,
  getParticipationForHackathon,
  initDailyThreadChunkUpload,
  initFinalSubmissionChunkUpload,
  uploadDailyThreadChunk,
  uploadFinalSubmissionChunk,
} from "@/lib/auth-api";
import {
  getCurrentDailyDayNumber,
  getInstructionForDay,
} from "@/lib/hackathon-deadlines";

export default function HackathonSubmitPage() {
  const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024;
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const id = typeof params.id === "string" ? params.id : "";
  const solo = searchParams.get("solo") === "1";
  const teamId = searchParams.get("teamId") ?? undefined;

  const { data: hackathon, isLoading: hackathonLoading } = useHackathon(
    id || null,
  );
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [finalTitle, setFinalTitle] = useState("");
  const [finalDescription, setFinalDescription] = useState("");
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [finalUploadPercent, setFinalUploadPercent] = useState(0);
  const [finalCurrentChunk, setFinalCurrentChunk] = useState(0);
  const [finalTotalChunks, setFinalTotalChunks] = useState(0);
  const [finalUploadError, setFinalUploadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [downloadingEntryId, setDownloadingEntryId] = useState<string | null>(
    null,
  );
  const [uploadPercent, setUploadPercent] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const activeUploadSessionRef = useRef<string | null>(null);
  const activeFinalUploadSessionRef = useRef<string | null>(null);
  const { data: thread, isLoading: threadLoading } = useMySubmissionThread(
    id || null,
  );
  const { data: participation } = useQuery({
    queryKey: ["participation", "hackathon", id],
    queryFn: () => getParticipationForHackathon(id),
    enabled: !!id,
  });

  const threadEntries = thread?.entries ?? [];
  const sortedThreadEntries = [...threadEntries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const hasFinalSubmitted = Boolean(participation?.hasSubmitted);

  const hasSubmittedToday =
    !hasFinalSubmitted &&
    Boolean(
      threadEntries.some((entry) => {
        const submittedDay = new Date(entry.entryDate)
          .toISOString()
          .slice(0, 10);
        const today = new Date().toISOString().slice(0, 10);
        return submittedDay === today;
      }),
    );

  const resetUploadProgress = () => {
    setUploadPercent(0);
    setCurrentChunk(0);
    setTotalChunks(0);
    activeUploadSessionRef.current = null;
  };

  useEffect(() => {
    return () => {
      const sessionId = activeUploadSessionRef.current;
      if (sessionId) {
        void abortDailyThreadChunkUpload(sessionId).catch(() => undefined);
      }
      const finalSessionId = activeFinalUploadSessionRef.current;
      if (finalSessionId) {
        void abortFinalSubmissionChunkUpload(finalSessionId).catch(
          () => undefined,
        );
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    const message = feedbackMessage.trim();
    if (!message) {
      toast.error("Please enter feedback message.");
      return;
    }
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (hasSubmittedToday) {
      toast.error("You have already submitted an update today.");
      return;
    }
    if (hasFinalSubmitted) {
      toast.error("Daily updates are not available after a final submission.");
      return;
    }
    setIsUploading(true);
    resetUploadProgress();
    try {
      const totalSize = file.size;
      const chunkSize = Math.min(
        Math.max(DEFAULT_CHUNK_SIZE, 5 * 1024 * 1024),
        10 * 1024 * 1024,
      );
      const computedTotalChunks = Math.ceil(totalSize / chunkSize);
      setTotalChunks(computedTotalChunks);

      const init = await initDailyThreadChunkUpload({
        hackathonId: id,
        teamId: solo ? undefined : teamId,
        originalFileName: file.name,
        mimeType: file.type || "application/octet-stream",
        totalSize,
        chunkSize,
        totalChunks: computedTotalChunks,
      });
      activeUploadSessionRef.current = init.id;

      for (let chunkIndex = 0; chunkIndex < computedTotalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const chunkBlob = file.slice(start, end);
        const progress = await uploadDailyThreadChunk(
          init.id,
          chunkIndex,
          chunkBlob,
        );
        setCurrentChunk(progress.receivedChunks);
        setUploadPercent(progress.progressPercent);
      }

      await completeDailyThreadChunkUpload(init.id, message);
      toast.success("Daily update posted successfully.");
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["hackathons"] });
      queryClient.invalidateQueries({ queryKey: ["submission-thread-me", id] });
      queryClient.invalidateQueries({
        queryKey: ["submission-threads-hackathon", id],
      });
      setFeedbackMessage("");
      setFile(null);
      resetUploadProgress();
    } catch (err) {
      const sessionId = activeUploadSessionRef.current;
      if (sessionId) {
        try {
          await abortDailyThreadChunkUpload(sessionId);
        } catch {
          // no-op
        }
      }
      const messageText =
        err instanceof Error ? err.message : "Chunked upload failed";
      setUploadError(messageText);
      toast.error(messageText);
      resetUploadProgress();
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFinalUploadError(null);
    if (hasFinalSubmitted) {
      toast.error("Final submission already completed.");
      return;
    }
    const title = finalTitle.trim();
    if (!title) {
      toast.error("Please enter final submission title.");
      return;
    }
    if (!finalFile) {
      toast.error("Please select final submission file.");
      return;
    }
    setSubmittingFinal(true);
    try {
      const totalSize = finalFile.size;
      const chunkSize = Math.min(
        Math.max(DEFAULT_CHUNK_SIZE, 5 * 1024 * 1024),
        10 * 1024 * 1024,
      );
      const computedTotalChunks = Math.ceil(totalSize / chunkSize);
      setFinalTotalChunks(computedTotalChunks);

      const init = await initFinalSubmissionChunkUpload({
        hackathonId: id,
        teamId: solo ? undefined : teamId,
        originalFileName: finalFile.name,
        mimeType: finalFile.type || "application/octet-stream",
        totalSize,
        chunkSize,
        totalChunks: computedTotalChunks,
      });
      activeFinalUploadSessionRef.current = init.id;

      for (let chunkIndex = 0; chunkIndex < computedTotalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const chunkBlob = finalFile.slice(start, end);
        const progress = await uploadFinalSubmissionChunk(
          init.id,
          chunkIndex,
          chunkBlob,
        );
        setFinalCurrentChunk(progress.receivedChunks);
        setFinalUploadPercent(progress.progressPercent);
      }

      await completeFinalSubmissionChunkUpload(init.id, {
        title,
        description: finalDescription.trim(),
      });
      toast.success("Final submission created successfully.");
      queryClient.invalidateQueries({ queryKey: ["submission-thread-me", id] });
      queryClient.invalidateQueries({
        queryKey: ["participation", "hackathon", id],
      });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      setFinalTitle("");
      setFinalDescription("");
      setFinalFile(null);
      setFinalUploadPercent(0);
      setFinalCurrentChunk(0);
      setFinalTotalChunks(0);
      activeFinalUploadSessionRef.current = null;
    } catch (err) {
      const finalSessionId = activeFinalUploadSessionRef.current;
      if (finalSessionId) {
        try {
          await abortFinalSubmissionChunkUpload(finalSessionId);
        } catch {
          // no-op
        }
      }
      const messageText =
        err instanceof Error
          ? err.message
          : "Failed to create final submission";
      setFinalUploadError(messageText);
      toast.error(messageText);
      setFinalUploadPercent(0);
      setFinalCurrentChunk(0);
      setFinalTotalChunks(0);
      activeFinalUploadSessionRef.current = null;
    } finally {
      setSubmittingFinal(false);
    }
  };

  if (!id) {
    return (
      <div>
        <PageHeader title="Submit" description="Invalid challenge." />
        <Button variant="outline" asChild>
          <Link href="/hackathons">Back to challenges</Link>
        </Button>
      </div>
    );
  }

  if (hackathonLoading || threadLoading || !hackathon) {
    return (
      <div>
        <PageHeader title="Submit" description="Loading..." />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const isDailyMode = hackathon.submissionMode === SUBMISSION_MODE.DAILY_UPDATE;
  const dailyDayNumber = isDailyMode
    ? getCurrentDailyDayNumber(
        hackathon.applyDeadline,
        hackathon.finalSubmissionDeadline,
      )
    : null;
  const dailyInstructionToday =
    dailyDayNumber != null
      ? getInstructionForDay(hackathon.dailyInstructions, dailyDayNumber)
      : null;

  const dailyFormDisabled = isUploading || hasSubmittedToday;

  const pageDescription = isDailyMode
    ? solo
      ? "Post one daily update with file and feedback (UTC day). No separate final upload for this challenge type."
      : "Post one daily team update with file and feedback (UTC day). No separate final upload for this challenge type."
    : solo
      ? "Upload your final submission file before the final submission deadline."
      : "Upload your team’s final submission file before the final submission deadline.";

  return (
    <div>
      <PageHeader
        title={
          solo
            ? `Submit as solo — ${hackathon.title}`
            : `Submit project — ${hackathon.title}`
        }
        description={pageDescription}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/hackathons/${id}${solo ? "" : "/apply"}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="mx-auto max-w-3xl">
        {isDailyMode ? (
          <div className="space-y-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-lg border border-cs-border bg-card p-4"
            >
              <h3 className="font-medium text-cs-heading">
                Post today&apos;s update
              </h3>
              {dailyDayNumber === null ? (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                  Daily updates are only available from the first UTC day after
                  the apply deadline through the final submission deadline.
                </p>
              ) : dailyInstructionToday ? (
                <div className="rounded-md border border-cs-primary/25 bg-cs-primary/5 p-3 text-sm">
                  <p className="font-medium text-cs-heading">
                    Day {dailyDayNumber}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {dailyInstructionToday}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No organizer instruction is set for day {dailyDayNumber}; you
                  can still post your update.
                </p>
              )}
              <div>
                <label
                  htmlFor="submit-feedback"
                  className="mb-1.5 block text-sm font-medium text-cs-heading"
                >
                  Daily feedback message
                </label>
                <textarea
                  id="submit-feedback"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Share today's progress, blockers, and next steps"
                  disabled={dailyFormDisabled}
                  className="border-cs-border placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus:ring-2 focus:ring-cs-primary/20"
                  rows={4}
                />
              </div>
              <div>
                <label
                  htmlFor="submit-file"
                  className="mb-1.5 block text-sm font-medium text-cs-heading"
                >
                  <FileUp className="mr-1.5 inline size-4" />
                  Upload file (required)
                </label>
                <Input
                  id="submit-file"
                  type="file"
                  accept=".zip,.tar.gz,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={dailyFormDisabled}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  One update per UTC day until the final submission deadline (
                  {new Date(hackathon.finalSubmissionDeadline).toLocaleString()}
                  ).
                </p>
              </div>
              {hasSubmittedToday ? (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                  Today&apos;s update is already posted. Come back tomorrow for
                  the next update.
                </p>
              ) : null}
              {isUploading ? (
                <div className="space-y-2 rounded-md border border-cs-border bg-muted/30 p-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.max(0, Math.min(uploadPercent, 100))}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uploading {uploadPercent}% ({currentChunk}/{totalChunks}{" "}
                    chunks)
                  </p>
                </div>
              ) : null}
              {uploadError ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Upload failed and partial data was cleaned up. Retry upload. (
                  {uploadError})
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isUploading || !file || dailyFormDisabled}
                >
                  {isUploading ? "Uploading..." : "Post daily update"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/hackathons/${id}`}>Cancel</Link>
                </Button>
              </div>
            </form>

            <div className="rounded-lg border border-cs-border bg-card p-4">
              <h3 className="mb-4 font-medium text-cs-heading">
                Submission thread
              </h3>
              {sortedThreadEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No updates posted yet.
                </p>
              ) : (
                <ol className="relative m-0 list-none space-y-5 p-0">
                  <div className="pointer-events-none absolute left-3 top-3 bottom-3 w-px bg-cs-border" />
                  {sortedThreadEntries.map((entry, idx) => {
                    const lines = entry.feedbackMessage
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean);
                    const title = lines[0] ?? "Update";
                    const body = lines.slice(1).join("\n");
                    const isLatest = idx === 0;

                    return (
                      <li
                        key={entry.id}
                        className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-4"
                      >
                        <span
                          className={`z-10 mt-0.5 inline-flex size-6 items-center justify-center justify-self-center rounded-full border ${
                            isLatest
                              ? "border-cs-primary bg-cs-primary/15 text-cs-primary"
                              : "border-cs-border bg-card text-muted-foreground"
                          }`}
                        >
                          {isLatest ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : (
                            <span className="size-2 rounded-full bg-current" />
                          )}
                        </span>
                        <div className="rounded-md border border-cs-border bg-muted/20 p-3">
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-cs-heading">
                            {title}
                          </p>
                          {body ? (
                            <p className="mt-1 whitespace-pre-wrap text-sm text-cs-text">
                              {body}
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                              by{" "}
                              {entry.submittedByUser?.username ??
                                entry.submittedByUser?.email ??
                                "Participant"}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={downloadingEntryId === entry.id}
                              onClick={async () => {
                                setDownloadingEntryId(entry.id);
                                try {
                                  await downloadThreadEntry(entry.id);
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error
                                      ? err.message
                                      : "Download failed",
                                  );
                                } finally {
                                  setDownloadingEntryId(null);
                                }
                              }}
                            >
                              <Download className="mr-2 size-4" />
                              {downloadingEntryId === entry.id
                                ? "Downloading..."
                                : "Download"}
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleFinalSubmit}
            className="space-y-4 rounded-lg border border-cs-border bg-card p-4"
          >
            <h3 className="font-medium text-cs-heading">Final submission</h3>
            <div>
              <label
                htmlFor="final-title"
                className="mb-1.5 block text-sm font-medium text-cs-heading"
              >
                Title
              </label>
              <Input
                id="final-title"
                value={finalTitle}
                onChange={(e) => setFinalTitle(e.target.value)}
                placeholder="Final project title"
                disabled={submittingFinal || hasFinalSubmitted}
              />
            </div>
            <div>
              <label
                htmlFor="final-desc"
                className="mb-1.5 block text-sm font-medium text-cs-heading"
              >
                Description
              </label>
              <textarea
                id="final-desc"
                value={finalDescription}
                onChange={(e) => setFinalDescription(e.target.value)}
                placeholder="Final summary for judges"
                disabled={submittingFinal || hasFinalSubmitted}
                className="border-cs-border placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus:ring-2 focus:ring-cs-primary/20"
                rows={4}
              />
            </div>
            <div>
              <label
                htmlFor="final-file"
                className="mb-1.5 block text-sm font-medium text-cs-heading"
              >
                Final file
              </label>
              <Input
                id="final-file"
                type="file"
                accept=".zip,.tar.gz,.pdf"
                onChange={(e) => setFinalFile(e.target.files?.[0] ?? null)}
                disabled={submittingFinal || hasFinalSubmitted}
              />
            </div>
            {submittingFinal ? (
              <div className="space-y-2 rounded-md border border-cs-border bg-muted/30 p-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(finalUploadPercent, 100))}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Uploading final file {finalUploadPercent}% (
                  {finalCurrentChunk}/{finalTotalChunks} chunks)
                </p>
              </div>
            ) : null}
            {finalUploadError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Final upload failed and partial data was cleaned up. Retry
                upload. ({finalUploadError})
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={submittingFinal || hasFinalSubmitted || !finalFile}
              >
                {submittingFinal ? "Submitting..." : "Submit final"}
              </Button>
              {hasFinalSubmitted ? (
                <Button type="button" variant="outline" asChild>
                  <Link href="/submissions">View final submissions</Link>
                </Button>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
