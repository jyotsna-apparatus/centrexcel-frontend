"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  GraduationCap,
  Lightbulb,
  Loader2,
  Rocket,
} from "lucide-react";
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
  createChallenge,
  type CreateChallengeInput,
  type CreateHackathonChallengeInput,
  type CreateStartupChallengeInput,
} from "@/lib/challenges-api";
import { cn } from "@/lib/utils";
import {
  CHALLENGE_CONSTANTS,
  CHALLENGE_TYPE_DESCRIPTIONS,
  DEFAULT_PRICING_TIERS,
} from "@/config/challenge-constants";

const { TEAM_SIZE, STARTUP_DURATION, TEXT_LIMITS, JUDGE_COUNT } =
  CHALLENGE_CONSTANTS;

type ChallengeType = "hackathon" | "startup";
type StageKey = "ideation" | "concept" | "project";
const STAGE_KEYS: StageKey[] = ["ideation", "concept", "project"];

const STAGE_META: Record<
  StageKey,
  { title: string; hint: string; icon: typeof Lightbulb }
> = {
  ideation: {
    title: "Ideation Stage",
    hint: "Participants submit rough ideas (.zip). Admin/sponsor shortlists.",
    icon: Lightbulb,
  },
  concept: {
    title: "Concept Stage",
    hint: "Shortlisted participants submit concepts (.zip). Admin/sponsor shortlists again.",
    icon: GraduationCap,
  },
  project: {
    title: "Project Stage",
    hint: "Final shortlist builds the project. Judges score submissions.",
    icon: Rocket,
  },
};

interface StageDraft {
  stageType: StageKey;
  instructions: string;
  applyDeadline: string;
  submissionDeadline: string;
  reviewDeadline: string;
}

interface DailyDraft {
  dayNumber: number;
  instruction: string;
}

interface TierDraft {
  teamSize: number;
  discountPercent: number;
}

function makeEmptyStages(): StageDraft[] {
  return STAGE_KEYS.map((k) => ({
    stageType: k,
    instructions: "",
    applyDeadline: "",
    submissionDeadline: "",
    reviewDeadline: "",
  }));
}

function makeDailyInstructions(n: number): DailyDraft[] {
  return Array.from({ length: n }, (_, i) => ({
    dayNumber: i + 1,
    instruction: "",
  }));
}

function makeDefaultTiers(): TierDraft[] {
  return DEFAULT_PRICING_TIERS.map((t) => ({ ...t }));
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

export default function NewChallengePage() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === "admin";
  const isSponsor = role === "sponsor";

  const sponsorsQuery = useQuery({
    queryKey: ["users", "sponsor", "picker"],
    queryFn: () => getUsers({ page: 1, limit: 100, role: "sponsor" }),
    enabled: isAdmin,
  });
  const judgesQuery = useQuery({
    queryKey: ["users", "judge", "picker"],
    queryFn: () => getUsers({ page: 1, limit: 100, role: "judge" }),
  });

  const [challengeType, setChallengeType] = useState<ChallengeType>("hackathon");
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sponsorId, setSponsorId] = useState<string>("");
  const [judgeIds, setJudgeIds] = useState<string[]>([]);

  const [stages, setStages] = useState<StageDraft[]>(makeEmptyStages);
  const [startupDurationDays, setStartupDurationDays] = useState<number>(15);
  const [startupStartAt, setStartupStartAt] = useState<string>("");
  const [dailyInstructions, setDailyInstructions] = useState<DailyDraft[]>(() =>
    makeDailyInstructions(15),
  );

  const [isPaid, setIsPaid] = useState(false);
  const [priceOfEntry, setPriceOfEntry] = useState<string>("");
  const [pricingTiers, setPricingTiers] = useState<TierDraft[]>(
    makeDefaultTiers,
  );

  const [publishStatus, setPublishStatus] = useState<"open" | "draft">("open");
  const [submitting, setSubmitting] = useState(false);

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

  function updateStage(idx: number, patch: Partial<StageDraft>) {
    setStages((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function handleDurationChange(nextRaw: number) {
    const next = Math.max(
      STARTUP_DURATION.MIN,
      Math.min(STARTUP_DURATION.MAX, Math.floor(nextRaw)),
    );
    setStartupDurationDays(next);
    setDailyInstructions((prev) => {
      const out: DailyDraft[] = [];
      for (let d = 1; d <= next; d++) {
        const existing = prev.find((x) => x.dayNumber === d);
        out.push(existing ?? { dayNumber: d, instruction: "" });
      }
      return out;
    });
  }

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

  function validate(): string | null {
    if (!title.trim()) return "Title is required.";
    if (!shortDescription.trim()) return "Short description is required.";
    if (!instructions.trim()) return "Instructions are required.";
    if (isAdmin && !sponsorId) return "Select a sponsor to own this challenge.";
    if (judgeIds.length < JUDGE_COUNT.MIN)
      return `Pick at least ${JUDGE_COUNT.MIN} judge.`;
    if (judgeIds.length > JUDGE_COUNT.MAX)
      return `Pick at most ${JUDGE_COUNT.MAX} judges.`;

    if (challengeType === "hackathon") {
      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        if (!s.instructions.trim())
          return `Stage ${i + 1} instructions are required.`;
        if (!s.applyDeadline || !s.submissionDeadline || !s.reviewDeadline)
          return `Stage ${i + 1}: all three deadlines are required.`;
        const a = new Date(s.applyDeadline).getTime();
        const su = new Date(s.submissionDeadline).getTime();
        const r = new Date(s.reviewDeadline).getTime();
        if (!(a < su))
          return `Stage ${i + 1}: submission deadline must be after apply deadline.`;
        if (!(su < r))
          return `Stage ${i + 1}: review deadline must be after submission deadline.`;
        if (i > 0) {
          const prevRev = new Date(stages[i - 1].reviewDeadline).getTime();
          if (!(prevRev <= a))
            return `Stage ${i + 1} apply deadline must be on/after previous stage's review deadline.`;
        }
      }
    } else {
      if (!startupStartAt) return "Start date & time are required.";
      if (
        startupDurationDays < STARTUP_DURATION.MIN ||
        startupDurationDays > STARTUP_DURATION.MAX
      )
        return `Duration must be between ${STARTUP_DURATION.MIN} and ${STARTUP_DURATION.MAX} days.`;
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
    setSubmitting(true);
    try {
      const base = {
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        instructions: instructions.trim(),
        sponsorId: isAdmin ? sponsorId : undefined,
        judgeIds,
        isPaid,
        priceOfEntry: isPaid ? Number(priceOfEntry) : undefined,
        pricingTiers: isPaid ? pricingTiers : undefined,
        status: publishStatus,
        image,
      } as const;

      let input: CreateChallengeInput;
      if (challengeType === "hackathon") {
        const hack: CreateHackathonChallengeInput = {
          ...base,
          challengeType: "hackathon",
          stages: stages.map((s, i) => ({
            stageType: s.stageType,
            stageOrder: (i + 1) as 1 | 2 | 3,
            instructions: s.instructions,
            applyDeadline: new Date(s.applyDeadline).toISOString(),
            submissionDeadline: new Date(s.submissionDeadline).toISOString(),
            reviewDeadline: new Date(s.reviewDeadline).toISOString(),
          })),
        };
        input = hack;
      } else {
        const startup: CreateStartupChallengeInput = {
          ...base,
          challengeType: "startup",
          startupDurationDays,
          startupStartAt: new Date(startupStartAt).toISOString(),
          dailyInstructions,
        };
        input = startup;
      }
      const created = await createChallenge(input);
      toast.success(
        isSponsor
          ? "Challenge submitted for admin approval"
          : "Challenge created",
      );
      router.push(`/challenges/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title="Create challenge"
        description="Launch a new hackathon or startup challenge."
      >
        <Button type="button" variant="outline" asChild>
          <Link href="/challenges">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <Section title="Type">
            <div className="grid gap-3 sm:grid-cols-2">
              {(["hackathon", "startup"] as ChallengeType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setChallengeType(t)}
                  aria-pressed={challengeType === t}
                  className={cn(
                    "relative flex flex-col gap-2 rounded-xl border p-4 text-left transition",
                    challengeType === t
                      ? "border-cs-primary bg-cs-primary/5 shadow-sm"
                      : "border-cs-border/60 hover:border-cs-primary/60",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {t === "hackathon" ? (
                      <Rocket className="size-4 text-cs-primary" />
                    ) : (
                      <CalendarDays className="size-4 text-cs-primary" />
                    )}
                    <strong className="text-sm">
                      {t === "hackathon" ? "Hackathon" : "Startup sprint"}
                    </strong>
                    {challengeType === t && (
                      <Check className="ml-auto size-4 text-cs-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {CHALLENGE_TYPE_DESCRIPTIONS[t]}
                  </p>
                </button>
              ))}
            </div>
          </Section>

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
                placeholder="e.g. AI for Climate 2026"
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
                placeholder="One-liner for the card"
              />
            </div>
            <div>
              <FieldLabel htmlFor="instructions" hint="Rich text">
                Full instructions
              </FieldLabel>
              <TiptapEditor
                value={instructions}
                onChange={setInstructions}
                placeholder="Rules, eligibility, context, prize pool, etc."
                maxLength={TEXT_LIMITS.INSTRUCTIONS}
                editorContentClassName="min-h-[200px]"
              />
            </div>
            <div>
              <FieldLabel htmlFor="image">Banner image (optional)</FieldLabel>
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
                ? "Pick the owning sponsor and judges for this challenge."
                : "Pick judges for this challenge. You'll be set as the owning sponsor."
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

          {challengeType === "hackathon" ? (
            <Section
              title="Stages"
              description="Three fixed stages. Each stage has an apply, submission, and review deadline."
            >
              <div className="space-y-5">
                {stages.map((s, i) => {
                  const meta = STAGE_META[s.stageType];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={s.stageType}
                      className="rounded-xl border border-cs-border/70 bg-background/40 p-4"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <Icon className="size-4 text-cs-primary" />
                        <h4 className="text-sm font-semibold">
                          Stage {i + 1}: {meta.title}
                        </h4>
                      </div>
                      <p className="mb-3 text-xs text-muted-foreground">
                        {meta.hint}
                      </p>
                      <div className="space-y-3">
                        <TiptapEditor
                          value={s.instructions}
                          onChange={(v) => updateStage(i, { instructions: v })}
                          placeholder="Specific instructions for this stage"
                          maxLength={TEXT_LIMITS.INSTRUCTIONS}
                          editorContentClassName="min-h-[120px]"
                        />
                        <div className="grid gap-3 md:grid-cols-3">
                          <div>
                            <FieldLabel>Apply deadline</FieldLabel>
                            <DateTimePicker
                              value={s.applyDeadline}
                              onChange={(v) =>
                                updateStage(i, { applyDeadline: v })
                              }
                            />
                          </div>
                          <div>
                            <FieldLabel>Submission deadline</FieldLabel>
                            <DateTimePicker
                              value={s.submissionDeadline}
                              onChange={(v) =>
                                updateStage(i, { submissionDeadline: v })
                              }
                            />
                          </div>
                          <div>
                            <FieldLabel>Review deadline</FieldLabel>
                            <DateTimePicker
                              value={s.reviewDeadline}
                              onChange={(v) =>
                                updateStage(i, { reviewDeadline: v })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          ) : (
            <Section
              title="Sprint schedule"
              description="Set the start date and daily instructions that participants must follow."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="duration">
                    Duration (days)
                  </FieldLabel>
                  <Input
                    id="duration"
                    type="number"
                    min={STARTUP_DURATION.MIN}
                    max={STARTUP_DURATION.MAX}
                    value={startupDurationDays}
                    onChange={(e) =>
                      handleDurationChange(Number(e.target.value) || 1)
                    }
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="startAt">Start date & time</FieldLabel>
                  <DateTimePicker
                    id="startAt"
                    value={startupStartAt}
                    onChange={setStartupStartAt}
                  />
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <h4 className="text-sm font-medium">Daily instructions</h4>
                <p className="text-xs text-muted-foreground">
                  One instruction per day. Participants see today&apos;s
                  instruction when posting their entry.
                </p>
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
            title="Pricing"
            description="Every challenge has fixed 4 options (solo, team of 2, team of 3, team of 4). You can customize the discount % for each option."
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
                  placeholder="e.g. 1000"
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
                  Team sizes are fixed, but discount percentages are editable
                  per challenge. Leader pays the full tier price upfront;
                  teammates join by invite code for free.
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
            <h3 className="text-base font-semibold">Publish</h3>
            <div className="mt-3 space-y-2">
              {(["open", "draft"] as const).map((s) => (
                <label
                  key={s}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm",
                    publishStatus === s
                      ? "border-cs-primary bg-cs-primary/5"
                      : "border-cs-border/60",
                  )}
                >
                  <input
                    type="radio"
                    name="publishStatus"
                    checked={publishStatus === s}
                    onChange={() => setPublishStatus(s)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium">
                      {s === "open" ? "Open immediately" : "Save as draft"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s === "open"
                        ? isSponsor
                          ? "Goes to admin for approval; opens to participants once approved."
                          : "Visible to participants immediately."
                        : "Won't be visible to participants yet."}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <Button
              type="submit"
              size="lg"
              className="mt-5 w-full"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {submitting
                ? "Creating..."
                : isSponsor
                  ? "Submit for approval"
                  : "Create challenge"}
            </Button>
          </GlassCard>

          <GlassCard className="p-5 text-xs text-muted-foreground">
            <strong className="text-foreground">Tip</strong>
            <p className="mt-1">
              {challengeType === "hackathon"
                ? "Participants need time between stages for shortlisting. Consider at least 24–48 hours between a stage's review deadline and the next stage's apply deadline."
                : "Each day's instruction should be specific and self-contained — participants only see one day at a time."}
            </p>
          </GlassCard>
        </aside>
      </div>
    </form>
  );
}
