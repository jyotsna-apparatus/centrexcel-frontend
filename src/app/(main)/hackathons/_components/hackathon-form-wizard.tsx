"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { SUBMISSION_MODE } from "@/config/hackathon-constants";
import { cn } from "@/lib/utils";

export type HackathonFormStepId =
  | "basics"
  | "timeline"
  | "daily"
  | "rules"
  | "people"
  | "extras";

export const HACKATHON_FORM_STEP_LABELS: Record<HackathonFormStepId, string> = {
  basics: "Basics",
  timeline: "Schedule",
  daily: "Daily briefs",
  rules: "Rules",
  people: "Sponsor & judges",
  extras: "Fee & banner",
};

export function buildHackathonFormSteps(
  submissionMode: (typeof SUBMISSION_MODE)[keyof typeof SUBMISSION_MODE],
): HackathonFormStepId[] {
  const steps: HackathonFormStepId[] = ["basics", "timeline"];
  if (submissionMode === SUBMISSION_MODE.DAILY_UPDATE) steps.push("daily");
  steps.push("rules", "people", "extras");
  return steps;
}

export function stripHtmlToPlain(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

type StepIndicatorProps = {
  steps: HackathonFormStepId[];
  currentIndex: number;
};

/** Short labels under step chips on small screens (fits narrow widths). */
export const HACKATHON_FORM_STEP_LABELS_COMPACT: Record<
  HackathonFormStepId,
  string
> = {
  basics: "Basics",
  timeline: "Schedule",
  daily: "Daily",
  rules: "Rules",
  people: "Team",
  extras: "Fee",
};

export function HackathonFormStepIndicator({
  steps,
  currentIndex,
}: StepIndicatorProps) {
  const total = steps.length;
  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(total - 1, 0));
  const currentId = total > 0 ? steps[safeIndex] : undefined;
  const currentLabel = currentId ? HACKATHON_FORM_STEP_LABELS[currentId] : "";

  return (
    <nav aria-label="Form progress" className="mb-6 sm:mb-8">
      {/* Mobile: segmented progress + grid of steps (no sideways scroll) */}
      <div className="sm:hidden">
        <p className="mb-3 text-sm leading-snug">
          <span className="font-semibold tabular-nums text-foreground">
            Step {safeIndex + 1} of {total}
          </span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-foreground">{currentLabel}</span>
        </p>
        <div
          className="mb-4 flex gap-1"
          role="progressbar"
          aria-valuenow={safeIndex + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuetext={`Step ${safeIndex + 1} of ${total}: ${currentLabel}`}
        >
          {steps.map((id, i) => {
            const done = i < safeIndex;
            const active = i === safeIndex;
            return (
              <span
                key={id}
                title={HACKATHON_FORM_STEP_LABELS[id]}
                className={cn(
                  "h-1.5 min-w-[6px] flex-1 rounded-full transition-[height,background-color] duration-200",
                  done && "bg-primary",
                  active &&
                    "h-2 bg-primary shadow-sm ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                  !done && !active && "bg-muted",
                )}
              />
            );
          })}
        </div>
        <ol className="flex flex-wrap justify-center gap-x-3 gap-y-3">
          {steps.map((id, i) => {
            const done = i < safeIndex;
            const active = i === safeIndex;
            return (
              <li
                key={id}
                className="flex w-19 shrink-0 flex-col items-center gap-1 text-center"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                    done &&
                      "border-transparent bg-primary text-primary-foreground",
                    active &&
                      "border-cs-primary/50 bg-cs-primary/12 text-cs-primary ring-2 ring-cs-primary/25",
                    !done &&
                      !active &&
                      "border-cs-border bg-card text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? (
                    <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    "line-clamp-2 w-full text-[11px] font-medium leading-tight",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {HACKATHON_FORM_STEP_LABELS_COMPACT[id]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* sm+: horizontal step pills (wraps on mid-width instead of awkward scroll) */}
      <div className="hidden sm:block">
        <ol className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {steps.map((id, i) => {
            const done = i < safeIndex;
            const active = i === safeIndex;
            return (
              <li key={id} className="flex min-w-0 items-center gap-2 md:gap-3">
                <div
                  className={cn(
                    "flex min-w-0 max-w-[200px] items-center gap-2 rounded-full border px-2.5 py-1.5 md:px-3 md:py-2",
                    active && "border-cs-primary/50 bg-cs-primary/8",
                    done && "border-transparent bg-muted/50",
                    !active && !done && "border-cs-border bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      done && "bg-primary text-primary-foreground",
                      active && !done && "bg-cs-primary/25 text-cs-primary",
                      !done && !active && "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="size-3.5" strokeWidth={2.5} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      "truncate text-sm font-medium",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {HACKATHON_FORM_STEP_LABELS[id]}
                  </span>
                </div>
                {i < steps.length - 1 ? (
                  <span
                    className="hidden h-px w-3 shrink-0 bg-cs-border md:block md:w-5"
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

type StepPanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function HackathonFormStepPanel({
  title,
  description,
  children,
  className,
}: StepPanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-cs-border bg-card p-4 shadow-xs sm:p-6",
        className,
      )}
    >
      <div className="mb-4 border-b border-cs-border pb-3 sm:mb-5 sm:pb-4">
        <h2 className="text-base font-semibold tracking-tight text-cs-heading sm:text-lg">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="space-y-4 sm:space-y-5">{children}</div>
    </div>
  );
}
