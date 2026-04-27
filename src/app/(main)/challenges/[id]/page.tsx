"use client";

import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Coins,
  Eye,
  Layers,
  Loader2,
  Pencil,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GlassCard } from "@/components/ui/glass-card";
import {
  CHALLENGE_APPROVAL_LABELS,
  CHALLENGE_STATUS_LABELS,
  CHALLENGE_TYPE_LABELS,
  STAGE_STATUS_LABELS,
  STAGE_TYPE_LABELS,
} from "@/config/challenge-constants";
import { useAuth } from "@/contexts/auth-context";
import { SafeHtmlContent } from "@/components/safe-html-content";
import { deleteChallenge, getChallenge, getMyChallengeParticipation } from "@/lib/challenges-api";
import type { Challenge, HackathonStage } from "@/types/challenge";
import { cn } from "@/lib/utils";
import { challengeImageSrc } from "@/components/challenge-card";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function StageRow({
  stage,
  challengeId,
  showParticipantSubmit,
  showSponsorTools,
}: {
  stage: HackathonStage;
  challengeId: string;
  showParticipantSubmit: boolean;
  showSponsorTools: boolean;
}) {
  const statusColor =
    stage.status === "active"
      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
      : stage.status === "completed"
        ? "bg-violet-500/15 text-violet-800 dark:text-violet-300"
        : stage.status === "shortlisting"
          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
          : "bg-muted text-muted-foreground";

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-cs-primary/10 text-sm font-semibold text-cs-primary">
              {stage.stageOrder}
            </span>
            <h3 className="text-base font-semibold">
              {STAGE_TYPE_LABELS[stage.stageType]}
            </h3>
          </div>
          <SafeHtmlContent html={stage.instructions} className="mt-2 text-sm" />
        </div>
        <span
          className={cn("rounded-full px-2.5 py-1 text-xs font-medium", statusColor)}
        >
          {STAGE_STATUS_LABELS[stage.status]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {showParticipantSubmit && stage.status === "active" ? (
          <Button size="sm" asChild>
            <Link href={`/challenges/${challengeId}/stages/${stage.id}/submit`}>
              Submit zip
            </Link>
          </Button>
        ) : null}
        {showSponsorTools && stage.stageType !== "project" ? (
          <>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/challenges/${challengeId}/stages/${stage.id}/shortlist`}>
                Shortlist
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/challenges/${challengeId}/stages/${stage.id}/edit`}>
                Edit stage
              </Link>
            </Button>
          </>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Apply opens</dt>
          <dd className="font-medium">{formatDate(stage.applyDeadline)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Submissions due</dt>
          <dd className="font-medium">{formatDate(stage.submissionDeadline)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Review by</dt>
          <dd className="font-medium">{formatDate(stage.reviewDeadline)}</dd>
        </div>
      </dl>
    </GlassCard>
  );
}

function PricingPreview({ challenge }: { challenge: Challenge }) {
  if (!challenge.isPaid || !challenge.pricingTiers?.length) return null;
  const base = Number(challenge.priceOfEntry ?? 0);
  return (
    <GlassCard className="p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <Coins className="size-4 text-cs-primary" />
        Pricing tiers
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Base price ₹{base} / person. Larger teams get a discount, the team
        leader pays for all seats upfront.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {challenge.pricingTiers
          .slice()
          .sort((a, b) => a.teamSize - b.teamSize)
          .map((tier) => {
            const full = base * tier.teamSize;
            const payable = Math.round(full * (1 - Number(tier.discountPercent) / 100));
            return (
              <div
                key={tier.teamSize}
                className="rounded-lg border border-cs-border/60 bg-card p-4"
              >
                <div className="text-sm text-muted-foreground">
                  Team of {tier.teamSize}
                </div>
                <div className="mt-1 text-2xl font-semibold">₹{payable}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <s>₹{full}</s> · save ₹{full - payable} ({Number(tier.discountPercent)}% off)
                </div>
              </div>
            );
          })}
      </div>
    </GlassCard>
  );
}

function StartupTimeline({ challenge }: { challenge: Challenge }) {
  if (challenge.challengeType !== "startup") return null;
  const days = challenge.dailyInstructions ?? [];
  return (
    <GlassCard className="p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <CalendarDays className="size-4 text-cs-primary" />
        Daily instructions ({challenge.startupDurationDays} days)
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Starts {formatDate(challenge.startupStartAt)}. One short entry per day,
        no final submission.
      </p>
      <ol className="mt-4 space-y-2 text-sm">
        {days.slice(0, 30).map((d) => (
          <li
            key={d.dayNumber}
            className="flex gap-3 rounded-md border border-cs-border/40 bg-card/60 p-3"
          >
            <span className="flex size-7 flex-none items-center justify-center rounded-full bg-cs-primary/10 text-xs font-semibold text-cs-primary">
              {d.dayNumber}
            </span>
            <SafeHtmlContent html={d.instruction} className="leading-6 text-sm" />
          </li>
        ))}
        {days.length > 30 && (
          <li className="text-xs text-muted-foreground">
            +{days.length - 30} more days…
          </li>
        )}
      </ol>
    </GlassCard>
  );
}

export default function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const isParticipant = user?.role === "participant";
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["challenge", id],
    queryFn: () => getChallenge(id),
  });

  const { data: myParticipation } = useQuery({
    queryKey: ["my-participation", id],
    queryFn: () => getMyChallengeParticipation(id),
    enabled: Boolean(isParticipant && id),
  });

  const enrolledActive =
    myParticipation != null && myParticipation.status === "active";

  const deleteMutation = useMutation({
    mutationFn: () => deleteChallenge(id),
    onSuccess: () => {
      toast.success("Challenge deleted");
      qc.invalidateQueries({ queryKey: ["challenges-page"] });
      qc.invalidateQueries({ queryKey: ["challenges"] });
      router.push("/challenges");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-cs-primary" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
        {error instanceof Error ? error.message : "Failed to load challenge."}
      </div>
    );
  }
  const challenge = data!;
  const image = challengeImageSrc(challenge.image);
  const isHackathon = challenge.challengeType === "hackathon";
  const canManage =
    user?.role === "admin" ||
    (user?.role === "sponsor" && user.id === challenge.sponsorId);
  const showSponsorStageTools =
    canManage && challenge.challengeType === "hackathon";

  return (
    <div>
      <PageHeader
        title={challenge.title}
        description={challenge.shortDescription}
      >
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button asChild variant="outline">
                <Link href={`/challenges/${challenge.id}/edit`}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </Button>
            </>
          )}
          {isParticipant && !enrolledActive ? (
            <Button asChild>
              <Link href={`/challenges/${challenge.id}/enroll`}>
                Enroll now
              </Link>
            </Button>
          ) : null}
          {isParticipant && enrolledActive && challenge.challengeType === "startup" ? (
            <Button asChild variant="secondary">
              <Link href={`/challenges/${challenge.id}/daily`}>
                Daily journal
              </Link>
            </Button>
          ) : null}
          {canManage && challenge.challengeType === "hackathon" ? (
            <Button variant="outline" asChild>
              <Link href={`/challenges/${challenge.id}/winners`}>Winners</Link>
            </Button>
          ) : null}
        </div>
      </PageHeader>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete challenge?"
        description="This permanently removes the challenge, its stages, pricing tiers, and related data. Participants and teams will lose access."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="relative aspect-[5/3] w-full overflow-hidden rounded-xl border border-cs-border/60 bg-muted">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={challenge.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-cs-primary/10 to-cs-primary/5 text-cs-primary/60">
                <Sparkles className="size-14" />
              </div>
            )}
          </div>

          <GlassCard className="p-5">
            <h3 className="text-base font-semibold">About this challenge</h3>
            <SafeHtmlContent
              html={challenge.instructions}
              className="mt-2 text-sm leading-relaxed"
            />
          </GlassCard>

          {isHackathon ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Stages</h2>
              {(challenge.stages ?? [])
                .slice()
                .sort((a, b) => a.stageOrder - b.stageOrder)
                .map((s) => (
                  <StageRow
                    key={s.id}
                    stage={s}
                    challengeId={challenge.id}
                    showParticipantSubmit={Boolean(isParticipant && enrolledActive)}
                    showSponsorTools={showSponsorStageTools}
                  />
                ))}
            </div>
          ) : (
            <StartupTimeline challenge={challenge} />
          )}

          <PricingPreview challenge={challenge} />
        </div>

        <aside className="space-y-4">
          <GlassCard className="p-5">
            <h3 className="text-base font-semibold">Overview</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">
                  {CHALLENGE_TYPE_LABELS[challenge.challengeType]}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium">
                  {CHALLENGE_STATUS_LABELS[challenge.status]}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Approval</dt>
                <dd className="font-medium">
                  {CHALLENGE_APPROVAL_LABELS[challenge.approvalStatus]}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Users className="size-3.5" /> Team size
                </dt>
                <dd className="font-medium">Up to {challenge.maxTeamSize}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Coins className="size-3.5" /> Entry
                </dt>
                <dd className="font-medium">
                  {challenge.isPaid ? `₹${challenge.priceOfEntry} / seat` : "Free"}
                </dd>
              </div>
              {isHackathon && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1 text-muted-foreground">
                    <Layers className="size-3.5" /> Stages
                  </dt>
                  <dd className="font-medium">
                    {challenge.stages?.length ?? 0} stages
                  </dd>
                </div>
              )}
              {!isHackathon && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1 text-muted-foreground">
                    <CalendarDays className="size-3.5" /> Duration
                  </dt>
                  <dd className="font-medium">
                    {challenge.startupDurationDays} days
                  </dd>
                </div>
              )}
            </dl>
          </GlassCard>

          {challenge.sponsor && (
            <GlassCard className="p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Eye className="size-4 text-cs-primary" />
                Sponsor
              </h3>
              <p className="mt-2 text-sm">
                {challenge.sponsor.name ?? challenge.sponsor.email}
              </p>
            </GlassCard>
          )}
        </aside>
      </div>

    </div>
  );
}
