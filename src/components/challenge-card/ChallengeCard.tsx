"use client";

import {
  CalendarDays,
  Coins,
  Eye,
  Flag,
  Layers,
  Lock,
  Pencil,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  CHALLENGE_APPROVAL_LABELS,
  CHALLENGE_STATUS_LABELS,
  CHALLENGE_TYPE_LABELS,
} from "@/config/challenge-constants";
import { useAuth } from "@/contexts/auth-context";
import type { Challenge } from "@/types/challenge";
import { cn } from "@/lib/utils";

export function challengeImageSrc(
  imagePath: string | null | undefined,
): string | null {
  if (!imagePath?.trim()) return null;
  const p = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `/api${p}`;
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

function nextHackathonStageInfo(c: Challenge): {
  label: string;
  deadline: string | null;
} {
  const stages = c.stages ?? [];
  const active = stages.find((s) => s.status === "active");
  if (active) {
    return {
      label: `${active.stageType[0].toUpperCase()}${active.stageType.slice(1)} stage`,
      deadline: active.submissionDeadline,
    };
  }
  const nextPending = stages.find((s) => s.status === "pending");
  if (nextPending) {
    return {
      label: `${nextPending.stageType[0].toUpperCase()}${nextPending.stageType.slice(1)} opens`,
      deadline: nextPending.applyDeadline,
    };
  }
  return { label: "Completed", deadline: null };
}

export function ChallengeCard({
  challenge,
  showApprovalBadge = false,
  showParticipate = false,
  alreadyParticipated = false,
}: {
  challenge: Challenge;
  showApprovalBadge?: boolean;
  showParticipate?: boolean;
  alreadyParticipated?: boolean;
}) {
  const { user } = useAuth();
  const canEdit =
    user?.role === "admin" ||
    (user?.role === "sponsor" && user.id === challenge.sponsorId);
  const isHackathon = challenge.challengeType === "hackathon";
  const image = challengeImageSrc(challenge.image);
  const stageInfo = isHackathon ? nextHackathonStageInfo(challenge) : null;
  const startupEnd =
    !isHackathon && challenge.startupStartAt && challenge.startupDurationDays
      ? new Date(
          new Date(challenge.startupStartAt).getTime() +
            challenge.startupDurationDays * 24 * 60 * 60 * 1000,
        ).toISOString()
      : null;

  const approvalLabel =
    challenge.approvalStatus === "approved"
      ? null
      : (CHALLENGE_APPROVAL_LABELS[challenge.approvalStatus] ?? challenge.approvalStatus);

  return (
    <GlassCard className="group flex h-full flex-col overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={challenge.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-cs-primary/10 to-cs-primary/5 text-cs-primary/60">
            <Sparkles className="size-10" />
          </div>
        )}

        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-md",
              isHackathon
                ? "bg-violet-500/15 text-violet-800 dark:text-violet-300"
                : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
            )}
          >
            {CHALLENGE_TYPE_LABELS[challenge.challengeType]}
          </span>
          {challenge.isPaid && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-800 backdrop-blur-md dark:text-amber-300">
              <Coins className="size-3.5" />
              ₹{challenge.priceOfEntry ?? 0}
            </span>
          )}
        </div>

        {showApprovalBadge && approvalLabel && (
          <div className="absolute inset-x-3 bottom-3">
            <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-800 backdrop-blur-md dark:text-sky-300">
              {approvalLabel}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 className="line-clamp-2 !leading-[1.2] font-semibold !text-xl mb-4 !text-cs-primary">
            {challenge.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {challenge.shortDescription}
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
          {isHackathon ? (
            <div className="flex items-center gap-2">
              <Layers className="size-3.5 text-cs-primary" />
              <dt className="sr-only">Next stage</dt>
              <dd>
                <span className="font-medium text-foreground">
                  {stageInfo?.label ?? "—"}
                </span>
                {stageInfo?.deadline ? (
                  <>
                    {" "}
                    · due {formatDate(stageInfo.deadline)}
                  </>
                ) : null}
              </dd>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CalendarDays className="size-3.5 text-cs-primary" />
              <dd>
                {challenge.startupDurationDays ?? 0}-day sprint
                {startupEnd ? <> · ends {formatDate(startupEnd)}</> : null}
              </dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-cs-primary" />
            <dd>
              Team of up to {challenge.maxTeamSize}
              {challenge.isPaid && challenge.pricingTiers?.length
                ? ` · ${challenge.pricingTiers.length} pricing tiers`
                : ""}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Flag className="size-3.5 text-cs-primary" />
            <dd>
              {CHALLENGE_STATUS_LABELS[challenge.status] ?? challenge.status}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/challenges/${challenge.id}`}>
              <Eye className="mr-2 size-4" /> View
            </Link>
          </Button>
          {showParticipate && (
            <Button
              asChild={!alreadyParticipated}
              variant="default"
              size="sm"
              className="flex-1"
              disabled={alreadyParticipated}
            >
              {alreadyParticipated ? (
                <span className="inline-flex items-center">
                  <Lock className="mr-2 size-4" />
                  Participated
                </span>
              ) : (
                <Link href={`/challenges/${challenge.id}/enroll`}>Participate</Link>
              )}
            </Button>
          )}
          {canEdit && (
            <Button
              asChild
              variant="outline"
              size="sm"
              aria-label="Edit challenge"
            >
              <Link href={`/challenges/${challenge.id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export default ChallengeCard;
