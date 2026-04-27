"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGE_TYPE_LABELS } from "@/config/challenge-constants";
import { useAuth } from "@/contexts/auth-context";
import {
  closeStage,
  getChallenge,
  getChallengeStage,
  listChallengeParticipations,
  shortlistStage,
} from "@/lib/challenges-api";
import type { ChallengeParticipation } from "@/types/challenge";

export default function StageShortlistPage({
  params,
}: {
  params: Promise<{ id: string; stageId: string }>;
}) {
  const { id: challengeId, stageId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: challenge, isLoading: cLoad } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => getChallenge(challengeId),
  });

  const { data: stage, isLoading: sLoad } = useQuery({
    queryKey: ["stage", challengeId, stageId],
    queryFn: () => getChallengeStage(challengeId, stageId),
  });

  const { data: participations = [], isLoading: pLoad } = useQuery({
    queryKey: ["challenge-participations", challengeId],
    queryFn: () => listChallengeParticipations(challengeId),
    enabled: Boolean(challengeId),
  });

  const canManage =
    user?.role === "admin" ||
    (user?.role === "sponsor" && challenge && user.id === challenge.sponsorId);

  useEffect(() => {
    if (!user || cLoad || !challenge) return;
    if (!canManage) router.replace("/dashboard");
  }, [user, cLoad, challenge, canManage, router]);

  const eligible = useMemo(() => {
    return participations.filter((p) => {
      if (p.status !== "active") return false;
      return (p.stageSubmissions ?? []).some((sub) => sub.stageId === stageId);
    });
  }, [participations, stageId]);

  const isProject = stage?.stageType === "project";

  const closeMutation = useMutation({
    mutationFn: () => closeStage(challengeId, stageId),
    onSuccess: () => {
      toast.success("Stage closed — you can now shortlist.");
      qc.invalidateQueries({ queryKey: ["stage", challengeId, stageId] });
      qc.invalidateQueries({ queryKey: ["challenge", challengeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const shortlistMutation = useMutation({
    mutationFn: (ids: string[]) =>
      shortlistStage(challengeId, stageId, ids),
    onSuccess: (res) => {
      toast.success(
        `Shortlist saved (${res.shortlistedCount} team(s) promoted to the next stage).`,
      );
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["challenge", challengeId] });
      qc.invalidateQueries({ queryKey: ["stage", challengeId, stageId] });
      qc.invalidateQueries({ queryKey: ["challenge-participations", challengeId] });
      router.push(`/challenges/${challengeId}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (pid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  const onSubmitShortlist = () => {
    shortlistMutation.mutate(Array.from(selected));
  };

  const loading = cLoad || sLoad || pLoad;

  if (loading) {
    return (
      <div>
        <PageHeader title="Shortlist" description="Loading…" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!challenge || !stage) {
    return (
      <div>
        <PageHeader title="Shortlist" description="Not found." />
        <Button variant="outline" asChild>
          <Link href={`/challenges/${challengeId}`}>Back</Link>
        </Button>
      </div>
    );
  }

  if (isProject) {
    return (
      <div>
        <PageHeader
          title="Shortlist"
          description="The project stage does not use shortlisting."
        >
          <Button variant="outline" size="sm" asChild>
            <Link href={`/challenges/${challengeId}`}>
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
        </PageHeader>
        <p className="text-sm text-muted-foreground">
          Use <Link className="underline" href={`/challenges/${challengeId}/winners`}>Winners</Link>{" "}
          to pick final placements.
        </p>
      </div>
    );
  }

  const stageShortlisting = stage.status === "shortlisting";
  const stageCompleted = stage.status === "completed";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Shortlist — ${STAGE_TYPE_LABELS[stage.stageType]}`}
        description={challenge.title}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/challenges/${challengeId}`}>
            <ArrowLeft className="mr-2 size-4" />
            Challenge
          </Link>
        </Button>
      </PageHeader>

      {stage.status === "active" ? (
        <GlassCard className="p-5">
          <p className="mb-3 text-sm text-muted-foreground">
            Close this stage for submissions to move it into shortlisting. Teams
            that submitted will appear below once shortlisting begins.
          </p>
          <Button
            type="button"
            disabled={closeMutation.isPending}
            onClick={() => closeMutation.mutate()}
          >
            {closeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Closing…
              </>
            ) : (
              "Close stage for shortlisting"
            )}
          </Button>
        </GlassCard>
      ) : null}

      {stageShortlisting ? (
        <GlassCard className="p-5">
          <h3 className="mb-2 font-semibold text-cs-heading">
            Select teams to promote
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Checked teams advance to the next stage. Everyone else who submitted
            is eliminated.
          </p>
          {eligible.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No eligible submissions for this stage.
            </p>
          ) : (
            <ul className="mb-4 space-y-2">
              {eligible.map((p: ChallengeParticipation) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-cs-border px-3 py-2"
                >
                  <input
                    id={`p-${p.id}`}
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="size-4 rounded border border-cs-border"
                  />
                  <label htmlFor={`p-${p.id}`} className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">
                      {p.team?.name ?? "Team"}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      ({p.user?.username ?? p.user?.email ?? p.userId})
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <Button
            type="button"
            disabled={
              shortlistMutation.isPending || eligible.length === 0
            }
            onClick={onSubmitShortlist}
          >
            {shortlistMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <CheckSquare className="mr-2 size-4" />
                Save shortlist ({selected.size} selected)
              </>
            )}
          </Button>
        </GlassCard>
      ) : null}

      {stageCompleted ? (
        <GlassCard className="p-5 text-sm text-muted-foreground">
          This stage is already completed. Shortlisting was finalized.
        </GlassCard>
      ) : null}
    </div>
  );
}
