"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  Calendar,
  Download,
  FileUp,
  MessageSquare,
  Pencil,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { hackathonImageSrc } from "@/components/hackathon-card";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HACKATHON_APPROVAL_LABELS,
  HACKATHON_STATUS_LABELS,
  SUBMISSION_MODE,
  SUBMISSION_MODE_LABELS,
} from "@/config/hackathon-constants";
import { useAuth } from "@/contexts/auth-context";
import { useHackathon } from "@/hooks/use-hackathons";
import {
  useHackathonSubmissionThreads,
  useSubmissionsByHackathon,
} from "@/hooks/use-submissions";
import { useTeams } from "@/hooks/use-teams";
import { useHackathonWinners } from "@/hooks/use-winners";
import {
  downloadHackathonEntries,
  downloadSubmission,
  downloadThreadEntry,
  getHackathonParticipations,
  getParticipationForHackathon,
  updateScore,
} from "@/lib/auth-api";
import {
  getCurrentDailyDayNumber,
  getInstructionForDay,
} from "@/lib/hackathon-deadlines";

export default function HackathonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = typeof params.id === "string" ? params.id : "";
  const [tabValue, setTabValue] = useState("details");

  const { user } = useAuth();
  const isParticipant = user?.role === "participant";
  const isAdmin = user?.role === "admin";
  const isSponsor = user?.role === "sponsor";
  const isJudge = user?.role === "judge";
  const canSeeJudges = isAdmin || isSponsor;
  const canSeeSubmissions = isAdmin || isSponsor;
  const {
    data: hackathon,
    isLoading,
    isError,
    error,
  } = useHackathon(id || null);
  const isJudgeAssignedToHackathon =
    isJudge && hackathon?.judges
      ? hackathon.judges.some((j) => j.judgeId === user?.id)
      : false;
  const isDailyChallenge =
    hackathon?.submissionMode === SUBMISSION_MODE.DAILY_UPDATE;
  const canSeeDailyUpdates =
    isDailyChallenge && (isAdmin || isSponsor || isJudgeAssignedToHackathon);
  const isOwnSponsorHackathon = Boolean(
    isSponsor && hackathon && user?.id === hackathon.sponsorId,
  );
  const { data: submissions = [], isLoading: submissionsLoading } =
    useSubmissionsByHackathon(canSeeSubmissions && id ? id : null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingThreadEntryId, setDownloadingThreadEntryId] = useState<
    string | null
  >(null);
  const [scoreEditorOpen, setScoreEditorOpen] = useState(false);
  const [scoreEditorSubmissionId, setScoreEditorSubmissionId] = useState<
    string | null
  >(null);
  const [adminScoreDrafts, setAdminScoreDrafts] = useState<
    Record<string, { score: string; feedback: string }>
  >({});
  const [savingScoreId, setSavingScoreId] = useState<string | null>(null);

  const selectedSubmissionForScoreEditor =
    submissions.find(
      (submission) => submission.id === scoreEditorSubmissionId,
    ) ?? null;

  const handleDownloadOne = useCallback(
    async (sub: { id: string; title: string }) => {
      if (downloadingId) return;
      setDownloadingId(sub.id);
      try {
        await downloadSubmission(
          sub.id,
          `${sub.title.replace(/[^a-zA-Z0-9-_]/g, "_")}.zip`,
        );
        toast.success("Download started.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Download failed");
      } finally {
        setDownloadingId(null);
      }
    },
    [downloadingId],
  );

  const handleDownloadAll = useCallback(async () => {
    if (!id || downloadingAll) return;
    setDownloadingAll(true);
    try {
      const blob = await downloadHackathonEntries(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hackathon-${id}-entries.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingAll(false);
    }
  }, [id, downloadingAll]);
  const { data: winners = [], isLoading: winnersLoading } = useHackathonWinners(
    id || null,
  );
  const { data: submissionThreads = [], isLoading: threadLoading } =
    useHackathonSubmissionThreads(canSeeDailyUpdates && id ? id : null);
  const { data: teamsData } = useTeams({
    page: 0,
    pageSize: 5,
    search: "",
    hackathonId: id || undefined,
  });
  const myTeamsForHackathon = teamsData?.data ?? [];
  const hasTeamForHackathon = myTeamsForHackathon.length > 0;
  const firstTeam = hasTeamForHackathon ? myTeamsForHackathon[0] : null;
  const { data: participation } = useQuery({
    queryKey: ["participation", "hackathon", id],
    queryFn: () => getParticipationForHackathon(id),
    enabled: !!id && isParticipant,
  });
  const {
    data: hackathonParticipations = [],
    isLoading: participationsLoading,
  } = useQuery({
    queryKey: ["participations", "hackathon", id],
    queryFn: () => getHackathonParticipations(id),
    enabled: !!id && isAdmin,
  });
  const hasSoloParticipation = participation && !participation.teamId;
  const hasAnyParticipation = Boolean(participation);
  const canSubmitSolo = hasSoloParticipation && !participation?.hasSubmitted;

  const teamInviteCode = firstTeam?.inviteCode ?? null;
  const handleCopyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Invite code copied.");
    } catch {
      toast.error("Failed to copy invite code");
    }
  };

  const updateScoreMutation = useMutation({
    mutationFn: (payload: {
      scoreId: string;
      score: number;
      feedback: string | null;
    }) => updateScore(payload),
    onSuccess: () => {
      toast.success("Score updated.");
      queryClient.invalidateQueries({
        queryKey: ["submissions-hackathon", id],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update score");
    },
    onSettled: () => {
      setSavingScoreId(null);
    },
  });

  const openScoreEditor = (submission: (typeof submissions)[number]) => {
    const nextDrafts: Record<string, { score: string; feedback: string }> = {};
    for (const scoreItem of submission.scores ?? []) {
      nextDrafts[scoreItem.id] = {
        score: String(scoreItem.score),
        feedback: scoreItem.feedback ?? "",
      };
    }
    setAdminScoreDrafts(nextDrafts);
    setScoreEditorSubmissionId(submission.id);
    setScoreEditorOpen(true);
  };

  const handleAdminScoreDraftChange = (
    scoreId: string,
    patch: Partial<{ score: string; feedback: string }>,
  ) => {
    setAdminScoreDrafts((prev) => {
      const existing = prev[scoreId] ?? { score: "", feedback: "" };
      return {
        ...prev,
        [scoreId]: {
          ...existing,
          ...patch,
        },
      };
    });
  };

  const handleAdminScoreSave = (scoreId: string) => {
    const draft = adminScoreDrafts[scoreId];
    if (!draft) return;
    const parsedScore = Number.parseInt(draft.score, 10);
    if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      toast.error("Score must be between 0 and 100");
      return;
    }

    setSavingScoreId(scoreId);
    updateScoreMutation.mutate({
      scoreId,
      score: parsedScore,
      feedback: draft.feedback.trim() ? draft.feedback.trim() : null,
    });
  };

  if (isError && error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to load challenge",
    );
  }

  if (isLoading || !id) {
    return (
      <div>
        <PageHeader title="Challenge" description="Loading..." />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div>
        <PageHeader title="Challenge" description="Not found." />
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const statusLabel =
    HACKATHON_STATUS_LABELS[hackathon.status] ?? hackathon.status;
  const hasResults = Array.isArray(winners) && winners.length > 0;
  const positionLabels: Record<number, string> = {
    1: "1st",
    2: "2nd",
    3: "3rd",
  };

  const approval = hackathon.approvalStatus;
  const canSponsorEdit =
    isOwnSponsorHackathon &&
    approval &&
    ["pending_review", "changes_requested", "rejected"].includes(approval);
  const canParticipateFlow =
    isParticipant && hackathon.approvalStatus === "approved";

  const imageSrc = hackathonImageSrc(hackathon.image);
  const isDailyChallengeResolved =
    hackathon.submissionMode === SUBMISSION_MODE.DAILY_UPDATE;
  const applyDeadlinePassed =
    new Date(hackathon.applyDeadline).getTime() < Date.now();
  const currentDailyDay = isDailyChallengeResolved
    ? getCurrentDailyDayNumber(
        hackathon.applyDeadline,
        hackathon.finalSubmissionDeadline,
      )
    : null;
  const currentDailyInstruction =
    currentDailyDay != null
      ? getInstructionForDay(hackathon.dailyInstructions, currentDailyDay)
      : null;

  return (
    <div>
      <PageHeader
        title={hackathon.title}
        description={hackathon.shortDescription}
      >
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/hackathons/${id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
          )}
          {canSponsorEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/hackathons/${id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit submission
              </Link>
            </Button>
          )}
          {canParticipateFlow && (
            <>
              {hasAnyParticipation ? (
                <Button variant="default" size="sm" asChild>
                  <Link href="/participations">
                    <UserCheck className="mr-2 size-4" />
                    View participation
                  </Link>
                </Button>
              ) : applyDeadlinePassed ? (
                <span className="text-muted-foreground max-w-[220px] text-right text-xs sm:text-sm">
                  Applications closed (apply deadline passed).
                </span>
              ) : (
                <Button variant="default" size="sm" asChild>
                  <Link href={`/hackathons/${id}/apply`}>
                    <UserPlus className="mr-2 size-4" />
                    Participate
                  </Link>
                </Button>
              )}
              {hasTeamForHackathon && firstTeam ? (
                <Button variant="secondary" size="sm" asChild>
                  <Link
                    href={`/hackathons/${id}/submit?teamId=${firstTeam.id}`}
                  >
                    <Users className="mr-2 size-4" />
                    Submit with team
                  </Link>
                </Button>
              ) : canSubmitSolo ? (
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/hackathons/${id}/submit?solo=1`}>
                    <User className="mr-2 size-4" />
                    Submit project
                  </Link>
                </Button>
              ) : (
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/hackathons/${id}/apply`}>
                    <User className="mr-2 size-4" />
                    Enter solo
                  </Link>
                </Button>
              )}
            </>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/hackathons">
              <ArrowLeft className="mr-2 size-4" />
              Back to list
            </Link>
          </Button>
        </div>
      </PageHeader>

      {approval && approval !== "approved" ? (
        <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-950 dark:text-amber-100">
            {HACKATHON_APPROVAL_LABELS[approval] ?? approval}
          </p>
          <p className="mt-1 text-muted-foreground">
            This challenge is not visible to participants until an admin
            approves it.
          </p>
          {hackathon.adminFeedback ? (
            <p className="mt-2 whitespace-pre-wrap border-t border-amber-500/20 pt-2 text-muted-foreground">
              <span className="font-medium text-foreground">
                Admin feedback:{" "}
              </span>
              {hackathon.adminFeedback}
            </p>
          ) : null}
        </div>
      ) : null}

      {canParticipateFlow && !hasAnyParticipation && applyDeadlinePassed ? (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive">
            You can no longer join this challenge.
          </p>
          <p className="mt-1 text-muted-foreground">
            The apply deadline was{" "}
            {new Date(hackathon.applyDeadline).toLocaleString()}.
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        {imageSrc && (
          <div className="w-full shrink-0 overflow-hidden rounded-lg border border-cs-border bg-muted lg:max-w-[500px]">
            <div className="relative w-full" style={{ aspectRatio: "5/3" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <Tabs
            value={tabValue}
            onValueChange={setTabValue}
            defaultValue="details"
          >
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {canSeeSubmissions && (
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
              )}
              {canSeeDailyUpdates && (
                <TabsTrigger value="daily-updates">Daily Updates</TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="participations">Participations</TabsTrigger>
              )}
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="rounded-lg border border-cs-border bg-card p-4">
                <h3 className="mb-2 font-medium text-cs-heading">Details</h3>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status</span>
                    <span>{statusLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <span className="text-muted-foreground">
                      Submission type
                    </span>
                    <span>
                      {SUBMISSION_MODE_LABELS[hackathon.submissionMode] ??
                        hackathon.submissionMode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>
                      Apply deadline:{" "}
                      {new Date(hackathon.applyDeadline).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>
                      Final submission deadline:{" "}
                      {new Date(
                        hackathon.finalSubmissionDeadline,
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>
                      Scoring deadline:{" "}
                      {new Date(hackathon.scoringDeadline).toLocaleString()}
                    </span>
                  </div>
                  {hackathon.sponsor && (
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span>
                        Sponsor:{" "}
                        {hackathon.sponsor.username ?? hackathon.sponsor.email}
                      </span>
                    </div>
                  )}
                  {hackathon.isPaid && hackathon.priceOfEntry != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Entry fee</span>
                      <span>${Number(hackathon.priceOfEntry).toFixed(2)}</span>
                    </div>
                  )}
                </dl>

                {isParticipant &&
                isDailyChallengeResolved &&
                currentDailyDay != null &&
                currentDailyInstruction ? (
                  <div className="mt-4 rounded-lg border border-cs-primary/25 bg-cs-primary/5 p-3">
                    <p className="text-sm font-medium text-cs-heading">
                      Today&apos;s focus (day {currentDailyDay})
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {currentDailyInstruction}
                    </p>
                  </div>
                ) : null}

                {isParticipant && teamInviteCode ? (
                  <div className="mt-4 rounded-lg border border-cs-border bg-muted/20 p-3">
                    <p className="text-sm font-medium text-cs-heading">
                      Team invite code
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-cs-text">
                        {teamInviteCode}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyInviteCode(teamInviteCode)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              {canSeeJudges &&
                hackathon.judges &&
                hackathon.judges.length > 0 && (
                  <div className="rounded-lg border border-cs-border bg-card p-4">
                    <h3 className="mb-2 flex items-center gap-2 font-medium text-cs-heading">
                      <Users className="size-4" />
                      Judges
                    </h3>
                    <ul className="flex flex-wrap gap-2">
                      {hackathon.judges.map((j) => (
                        <li
                          key={j.id}
                          className="rounded-md bg-muted px-2 py-1 text-sm"
                        >
                          {j.judge?.username ?? j.judge?.email ?? "Judge"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {hackathon.instructions && (
                <div className="rounded-lg border border-cs-border bg-card p-4">
                  <h3 className="mb-2 font-medium text-cs-heading">
                    Instructions
                  </h3>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-cs-text [&_a]:text-primary [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: hackathon.instructions }}
                  />
                </div>
              )}
            </TabsContent>

            {canSeeSubmissions && (
              <TabsContent value="submissions" className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="flex items-center gap-2 font-medium text-cs-heading">
                    <FileUp className="size-5" />
                    Submissions
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAll}
                    disabled={
                      submissionsLoading ||
                      submissions.length === 0 ||
                      downloadingAll
                    }
                  >
                    <Download className="mr-2 size-4" />
                    {downloadingAll ? "Preparing…" : "Download all as ZIP"}
                  </Button>
                </div>
                {submissionsLoading ? (
                  <Skeleton className="h-48 w-full rounded-lg" />
                ) : submissions.length === 0 ? (
                  <div className="rounded-lg border border-cs-border bg-card p-8 text-center">
                    <FileUp className="mx-auto size-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">
                      No submissions yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border border-cs-border bg-card p-4">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex flex-col gap-2 rounded-md border border-cs-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-cs-heading">
                            {sub.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {sub.teamId
                              ? sub.team?.name
                                ? `Team: ${sub.team.name}`
                                : "Team"
                              : "Solo"}
                            {sub.averageScore != null && (
                              <> · Avg score: {Number(sub.averageScore)}</>
                            )}
                            {(sub.scores?.length ?? 0) > 0 && (
                              <>
                                {" "}
                                · Scored by {sub.scores?.length ?? 0} judge(s)
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdmin && (sub.scores?.length ?? 0) > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openScoreEditor(sub)}
                            >
                              Edit scores
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadOne(sub)}
                            disabled={downloadingId === sub.id}
                          >
                            <Download className="mr-2 size-4" />
                            {downloadingId === sub.id
                              ? "Downloading…"
                              : "Download"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {canSeeDailyUpdates && (
              <TabsContent value="daily-updates" className="space-y-4">
                <h3 className="flex items-center gap-2 font-medium text-cs-heading">
                  <MessageSquare className="size-5" />
                  Daily update threads
                </h3>
                {threadLoading ? (
                  <Skeleton className="h-48 w-full rounded-lg" />
                ) : submissionThreads.length === 0 ? (
                  <div className="rounded-lg border border-cs-border bg-card p-8 text-center">
                    <MessageSquare className="mx-auto size-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">
                      No daily updates yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissionThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className="rounded-lg border border-cs-border bg-card p-4"
                      >
                        <p className="font-medium text-cs-heading">
                          {thread.team
                            ? `Team: ${thread.team.name}`
                            : `Solo: ${thread.user?.username ?? thread.user?.email ?? "Participant"}`}
                        </p>
                        {thread.entries.length === 0 ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            No updates in this thread.
                          </p>
                        ) : (
                          <ul className="mt-3 space-y-2">
                            {thread.entries.map((entry) => (
                              <li
                                key={entry.id}
                                className="flex flex-col gap-2 rounded-md border border-cs-border bg-muted/30 p-3 sm:flex-row sm:items-start sm:justify-between"
                              >
                                <div>
                                  <p className="text-sm font-medium text-cs-heading">
                                    {new Date(entry.createdAt).toLocaleString()}
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-cs-text">
                                    {entry.feedbackMessage}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    by{" "}
                                    {entry.submittedByUser?.username ??
                                      entry.submittedByUser?.email ??
                                      "Participant"}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    downloadingThreadEntryId === entry.id
                                  }
                                  onClick={async () => {
                                    setDownloadingThreadEntryId(entry.id);
                                    try {
                                      await downloadThreadEntry(
                                        entry.id,
                                        `thread-entry-${entry.id}.zip`,
                                      );
                                      toast.success("Download started.");
                                    } catch (err) {
                                      toast.error(
                                        err instanceof Error
                                          ? err.message
                                          : "Download failed",
                                      );
                                    } finally {
                                      setDownloadingThreadEntryId(null);
                                    }
                                  }}
                                >
                                  <Download className="mr-2 size-4" />
                                  {downloadingThreadEntryId === entry.id
                                    ? "Downloading…"
                                    : "Download"}
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="participations" className="space-y-4">
                <h3 className="flex items-center gap-2 font-medium text-cs-heading">
                  <UserCheck className="size-5" />
                  Participations
                </h3>
                {participationsLoading ? (
                  <Skeleton className="h-48 w-full rounded-lg" />
                ) : hackathonParticipations.length === 0 ? (
                  <div className="rounded-lg border border-cs-border bg-card p-8 text-center">
                    <UserCheck className="mx-auto size-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">
                      No participations yet.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2 rounded-lg border border-cs-border bg-card p-4">
                    {hackathonParticipations.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-cs-border bg-muted/30 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-cs-heading">
                          {p.user?.username ?? p.user?.email ?? p.userId}
                        </span>
                        <span className="text-muted-foreground">
                          {p.teamId
                            ? p.team?.name
                              ? `Team: ${p.team.name}`
                              : "Team"
                            : "Solo"}
                        </span>
                        {p.hasSubmitted && (
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                            Submitted
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            )}

            <TabsContent value="results">
              {winnersLoading ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : hasResults ? (
                <div className="rounded-lg border border-cs-border bg-card p-4">
                  <h3 className="mb-4 flex items-center gap-2 font-medium text-cs-heading">
                    <Trophy className="size-5" />
                    Podium — Top 3
                  </h3>
                  <div className="space-y-4">
                    {winners
                      .slice()
                      .sort((a, b) => a.position - b.position)
                      .map((winner) => {
                        const pos = winner.position as 1 | 2 | 3;
                        const highlight =
                          pos === 1
                            ? "border-amber-400/60 bg-amber-500/10 ring-2 ring-amber-400/30 dark:bg-amber-500/15"
                            : pos === 2
                              ? "border-slate-400/60 bg-slate-500/10 ring-2 ring-slate-400/30 dark:bg-slate-500/15"
                              : pos === 3
                                ? "border-amber-700/60 bg-amber-800/20 ring-2 ring-amber-700/30 dark:bg-amber-800/25"
                                : "border-cs-border bg-muted/30";
                        const iconBg =
                          pos === 1
                            ? "bg-amber-500/25 text-amber-700 dark:text-amber-400"
                            : pos === 2
                              ? "bg-slate-500/25 text-slate-700 dark:text-slate-300"
                              : pos === 3
                                ? "bg-amber-700/30 text-amber-800 dark:text-amber-500"
                                : "bg-cs-primary/20 text-cs-primary";
                        return (
                          <div
                            key={winner.id}
                            className={`flex items-center gap-4 rounded-lg border p-4 ${highlight}`}
                          >
                            <div
                              className={`flex size-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}
                            >
                              <Award className="size-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-cs-heading">
                                {positionLabels[pos] ?? winner.position} place
                              </p>
                              <p className="text-sm font-medium text-cs-text">
                                {winner.submission?.title ?? "Submission"}
                              </p>
                              {winner.submission?.team ? (
                                <p className="text-xs text-muted-foreground">
                                  Team: {winner.submission.team.name}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Solo
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-cs-border bg-card p-8 text-center">
                  <Trophy className="mx-auto size-12 text-muted-foreground" />
                  <p className="mt-4 font-medium text-cs-heading">
                    Results not declared yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Results are declared automatically after the scoring
                    deadline when all submissions have been scored, or when an
                    admin or sponsor selects winners.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Sheet open={scoreEditorOpen} onOpenChange={setScoreEditorOpen}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              Edit judge scores
              {selectedSubmissionForScoreEditor
                ? ` — ${selectedSubmissionForScoreEditor.title}`
                : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 overflow-y-auto pr-1">
            {!selectedSubmissionForScoreEditor ? (
              <p className="text-sm text-muted-foreground">
                No submission selected.
              </p>
            ) : (selectedSubmissionForScoreEditor.scores?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No judge scores found for this submission.
              </p>
            ) : (
              selectedSubmissionForScoreEditor.scores?.map((scoreItem) => {
                const draft = adminScoreDrafts[scoreItem.id] ?? {
                  score: String(scoreItem.score),
                  feedback: scoreItem.feedback ?? "",
                };
                const isSaving =
                  savingScoreId === scoreItem.id &&
                  updateScoreMutation.isPending;
                return (
                  <div
                    key={scoreItem.id}
                    className="rounded-md border border-cs-border bg-card p-3"
                  >
                    <p className="text-sm font-medium text-cs-heading">
                      {scoreItem.judge?.username ??
                        scoreItem.judge?.email ??
                        "Judge"}
                    </p>
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-cs-heading">
                          Score (0-100)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={draft.score}
                          onChange={(e) =>
                            handleAdminScoreDraftChange(scoreItem.id, {
                              score: e.target.value,
                            })
                          }
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-cs-heading">
                          Feedback
                        </label>
                        <textarea
                          value={draft.feedback}
                          onChange={(e) =>
                            handleAdminScoreDraftChange(scoreItem.id, {
                              feedback: e.target.value,
                            })
                          }
                          disabled={isSaving}
                          rows={3}
                          className="border-cs-border placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus:ring-2 focus:ring-cs-primary/20"
                          placeholder="Optional feedback"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAdminScoreSave(scoreItem.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving…" : "Save score"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setScoreEditorOpen(false)}
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
