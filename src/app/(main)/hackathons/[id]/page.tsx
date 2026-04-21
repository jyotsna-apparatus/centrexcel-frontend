"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  Download,
  FileUp,
  MessageSquare,
  Pencil,
  Trash2,
  Trophy,
  User,
  UserCheck,
  UserMinus,
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  CHALLENGE_TYPE_LABELS,
  FUNNEL_STAGE_STATUS_LABELS,
  HACKATHON_APPROVAL_LABELS,
  HACKATHON_STATUS_LABELS,
  SUBMISSION_MODE,
  SUBMISSION_MODE_LABELS,
} from "@/config/hackathon-constants";
import { useAuth } from "@/contexts/auth-context";
import { useHackathon, useHackathonFunnel } from "@/hooks/use-hackathons";
import {
  useHackathonSubmissionThreads,
  useSubmissionsByHackathon,
} from "@/hooks/use-submissions";
import { useTeams } from "@/hooks/use-teams";
import { useHackathonWinners } from "@/hooks/use-winners";
import {
  approveTeamJoinRequest,
  closeHackathonStage,
  createNextHackathonStage,
  deleteHackathon,
  downloadHackathonEntries,
  downloadSubmission,
  downloadThreadEntry,
  getHackathonParticipations,
  getParticipationForHackathon,
  getPendingJoinRequests,
  rejectTeamJoinRequest,
  removeTeamMember,
  updateScore,
  upsertHackathonStageSelections,
} from "@/lib/auth-api";
import {
  getCurrentDailyDayNumber,
  getInstructionForDay,
} from "@/lib/hackathon-deadlines";

export default function HackathonDetailPage() {
  const teamMaxMembers = 4;
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
  const { data: funnelData } = useHackathonFunnel(
    id || null,
    Boolean(id && hackathon?.submissionMode === SUBMISSION_MODE.DAILY_UPDATE),
  );
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
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(
    null,
  );
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(
    null,
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedFinalistIds, setSelectedFinalistIds] = useState<string[]>([]);
  const [nextStageTitle, setNextStageTitle] = useState("");
  const [nextStageShortDescription, setNextStageShortDescription] =
    useState("");
  const [nextStageApplyDeadline, setNextStageApplyDeadline] = useState("");
  const [nextStageFinalDeadline, setNextStageFinalDeadline] = useState("");
  const [nextStageScoringDeadline, setNextStageScoringDeadline] = useState("");

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
  const allTeamsForHackathon = teamsData?.data ?? [];
  const myTeamsForHackathon = allTeamsForHackathon.filter((team) =>
    team.members?.some((member) => member.userId === user?.id),
  );
  const hasTeamForHackathon = myTeamsForHackathon.length > 0;
  const firstTeam = hasTeamForHackathon ? myTeamsForHackathon[0] : null;
  const myTeamMembership = firstTeam?.members.find(
    (member) => member.userId === user?.id,
  );
  const isTeamLeader = myTeamMembership?.role === "leader";
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
    enabled: !!id && (isAdmin || isSponsor),
  });
  const canManageFunnelStages = isAdmin || isSponsor;
  const currentStageRecord =
    funnelData?.stages?.find((stage) => stage.hackathon.id === id) ?? null;
  const canCloseCurrentStage =
    canManageFunnelStages && currentStageRecord?.status === "active";
  const canSelectFinalists =
    canManageFunnelStages &&
    currentStageRecord != null &&
    currentStageRecord.status !== "active";
  const canCreateNextStage =
    canManageFunnelStages &&
    currentStageRecord?.status === "completed" &&
    (currentStageRecord.stageNumber ?? 0) < 3;
  const hasSoloParticipation = participation && !participation.teamId;
  const hasAnyParticipation = Boolean(participation);
  const canSubmitSolo = hasSoloParticipation && !participation?.hasSubmitted;

  const teamInviteCode = firstTeam?.inviteCode ?? null;
  const { data: pendingJoinRequests = [] } = useQuery({
    queryKey: ["team", firstTeam?.id, "join-requests"],
    queryFn: async () => {
      if (!firstTeam?.id) return [];
      return getPendingJoinRequests(firstTeam.id);
    },
    enabled: Boolean(firstTeam?.id && isTeamLeader),
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: async (memberUserId: string) => {
      if (!firstTeam?.id) throw new Error("Team not found");
      await removeTeamMember(firstTeam.id, memberUserId);
    },
    onMutate: (memberUserId) => {
      setRemovingMemberId(memberUserId);
    },
    onSuccess: () => {
      toast.success("Team member removed.");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({
        queryKey: ["participation", "hackathon", id],
      });
      queryClient.invalidateQueries({ queryKey: ["participations"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to remove member");
    },
    onSettled: () => {
      setRemovingMemberId(null);
    },
  });

  const approveJoinRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!firstTeam?.id) throw new Error("Team not found");
      await approveTeamJoinRequest(firstTeam.id, requestId);
    },
    onMutate: (requestId) => {
      setApprovingRequestId(requestId);
    },
    onSuccess: () => {
      toast.success("Join request approved.");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({
        queryKey: ["team", firstTeam?.id, "join-requests"],
      });
      queryClient.invalidateQueries({ queryKey: ["participations"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to approve request");
    },
    onSettled: () => {
      setApprovingRequestId(null);
    },
  });

  const rejectJoinRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!firstTeam?.id) throw new Error("Team not found");
      await rejectTeamJoinRequest(firstTeam.id, requestId);
    },
    onMutate: (requestId) => {
      setRejectingRequestId(requestId);
    },
    onSuccess: () => {
      toast.success("Join request rejected.");
      queryClient.invalidateQueries({
        queryKey: ["team", firstTeam?.id, "join-requests"],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to reject request");
    },
    onSettled: () => {
      setRejectingRequestId(null);
    },
  });

  const closeStageMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Hackathon not found");
      return closeHackathonStage(id);
    },
    onSuccess: () => {
      toast.success("Stage moved to review.");
      queryClient.invalidateQueries({ queryKey: ["hackathon-funnel", id] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to close stage");
    },
  });

  const finalistsMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Hackathon not found");
      return upsertHackathonStageSelections(id, selectedFinalistIds);
    },
    onSuccess: (data) => {
      toast.success(`Finalists saved (${data.selectedCount} selected).`);
      queryClient.invalidateQueries({ queryKey: ["hackathon-funnel", id] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save finalists");
    },
  });

  const nextStageMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Hackathon not found");
      return createNextHackathonStage(id, {
        title: nextStageTitle.trim() || undefined,
        shortDescription: nextStageShortDescription.trim() || undefined,
        applyDeadline: new Date(nextStageApplyDeadline).toISOString(),
        finalSubmissionDeadline: new Date(nextStageFinalDeadline).toISOString(),
        scoringDeadline: new Date(nextStageScoringDeadline).toISOString(),
      });
    },
    onSuccess: (data) => {
      toast.success("Next stage created successfully.");
      queryClient.invalidateQueries({ queryKey: ["hackathons"] });
      queryClient.invalidateQueries({ queryKey: ["hackathon-funnel", id] });
      router.push(`/hackathons/${data.nextHackathon.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to create next stage");
    },
  });

  const toggleFinalist = (participationId: string) => {
    setSelectedFinalistIds((prev) =>
      prev.includes(participationId)
        ? prev.filter((id) => id !== participationId)
        : [...prev, participationId],
    );
  };
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
  const deleteHackathonMutation = useMutation({
    mutationFn: () => deleteHackathon(id),
    onSuccess: () => {
      toast.success("Challenge deleted.");
      queryClient.invalidateQueries({ queryKey: ["hackathons"] });
      router.push("/hackathons");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to delete challenge");
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
  const challengeTypeLabel =
    CHALLENGE_TYPE_LABELS[hackathon.submissionMode] ?? "Challenge";
  const hasResults = Array.isArray(winners) && winners.length > 0;
  const positionLabels: Record<number, string> = {
    1: "1st",
    2: "2nd",
    3: "3rd",
  };

  const approval = hackathon.approvalStatus;
  const canEditChallenge = isAdmin || isOwnSponsorHackathon;
  const canDeleteChallenge = isAdmin;
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
          {canEditChallenge && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/hackathons/${id}/edit`}>
                <Pencil className="mr-2 size-4" />
                {isAdmin ? "Edit" : "Edit challenge"}
              </Link>
            </Button>
          )}
          {canDeleteChallenge && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleteHackathonMutation.isPending}
            >
              <Trash2 className="mr-2 size-4" />
              {deleteHackathonMutation.isPending ? "Deleting..." : "Delete"}
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
          <p className="font-medium !text-red-500">
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
              {hackathon.submissionMode === SUBMISSION_MODE.DAILY_UPDATE && (
                <TabsTrigger value="stages">Stages</TabsTrigger>
              )}
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
                <dl className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="!text-cs-primary">Status</span>
                    <span>{statusLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <span className="!text-cs-primary">Submission type</span>
                    <span>
                      {SUBMISSION_MODE_LABELS[hackathon.submissionMode] ??
                        hackathon.submissionMode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <span className="!text-cs-primary">Challenge type</span>
                    <span>{challengeTypeLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="!text-cs-primary">Apply deadline:</span>
                    <span>
                      {new Date(hackathon.applyDeadline).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="!text-cs-primary">
                      Final submission deadline:
                    </span>
                    <span>
                      {new Date(
                        hackathon.finalSubmissionDeadline,
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <span className="!text-cs-primary">Scoring deadline:</span>
                    <span>
                      {new Date(hackathon.scoringDeadline).toLocaleString()}
                    </span>
                  </div>
                  {hackathon.sponsor && (
                    <div className="flex items-center gap-2">
                      <span className="!text-cs-primary">Sponsor:</span>
                      <span>
                        {hackathon.sponsor.username ?? hackathon.sponsor.email}
                      </span>
                    </div>
                  )}
                  {hackathon.isPaid && hackathon.priceOfEntry != null && (
                    <div className="flex items-center gap-2">
                      <span className="!text-cs-primary">Entry fee</span>
                      <span>₹{Number(hackathon.priceOfEntry).toFixed(2)}</span>
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
                    <p className="mt-2 text-xs text-muted-foreground">
                      Team members: {firstTeam?.members.length ?? 0}/
                      {teamMaxMembers}
                    </p>
                  </div>
                ) : null}

                {isParticipant && firstTeam && (
                  <div className="mt-4 rounded-lg border border-cs-border bg-card p-3">
                    <p className="text-sm font-medium text-cs-heading">
                      Team members
                    </p>
                    <ul className="mt-2 space-y-2">
                      {firstTeam.members.map((member) => {
                        const label = member.user.username ?? member.user.email;
                        const isLeaderMember = member.role === "leader";
                        const canRemoveMember = isTeamLeader && !isLeaderMember;
                        return (
                          <li
                            key={member.id}
                            className="flex items-center justify-between rounded-md border border-cs-border bg-muted/20 px-3 py-2 text-sm"
                          >
                            <div>
                              <span className="font-medium text-cs-heading">
                                {label}
                              </span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {isLeaderMember ? "Team admin" : "Member"}
                              </span>
                            </div>
                            {canRemoveMember ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={removingMemberId === member.userId}
                                onClick={() =>
                                  removeTeamMemberMutation.mutate(member.userId)
                                }
                              >
                                <UserMinus className="mr-2 size-4" />
                                {removingMemberId === member.userId
                                  ? "Removing..."
                                  : "Remove"}
                              </Button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {isParticipant && isTeamLeader && firstTeam && (
                  <div className="mt-4 rounded-lg border border-cs-border bg-card p-3">
                    <p className="text-sm font-medium text-cs-heading">
                      Pending join requests
                    </p>
                    {pendingJoinRequests.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No pending requests.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {pendingJoinRequests.map((request) => {
                          const canApprove =
                            (firstTeam.members.length ?? 0) < teamMaxMembers;
                          const isActionLoading =
                            approvingRequestId === request.id ||
                            rejectingRequestId === request.id;
                          return (
                            <li
                              key={request.id}
                              className="rounded-md border border-cs-border bg-muted/20 px-3 py-2"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm">
                                  <p className="font-medium text-cs-heading">
                                    {request.user?.username ??
                                      request.user?.email ??
                                      request.userId}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Requested on{" "}
                                    {new Date(
                                      request.createdAt,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={!canApprove || isActionLoading}
                                    onClick={() =>
                                      approveJoinRequestMutation.mutate(
                                        request.id,
                                      )
                                    }
                                  >
                                    {approvingRequestId === request.id
                                      ? "Approving..."
                                      : "Approve"}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={isActionLoading}
                                    onClick={() =>
                                      rejectJoinRequestMutation.mutate(
                                        request.id,
                                      )
                                    }
                                  >
                                    {rejectingRequestId === request.id
                                      ? "Rejecting..."
                                      : "Reject"}
                                  </Button>
                                </div>
                              </div>
                              {!canApprove && (
                                <p className="mt-2 text-xs text-destructive">
                                  Team is at the {teamMaxMembers}-member limit.
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
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

            {hackathon.submissionMode === SUBMISSION_MODE.DAILY_UPDATE && (
              <TabsContent value="stages" className="space-y-4">
                <div className="rounded-lg border border-cs-border bg-muted/20 p-3">
                  <p className="text-sm font-medium text-cs-heading">
                    Stage progression
                  </p>
                  {funnelData?.stages?.length ? (
                    <ul className="mt-2 space-y-2">
                      {funnelData.stages.map((stage) => (
                        <li
                          key={
                            stage.id ??
                            `${stage.stageNumber}-${stage.hackathon.id}`
                          }
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-cs-border bg-card px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-cs-heading">
                              Stage {stage.stageNumber}/3
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(stage.startAt).toLocaleDateString()} -{" "}
                              {new Date(stage.endAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {FUNNEL_STAGE_STATUS_LABELS[stage.status] ??
                                stage.status}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {stage.selectedCount} selected
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Stage timeline is not available yet.
                    </p>
                  )}
                </div>

                {canManageFunnelStages ? (
                  <div className="space-y-3 rounded-lg border border-cs-border bg-card p-3">
                    <p className="text-sm font-medium text-cs-heading">
                      Stage controls
                    </p>
                    {currentStageRecord ? (
                      <p className="text-xs text-muted-foreground">
                        Current stage: {currentStageRecord.stageNumber}/3 ·{" "}
                        {FUNNEL_STAGE_STATUS_LABELS[
                          currentStageRecord.status
                        ] ?? currentStageRecord.status}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => closeStageMutation.mutate()}
                        disabled={
                          !canCloseCurrentStage || closeStageMutation.isPending
                        }
                      >
                        {closeStageMutation.isPending
                          ? "Closing stage..."
                          : "Close current stage"}
                      </Button>
                    </div>

                    <div className="rounded-md border border-cs-border bg-muted/20 p-3">
                      <p className="text-sm font-medium text-cs-heading">
                        Select finalists
                      </p>
                      {participationsLoading ? (
                        <Skeleton className="mt-3 h-24 w-full rounded-md" />
                      ) : hackathonParticipations.length === 0 ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          No participations available for selection.
                        </p>
                      ) : (
                        <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                          {hackathonParticipations.map((participant) => {
                            const checked = selectedFinalistIds.includes(
                              participant.id,
                            );
                            return (
                              <label
                                key={participant.id}
                                className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-cs-border bg-card px-3 py-2 text-sm"
                              >
                                <span className="min-w-0">
                                  <span className="font-medium text-cs-heading">
                                    {participant.user.username ??
                                      participant.user.email}
                                  </span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {participant.team?.name
                                      ? `Team: ${participant.team.name}`
                                      : "Solo"}
                                  </span>
                                </span>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    toggleFinalist(participant.id)
                                  }
                                  disabled={!canSelectFinalists}
                                />
                              </label>
                            );
                          })}
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Selected: {selectedFinalistIds.length}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => finalistsMutation.mutate()}
                          disabled={
                            !canSelectFinalists || finalistsMutation.isPending
                          }
                        >
                          {finalistsMutation.isPending
                            ? "Saving..."
                            : "Save finalists"}
                        </Button>
                      </div>
                    </div>

                    {canCreateNextStage ? (
                      <div className="rounded-md border border-cs-border bg-muted/20 p-3">
                        <p className="text-sm font-medium text-cs-heading">
                          Create next stage
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <Input
                            placeholder="Stage title (optional)"
                            value={nextStageTitle}
                            onChange={(e) => setNextStageTitle(e.target.value)}
                          />
                          <Input
                            placeholder="Short description (optional)"
                            value={nextStageShortDescription}
                            onChange={(e) =>
                              setNextStageShortDescription(e.target.value)
                            }
                          />
                          <Input
                            type="datetime-local"
                            value={nextStageApplyDeadline}
                            onChange={(e) =>
                              setNextStageApplyDeadline(e.target.value)
                            }
                          />
                          <Input
                            type="datetime-local"
                            value={nextStageFinalDeadline}
                            onChange={(e) =>
                              setNextStageFinalDeadline(e.target.value)
                            }
                          />
                          <Input
                            type="datetime-local"
                            value={nextStageScoringDeadline}
                            onChange={(e) =>
                              setNextStageScoringDeadline(e.target.value)
                            }
                          />
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            type="button"
                            onClick={() => nextStageMutation.mutate()}
                            disabled={
                              nextStageMutation.isPending ||
                              !nextStageApplyDeadline ||
                              !nextStageFinalDeadline ||
                              !nextStageScoringDeadline
                            }
                          >
                            {nextStageMutation.isPending
                              ? "Creating..."
                              : "Create next stage"}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Stage selection is available for sponsor/admin.
                  </p>
                )}
              </TabsContent>
            )}

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
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete challenge"
        description="Are you sure you want to delete this challenge? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={async () => {
          await deleteHackathonMutation.mutateAsync();
        }}
        loading={deleteHackathonMutation.isPending}
      />
    </div>
  );
}
