"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Lock,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { PARTICIPATION_STATUS_LABELS } from "@/config/challenge-constants";
import { useAuth } from "@/contexts/auth-context";
import {
  getChallenge,
  getMyChallengeParticipation,
  getPricingPreview,
  startEnrollment,
} from "@/lib/challenges-api";
import { invalidateParticipationQueries } from "@/lib/participation-query-utils";
import { cn } from "@/lib/utils";
import type { PricingTierPreview } from "@/types/challenge";

const TEAM_SIZE_LABELS: Record<number, string> = {
  1: "Solo",
  2: "Team of 2",
  3: "Team of 3",
  4: "Team of 4",
};

function TierCard({
  tier,
  selected,
  onSelect,
  isFree,
  basePrice,
}: {
  tier: PricingTierPreview;
  selected: boolean;
  onSelect: () => void;
  isFree: boolean;
  basePrice: number | null;
}) {
  const displayPayable = isFree ? 0 : tier.payableRupees;
  const displayFull =
    isFree && basePrice ? basePrice * tier.teamSize : tier.fullPriceRupees;
  const savings = isFree ? 0 : tier.savingsRupees;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-cs-primary bg-cs-primary/5 shadow-md"
          : "border-cs-border/60 bg-card hover:border-cs-primary/60",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-cs-primary" />
          <span className="text-sm font-medium">
            {TEAM_SIZE_LABELS[tier.teamSize] ?? `Team of ${tier.teamSize}`}
          </span>
        </div>
        {selected && (
          <span className="rounded-full bg-cs-primary px-2 py-0.5 text-[11px] font-medium text-cs-primary-foreground">
            Selected
          </span>
        )}
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold">
            {isFree ? "Free" : `₹${displayPayable}`}
          </span>
          {!isFree && tier.discountPercent > 0 && (
            <span className="text-xs text-muted-foreground">
              <s>₹{displayFull}</s>
            </span>
          )}
        </div>
        {isFree ? (
          <p className="mt-1 text-xs text-muted-foreground">
            No payment required
          </p>
        ) : tier.discountPercent > 0 ? (
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
            {tier.discountPercent}% off · save ₹{savings}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Standard price</p>
        )}
      </div>
    </button>
  );
}

function InviteStep({
  inviteCode,
  teamSize,
  onDone,
}: {
  inviteCode: string;
  teamSize: number;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed. Copy the code manually.");
    }
  };
  return (
    <GlassCard className="space-y-4 p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-cs-primary" />
        <h3 className="text-lg font-semibold">You&apos;re enrolled</h3>
      </div>
      {teamSize > 1 ? (
        <>
          <p className="text-sm text-muted-foreground">
            Share this invite code with your {teamSize - 1} teammate
            {teamSize - 1 === 1 ? "" : "s"}. The team is locked at{" "}
            <strong>{teamSize} seats</strong> — no more, no less.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border border-cs-border/80 bg-muted px-3 py-2 font-mono text-sm">
              {inviteCode}
            </code>
            <Button variant="outline" onClick={onCopy}>
              {copied ? (
                <>
                  <Check className="mr-2 size-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 size-4" /> Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Teammates: head to{" "}
            <Link
              href="/participations"
              className="underline underline-offset-2"
            >
              My participations → Join by invite
            </Link>{" "}
            and paste this code.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          You&apos;re participating solo. Head to the challenge to start
          submitting.
        </p>
      )}
      <div className="flex justify-end">
        <Button onClick={onDone}>Go to challenge</Button>
      </div>
    </GlassCard>
  );
}

export default function EnrollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: challengeId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isParticipant = user?.role === "participant";

  const challengeQuery = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => getChallenge(challengeId),
  });
  const pricingQuery = useQuery({
    queryKey: ["challenge-pricing", challengeId],
    queryFn: () => getPricingPreview(challengeId),
  });
  const myParticipation = useQuery({
    queryKey: ["my-participation", challengeId],
    queryFn: () => getMyChallengeParticipation(challengeId),
    enabled: isParticipant,
  });

  const [selectedSize, setSelectedSize] = useState<number | null>(1);
  const [teamName, setTeamName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<{ code: string; size: number } | null>(
    null,
  );

  const challenge = challengeQuery.data;
  const pricing = pricingQuery.data;
  const isFreeChallenge = !(challenge?.isPaid ?? false);
  const basePrice = challenge?.priceOfEntry ?? null;

  // Every challenge exposes the same 4 options (solo, 2, 3, 4). If the server
  // returns them (paid challenges), use those values. Otherwise synthesise the
  // 4 free rows so the UI stays consistent.
  const tiers: PricingTierPreview[] = useMemo(() => {
    if (pricing?.tiers?.length) return pricing.tiers;
    return [1, 2, 3, 4].map((teamSize) => ({
      teamSize,
      discountPercent: 0,
      fullPriceRupees: 0,
      payableRupees: 0,
      payablePaisa: 0,
      savingsRupees: 0,
    }));
  }, [pricing?.tiers]);

  // Auto-prefill a sensible team name so the CTA is immediately usable even
  // before typing. Users can still edit it anytime.
  useEffect(() => {
    if (!teamName && (user?.name || user?.email)) {
      const who = user?.name ?? user?.email ?? "Solo";
      setTeamName(selectedSize === 1 ? `${who}'s team` : `${who} team`);
    }
  }, [selectedSize, teamName, user?.name, user?.email]);

  if (
    challengeQuery.isLoading ||
    pricingQuery.isLoading ||
    (isParticipant && myParticipation.isPending)
  ) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-cs-primary" />
      </div>
    );
  }
  if (challengeQuery.isError || !challenge) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
        {(challengeQuery.error as Error | null)?.message ??
          "Failed to load challenge."}
      </div>
    );
  }
  if (!isParticipant) {
    return (
      <div>
        <PageHeader title="Enroll" description="" />
        <GlassCard className="p-6 text-sm text-muted-foreground">
          Only participants can enroll in challenges.
        </GlassCard>
      </div>
    );
  }
  if (myParticipation.isError) {
    return (
      <div>
        <PageHeader title={challenge.title} description="Enrollment" />
        <GlassCard className="p-6 text-sm text-destructive">
          {(myParticipation.error as Error | null)?.message ??
            "Could not load your participation for this challenge."}
        </GlassCard>
      </div>
    );
  }
  const participation = myParticipation.data;
  if (participation) {
    const status = participation.status;
    if (status === "pending_payment") {
      return (
        <div>
          <PageHeader
            title={challenge.title}
            description="Complete payment to finish enrollment"
          />
          <GlassCard className="space-y-3 p-6">
            <p className="text-sm text-muted-foreground">
              You already started enrollment for this challenge. Finish checkout
              in PhonePe — when you return, we&apos;ll confirm your payment. You
              can&apos;t start a second enrollment until this one completes or
              times out.
            </p>
            {participation.team?.name ? (
              <p className="text-sm">
                Team: <strong>{participation.team.name}</strong>
                {participation.team.lockedTeamSize != null
                  ? ` · locked at ${participation.team.lockedTeamSize} seats`
                  : null}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/challenges/${challenge.id}`}>
                  Back to challenge
                </Link>
              </Button>
              <Button asChild>
                <Link href="/participations">My participations</Link>
              </Button>
            </div>
          </GlassCard>
        </div>
      );
    }
    if (status === "active") {
      return (
        <div>
          <PageHeader title={challenge.title} description="You are enrolled." />
          <GlassCard className="space-y-3 p-6">
            <p className="text-sm">
              You&apos;re already enrolled in this challenge as part of team{" "}
              <strong>{participation.team?.name}</strong> (locked at{" "}
              {participation.team?.lockedTeamSize} seats).
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/challenges/${challenge.id}`}>
                  Back to challenge
                </Link>
              </Button>
              <Button asChild>
                <Link href="/participations">My participations</Link>
              </Button>
            </div>
          </GlassCard>
        </div>
      );
    }
    if (status === "eliminated" || status === "withdrawn") {
      const label =
        PARTICIPATION_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
      return (
        <div>
          <PageHeader title={challenge.title} description="Enrollment closed" />
          <GlassCard className="space-y-3 p-6">
            <p className="text-sm text-muted-foreground">
              Your participation in this challenge is{" "}
              <strong>{label}</strong>. Re-enrollment is not available.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/challenges/${challenge.id}`}>
                  Back to challenge
                </Link>
              </Button>
              <Button asChild>
                <Link href="/participations">My participations</Link>
              </Button>
            </div>
          </GlassCard>
        </div>
      );
    }
    const _neverStatus: never = status;
    return (
      <div>
        <PageHeader title={challenge.title} description="Enrollment" />
        <GlassCard className="p-6 text-sm text-muted-foreground">
          Unexpected participation status: {String(_neverStatus)}. Try refreshing
          the page or contact support.
        </GlassCard>
      </div>
    );
  }

  if (invite) {
    return (
      <div>
        <PageHeader title={challenge.title} description="Enrollment complete" />
        <InviteStep
          inviteCode={invite.code}
          teamSize={invite.size}
          onDone={() => router.push(`/challenges/${challenge.id}`)}
        />
      </div>
    );
  }

  const selectedTier = tiers.find((t) => t.teamSize === selectedSize);

  async function handleEnroll() {
    if (!selectedTier) return;
    const finalTeamName =
      teamName.trim() ||
      `${user?.name ?? user?.email ?? "Participant"}${selectedTier.teamSize === 1 ? "'s team" : " team"}`;
    // Authoritative "is this paid?" — trust the server's pricing preview over
    // the cached challenge row (invalidation races aside).
    const serverSaysPaid = Boolean(pricing?.isPaid ?? challenge?.isPaid);

    setSubmitting(true);
    try {
      const result = await startEnrollment(challengeId, {
        teamSize: selectedTier.teamSize,
        teamName: finalTeamName,
      });
      // eslint-disable-next-line no-console
      console.log("[enroll] startEnrollment result:", result, {
        serverSaysPaid,
        challengeIsPaid: challenge?.isPaid,
        pricingIsPaid: pricing?.isPaid,
        teamSize: selectedTier.teamSize,
      });

      const hasRedirect = result.kind === "paid" && !!result.redirectUrl;

      // For ANY challenge the server considers paid, we MUST redirect to
      // PhonePe. We never fall into the free-success UI for a paid challenge.
      if (serverSaysPaid || hasRedirect) {
        if (!hasRedirect) {
          toast.error(
            "This is a paid challenge but no checkout URL was returned. Check the backend [enrollment] log.",
          );
          return;
        }
        toast.success("Redirecting to secure checkout...");
        await invalidateParticipationQueries(queryClient, { challengeId });
        window.location.href = result.redirectUrl;
        return;
      }
      toast.success("You're enrolled!");
      await invalidateParticipationQueries(queryClient, { challengeId });
      setInvite({ code: result.inviteCode, size: selectedTier.teamSize });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setSubmitting(false);
    }
  }

  const paid = !!challenge.isPaid;
  const soloSelected = selectedSize === 1;
  const payLabel = paid
    ? `Pay ₹${selectedTier?.payableRupees ?? 0} & enroll`
    : soloSelected
      ? "Enroll now"
      : "Create team & enroll";

  return (
    <div>
      <PageHeader
        title={challenge.title}
        description={
          paid
            ? "Choose solo or a team size — the leader pays upfront via PhonePe."
            : "Choose solo or a team size — it's free to enroll."
        }
      >
        <Button variant="outline" asChild>
          <Link href={`/challenges/${challenge.id}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <GlassCard className="p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Users className="size-4 text-cs-primary" />
              Solo or team?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Every challenge has the same 4 options. The size you pick
              <strong> locks your team permanently</strong> — teammates can only
              join via the invite code you receive next, and no one else can
              squeeze in afterwards.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tiers.map((tier) => (
                <TierCard
                  key={tier.teamSize}
                  tier={tier}
                  selected={selectedSize === tier.teamSize}
                  onSelect={() => setSelectedSize(tier.teamSize)}
                  isFree={isFreeChallenge}
                  basePrice={basePrice}
                />
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="text-base font-semibold">
              {soloSelected ? "Entry name" : "Team name"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {soloSelected
                ? "This is how you'll appear in submissions, leaderboards, and sponsor dashboards."
                : "This name is visible to sponsors, judges, and your teammates."}
            </p>
            <Input
              className="mt-3"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder={
                soloSelected ? "e.g. Alex's solo run" : "e.g. Pixel Pirates"
              }
              maxLength={80}
            />
          </GlassCard>
        </div>

        <aside className="space-y-4">
          <GlassCard className="p-5">
            <h3 className="text-base font-semibold">Order summary</h3>
            {selectedTier ? (
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Option</dt>
                  <dd className="font-medium">
                    {TEAM_SIZE_LABELS[selectedTier.teamSize] ??
                      `Team of ${selectedTier.teamSize}`}
                  </dd>
                </div>
                {!isFreeChallenge && (
                  <>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Per seat</dt>
                      <dd className="font-medium">₹{basePrice}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Full price</dt>
                      <dd>₹{selectedTier.fullPriceRupees}</dd>
                    </div>
                    {selectedTier.discountPercent > 0 && (
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Discount</dt>
                        <dd className="text-emerald-700 dark:text-emerald-300">
                          -₹{selectedTier.savingsRupees} (
                          {selectedTier.discountPercent}%)
                        </dd>
                      </div>
                    )}
                    <div className="my-2 border-t border-cs-border/50" />
                    <div className="flex items-center justify-between text-base">
                      <dt className="font-medium">You pay now</dt>
                      <dd className="text-lg font-semibold">
                        ₹{selectedTier.payableRupees}
                      </dd>
                    </div>
                  </>
                )}
                {isFreeChallenge && (
                  <div className="flex items-center justify-between text-base">
                    <dt className="font-medium">Total</dt>
                    <dd className="text-lg font-semibold">Free</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Select an option to see pricing.
              </p>
            )}

            <Button
              className="mt-5 w-full"
              size="lg"
              disabled={submitting || !selectedTier}
              onClick={handleEnroll}
            >
              {submitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : paid ? (
                <Lock className="mr-2 size-4" />
              ) : null}
              {submitting ? "Processing..." : payLabel}
            </Button>
            {paid && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                You&apos;ll be redirected to PhonePe. Payment is processed
                securely off-platform.
              </p>
            )}
            {!paid && !soloSelected && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                You&apos;ll get an invite code to share with teammates on the
                next screen.
              </p>
            )}
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
