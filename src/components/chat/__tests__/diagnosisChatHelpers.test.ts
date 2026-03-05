import { describe, it, expect } from "vitest";
import { detectEmotionalState, applyOptionToSymptoms } from "../diagnosisChatHelpers";

// ─── detectEmotionalState ────────────────────────────────────

describe("detectEmotionalState", () => {
    it("detects urgent from emergency language", () => {
        expect(detectEmotionalState("help me right now")).toBe("urgent");
        expect(detectEmotionalState("This is an EMERGENCY")).toBe("urgent");
        expect(detectEmotionalState("I can't wait, it's critical")).toBe("urgent");
        expect(detectEmotionalState("Please help me immediately")).toBe("urgent");
    });

    it("detects frustrated from annoyance language", () => {
        expect(detectEmotionalState("I already told you this")).toBe("frustrated");
        expect(detectEmotionalState("Why do you keep asking the same question?")).toBe("frustrated");
        expect(detectEmotionalState("I'm so frustrated with this")).toBe("frustrated");
        expect(detectEmotionalState("I'm annoyed")).toBe("frustrated");
    });

    it("detects anxious from worry language", () => {
        expect(detectEmotionalState("I'm really worried about this")).toBe("anxious");
        expect(detectEmotionalState("Am I dying?")).toBe("anxious");
        expect(detectEmotionalState("I'm so scared")).toBe("anxious");
        expect(detectEmotionalState("I feel nervous about the results")).toBe("anxious");
        expect(detectEmotionalState("please help me I'm afraid")).toBe("urgent"); // "help me" triggers urgent first
    });

    it("returns calm for neutral messages", () => {
        expect(detectEmotionalState("I have a headache")).toBe("calm");
        expect(detectEmotionalState("It hurts in my lower back")).toBe("calm");
        expect(detectEmotionalState("Yes")).toBe("calm");
        expect(detectEmotionalState("3 days")).toBe("calm");
        expect(detectEmotionalState("")).toBe("calm");
    });

    it("prioritizes urgent over anxious (both patterns present)", () => {
        expect(detectEmotionalState("I'm scared, help me right now")).toBe("urgent");
    });

    it("prioritizes urgent over frustrated", () => {
        expect(detectEmotionalState("I already told you, this is an emergency!")).toBe("urgent");
    });
});

// ─── applyOptionToSymptoms ───────────────────────────────────

describe("applyOptionToSymptoms", () => {
    it("handles multi-choice with 'none of the above'", () => {
        const result = applyOptionToSymptoms(
            "",
            [],
            "None of the above",
            null,
            ["fever", "nausea", "headache"],
            ["Fever", "Nausea", "Headache"]
        );
        expect(result.excludedSymptoms).toEqual(["fever", "nausea", "headache"]);
        expect(result.additionalNotes).toBe("");
    });

    it("handles multi-choice with a specific option selected", () => {
        const result = applyOptionToSymptoms(
            "existing notes",
            [],
            "Nausea",
            null,
            ["fever", "nausea", "headache"],
            ["Fever", "Nausea", "Headache"]
        );
        expect(result.additionalNotes).toBe("existing notes nausea");
        expect(result.excludedSymptoms).toEqual([]);
    });

    it("excludes context symptom on 'no' answer", () => {
        const result = applyOptionToSymptoms(
            "",
            [],
            "No",
            "chest_tightness"
        );
        expect(result.excludedSymptoms).toEqual(["chest_tightness"]);
        expect(result.additionalNotes).toBe("");
    });

    it("adds context symptom on affirmative answer", () => {
        const result = applyOptionToSymptoms(
            "",
            [],
            "Yes",
            "chest_tightness"
        );
        expect(result.additionalNotes).toBe("chest_tightness");
        expect(result.excludedSymptoms).toEqual([]);
    });

    it("detects radiation/numbness keywords", () => {
        const result = applyOptionToSymptoms(
            "",
            [],
            "Pain radiates to my arm with numbness",
            null
        );
        expect(result.additionalNotes).toBe("numbness radiating");
    });

    it("returns unchanged data when no patterns match", () => {
        const result = applyOptionToSymptoms(
            "existing",
            ["prev"],
            "Something unrelated",
            null
        );
        expect(result.additionalNotes).toBe("existing");
        expect(result.excludedSymptoms).toEqual(["prev"]);
    });

    it("preserves existing excluded symptoms", () => {
        const result = applyOptionToSymptoms(
            "",
            ["fever"],
            "No",
            "nausea"
        );
        expect(result.excludedSymptoms).toEqual(["fever", "nausea"]);
    });
});
