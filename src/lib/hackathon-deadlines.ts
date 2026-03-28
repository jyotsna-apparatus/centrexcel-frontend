/** UTC midnight for the given instant's calendar date (UTC). */
export function utcDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/** First daily-update day: UTC calendar day after the UTC calendar day of `applyDeadline`. */
export function getDailyTimelineStartUtc(applyDeadline: Date): Date {
  const y = applyDeadline.getUTCFullYear()
  const m = applyDeadline.getUTCMonth()
  const d = applyDeadline.getUTCDate()
  return new Date(Date.UTC(y, m, d + 1))
}

/** Inclusive count of UTC calendar days from `from` through `to`. */
export function countInclusiveUtcDays(from: Date, to: Date): number {
  const a = utcDayStart(from).getTime()
  const b = utcDayStart(to).getTime()
  if (b < a) return 0
  return Math.floor((b - a) / (24 * 60 * 60 * 1000)) + 1
}

export type DailyInstructionRow = { dayNumber: number; instruction: string }

export function parseDailyInstructionsFromApi(raw: unknown): DailyInstructionRow[] {
  if (!Array.isArray(raw)) return []
  const out: DailyInstructionRow[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    if (typeof r.dayNumber !== 'number' || typeof r.instruction !== 'string') continue
    out.push({ dayNumber: r.dayNumber, instruction: r.instruction })
  }
  return out.sort((x, y) => x.dayNumber - y.dayNumber)
}

/** Current 1-based day index within the daily window, or null if outside (UTC). */
export function getCurrentDailyDayNumber(
  applyDeadline: Date | string,
  finalSubmissionDeadline: Date | string,
  now: Date = new Date()
): number | null {
  const apply = typeof applyDeadline === 'string' ? new Date(applyDeadline) : applyDeadline
  const finalD =
    typeof finalSubmissionDeadline === 'string'
      ? new Date(finalSubmissionDeadline)
      : finalSubmissionDeadline
  const timelineStart = getDailyTimelineStartUtc(apply)
  const nowDay = utcDayStart(now).getTime()
  const firstDay = utcDayStart(timelineStart).getTime()
  const lastDay = utcDayStart(finalD).getTime()
  if (nowDay < firstDay || nowDay > lastDay) return null
  return countInclusiveUtcDays(timelineStart, now)
}

export function getInstructionForDay(dailyInstructions: unknown, dayNumber: number): string | null {
  const rows = parseDailyInstructionsFromApi(dailyInstructions)
  const row = rows.find((r) => r.dayNumber === dayNumber)
  return row?.instruction ?? null
}
