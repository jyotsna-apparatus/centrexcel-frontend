"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAuth } from "@/contexts/auth-context";
import { getUsers } from "@/lib/auth-api";
import {
  getChallenge,
  updateChallenge,
  type UpdateChallengeInput,
} from "@/lib/challenges-api";
import { cn } from "@/lib/utils";
import {
  CHALLENGE_CONSTANTS,
  CHALLENGE_STATUS_LABELS,
  DEFAULT_PRICING_TIERS,
} from "@/config/challenge-constants";

const { TEXT_LIMITS, JUDGE_COUNT } = CHALLENGE_CONSTANTS;

interface DailyDraft {
  dayNumber: number;
  instruction: string;
}

interface TierDraft {
  teamSize: number;
  discountPercent: number;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="space-y-4 p-5">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </GlassCard>
  );
}

function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1 flex items-baseline justify-between">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-foreground"
      >
        {children}
      </label>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export default function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const challengeQuery = useQuery({
    queryKey: ["challenge", id],
    queryFn: () => getChallenge(id),
  });
  const challenge = challengeQuery.data;

  const sponsorsQuery = useQuery({
    queryKey: ["users", "sponsor", "picker"],
    queryFn: () => getUsers({ page: 1, limit: 100, role: "sponsor" }),
    enabled: isAdmin,
  });
  const judgesQuery = useQuery({
    queryKey: ["users", "judge", "picker"],
    queryFn: () => getUsers({ page: 1, limit: 100, role: "judge" }),
  });

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sponsorId, setSponsorId] = useState<string>("");
  const [judgeIds, setJudgeIds] = useState<string[]>([]);

  const [startupStartAt, setStartupStartAt] = useState<string>("");
  const [dailyInstructions, setDailyInstructions] = useState<DailyDraft[]>([]);

  const [isPaid, setIsPaid] = useState(false);
  const [priceOfEntry, setPriceOfEntry] = useState<string>("");
  const [pricingTiers, setPricingTiers] = useState<TierDraft[]>(() =>
    DEFAULT_PRICING_TIERS.map((t) => ({ ...t })),
  );

  const [status, setStatus] = useState<UpdateChallengeInput["status"]>("open");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!challenge || loaded) return;
    setTitle(challenge.title ?? "");
    setShortDescription(challenge.shortDescription ?? "");
    setInstructions(challenge.instructions ?? "");
    setSponsorId(challenge.sponsorId ?? "");
    setJudgeIds(
      (challenge.judges ?? [])
        .map((j) => j.judge?.id)
        .filter((v): v is string => !!v),
    );
    setStartupStartAt(challenge.startupStartAt ?? "");
    setDailyInstructions(
      (challenge.dailyInstructions ?? []).map((d) => ({
        dayNumber: d.dayNumber,
        instruction: d.instruction,
      })),
    );
    setIsPaid(challenge.isPaid);
    setPriceOfEntry(
      challenge.priceOfEntry != null ? String(challenge.priceOfEntry) : "",
    );
    setPricingTiers(
      [1, 2, 3, 4].map((teamSize) => {
        const existing = (challenge.pricingTiers ?? []).find(
          (t) => t.teamSize === teamSize,
        );
        return {
          teamSize,
          discountPercent: existing
            ? Number(existing.discountPercent)
            : (DEFAULT_PRICING_TIERS.find((t) => t.teamSize === teamSize)
                ?.discountPercent ?? 0),
        };
      }),
    );
    setStatus(
      (challenge.status as UpdateChallengeInput["status"]) ?? "open",
    );
    setLoaded(true);
  }, [challenge, loaded]);

  const sponsorOptions = useMemo(
    () =>
      (sponsorsQuery.data?.data ?? []).map((u) => ({
        value: u.id,
        label: u.name || u.email,
      })),
    [sponsorsQuery.data],
  );
  const judgeOptions = useMemo(
    () =>
      (judgesQuery.data?.data ?? []).map((u) => ({
        value: u.id,
        label: u.name || u.email,
      })),
    [judgesQuery.data],
  );

  function updateDaily(day: number, instruction: string) {
    setDailyInstructions((prev) =>
      prev.map((d) =>
        d.dayNumber === day
          ? {
              ...d,
              instruction: instruction.slice(0, TEXT_LIMITS.DAILY_INSTRUCTION),
            }
          : d,
      ),
    );
  }

  function updateTierDiscount(teamSize: number, discountPercent: number) {
    setPricingTiers((prev) =>
      prev.map((t) =>
        t.teamSize === teamSize
          ? {
              ...t,
              discountPercent: Math.max(0, Math.min(100, discountPercent)),
            }
          : t,
      ),
    );
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setImage(f);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(f ? URL.createObjectURL(f) : null);
  }

  const isHackathon = challenge?.challengeType === "hackathon";

  const updateMutation = useMutation({
    mutationFn: (input: UpdateChallengeInput) => updateChallenge(id, input),
    onSuccess: () => {
      toast.success("Challenge updated");
      qc.invalidateQueries({ queryKey: ["challenge", id] });
      qc.invalidateQueries({ queryKey: ["challenges-page"] });
      router.push(`/challenges/${id}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    },
  });

  function validate(): string | null {
    if (!title.trim()) return "Title is required.";
    if (!shortDescription.trim()) return "Short description is required.";
    if (!instructions.trim()) return "Instructions are required.";
    if (judgeIds.length < JUDGE_COUNT.MIN)
      return `Pick at least ${JUDGE_COUNT.MIN} judge.`;
    if (judgeIds.length > JUDGE_COUNT.MAX)
      return `Pick at most ${JUDGE_COUNT.MAX} judges.`;

    if (!isHackathon) {
      if (!startupStartAt) return "Start date & time are required.";
      for (const d of dailyInstructions) {
        if (!d.instruction.trim())
          return `Day ${d.dayNumber} needs an instruction.`;
      }
    }

    if (isPaid) {
      const price = Number(priceOfEntry);
      if (!Number.isFinite(price) || price <= 0)
        return "Price per seat must be greater than 0.";
      if (pricingTiers.length !== 4)
        return "Exactly 4 pricing tiers are required (solo, 2, 3, 4).";
      const required = [1, 2, 3, 4];
      for (const teamSize of required) {
        if (!pricingTiers.some((t) => t.teamSize === teamSize)) {
          return `Missing pricing tier for team size ${teamSize}.`;
        }
      }
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const payload: UpdateChallengeInput = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      instructions: instructions.trim(),
      sponsorId: isAdmin ? sponsorId : undefined,
      judgeIds,
      isPaid,
      priceOfEntry: isPaid ? Number(priceOfEntry) : undefined,
      pricingTiers: isPaid ? pricingTiers : undefined,
      status,
      image,
    };
    if (!isHackathon) {
      payload.startupStartAt = startupStartAt
        ? new Date(startupStartAt).toISOString()
        : undefined;
      payload.dailyInstructions = dailyInstructions;
    }
    await updateMutation.mutateAsync(payload);
  }

  if (challengeQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-cs-primary" />
      </div>
    );
  }
  if (challengeQuery.isError || !challenge) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
        {challengeQuery.error instanceof Error
          ? challengeQuery.error.message
          : "Failed to load challenge."}
      </div>
    );
  }

  const canEdit =
    isAdmin || (user?.role === "sponsor" && user.id === challenge.sponsorId);
  if (!canEdit) {
    return (
      <div>
        <PageHeader title={challenge.title} description="" />
        <GlassCard className="p-6 text-sm text-muted-foreground">
          You don&apos;t have permission to edit this challenge.
        </GlassCard>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title={`Edit: ${challenge.title}`}
        description="Update challenge details. Some fields are locked once created."
      >
        <Button type="button" variant="outline" asChild>
          <Link href={`/challenges/${challenge.id}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <Section title="Basics">
            <div>
              <FieldLabel
                htmlFor="title"
                hint={`${title.length} / ${TEXT_LIMITS.TITLE}`}
              >
                Title
              </FieldLabel>
              <Input
                id="title"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value.slice(0, TEXT_LIMITS.TITLE))
                }
              />
            </div>
            <div>
              <FieldLabel
                htmlFor="short"
                hint={`${shortDescription.length} / ${TEXT_LIMITS.SHORT_DESCRIPTION}`}
              >
                Short description
              </FieldLabel>
              <Input
                id="short"
                value={shortDescription}
                onChange={(e) =>
                  setShortDescription(
                    e.target.value.slice(0, TEXT_LIMITS.SHORT_DESCRIPTION),
                  )
                }
              />
            </div>
            <div>
              <FieldLabel htmlFor="instructions" hint="Rich text">
                Full instructions
              </FieldLabel>
              <TiptapEditor
                value={instructions}
                onChange={setInstructions}
                maxLength={TEXT_LIMITS.INSTRUCTIONS}
                editorContentClassName="min-h-[200px]"
              />
            </div>
            <div>
              <FieldLabel htmlFor="image">Replace banner image</FieldLabel>
              <input
                id="image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onImageChange}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-cs-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-cs-primary-foreground"
              />
              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="preview"
                  className="mt-3 max-h-48 rounded-md object-cover"
                />
              )}
            </div>
          </Section>

          <Section
            title="People"
            description={
              isAdmin
                ? "Change the owning sponsor and judges."
                : "Update the assigned judges."
            }
          >
            {isAdmin && (
              <div>
                <FieldLabel htmlFor="sponsor">Sponsor</FieldLabel>
                <SearchableSelect
                  id="sponsor"
                  options={sponsorOptions}
                  value={sponsorId}
                  onChange={setSponsorId}
                  placeholder={
                    sponsorsQuery.isLoading
                      ? "Loading sponsors..."
                      : "Pick a sponsor"
                  }
                />
              </div>
            )}
            <div>
              <FieldLabel htmlFor="judges" hint={`${judgeIds.length} selected`}>
                Judges (1–{JUDGE_COUNT.MAX})
              </FieldLabel>
              <SearchableMultiSelect
                id="judges"
                options={judgeOptions}
                value={judgeIds}
                onChange={setJudgeIds}
                max={JUDGE_COUNT.MAX}
                placeholder={
                  judgesQuery.isLoading ? "Loading judges..." : "Pick judges"
                }
              />
            </div>
          </Section>

          {isHackathon ? (
            <Section
              title="Stages"
              description="Stage instructions and deadlines are edited per stage."
            >
              <div className="flex items-start gap-2 rounded-md border border-cs-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0 text-cs-primary" />
                <p>
                  The 3 stages and challenge type can&apos;t be changed after
                  creation. Edit each stage&apos;s instructions and deadlines
                  from the links below.
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                {(challenge.stages ?? []).map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-cs-border/40 bg-background/40 px-3 py-2"
                  >
                    <span>
                      <strong>Stage {s.stageOrder}:</strong>{" "}
                      {s.stageType[0].toUpperCase() + s.stageType.slice(1)}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {s.status}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/challenges/${id}/stages/${s.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : (
            <Section
              title="Sprint schedule"
              description="Update the start date and daily instructions."
            >
              <div>
                <FieldLabel htmlFor="startAt">Start date & time</FieldLabel>
                <DateTimePicker
                  id="startAt"
                  value={startupStartAt}
                  onChange={setStartupStartAt}
                />
              </div>
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Daily instructions</h4>
                <div className="max-h-[480px] space-y-2 overflow-y-auto rounded-lg border border-cs-border/60 p-3">
                  {dailyInstructions.map((d) => (
                    <div
                      key={d.dayNumber}
                      className="grid grid-cols-[auto_1fr] items-start gap-3"
                    >
                      <span className="mt-2 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-cs-primary/10 text-xs font-semibold text-cs-primary">
                        D{d.dayNumber}
                      </span>
                      <TiptapEditor
                        value={d.instruction}
                        onChange={(v) => updateDaily(d.dayNumber, v)}
                        placeholder={`Instruction for day ${d.dayNumber}`}
                        maxLength={TEXT_LIMITS.DAILY_INSTRUCTION}
                        editorContentClassName="min-h-[80px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

          <Section
            title="Pricing & team size"
            description="Team sizes are fixed (solo, 2, 3, 4). Discount percentages are customizable per challenge."
          >
            <div className="flex items-center gap-2">
              <input
                id="isPaid"
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="size-4 rounded border-cs-border"
              />
              <label htmlFor="isPaid" className="text-sm">
                This is a <strong>paid</strong> challenge
              </label>
            </div>

            {isPaid && (
              <div>
                <FieldLabel htmlFor="price">Price per seat (₹)</FieldLabel>
                <Input
                  id="price"
                  type="number"
                  min={1}
                  value={priceOfEntry}
                  onChange={(e) => setPriceOfEntry(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Solo pays this × 1. Larger teams apply the platform discount
                  ladder.
                </p>
              </div>
            )}

            {isPaid && (
              <div className="rounded-md border border-cs-border/60 bg-muted/30 p-3">
                <h4 className="text-sm font-medium">
                  Team size & discount ladder
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Team size options are fixed, but discount percentages are
                  editable for this challenge. Leader pays the full tier price
                  upfront; teammates join by invite code for free.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  {pricingTiers.map((t) => {
                    const price = Number(priceOfEntry) || 0;
                    const full = price * t.teamSize;
                    const payable = Math.round(
                      full * (1 - t.discountPercent / 100),
                    );
                    return (
                      <div
                        key={t.teamSize}
                        className="rounded-md border border-cs-border/60 bg-background/40 p-2 text-xs"
                      >
                        <div className="font-medium text-foreground">
                          {t.teamSize === 1
                            ? "Solo"
                            : `Team of ${t.teamSize}`}
                        </div>
                        <div className="mt-2">
                          <FieldLabel htmlFor={`tier-discount-${t.teamSize}`}>
                            Discount %
                          </FieldLabel>
                          <Input
                            id={`tier-discount-${t.teamSize}`}
                            type="number"
                            min={0}
                            max={100}
                            value={t.discountPercent}
                            onChange={(e) =>
                              updateTierDiscount(
                                t.teamSize,
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div className="mt-1 text-foreground">
                          ₹{payable}
                          {t.discountPercent > 0 && (
                            <s className="ml-1 text-muted-foreground">
                              ₹{full}
                            </s>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>
        </div>

        <aside className="space-y-4">
          <GlassCard className="p-5">
            <h3 className="text-base font-semibold">Status</h3>
            <div className="mt-3 space-y-2">
              {(
                [
                  "open",
                  "draft",
                  "submission_closed",
                  "closed",
                  "cancelled",
                ] as const
              ).map((s) => (
                <label
                  key={s}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md border p-2.5 text-sm",
                    status === s
                      ? "border-cs-primary bg-cs-primary/5"
                      : "border-cs-border/60",
                  )}
                >
                  <input
                    type="radio"
                    name="status"
                    checked={status === s}
                    onChange={() => setStatus(s)}
                  />
                  <span>{CHALLENGE_STATUS_LABELS[s] ?? s}</span>
                </label>
              ))}
            </div>
            <Button
              type="submit"
              size="lg"
              className="mt-5 w-full"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </GlassCard>
        </aside>
      </div>
    </form>
  );
}
