import { describe, it, expect } from "vitest";
import { getPathwayForCondition, COMMON_COLD_PATHWAY, PATHWAY_LIBRARY } from "../pathwayLibrary";
import { buildEscalationAlert, shouldSuppressHomeCare } from "../../../wellness/escalationEngine";
import type { SafetyAssessment } from "../../../diagnosis/advanced/intelligenceTypes";
import { isEscalationOnlyTopic, isEscalationOnlyInput } from "../../../wellness/escalationOnlyTopics";

describe("Care Pathways & Wellness Escalation System", () => {
  describe("Care Pathway Library", () => {
    it("should retrieve common cold care pathway from registry", () => {
      const pathway = getPathwayForCondition("common_cold");
      expect(pathway).not.toBeNull();
      expect(pathway?.conditionId).toBe("common_cold");
      expect(pathway?.phases.length).toBe(3);
    });

    it("should return null for unregistered condition IDs", () => {
      expect(getPathwayForCondition("non_existent_condition")).toBeNull();
    });

    it("should contain complete structure for common cold pathway", () => {
      expect(COMMON_COLD_PATHWAY.expectedDuration.typical).toBe(7);
      expect(COMMON_COLD_PATHWAY.urgency).toBe("self-care");
      expect(COMMON_COLD_PATHWAY.redFlags.length).toBeGreaterThan(0);
      expect(COMMON_COLD_PATHWAY.evidenceBase?.length).toBeGreaterThan(0);
    });

    it("should validate all pathways registered in PATHWAY_LIBRARY", () => {
      Object.entries(PATHWAY_LIBRARY).forEach(([id, pathway]) => {
        expect(pathway.conditionId).toBe(id);
        expect(pathway.phases.length).toBeGreaterThan(0);
        expect(pathway.redFlags).toBeDefined();
        expect(pathway.seekHelpCriteria).toBeDefined();
      });
    });
  });

  describe("Wellness Escalation Engine & Home-Care Suppression", () => {
    it("should build L1 alert props and allow home care", () => {
      const assessment: SafetyAssessment = {
        safetyLevel: "safe",
        forceSeekHelp: false,
        mergedRedFlags: [],
        escalationLevel: "L1",
        alerts: [],
      };

      const result = buildEscalationAlert(assessment);
      expect(result.alertProps.level).toBe("L1");
      expect(result.suppressHomeCare).toBe(false);
      expect(result.nonDismissible).toBe(false);
    });

    it("should suppress home care for L4 (same-day doctor visit)", () => {
      const assessment: SafetyAssessment = {
        safetyLevel: "danger",
        forceSeekHelp: true,
        mergedRedFlags: ["high_fever"],
        escalationLevel: "L4",
        alerts: [{ type: "symptom_combination", message: "See doctor today", severity: "critical", recommendation: "Visit clinic" }],
      };

      const result = buildEscalationAlert(assessment);
      expect(result.alertProps.level).toBe("L4");
      expect(result.suppressHomeCare).toBe(true);
      expect(result.nonDismissible).toBe(true);
    });

    it("should suppress home care for L5 (emergency room)", () => {
      const assessment: SafetyAssessment = {
        safetyLevel: "emergency",
        forceSeekHelp: true,
        mergedRedFlags: ["chest_pain"],
        escalationLevel: "L5",
        alerts: [{ type: "symptom_combination", message: "Call 911 immediately", severity: "critical", recommendation: "Go to ER" }],
      };

      expect(shouldSuppressHomeCare(assessment)).toBe(true);
      const result = buildEscalationAlert(assessment);
      expect(result.suppressHomeCare).toBe(true);
    });

    it("should not suppress home care for undefined or L2 assessments", () => {
      expect(shouldSuppressHomeCare(undefined)).toBe(false);
      expect(shouldSuppressHomeCare(null)).toBe(false);
      expect(shouldSuppressHomeCare({ safetyLevel: "caution", forceSeekHelp: false, mergedRedFlags: [], escalationLevel: "L2", alerts: [] })).toBe(false);
    });
  });

  describe("Escalation-Only Topics Classifier", () => {
    it("should flag high-risk topics like suicidal ideation, chest pain, and stroke", () => {
      expect(isEscalationOnlyTopic("chest-pain")).toBe(true);
      expect(isEscalationOnlyTopic("suicidal-ideation")).toBe(true);
      expect(isEscalationOnlyInput("I have severe crushing chest pain")).toBe(true);
      expect(isEscalationOnlyInput("feeling suicidal")).toBe(true);
    });

    it("should not flag general routine topics like mild cold or hydration", () => {
      expect(isEscalationOnlyInput("how to stay hydrated")).toBe(false);
      expect(isEscalationOnlyInput("mild sneezing")).toBe(false);
    });
  });
});
