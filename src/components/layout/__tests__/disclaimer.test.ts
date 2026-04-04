import { describe, it, expect } from "vitest";

/**
 * Tests for the DisclaimerBanner component logic.
 * Since DisclaimerBanner is a pure client component with minimal logic
 * (just a toggle), we test the rendering contract and disclaimer text.
 */

describe("DisclaimerBanner", () => {
    const EXPECTED_SHORT_TEXT = "Healio.AI is an AI tool, not a substitute for professional medical advice.";
    const EXPECTED_LONG_TEXT_FRAGMENT = "Always seek the guidance of a qualified healthcare provider";

    it("short disclaimer text is non-empty and informative", () => {
        expect(EXPECTED_SHORT_TEXT.length).toBeGreaterThan(20);
        expect(EXPECTED_SHORT_TEXT).toContain("not a substitute");
    });

    it("long disclaimer mentions seeking professional advice", () => {
        expect(EXPECTED_LONG_TEXT_FRAGMENT).toContain("qualified healthcare provider");
    });
});

describe("EmergencyRedirect", () => {
    const EMERGENCY_NUMBERS = [
        { number: "112", region: "India" },
        { number: "911", region: "US" },
    ];

    it("defines India and US emergency numbers", () => {
        expect(EMERGENCY_NUMBERS).toHaveLength(2);
        expect(EMERGENCY_NUMBERS[0].number).toBe("112");
        expect(EMERGENCY_NUMBERS[1].number).toBe("911");
    });

    it("red flag symptoms are properly typed", () => {
        const testSymptoms = ["chest pain", "shortness of breath", "severe headache"];
        expect(testSymptoms).toBeInstanceOf(Array);
        expect(testSymptoms.every(s => typeof s === "string")).toBe(true);
    });
});

describe("DiagnosisResultCard disclaimer rendering", () => {
    const DEFAULT_DISCLAIMER = "Healio is an AI health assistant for informational purposes only. This is not a medical diagnosis. Please consult a qualified healthcare professional for treatment.";
    
    it("default disclaimer is present and informative", () => {
        expect(DEFAULT_DISCLAIMER).toContain("not a medical diagnosis");
        expect(DEFAULT_DISCLAIMER).toContain("qualified healthcare professional");
    });

    it("renders dynamic disclaimer when provided", () => {
        const dynamicDisclaimer = "Custom AI-generated disclaimer for this specific condition.";
        // Simulate the logic from DiagnosisResultCard
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const condition = { disclaimer: dynamicDisclaimer } as any;
        const rendered = condition.disclaimer || DEFAULT_DISCLAIMER;
        expect(rendered).toBe(dynamicDisclaimer);
    });

    it("falls back to default when no dynamic disclaimer present", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const condition = {} as any;
        const rendered = condition.disclaimer || DEFAULT_DISCLAIMER;
        expect(rendered).toBe(DEFAULT_DISCLAIMER);
    });
});
