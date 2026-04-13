"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, FileUp } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { RequiredFieldMark } from "@/components/required-field-mark";
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
  getUtcCalendarDateKey,
  getUtcDateForDailyDayNumber,
  parseDailyInstructionsFromApi,
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
  const [dailyFileInputKey, setDailyFileInputKey] = useState(0);
  const [finalFileInputKey, setFinalFileInputKey] = useState(0);
  const activeUploadSessionRef = useRef<string | null>(null);
  const activeFinalUploadSessionRef = useRef<string | null>(null);
  const cancelDailyUploadRef = useRef(false);
  const cancelFinalUploadRef = useRef(false);
  const { data: thread, isLoading: threadLoading } = useMySubmissionThread(
    id || null,
  );
  const { data: participation, isLoading: participationLoading } = useQuery({
    queryKey: ["participation", "hackathon", id],
    queryFn: () => getParticipationForHackathon(id),
    enabled: !!id,
  });

  const threadEntries = thread?.entries ?? [];

  const entriesByDayKey = new Map<string, (typeof threadEntries)[number]>();
  for (const entry of threadEntries) {
    entriesByDayKey.set(getUtcCalendarDateKey(entry.entryDate), entry);
  }
  const todayUtcKey = getUtcCalendarDateKey(new Date());
  const hasFinalSubmitted = Boolean(participation?.hasSubmitted);

  const hasSubmittedToday =
    !hasFinalSubmitted && entriesByDayKey.has(todayUtcKey);

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
    cancelDailyUploadRef.current = false;
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

      let dailyCancelled = false;
      for (let chunkIndex = 0; chunkIndex < computedTotalChunks; chunkIndex++) {
        if (cancelDailyUploadRef.current) {
          dailyCancelled = true;
          break;
        }
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

      if (dailyCancelled) {
        try {
          await abortDailyThreadChunkUpload(init.id);
        } catch {
          // no-op
        }
        activeUploadSessionRef.current = null;
        setFile(null);
        setDailyFileInputKey((k) => k + 1);
        resetUploadProgress();
        toast.info("Upload cancelled");
        return;
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
      setDailyFileInputKey((k) => k + 1);
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
    cancelFinalUploadRef.current = false;
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

      let finalCancelled = false;
      for (let chunkIndex = 0; chunkIndex < computedTotalChunks; chunkIndex++) {
        if (cancelFinalUploadRef.current) {
          finalCancelled = true;
          break;
        }
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

      if (finalCancelled) {
        try {
          await abortFinalSubmissionChunkUpload(init.id);
        } catch {
          // no-op
        }
        activeFinalUploadSessionRef.current = null;
        setFinalFile(null);
        setFinalFileInputKey((k) => k + 1);
        setFinalUploadPercent(0);
        setFinalCurrentChunk(0);
        setFinalTotalChunks(0);
        toast.info("Upload cancelled");
        return;
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
      setFinalFileInputKey((k) => k + 1);
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

  if (hackathonLoading || threadLoading || participationLoading || !hackathon) {
    return (
      <div>
        <PageHeader title="Submit" description="Loading..." />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const isDailyMode = hackathon.submissionMode === SUBMISSION_MODE.DAILY_UPDATE;
  const dailyInstructionRows = isDailyMode
    ? parseDailyInstructionsFromApi(hackathon.dailyInstructions)
    : [];

  const dailyDayNumber = isDailyMode
    ? getCurrentDailyDayNumber(
        hackathon.applyDeadline,
        hackathon.finalSubmissionDeadline,
      )
    : null;

  const currentDailyDayNumber =
    dailyDayNumber != null &&
    dailyDayNumber >= 1 &&
    dailyDayNumber <= dailyInstructionRows.length
      ? dailyDayNumber
      : null;

  const dailyFormDisabled = isUploading || hasSubmittedToday;

  const shouldGateEntryFee =
    hackathon.isPaid && participation?.entryFeeSatisfied === false;

  if (shouldGateEntryFee) {
    const checkoutHref = `/payments/checkout?hackathonId=${id}&amount=${Number(
      hackathon.priceOfEntry,
    )}`;
    const entryFeeRupees = Number(hackathon.priceOfEntry);

    return (
      <div className="mx-auto max-w-3xl py-10">
        <PageHeader
          title="Submit"
          description={`This challenge requires an entry fee of ₹${entryFeeRupees.toFixed(
            2,
          )}. Pay to unlock uploading and submission.`}
        >
          <Button variant="outline" size="sm" asChild>
            <Link href={`/hackathons/${id}/apply`}>Back</Link>
          </Button>
        </PageHeader>

        <div className="mt-6 rounded-lg border border-cs-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            You can join the hackathon anytime, but payment must be completed
            before you can upload your project.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={checkoutHref}>
                Pay ₹{entryFeeRupees.toFixed(2)} with PhonePe
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/hackathons/${id}`}>View details</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="space-y-4">
            <div className="space-y-4 rounded-lg border border-cs-border bg-card p-4">
              <h3 className="font-medium text-cs-heading">
                Daily instructions & progress
              </h3>

              {dailyInstructionRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Daily instructions are not configured for this challenge.
                </p>
              ) : (
                <div className="space-y-4">
                  {dailyInstructionRows.map(({ dayNumber, instruction }) => {
                    const dayDate = getUtcDateForDailyDayNumber(
                      hackathon.applyDeadline,
                      dayNumber,
                    );
                    const dayDateKey = getUtcCalendarDateKey(dayDate);
                    const entry = entriesByDayKey.get(dayDateKey);
                    const isToday = currentDailyDayNumber === dayNumber;
                    const canUploadToday =
                      isToday && !hasFinalSubmitted && !entry;

                    const status: "uploaded" | "today" | "missed" | "upcoming" =
                      entry
                        ? "uploaded"
                        : canUploadToday
                          ? "today"
                          : dayDateKey > todayUtcKey
                            ? "upcoming"
                            : "missed";

                    const badgeClass =
                      status === "uploaded"
                        ? "border-cs-primary/30 bg-cs-primary/10 text-cs-primary"
                        : status === "today"
                          ? "border-cs-primary/25 bg-cs-primary/5 text-cs-primary"
                          : status === "upcoming"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                            : "border-destructive/30 bg-destructive/10 text-destructive";

                    const statusLabel =
                      status === "uploaded"
                        ? "Uploaded"
                        : status === "today"
                          ? "Today"
                          : status === "upcoming"
                            ? "Upcoming"
                            : "Missed";

                    const feedbackLines = entry?.feedbackMessage
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean);
                    const feedbackBody = feedbackLines
                      ? feedbackLines.slice(1).join("\n")
                      : "";

                    return (
                      <div
                        key={dayNumber}
                        className="rounded-md border border-cs-border bg-muted/10 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              UTC {dayDateKey}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-cs-heading">
                              Day {dayNumber}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-1 text-xs ${badgeClass}`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <div
                          className="prose prose-sm mt-2 max-w-none text-muted-foreground dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: instruction }}
                        />

                        {status === "upcoming" ? (
                          <p className="mt-3 text-sm text-muted-foreground">
                            Opens on {dayDateKey} (UTC).
                          </p>
                        ) : null}

                        {status === "missed" ? (
                          <p className="mt-3 text-sm text-muted-foreground">
                            No update submitted for this day.
                          </p>
                        ) : null}

                        {status === "uploaded" && entry ? (
                          <div className="mt-3 space-y-3 rounded-md border border-cs-border bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString()}
                            </p>
                            {feedbackBody ? (
                              <p className="whitespace-pre-wrap text-sm text-cs-text">
                                {feedbackBody}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No feedback provided.
                              </p>
                            )}
                            <div className="flex flex-wrap items-center justify-between gap-2">
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
                        ) : null}

                        {status === "today" ? (
                          <form
                            onSubmit={handleSubmit}
                            className="mt-3 space-y-4"
                          >
                            <div>
                              <label
                                htmlFor="submit-feedback"
                                className="mb-1.5 block text-sm font-medium text-cs-heading"
                              >
                                Daily feedback message
                                <RequiredFieldMark />
                              </label>
                              <textarea
                                id="submit-feedback"
                                value={feedbackMessage}
                                onChange={(e) =>
                                  setFeedbackMessage(e.target.value)
                                }
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
                                Upload file
                                <RequiredFieldMark />
                              </label>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                                <Input
                                  key={dailyFileInputKey}
                                  id="submit-file"
                                  type="file"
                                  accept=".zip,application/zip,application/x-zip-compressed"
                                  onChange={(e) =>
                                    setFile(e.target.files?.[0] ?? null)
                                  }
                                  disabled={dailyFormDisabled}
                                  className="w-full min-w-0 flex-1 cursor-pointer"
                                />
                                {file && !isUploading ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 sm:self-center"
                                    disabled={dailyFormDisabled}
                                    onClick={() => {
                                      setFile(null);
                                      setDailyFileInputKey((k) => k + 1);
                                    }}
                                  >
                                    Clear file
                                  </Button>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                ZIP only; max 128 MB. One update per UTC day
                                until the final submission deadline (
                                {new Date(
                                  hackathon.finalSubmissionDeadline,
                                ).toLocaleString()}
                                ).
                              </p>
                            </div>

                            {isUploading ? (
                              <div className="space-y-2 rounded-lg border border-cs-border bg-muted/40 p-4">
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{
                                      width: `${Math.max(
                                        0,
                                        Math.min(uploadPercent, 100),
                                      )}%`,
                                    }}
                                  />
                                </div>
                                <p className="text-sm font-medium text-cs-heading">
                                  Uploading… {uploadPercent}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Chunk {currentChunk} of {totalChunks}. You can
                                  cancel below if you need to start over.
                                </p>
                              </div>
                            ) : null}

                            {uploadError ? (
                              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm !text-red-500">
                                Upload failed and partial data was cleaned up.
                                Retry upload. ({uploadError})
                              </p>
                            ) : null}

                            <div className="flex flex-wrap items-center gap-2">
                              {isUploading ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="default"
                                  className="min-h-10 border-destructive/50 font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => {
                                    cancelDailyUploadRef.current = true;
                                  }}
                                >
                                  Cancel upload
                                </Button>
                              ) : null}
                              <Button
                                type="submit"
                                disabled={
                                  isUploading || !file || dailyFormDisabled
                                }
                              >
                                {isUploading
                                  ? "Uploading..."
                                  : "Post daily update"}
                              </Button>
                              <Button type="button" variant="outline" asChild>
                                <Link href={`/hackathons/${id}`}>Cancel</Link>
                              </Button>
                            </div>
                          </form>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
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
                <RequiredFieldMark />
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
                <RequiredFieldMark />
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                <Input
                  key={finalFileInputKey}
                  id="final-file"
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={(e) => setFinalFile(e.target.files?.[0] ?? null)}
                  disabled={submittingFinal || hasFinalSubmitted}
                  className="w-full min-w-0 flex-1 cursor-pointer"
                />
                {finalFile && !submittingFinal && !hasFinalSubmitted ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 sm:self-center"
                    onClick={() => {
                      setFinalFile(null);
                      setFinalFileInputKey((k) => k + 1);
                    }}
                  >
                    Clear file
                  </Button>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                ZIP only; max 128 MB.
              </p>
            </div>
            {submittingFinal ? (
              <div className="space-y-2 rounded-lg border border-cs-border bg-muted/40 p-4">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(finalUploadPercent, 100))}%`,
                    }}
                  />
                </div>
                <p className="text-sm font-medium text-cs-heading">
                  Uploading… {finalUploadPercent}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Chunk {finalCurrentChunk} of {finalTotalChunks}. Cancel below
                  if you need to start over.
                </p>
              </div>
            ) : null}
            {finalUploadError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm !text-red-500">
                Final upload failed and partial data was cleaned up. Retry
                upload. ({finalUploadError})
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              {submittingFinal ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10 border-destructive/50 font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    cancelFinalUploadRef.current = true;
                  }}
                >
                  Cancel upload
                </Button>
              ) : null}
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
