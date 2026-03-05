import { describe, it, expect } from "vitest";
import { extractSymptomList, scanRedFlags, buildEvidenceMetrics } from "../engine";
import type { UserSymptomData } from "../types";

// ─── extractSymptomList ──────────────────────────────────────

describe("extractSymptomList", () => {
    it("extracts location-based pain symptoms", () => {
        const symptoms: UserSymptomData = {
            location: ["Chest", "Back"],
        };
        const result = extractSymptomList(symptoms);
        expect(result).toContain("chest_pain");
        expect(result).toContain("back_pain");
    });

    it("includes pain type", () => {
        const symptoms: UserSymptomData = {
            location: ["Head"],
            painType: "Throbbing",
        };
        const result = extractSymptomList(symptoms);
        expect(result).toContain("throbbing");
    });

    it("parses known symptoms from additional notes", () => {
        const symptoms: UserSymptomData = {
            location: ["Abdomen"],
            additionalNotes: "I have fever and nausea with some dizziness",
        };
        const result = extractSymptomList(symptoms);
        expect(result).toContain("fever");
        expect(result).toContain("nausea");
        expect(result).toContain("dizziness");
    });

    it("deduplicates symptoms", () => {
        const symptoms: UserSymptomData = {
            location: ["Head", "Head"],
            additionalNotes: "fever fever",
        };
        const result = extractSymptomList(symptoms);
        const headPainCount = result.filter((s) => s === "head_pain").length;
        expect(headPainCount).toBe(1);
    });

    it("returns empty-ish array for minimal input", () => {
        const symptoms: UserSymptomData = {
            location: [],
        };
        const result = extractSymptomList(symptoms);
        expect(result).toEqual([]);
    });
});

// ─── scanRedFlags ────────────────────────────────────────────

describe("scanRedFlags", () => {
    it("detects cardiac emergency - classic heart attack", () => {
        const symptoms: UserSymptomData = {
            location: ["Chest"],
            painType: "crushing",
            additionalNotes: "sweating and left arm pain",
        };
        const alerts = scanRedFlags(symptoms);
        expect(alerts.some((a) => a.includes("CARDIAC EMERGENCY"))).toBe(true);
    });

    it("detects stroke symptoms (FAST)", () => {
        const symptoms: UserSymptomData = {
            location: ["Head"],
            additionalNotes: "face drooping and arm weakness with slurred speech",
        };
        const alerts = scanRedFlags(symptoms);
        expect(alerts.some((a) => a.includes("STROKE WARNING"))).toBe(true);
    });

    it("detects respiratory emergency", () => {
        const symptoms: UserSymptomData = {
            location: ["Chest"],
            additionalNotes: "can't breathe, gasping for air",
        };
        const alerts = scanRedFlags(symptoms);
        expect(alerts.some((a) => a.includes("RESPIRATORY EMERGENCY"))).toBe(true);
    });

    it("detects mental health crisis", () => {
        const symptoms: UserSymptomData = {
            location: ["Head"],
            additionalNotes: "I want to kill myself",
        };
        const alerts = scanRedFlags(symptoms);
        expect(alerts.some((a) => a.includes("CRISIS SUPPORT"))).toBe(true);
    });

    it("detects anaphylaxis risk", () => {
        const symptoms: UserSymptomData = {
            location: ["Throat"],
            additionalNotes: "allergic reaction, throat swelling, can't breathe",
        };
        const alerts = scanRedFlags(symptoms);
        expect(alerts.some((a) => a.includes("ANAPHYLAXIS"))).toBe(true);
    });

    it("detects meningitis risk", () => {
        const symptoms: UserSymptomData = {
            location: ["Head"],
            additionalNotes: "severe headache with stiff neck",
        };
        const alerts = scanRedFlags(symptoms);
        expect(alerts.some((a) => a.includes("MENINGITIS"))).toBe(true);
    });

    it("returns empty array for benign symptoms", () => {
        const symptoms: UserSymptomData = {
            location: ["Knee"],
            painType: "aching",
            additionalNotes: "mild pain when walking",
        };
        const alerts = scanRedFlags(symptoms);
        expect(alerts).toHaveLength(0);
    });

    it("detects overdose/poisoning", () => {
        const symptoms: UserSymptomData = {
            location: ["Abdomen"],
            additionalNotes: "took too many pills, overdose",
        };
        const alerts = scanRedFlags(symptoms);
        expect(alerts.some((a) => a.includes("OVERDOSE"))).toBe(true);
    });

    it("detects severe bleeding", () => {
        const symptoms: UserSymptomData = {
            location: ["Arm"],
            additionalNotes: "severe bleeding that won't stop",
        };
        const alerts = scanRedFlags(symptoms);
        expect(alerts.some((a) => a.includes("SEVERE BLEEDING"))).toBe(true);
    });
});

// ─── buildEvidenceMetrics ────────────────────────────────────

describe("buildEvidenceMetrics", () => {
    it("returns base metrics for minimal input", () => {
        const symptoms: UserSymptomData = {
            location: ["Knee"],
        };
        const metrics = buildEvidenceMetrics(symptoms, []);
        expect(metrics.symptomCount).toBeGreaterThanOrEqual(1);
        expect(metrics.hasLabResults).toBe(false);
        expect(metrics.hasPhysicalExam).toBe(false);
        expect(metrics.specificityOfSymptoms).toBe(0.5);
    });

    it("reports temporal clarity based on duration", () => {
        const withDuration: UserSymptomData = {
            location: ["Head"],
            duration: "3 days",
        };
        const withoutDuration: UserSymptomData = {
            location: ["Head"],
        };
        expect(buildEvidenceMetrics(withDuration, []).temporalClarity).toBe("clear");
        expect(buildEvidenceMetrics(withoutDuration, []).temporalClarity).toBe("vague");
    });
});
