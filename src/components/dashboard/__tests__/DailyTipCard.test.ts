import { describe, expect, it } from "vitest";
import { getDailyTip } from "../DailyTipCard";

describe("getDailyTip", () => {
    it("returns the same tip for the same date", () => {
        const date = new Date("2026-06-14T08:00:00.000Z");

        expect(getDailyTip(date)).toEqual(getDailyTip(date));
    });

    it("uses the offset to advance refreshes without randomness", () => {
        const date = new Date("2026-06-14T08:00:00.000Z");

        expect(getDailyTip(date, 0).title).not.toBe(getDailyTip(date, 1).title);
    });
});
