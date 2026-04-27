"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Award, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import {
  getChallenge,
  getChallengeWinners,
  listChallengeStageSubmissions,
  removeWinner,
  selectWinner,
} from "@/lib/challenges-api";
import type { StageSubmission, Winner } from "@/types/challenge";

export default function ChallengeWinnersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: challengeId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [pick, setPick] = useState<{ position: 1 | 2 | 3; submissionId: string }>({
    position: 1,
    submissionId: "",
  });

  const { data: challenge, isLoading: cLoad } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => getChallenge(challengeId),
  });

  const projectStageId = useMemo(() => {
    const stages = (challenge?.stages ?? []).filter((s) => s.stageType === "project");
    return stages[0]?.id ?? "";
  }, [challenge?.stages]);

  const { data: submissions = [], isLoading: subLoad } = useQuery({
    queryKey: ["project-subs", challengeId, projectStageId],
    queryFn: () => listChallengeStageSubmissions(challengeId, projectStageId),
    enabled: Boolean(challengeId && projectStageId),
  });

  const { data: winners = [], isLoading: wLoad } = useQuery({
    queryKey: ["winners", challengeId],
    queryFn: () => getChallengeWinners(challengeId),
  });

  const canManage =
    user?.role === "admin" ||
    (user?.role === "sponsor" && challenge && user.id === challenge.sponsorId);

  useEffect(() => {
    if (!user || cLoad || !challenge) return;
    if (!canManage) router.replace("/dashboard");
  }, [user, cLoad, challenge, canManage, router]);

  const selectMutation = useMutation({
    mutationFn: (body: {
      challengeId: string;
      stageSubmissionId: string;
      position: 1 | 2 | 3;
    }) => selectWinner(body),
    onSuccess: () => {
      toast.success("Winner recorded");
      qc.invalidateQueries({ queryKey: ["winners", challengeId] });
      qc.invalidateQueries({ queryKey: ["project-subs", challengeId, projectStageId] });
      setPick({ position: 1, submissionId: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (winnerId: string) => removeWinner(winnerId),
    onSuccess: () => {
      toast.success("Winner removed");
      qc.invalidateQueries({ queryKey: ["winners", challengeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const winnerSubIds = new Set(winners.map((w) => w.stageSubmissionId));
  const available = submissions.filter((s) => !winnerSubIds.has(s.id));

  const loading = cLoad || subLoad || wLoad;

  if (loading) {
    return (
      <div>
        <PageHeader title="Winners" description="Loading…" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!challenge || challenge.challengeType !== "hackathon") {
    return (
      <div>
        <PageHeader title="Winners" description="Only hackathon challenges declare winners." />
        <Button variant="outline" asChild>
          <Link href={`/challenges/${challengeId}`}>Back</Link>
        </Button>
      </div>
    );
  }

  if (!projectStageId) {
    return (
      <div>
        <PageHeader title="Winners" description="No project stage found." />
        <Button variant="outline" asChild>
          <Link href={`/challenges/${challengeId}`}>Back</Link>
        </Button>
      </div>
    );
  }

  const byPosition = (pos: 1 | 2 | 3) =>
    winners.find((w: Winner) => w.position === pos) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="Winners" description={challenge.title}>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/challenges/${challengeId}`}>
            <ArrowLeft className="mr-2 size-4" />
            Challenge
          </Link>
        </Button>
      </PageHeader>

      <GlassCard className="p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-cs-heading">
          <Award className="size-5 text-cs-primary" />
          Podium
        </h3>
        <ul className="space-y-3">
          {([1, 2, 3] as const).map((pos) => {
            const w = byPosition(pos);
            return (
              <li
                key={pos}
                className="flex flex-col gap-2 rounded-lg border border-cs-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-cs-heading">
                    {pos === 1 ? "1st" : pos === 2 ? "2nd" : "3rd"} place
                  </p>
                  {w ? (
                    <p className="text-sm text-muted-foreground">
                      {w.stageSubmission.title} —{" "}
                      {w.stageSubmission.team?.name ?? "Team"}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not assigned</p>
                  )}
                </div>
                {w ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(w.id)}
                  >
                    <Trash2 className="mr-1 size-4" />
                    Remove
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </GlassCard>

      {available.length > 0 ? (
        <GlassCard className="space-y-4 p-5">
          <h3 className="font-semibold text-cs-heading">Assign placement</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <span className="text-sm font-medium">Submission</span>
              <Select
                value={pick.submissionId}
                onChange={(e) =>
                  setPick((p) => ({ ...p, submissionId: e.target.value }))
                }
              >
                <option value="">Choose submission</option>
                {available.map((s: StageSubmission) => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {s.team?.name ?? "Team"}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-full space-y-2 sm:w-40">
              <span className="text-sm font-medium">Position</span>
              <Select
                value={String(pick.position)}
                onChange={(e) =>
                  setPick((p) => ({
                    ...p,
                    position: Number(e.target.value) as 1 | 2 | 3,
                  }))
                }
              >
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
              </Select>
            </div>
            <Button
              type="button"
              disabled={
                !pick.submissionId ||
                selectMutation.isPending ||
                Boolean(byPosition(pick.position))
              }
              onClick={() =>
                selectMutation.mutate({
                  challengeId,
                  stageSubmissionId: pick.submissionId,
                  position: pick.position,
                })
              }
            >
              {selectMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
          {Boolean(byPosition(pick.position)) ? (
            <p className="text-xs text-muted-foreground">
              Clear the existing {pick.position === 1 ? "1st" : pick.position === 2 ? "2nd" : "3rd"} place winner first.
            </p>
          ) : null}
        </GlassCard>
      ) : (
        <p className="text-sm text-muted-foreground">
          {submissions.length === 0
            ? "No project-stage submissions yet."
            : "All submissions are already on the podium, or none left to assign."}
        </p>
      )}
    </div>
  );
}
