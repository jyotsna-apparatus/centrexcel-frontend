"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, IndianRupee } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import {
  HACKATHON_CONSTANTS,
  SUBMISSION_MODE,
  SUBMISSION_MODE_LABELS,
} from "@/config/hackathon-constants";
import { useAuth } from "@/contexts/auth-context";
import {
  type CreateHackathonFormData,
  createHackathon,
  getFavorites,
  getJudgeOptions,
  getUsers,
  type UserListItem,
} from "@/lib/auth-api";
import {
  countInclusiveUtcDays,
  getDailyTimelineStartUtc,
} from "@/lib/hackathon-deadlines";
import { cn, FIELD_ERROR_INPUT_CLASS } from "@/lib/utils";
import {
  buildHackathonFormSteps,
  HackathonFormSectionNav,
  type HackathonFormStepId,
  HackathonFormStepPanel,
  hackathonFormSectionId,
  stripHtmlToPlain,
} from "../_components/hackathon-form-wizard";

function toOptions(
  users: UserListItem[],
  favoriteIds: Set<string>,
): { value: string; label: string; isFavorite: boolean }[] {
  return users.map((u) => ({
    value: u.id,
    label: u.username || u.name || u.email || u.id,
    isFavorite: favoriteIds.has(u.id),
  }));
}

function sortWithFavoritesFirst<T extends { isFavorite?: boolean }>(
  options: T[],
): T[] {
  return [...options].sort(
    (a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0),
  );
}

function scrollToHackathonSection(step: HackathonFormStepId) {
  const el = document.getElementById(hackathonFormSectionId(step));
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function NewHackathonPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSponsor = user?.role === "sponsor";
  const isAdmin = user?.role === "admin";

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [applyDeadline, setApplyDeadline] = useState("");
  const [finalSubmissionDeadline, setFinalSubmissionDeadline] = useState("");
  const [scoringDeadline, setScoringDeadline] = useState("");
  const [submissionMode, setSubmissionMode] = useState<
    (typeof SUBMISSION_MODE)[keyof typeof SUBMISSION_MODE]
  >(SUBMISSION_MODE.SINGLE_SUBMISSION);
  const [dailyInstructionTexts, setDailyInstructionTexts] = useState<string[]>(
    [],
  );
  const [instructions, setInstructions] = useState("");
  const [sponsorId, setSponsorId] = useState("");
  const [judgeIds, setJudgeIds] = useState<string[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [priceOfEntry, setPriceOfEntry] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stepOrder = useMemo(
    () => buildHackathonFormSteps(submissionMode),
    [submissionMode],
  );

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin" && user.role !== "sponsor") {
      router.replace("/hackathons");
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === "sponsor" && user.id) {
      setSponsorId(user.id);
    }
  }, [user]);

  const { data: sponsorsData } = useQuery({
    queryKey: ["users", "sponsor", 1, 100],
    queryFn: () => getUsers({ page: 1, limit: 100, role: "sponsor" }),
    enabled: isAdmin,
  });
  const { data: judgesData } = useQuery({
    queryKey: ["users", "judge", 1, 100],
    queryFn: () => getJudgeOptions(),
  });
  const { data: sponsorFavoritesData } = useQuery({
    queryKey: ["favorites", "sponsor"],
    queryFn: () => getFavorites("sponsor"),
    enabled: isAdmin,
  });
  const { data: judgeFavoritesData } = useQuery({
    queryKey: ["favorites", "judge"],
    queryFn: () => getFavorites("judge"),
    enabled: isAdmin,
  });

  const sponsors: UserListItem[] = sponsorsData?.data ?? [];
  const judges: UserListItem[] = judgesData ?? [];
  const sponsorFavoriteIds = useMemo(
    () => new Set((sponsorFavoritesData?.data ?? []).map((f) => f.favoriteId)),
    [sponsorFavoritesData],
  );
  const judgeFavoriteIds = useMemo(
    () => new Set((judgeFavoritesData?.data ?? []).map((f) => f.favoriteId)),
    [judgeFavoritesData],
  );

  const sponsorOptions = useMemo(
    () => sortWithFavoritesFirst(toOptions(sponsors, sponsorFavoriteIds)),
    [sponsors, sponsorFavoriteIds],
  );
  const judgeOptions = useMemo(
    () => sortWithFavoritesFirst(toOptions(judges, judgeFavoriteIds)),
    [judges, judgeFavoriteIds],
  );

  const expectedDailyCount = useMemo(() => {
    if (submissionMode !== SUBMISSION_MODE.DAILY_UPDATE) return 0;
    if (!applyDeadline || !finalSubmissionDeadline) return 0;
    const apply = new Date(applyDeadline);
    const finalD = new Date(finalSubmissionDeadline);
    const timelineStart = getDailyTimelineStartUtc(apply);
    return countInclusiveUtcDays(timelineStart, finalD);
  }, [submissionMode, applyDeadline, finalSubmissionDeadline]);

  useEffect(() => {
    if (expectedDailyCount <= 0) {
      setDailyInstructionTexts([]);
      return;
    }
    setDailyInstructionTexts((prev) => {
      const next = [...prev];
      while (next.length < expectedDailyCount) next.push("");
      return next.slice(0, expectedDailyCount);
    });
  }, [expectedDailyCount]);

  const validateStepFields = useCallback(
    (step: HackathonFormStepId): Record<string, string> => {
      const next: Record<string, string> = {};
      switch (step) {
        case "basics":
          if (!title.trim()) next.title = "Title is required";
          else if (title.length > HACKATHON_CONSTANTS.TEXT_LIMITS.TITLE) {
            next.title = `Max ${HACKATHON_CONSTANTS.TEXT_LIMITS.TITLE} characters`;
          }
          if (!shortDescription.trim())
            next.shortDescription = "Short description is required";
          else if (
            shortDescription.length >
            HACKATHON_CONSTANTS.TEXT_LIMITS.SHORT_DESCRIPTION
          ) {
            next.shortDescription = `Max ${HACKATHON_CONSTANTS.TEXT_LIMITS.SHORT_DESCRIPTION} characters`;
          }
          break;
        case "timeline":
          if (!applyDeadline) next.applyDeadline = "Apply deadline is required";
          else if (new Date(applyDeadline) <= new Date()) {
            next.applyDeadline = "Apply deadline must be in the future";
          }
          if (!finalSubmissionDeadline) {
            next.finalSubmissionDeadline =
              "Final submission deadline is required";
          } else if (
            applyDeadline &&
            new Date(finalSubmissionDeadline) <= new Date(applyDeadline)
          ) {
            next.finalSubmissionDeadline = "Must be after apply deadline";
          }
          if (!scoringDeadline)
            next.scoringDeadline = "Scoring deadline is required";
          else if (
            finalSubmissionDeadline &&
            new Date(scoringDeadline) <= new Date(finalSubmissionDeadline)
          ) {
            next.scoringDeadline = "Must be after final submission deadline";
          }
          break;
        case "daily":
          if (submissionMode !== SUBMISSION_MODE.DAILY_UPDATE) break;
          if (expectedDailyCount < 1) {
            next.dailyInstructions =
              "Set apply and final deadlines so the first daily day is on or before the final day (UTC)";
          } else {
            for (let i = 0; i < dailyInstructionTexts.length; i++) {
              const html = dailyInstructionTexts[i] ?? "";
              const plain = stripHtmlToPlain(html);
              if (!plain) {
                next.dailyInstructions = `Day ${i + 1} instruction is required`;
                break;
              }
              if (html.length > HACKATHON_CONSTANTS.TEXT_LIMITS.INSTRUCTIONS) {
                next.dailyInstructions = `Day ${i + 1} instruction is too long`;
                break;
              }
            }
          }
          break;
        case "rules": {
          const instructionsPlain = stripHtmlToPlain(instructions);
          if (!instructionsPlain)
            next.instructions = "Instructions are required";
          else if (
            instructions.length > HACKATHON_CONSTANTS.TEXT_LIMITS.INSTRUCTIONS
          ) {
            next.instructions = `Max ${HACKATHON_CONSTANTS.TEXT_LIMITS.INSTRUCTIONS} characters`;
          }
          break;
        }
        case "people":
          if (!isSponsor && !sponsorId)
            next.sponsorId = "Please select a sponsor";
          if (judgeIds.length < HACKATHON_CONSTANTS.JUDGE_COUNT.MIN) {
            next.judgeIds = `Select at least ${HACKATHON_CONSTANTS.JUDGE_COUNT.MIN} judge(s)`;
          } else if (judgeIds.length > HACKATHON_CONSTANTS.JUDGE_COUNT.MAX) {
            next.judgeIds = `Maximum ${HACKATHON_CONSTANTS.JUDGE_COUNT.MAX} judges`;
          }
          break;
        case "extras":
          if (isPaid) {
            const n = Number.parseFloat(priceOfEntry);
            if (Number.isNaN(n) || n <= 0)
              next.priceOfEntry = "Enter a positive amount in ₹";
          }
          if (
            image &&
            image.size > HACKATHON_CONSTANTS.FILE_LIMITS.MAX_IMAGE_SIZE
          ) {
            next.image = "Image must be 2 MB or less";
          }
          break;
        default:
          break;
      }
      return next;
    },
    [
      title,
      shortDescription,
      applyDeadline,
      finalSubmissionDeadline,
      scoringDeadline,
      submissionMode,
      expectedDailyCount,
      dailyInstructionTexts,
      instructions,
      isSponsor,
      sponsorId,
      judgeIds,
      isPaid,
      priceOfEntry,
      image,
    ],
  );

  const validateAllSteps = useCallback((): Record<string, string> => {
    let all: Record<string, string> = {};
    for (const s of stepOrder) {
      all = { ...all, ...validateStepFields(s) };
    }
    return all;
  }, [stepOrder, validateStepFields]);

  const mutation = useMutation({
    mutationFn: (form: CreateHackathonFormData) => createHackathon(form),
    onSuccess: () => {
      toast.success(
        isSponsor
          ? "Challenge submitted. An admin will review it before it appears publicly."
          : "Challenge created successfully.",
      );
      router.push("/hackathons");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to create challenge");
    },
  });

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validateAllSteps();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const firstProblemStep = stepOrder.find(
        (s) => Object.keys(validateStepFields(s)).length > 0,
      );
      if (firstProblemStep) {
        requestAnimationFrame(() => scrollToHackathonSection(firstProblemStep));
      }
      toast.error("Please fix the highlighted sections below.");
      return;
    }

    const dailyInstructionsJson =
      submissionMode === SUBMISSION_MODE.DAILY_UPDATE && expectedDailyCount > 0
        ? JSON.stringify(
            dailyInstructionTexts.map((instruction, i) => ({
              dayNumber: i + 1,
              instruction: instruction.trim(),
            })),
          )
        : undefined;

    const form: CreateHackathonFormData = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      applyDeadline: new Date(applyDeadline).toISOString(),
      finalSubmissionDeadline: new Date(finalSubmissionDeadline).toISOString(),
      scoringDeadline: new Date(scoringDeadline).toISOString(),
      submissionMode,
      ...(dailyInstructionsJson ? { dailyInstructionsJson } : {}),
      instructions: instructions.trim(),
      ...(isSponsor ? {} : { sponsorId }),
      judgeIds,
      isPaid,
      priceOfEntry: isPaid && priceOfEntry ? Number(priceOfEntry) : null,
      image: image ?? undefined,
    };
    mutation.mutate(form);
  };

  if (!user || (!isAdmin && !isSponsor)) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={isSponsor ? "Submit a challenge" : "Create challenge"}
        description={
          isSponsor
            ? "You are the sponsor. After you submit, an admin must approve this challenge before it appears in the public list."
            : "Add a new challenge — all sections on one page. Use the links below to jump."
        }
      >
        <Button variant="outline" asChild>
          <Link href="/hackathons">
            <ArrowLeft className="mr-2 size-4" />
            Back to list
          </Link>
        </Button>
      </PageHeader>

      <form
        onSubmit={handleFinalSubmit}
        className="mx-auto max-w-3xl pb-[calc(6rem+env(safe-area-inset-bottom,0px))]"
        noValidate
      >
        {isSponsor ? (
          <div className="mb-6 rounded-lg border border-cs-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Sponsor is set to your account. You cannot change the sponsor for
            your own submission.
          </div>
        ) : null}

        <HackathonFormSectionNav steps={stepOrder} />

        <div className="flex flex-col gap-10">
          <HackathonFormStepPanel
            id={hackathonFormSectionId("basics")}
            title="Challenge basics"
            description="Name and short summary — this is what participants see first in the list."
          >
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Challenge title"
                maxLength={HACKATHON_CONSTANTS.TEXT_LIMITS.TITLE}
                aria-invalid={!!errors.title}
                className={errors.title ? FIELD_ERROR_INPUT_CLASS : ""}
              />
              {errors.title && (
                <p className="text-sm !text-red-500">{errors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="shortDescription">
                Short description
              </label>
              <textarea
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief description"
                rows={4}
                maxLength={HACKATHON_CONSTANTS.TEXT_LIMITS.SHORT_DESCRIPTION}
                aria-invalid={!!errors.shortDescription}
                className={cn(
                  "border-cs-border placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus:ring-2 focus:ring-cs-primary/20",
                  errors.shortDescription && FIELD_ERROR_INPUT_CLASS,
                )}
              />
              {errors.shortDescription && (
                <p className="text-sm !text-red-500">
                  {errors.shortDescription}
                </p>
              )}
            </div>
          </HackathonFormStepPanel>

          <HackathonFormStepPanel
            id={hackathonFormSectionId("timeline")}
            title="Schedule & submission type"
            description="Choose how participants submit work and set deadlines in order: apply → final submissions → scoring."
          >
            <div className="space-y-3">
              <label className="text-sm font-medium">Submission type</label>
              <div className="flex flex-col gap-2 sm:flex-row sm:rounded-lg sm:border sm:border-input sm:p-0.5">
                <button
                  type="button"
                  onClick={() =>
                    setSubmissionMode(SUBMISSION_MODE.SINGLE_SUBMISSION)
                  }
                  className={cn(
                    "rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors sm:flex-1 sm:py-2 sm:text-center",
                    submissionMode === SUBMISSION_MODE.SINGLE_SUBMISSION
                      ? "bg-primary text-primary-foreground"
                      : "border border-cs-border bg-card text-muted-foreground hover:bg-muted/60 sm:border-0",
                  )}
                >
                  {SUBMISSION_MODE_LABELS.single_submission}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSubmissionMode(SUBMISSION_MODE.DAILY_UPDATE)
                  }
                  className={cn(
                    "rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors sm:flex-1 sm:py-2 sm:text-center",
                    submissionMode === SUBMISSION_MODE.DAILY_UPDATE
                      ? "bg-primary text-primary-foreground"
                      : "border border-cs-border bg-card text-muted-foreground hover:bg-muted/60 sm:border-0",
                  )}
                >
                  {SUBMISSION_MODE_LABELS.daily_update}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Daily: one file update per UTC day through the final deadline
                (no separate final upload). Single: one final submission file
                before the final deadline.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Apply deadline</label>
                <DateTimePicker
                  value={applyDeadline}
                  onChange={setApplyDeadline}
                  placeholder="Last moment to join"
                  aria-invalid={!!errors.applyDeadline}
                />
                {errors.applyDeadline && (
                  <p className="text-sm !text-red-500">
                    {errors.applyDeadline}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Final submission deadline
                </label>
                <DateTimePicker
                  value={finalSubmissionDeadline}
                  onChange={setFinalSubmissionDeadline}
                  placeholder="Last day to submit"
                  aria-invalid={!!errors.finalSubmissionDeadline}
                />
                {errors.finalSubmissionDeadline && (
                  <p className="text-sm !text-red-500">
                    {errors.finalSubmissionDeadline}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Scoring deadline</label>
              <DateTimePicker
                value={scoringDeadline}
                onChange={setScoringDeadline}
                placeholder="Judging ends"
                aria-invalid={!!errors.scoringDeadline}
              />
              {errors.scoringDeadline && (
                <p className="text-sm !text-red-500">
                  {errors.scoringDeadline}
                </p>
              )}
            </div>
          </HackathonFormStepPanel>

          {submissionMode === SUBMISSION_MODE.DAILY_UPDATE ? (
            <HackathonFormStepPanel
              id={hackathonFormSectionId("daily")}
              title="Daily briefs (UTC)"
              description={
                expectedDailyCount > 0
                  ? `Day 1 is the UTC calendar day after the apply deadline. Add rich text for each of the ${expectedDailyCount} day(s) in this challenge window.`
                  : "Set apply and final deadlines under Schedule so we know how many daily briefs you need."
              }
            >
              {errors.dailyInstructions && (
                <p className="text-sm !text-red-500">
                  {errors.dailyInstructions}
                </p>
              )}
              {expectedDailyCount > 0 ? (
                <div className="space-y-8">
                  {dailyInstructionTexts.map((html, idx) => (
                    <div key={`day-${idx}`} className="space-y-2">
                      <label className="text-sm font-semibold text-cs-heading">
                        Day {idx + 1}
                      </label>
                      <TiptapEditor
                        value={html}
                        onChange={(v) => {
                          setDailyInstructionTexts((prev) => {
                            const copy = [...prev];
                            copy[idx] = v;
                            return copy;
                          });
                        }}
                        placeholder={`What should participants focus on on day ${idx + 1}?`}
                        maxLength={HACKATHON_CONSTANTS.TEXT_LIMITS.INSTRUCTIONS}
                        editorContentClassName="min-h-[100px]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Under <strong>Schedule</strong>, choose deadlines so the first
                  daily day falls on or before the final submission day (UTC).
                </p>
              )}
            </HackathonFormStepPanel>
          ) : null}

          <HackathonFormStepPanel
            id={hackathonFormSectionId("rules")}
            title="Participant rules"
            description="Full rules, judging criteria, and links — shown on the challenge page."
          >
            <TiptapEditor
              value={instructions}
              onChange={setInstructions}
              placeholder="Rules and instructions for participants"
              maxLength={HACKATHON_CONSTANTS.TEXT_LIMITS.INSTRUCTIONS}
              className={errors.instructions ? FIELD_ERROR_INPUT_CLASS : ""}
              aria-invalid={!!errors.instructions}
            />
            {errors.instructions && (
              <p className="text-sm !text-red-500">{errors.instructions}</p>
            )}
          </HackathonFormStepPanel>

          <HackathonFormStepPanel
            id={hackathonFormSectionId("people")}
            title="Sponsor & judges"
            description="Who owns the challenge and who scores submissions."
          >
            {isAdmin ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Sponsor</label>
                <SearchableSelect
                  options={sponsorOptions}
                  value={sponsorId}
                  onChange={setSponsorId}
                  placeholder="Select sponsor"
                  searchPlaceholder="Search sponsors..."
                  emptyText="No sponsor found."
                  aria-invalid={!!errors.sponsorId}
                />
                {errors.sponsorId && (
                  <p className="text-sm !text-red-500">{errors.sponsorId}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Sponsor</label>
                <p className="rounded-md border border-cs-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {user?.username ?? user?.email ?? "Your account"}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Judges (1–5)</label>
              <SearchableMultiSelect
                options={judgeOptions}
                value={judgeIds}
                onChange={setJudgeIds}
                placeholder="Select judges"
                searchPlaceholder="Search judges..."
                emptyText="No judge found."
                max={HACKATHON_CONSTANTS.JUDGE_COUNT.MAX}
                aria-invalid={!!errors.judgeIds}
              />
              <p className="text-xs text-muted-foreground">
                Favorites appear first.
              </p>
              {errors.judgeIds && (
                <p className="text-sm !text-red-500">{errors.judgeIds}</p>
              )}
            </div>
          </HackathonFormStepPanel>

          <HackathonFormStepPanel
            id={hackathonFormSectionId("extras")}
            title="Entry fee & banner"
            description="Optional banner for cards and listing. Participants pay the fee on the apply flow when set."
          >
            <div className="space-y-3">
              <label className="text-sm font-medium">Entry fee</label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-lg border border-input p-0.5">
                  <button
                    type="button"
                    onClick={() => setIsPaid(false)}
                    className={cn(
                      "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                      !isPaid
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Free
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaid(true)}
                    className={cn(
                      "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                      isPaid
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Paid
                  </button>
                </div>
                {isPaid && (
                  <div className="flex items-center gap-2">
                    <IndianRupee className="size-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Amount"
                      value={priceOfEntry}
                      onChange={(e) => setPriceOfEntry(e.target.value)}
                      aria-invalid={!!errors.priceOfEntry}
                      className={cn(
                        "w-32",
                        errors.priceOfEntry && FIELD_ERROR_INPUT_CLASS,
                      )}
                    />
                    <span className="text-sm text-muted-foreground">INR</span>
                  </div>
                )}
              </div>
              {errors.priceOfEntry && (
                <p className="text-sm !text-red-500">{errors.priceOfEntry}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="image">
                Banner image (optional, 5:3, max 2 MB)
              </label>
              <Input
                id="image"
                type="file"
                accept=".webp,.png,.jpg,.jpeg,image/webp,image/png,image/jpeg,image/jpg"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                aria-invalid={!!errors.image}
                className={errors.image ? FIELD_ERROR_INPUT_CLASS : ""}
              />
              {errors.image && (
                <p className="text-sm !text-red-500">{errors.image}</p>
              )}
            </div>
          </HackathonFormStepPanel>
        </div>

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-cs-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            asChild
            className="min-h-11 w-full sm:min-h-10 sm:w-auto"
          >
            <Link href="/hackathons">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="min-h-11 w-full sm:min-h-10 sm:w-auto"
          >
            {mutation.isPending
              ? "Submitting..."
              : isSponsor
                ? "Submit for approval"
                : "Create challenge"}
          </Button>
        </div>
      </form>
    </div>
  );
}
