/** UTC midnight for the given instant's calendar date (UTC). */
export function utcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * UTC calendar day key in the format `YYYY-MM-DD`.
 * Useful for matching stored `entryDate` values to configured daily days.
 */
export function getUtcCalendarDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return utcDayStart(d).toISOString().slice(0, 10);
}

/** First daily-update day: UTC calendar day after the UTC calendar day of `applyDeadline`. */
export function getDailyTimelineStartUtc(applyDeadline: Date): Date {
  const y = applyDeadline.getUTCFullYear();
  const m = applyDeadline.getUTCMonth();
  const d = applyDeadline.getUTCDate();
  return new Date(Date.UTC(y, m, d + 1));
}

/** UTC midnight date for the given 1-based daily day number. */
export function getUtcDateForDailyDayNumber(
  applyDeadline: Date | string,
  dayNumber: number,
): Date {
  const apply =
    typeof applyDeadline === "string" ? new Date(applyDeadline) : applyDeadline;
  // dayNumber=1 should correspond to the configured timeline start.
  const timelineStart = utcDayStart(getDailyTimelineStartUtc(apply));
  return new Date(
    timelineStart.getTime() + (dayNumber - 1) * 24 * 60 * 60 * 1000,
  );
}

/** Inclusive count of UTC calendar days from `from` through `to`. */
export function countInclusiveUtcDays(from: Date, to: Date): number {
  const a = utcDayStart(from).getTime();
  const b = utcDayStart(to).getTime();
  if (b < a) return 0;
  return Math.floor((b - a) / (24 * 60 * 60 * 1000)) + 1;
}

export type DailyInstructionRow = { dayNumber: number; instruction: string };

export function parseDailyInstructionsFromApi(
  raw: unknown,
): DailyInstructionRow[] {
  if (typeof raw === "string") {
    try {
      return parseDailyInstructionsFromApi(JSON.parse(raw) as unknown);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  const out: DailyInstructionRow[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const dayNum =
      typeof r.dayNumber === "number"
        ? r.dayNumber
        : typeof r.dayNumber === "string"
          ? Number(r.dayNumber)
          : NaN;
    if (!Number.isFinite(dayNum) || typeof r.instruction !== "string") continue;
    out.push({ dayNumber: dayNum, instruction: r.instruction });
  }
  return out.sort((x, y) => x.dayNumber - y.dayNumber);
}

/** Current 1-based day index within the daily window, or null if outside (UTC). */
export function getCurrentDailyDayNumber(
  applyDeadline: Date | string,
  finalSubmissionDeadline: Date | string,
  now: Date = new Date(),
): number | null {
  const apply =
    typeof applyDeadline === "string" ? new Date(applyDeadline) : applyDeadline;
  const finalD =
    typeof finalSubmissionDeadline === "string"
      ? new Date(finalSubmissionDeadline)
      : finalSubmissionDeadline;
  const timelineStart = getDailyTimelineStartUtc(apply);
  const nowDay = utcDayStart(now).getTime();
  const firstDay = utcDayStart(timelineStart).getTime();
  const lastDay = utcDayStart(finalD).getTime();
  if (nowDay < firstDay || nowDay > lastDay) return null;
  return countInclusiveUtcDays(timelineStart, now);
}

export function getInstructionForDay(
  dailyInstructions: unknown,
  dayNumber: number,
): string | null {
  const rows = parseDailyInstructionsFromApi(dailyInstructions);
  const row = rows.find((r) => r.dayNumber === dayNumber);
  return row?.instruction ?? null;
}
