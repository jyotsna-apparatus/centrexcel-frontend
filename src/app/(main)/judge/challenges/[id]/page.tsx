"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Download, FileUp } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { SafeHtmlContent } from "@/components/safe-html-content";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import {
  STAGE_TYPE_LABELS,
} from "@/config/challenge-constants";
import { useAuth } from "@/contexts/auth-context";
import {
  getChallenge,
  listChallengeStageSubmissions,
} from "@/lib/challenges-api";
import {
  createJudgeScore,
  downloadStageSubmissionFile,
  getSubmissionScores,
  triggerBrowserDownload,
} from "@/lib/submissions-api";
import type { HackathonStage, StageSubmission } from "@/types/challenge";

const SCORE_MIN = 0;
const SCORE_MAX = 100;

export default function JudgeChallengeSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const [activeStageId, setActiveStageId] = useState<string>("");
  const [scoreOpen, setScoreOpen] = useState(false);
  const [selected, setSelected] = useState<StageSubmission | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [feedbackHtml, setFeedbackHtml] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "judge") router.replace("/dashboard");
  }, [user, router]);

  const { data: challenge, isLoading: chLoading } = useQuery({
    queryKey: ["challenge", id],
    queryFn: () => getChallenge(id),
    enabled: Boolean(id),
  });

  const stages = useMemo(() => {
    return (challenge?.stages ?? [])
      .slice()
      .sort((a, b) => a.stageOrder - b.stageOrder);
  }, [challenge?.stages]);

  useEffect(() => {
    if (stages.length && !activeStageId) {
      setActiveStageId(stages[0].id);
    }
  }, [stages, activeStageId]);

  const activeStage = stages.find((s) => s.id === activeStageId);

  const { data: submissions = [], isLoading: subLoading } = useQuery({
    queryKey: ["judge-stage-subs", id, activeStageId],
    queryFn: () => listChallengeStageSubmissions(id, activeStageId),
    enabled: Boolean(id && activeStageId),
  });

  const { data: scoresForSelected = [] } = useQuery({
    queryKey: ["scores", selected?.id],
    queryFn: () => getSubmissionScores(selected!.id),
    enabled: Boolean(selected?.id && scoreOpen),
  });

  const scoreMutation = useMutation({
    mutationFn: (body: {
      stageSubmissionId: string;
      score: number;
      feedback?: string | null;
    }) => createJudgeScore(body),
    onSuccess: (_data, variables) => {
      toast.success("Score saved");
      qc.invalidateQueries({ queryKey: ["judge-stage-subs", id, activeStageId] });
      qc.invalidateQueries({ queryKey: ["scores", variables.stageSubmissionId] });
      setScoreOpen(false);
      setSelected(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openScore = (sub: StageSubmission) => {
    setSelected(sub);
    const existing = user?.id
      ? sub.scores?.find((s) => s.judgeId === user.id)
      : undefined;
    if (existing) {
      setScoreInput(String(existing.score));
      setFeedbackHtml(existing.feedback ?? "");
      setReviewed(true);
    } else {
      setScoreInput("");
      setFeedbackHtml("");
      setReviewed(false);
    }
    setScoreOpen(true);
  };

  useEffect(() => {
    if (!scoreOpen || !selected?.id || !user?.id) return;
    const sc = scoresForSelected.find((s) => s.judgeId === user.id);
    if (!sc) return;
    setScoreInput(String(sc.score));
    setFeedbackHtml(sc.feedback ?? "");
    setReviewed(true);
  }, [scoreOpen, selected?.id, scoresForSelected, user?.id]);

  const handleDownload = async (sub: StageSubmission) => {
    if (downloadingId) return;
    setDownloadingId(sub.id);
    try {
      const { blob, filename } = await downloadStageSubmissionFile(sub.id);
      triggerBrowserDownload(blob, filename);
      toast.success("Download started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const sheetMyScore = useMemo(() => {
    if (!selected || !user?.id) return null;
    const fromList = selected.scores?.find((s) => s.judgeId === user.id);
    const fromApi = scoresForSelected.find((s) => s.judgeId === user.id);
    return fromApi ?? fromList ?? null;
  }, [selected, scoresForSelected, user?.id]);

  const alreadyScored = Boolean(sheetMyScore);
  const canScoreThisStage = activeStage?.stageType === "project";

  const onSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !canScoreThisStage) return;
    const score = parseInt(scoreInput, 10);
    if (Number.isNaN(score) || score < SCORE_MIN || score > SCORE_MAX) {
      toast.error(`Score must be ${SCORE_MIN}–${SCORE_MAX}`);
      return;
    }
    scoreMutation.mutate({
      stageSubmissionId: selected.id,
      score,
      feedback: feedbackHtml.trim() || null,
    });
  };

  if (user && user.role !== "judge") return null;

  if (!id) {
    return (
      <div>
        <PageHeader title="Submissions" description="Invalid challenge." />
        <Button variant="outline" asChild>
          <Link href="/judge/challenges">Back</Link>
        </Button>
      </div>
    );
  }

  const isLoading = chLoading || subLoading;

  return (
    <div>
      <PageHeader
        title={
          challenge ? `Submissions — ${challenge.title}` : "Submissions"
        }
        description="Review files and score the project stage."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/judge/challenges">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      {challenge?.challengeType === "startup" ? (
        <p className="mb-6 rounded-lg border border-cs-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Startup challenges use daily entries. Stage zip submissions and judge
          scoring apply to hackathon challenges.
        </p>
      ) : challenge?.challengeType === "hackathon" && stages.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {stages.map((s: HackathonStage) => (
            <Button
              key={s.id}
              type="button"
              size="sm"
              variant={s.id === activeStageId ? "default" : "outline"}
              onClick={() => setActiveStageId(s.id)}
            >
              {STAGE_TYPE_LABELS[s.stageType]}
            </Button>
          ))}
        </div>
      ) : challenge?.challengeType === "hackathon" && stages.length === 0 ? (
        <p className="mb-6 text-sm text-muted-foreground">
          This challenge has no stages configured yet.
        </p>
      ) : null}

      {activeStage && !canScoreThisStage ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Scoring opens on the <strong>project</strong> stage. You can still
          download submissions for review in earlier stages.
        </p>
      ) : null}

      {challenge?.challengeType === "startup" ? null : isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : !activeStageId ? (
        <p className="text-sm text-muted-foreground">Select a stage to load submissions.</p>
      ) : submissions.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-card p-8 text-center">
          <FileUp className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No submissions for this stage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const mine = sub.scores?.find((sc) => sc.judgeId === user?.id);
            const scoredByMe = !!mine;
            return (
              <div
                key={sub.id}
                className="flex flex-col gap-3 rounded-lg border border-cs-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-medium text-cs-heading">{sub.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {sub.team?.name ? `Team: ${sub.team.name}` : "Team"}
                    {sub.averageScore != null && (
                      <> · Avg: {Number(sub.averageScore)}</>
                    )}
                  </p>
                  {scoredByMe && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" />
                      Your score: {mine.score}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDownload(sub)}
                    disabled={downloadingId === sub.id}
                  >
                    <Download className="mr-1 size-4" />
                    {downloadingId === sub.id ? "…" : "Download"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openScore(sub)}
                  >
                    {canScoreThisStage
                      ? scoredByMe
                        ? "View score"
                        : "Score"
                      : "Details"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={scoreOpen} onOpenChange={setScoreOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selected ? selected.title : "Score submission"}
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="flex flex-1 flex-col gap-4 overflow-auto px-4">
              {selected.description ? (
                <SafeHtmlContent html={selected.description} />
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleDownload(selected)}
                disabled={downloadingId === selected.id}
              >
                <Download className="mr-2 size-4" />
                Download
              </Button>
              {!canScoreThisStage ? (
                <p className="text-sm text-muted-foreground">
                  Scoring is only available on the project stage.
                </p>
              ) : alreadyScored && sheetMyScore ? (
                <div className="space-y-2 rounded-lg border border-cs-border bg-muted/30 p-3 text-sm">
                  <p className="font-medium text-cs-heading">
                    Your score: {sheetMyScore.score}
                  </p>
                  {sheetMyScore.feedback ? (
                    <div>
                      <p className="mb-1 text-muted-foreground">Your feedback</p>
                      <SafeHtmlContent
                        className="text-foreground"
                        html={sheetMyScore.feedback}
                      />
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No feedback provided.</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Scores cannot be edited after they are submitted.
                  </p>
                </div>
              ) : (
                <>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={reviewed}
                      onChange={(e) => setReviewed(e.target.checked)}
                      className="rounded border border-cs-border"
                    />
                    <span>I have reviewed this submission</span>
                  </label>
                  <form
                    id="judge-score-form"
                    onSubmit={onSubmitScore}
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="j-score"
                        className="mb-1.5 block text-sm font-medium"
                      >
                        Score ({SCORE_MIN}–{SCORE_MAX}) *
                      </label>
                      <Input
                        id="j-score"
                        type="number"
                        min={SCORE_MIN}
                        max={SCORE_MAX}
                        value={scoreInput}
                        onChange={(e) => setScoreInput(e.target.value)}
                        disabled={
                          scoreMutation.isPending || !reviewed || !canScoreThisStage
                        }
                      />
                    </div>
                    <div>
                      <span className="mb-1.5 block text-sm font-medium">
                        Feedback
                      </span>
                      <TiptapEditor
                        value={feedbackHtml}
                        onChange={setFeedbackHtml}
                        placeholder="Optional feedback"
                        maxLength={5000}
                        disabled={
                          scoreMutation.isPending || !reviewed || !canScoreThisStage
                        }
                        editorContentClassName="min-h-[100px]"
                      />
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
          <SheetFooter>
            {!alreadyScored && canScoreThisStage && (
              <Button
                type="submit"
                form="judge-score-form"
                disabled={scoreMutation.isPending || !reviewed}
              >
                {scoreMutation.isPending ? "Saving…" : "Submit score"}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
