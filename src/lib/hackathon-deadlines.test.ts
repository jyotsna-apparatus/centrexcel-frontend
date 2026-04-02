import { describe, expect, it } from "vitest";
import {
  countInclusiveUtcDays,
  getCurrentDailyDayNumber,
  getDailyTimelineStartUtc,
  getUtcCalendarDateKey,
  getUtcDateForDailyDayNumber,
  parseDailyInstructionsFromApi,
  utcDayStart,
} from "./hackathon-deadlines";

describe("utcDayStart", () => {
  it("normalizes to UTC midnight", () => {
    const d = new Date("2024-06-15T14:30:00.000Z");
    const s = utcDayStart(d);
    expect(s.toISOString()).toBe("2024-06-15T00:00:00.000Z");
  });
});

describe("getDailyTimelineStartUtc", () => {
  it("is the UTC calendar day after the apply deadline day", () => {
    const apply = new Date(Date.UTC(2024, 0, 10, 23, 0, 0));
    const start = getDailyTimelineStartUtc(apply);
    expect(start.toISOString()).toBe("2024-01-11T00:00:00.000Z");
  });
});

describe("countInclusiveUtcDays", () => {
  it("returns inclusive count for both endpoints", () => {
    const from = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
    const to = new Date(Date.UTC(2024, 0, 3, 8, 0, 0));
    expect(countInclusiveUtcDays(from, to)).toBe(3);
  });

  it("returns 0 when the range is invalid", () => {
    const from = new Date(Date.UTC(2024, 0, 5));
    const to = new Date(Date.UTC(2024, 0, 1));
    expect(countInclusiveUtcDays(from, to)).toBe(0);
  });
});

describe("parseDailyInstructionsFromApi", () => {
  it("parses and sorts valid rows", () => {
    const raw = [
      { dayNumber: 2, instruction: "b" },
      { dayNumber: 1, instruction: "a" },
    ];
    expect(parseDailyInstructionsFromApi(raw)).toEqual([
      { dayNumber: 1, instruction: "a" },
      { dayNumber: 2, instruction: "b" },
    ]);
  });

  it("returns empty array for invalid input", () => {
    expect(parseDailyInstructionsFromApi(null)).toEqual([]);
    expect(parseDailyInstructionsFromApi([{ foo: 1 }])).toEqual([]);
  });
});

describe("getCurrentDailyDayNumber", () => {
  it("returns null before the first daily UTC day", () => {
    const apply = new Date(Date.UTC(2024, 0, 1));
    const finalD = new Date(Date.UTC(2024, 0, 10));
    const now = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
    expect(getCurrentDailyDayNumber(apply, finalD, now)).toBeNull();
  });

  it("returns 1 on the first daily UTC day", () => {
    const apply = new Date(Date.UTC(2024, 0, 1));
    const finalD = new Date(Date.UTC(2024, 0, 10));
    const now = new Date(Date.UTC(2024, 0, 2, 12, 0, 0));
    expect(getCurrentDailyDayNumber(apply, finalD, now)).toBe(1);
  });
});

describe("getUtcCalendarDateKey", () => {
  it("returns YYYY-MM-DD in UTC", () => {
    expect(getUtcCalendarDateKey(new Date("2024-06-15T14:30:00.000Z"))).toBe(
      "2024-06-15",
    );
  });
});

describe("getUtcDateForDailyDayNumber", () => {
  it("maps across month boundaries", () => {
    // apply day is Jan 31 (UTC) → day 1 should be Feb 1 (UTC)
    const apply = new Date(Date.UTC(2024, 0, 31, 23, 0, 0));
    expect(getUtcDateForDailyDayNumber(apply, 1).toISOString()).toBe(
      "2024-02-01T00:00:00.000Z",
    );
    expect(getUtcDateForDailyDayNumber(apply, 2).toISOString()).toBe(
      "2024-02-02T00:00:00.000Z",
    );
  });

  it("matches entryDate to the correct daily day key", () => {
    const apply = new Date(Date.UTC(2024, 0, 31, 23, 0, 0));
    const day2 = getUtcDateForDailyDayNumber(apply, 2);
    const entryDate = new Date("2024-02-02T00:00:00.000Z");
    expect(getUtcCalendarDateKey(entryDate)).toBe(getUtcCalendarDateKey(day2));
  });
});
