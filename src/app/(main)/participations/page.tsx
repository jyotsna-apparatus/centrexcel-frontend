"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Copy,
  ExternalLink,
  FileUp,
  Layers,
  Loader2,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CHALLENGE_TYPE_LABELS,
  PARTICIPATION_STATUS_LABELS,
} from "@/config/challenge-constants";
import {
  getMyParticipations,
  joinTeamByInvite,
} from "@/lib/challenges-api";
import type { ChallengeParticipation } from "@/types/challenge";
import { invalidateParticipationQueries } from "@/lib/participation-query-utils";
import { cn } from "@/lib/utils";

function stageSubmitHref(p: ChallengeParticipation): string {
  const ch = p.challenge;
  const base = `/challenges/${p.challengeId}`;
  if (!ch || ch.challengeType !== "hackathon") return base;
  const stages = (ch.stages ?? [])
    .slice()
    .sort((a, b) => a.stageOrder - b.stageOrder);
  const ord = p.currentStageOrder ?? 1;
  const stage =
    stages.find((s) => s.stageOrder === ord) ?? stages[0];
  if (!stage) return base;
  return `${base}/stages/${stage.id}/submit`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function JoinByInvite({ onJoined }: { onJoined: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) {
      toast.error("Paste an invite code first.");
      return;
    }
    setBusy(true);
    try {
      await joinTeamByInvite(c);
      toast.success("Joined the team. Welcome aboard!");
      setCode("");
      await invalidateParticipationQueries(queryClient);
      onJoined();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join team");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard className="p-5">
      <h3 className="text-base font-semibold">Join a team by invite code</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Got an invite from a team leader? Paste the code below to join their
        challenge-scoped team.
      </p>
      <form
        onSubmit={submit}
        className="mt-3 flex flex-col gap-2 sm:flex-row"
      >
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Invite code"
          className="sm:max-w-sm"
        />
        <Button type="submit" disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Copy className="mr-2 size-4" />
          )}
          Join team
        </Button>
      </form>
    </GlassCard>
  );
}

export default function ParticipationsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-participations", page, limit],
    queryFn: () => getMyParticipations({ page, limit }),
  });

  const participations = data?.data ?? [];
  const pagination = data?.pagination;
  const totalCount = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  useEffect(() => {
    if (isError && error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load participations",
      );
    }
  }, [isError, error]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My participations"
        description="Challenges you've enrolled in. Submit your work before each stage deadline."
      />

      <JoinByInvite onJoined={() => refetch()} />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : participations.length === 0 ? (
        <GlassCard className="px-6 py-12 text-center sm:px-10">
          <UserCheck className="mx-auto size-12 text-cs-primary" />
          <p className="mt-5 text-muted-foreground leading-relaxed">
            You haven&apos;t enrolled in any challenge yet.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/challenges">Browse challenges</Link>
          </Button>
        </GlassCard>
      ) : (
        <>
          <div className="space-y-4">
            {participations.map((p) => {
              const challenge = p.challenge;
              const team = p.team;
              const isHackathon = challenge?.challengeType === "hackathon";
              const statusLabel =
                PARTICIPATION_STATUS_LABELS[p.status] ?? p.status;
              const statusColor =
                p.status === "active"
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                  : p.status === "eliminated"
                    ? "bg-rose-500/15 text-rose-800 dark:text-rose-300"
                    : p.status === "pending_payment"
                      ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                      : "bg-muted text-muted-foreground";

              return (
                <GlassCard
                  key={p.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">
                        {challenge?.title ?? "—"}
                      </h3>
                      {challenge?.challengeType && (
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                            isHackathon
                              ? "bg-violet-500/15 text-violet-800 dark:text-violet-300"
                              : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
                          )}
                        >
                          {CHALLENGE_TYPE_LABELS[challenge.challengeType]}
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          statusColor,
                        )}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="size-3.5 text-cs-primary" />
                        <dd>
                          Team:{" "}
                          <span className="font-medium text-foreground">
                            {team?.name ?? "—"}
                          </span>
                          {team?.lockedTeamSize ? (
                            <> · locked at {team.lockedTeamSize}</>
                          ) : null}
                        </dd>
                      </div>
                      {isHackathon && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Layers className="size-3.5 text-cs-primary" />
                          <dd>
                            Current stage:{" "}
                            <span className="font-medium text-foreground">
                              {p.currentStageOrder ?? "—"}
                            </span>
                          </dd>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="size-3.5 text-cs-primary" />
                        <dd>Enrolled {formatDate(p.createdAt)}</dd>
                      </div>
                      {team?.inviteCode && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Copy className="size-3.5 text-cs-primary" />
                          <dd>
                            Invite code:{" "}
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                              {team.inviteCode}
                            </code>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {p.status === "active" && challenge ? (
                      isHackathon ? (
                        <Button size="sm" asChild>
                          <Link href={stageSubmitHref(p)}>
                            <FileUp className="mr-1.5 size-4" />
                            Submit
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" asChild>
                          <Link href={`/challenges/${p.challengeId}/daily`}>
                            <CalendarDays className="mr-1.5 size-4" />
                            Daily journal
                          </Link>
                        </Button>
                      )
                    ) : null}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/challenges/${p.challengeId}`}>
                        <ExternalLink className="mr-1.5 size-4 text-cs-primary" />
                        View challenge
                      </Link>
                    </Button>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
