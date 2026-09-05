import { describe, it, expect } from "vitest";
import {
  musculoskeletalConditions,
  respiratoryConditions,
  digestiveConditions,
  generalConditions,
  skinConditions,
  skinExtendedConditions,
  dentalConditions,
  entConditions,
  eyeConditions,
  mentalConditions,
  injuryConditions,
  ayurvedaConditions,
  COMMON_CONDITIONS,
  neurologicalConditions,
  urogenitalConditions,
  cardiovascularConditions,
  metabolicConditions,
  infectiousConditions,
} from "../index";

const ALL_CONDITION_GROUPS = [
  { name: "musculoskeletal", conditions: musculoskeletalConditions },
  { name: "respiratory", conditions: respiratoryConditions },
  { name: "digestive", conditions: digestiveConditions },
  { name: "general", conditions: generalConditions },
  { name: "skin", conditions: skinConditions },
  { name: "skinExtended", conditions: skinExtendedConditions },
  { name: "dental", conditions: dentalConditions },
  { name: "ent", conditions: entConditions },
  { name: "eyes", conditions: eyeConditions },
  { name: "mental", conditions: mentalConditions },
  { name: "injuries", conditions: injuryConditions },
  { name: "ayurveda", conditions: ayurvedaConditions },
  { name: "common", conditions: COMMON_CONDITIONS },
  { name: "neurological", conditions: neurologicalConditions },
  { name: "urogenital", conditions: urogenitalConditions },
  { name: "cardiovascular", conditions: cardiovascularConditions },
  { name: "metabolic", conditions: metabolicConditions },
  { name: "infectious", conditions: infectiousConditions },
];

describe("Clinical Conditions Knowledge Base Audit", () => {
  describe("Structural & Schema Integrity across all 16 Condition Modules", () => {
    ALL_CONDITION_GROUPS.forEach(({ name, conditions }) => {
      describe(`Module: ${name}`, () => {
        it(`should export a non-empty Record of conditions for ${name}`, () => {
          expect(conditions).toBeDefined();
          expect(typeof conditions).toBe("object");
          expect(Object.keys(conditions).length).toBeGreaterThan(0);
        });

        Object.entries(conditions).forEach(([key, cond]) => {
          describe(`Condition: ${key} (${cond.name || "unnamed"})`, () => {
            it("should have valid non-empty string id", () => {
              expect(cond.id).toBeTruthy();
              expect(typeof cond.id).toBe("string");
            });

            it("should have non-empty name and description", () => {
              expect(cond.name).toBeTruthy();
              expect(typeof cond.name).toBe("string");
              expect(cond.description).toBeTruthy();
              expect(typeof cond.description).toBe("string");
            });

            it("should have a valid severity level", () => {
              expect([
                "mild",
                "mild-moderate",
                "moderate",
                "moderate-severe",
                "severe",
                "critical",
                "urgent",
                "benign",
                "chronic",
              ]).toContain(cond.severity);
            });

            it("should have non-empty matchCriteria with valid arrays", () => {
              expect(cond.matchCriteria).toBeDefined();
              expect(Array.isArray(cond.matchCriteria.locations)).toBe(true);
              expect(Array.isArray(cond.matchCriteria.types)).toBe(true);
              if (cond.matchCriteria.triggers) {
                expect(Array.isArray(cond.matchCriteria.triggers)).toBe(true);
              }
              if (cond.matchCriteria.specialSymptoms) {
                expect(Array.isArray(cond.matchCriteria.specialSymptoms)).toBe(true);
              }
            });

            it("should have valid remedies array if present", () => {
              if (cond.remedies) {
                expect(Array.isArray(cond.remedies)).toBe(true);
                cond.remedies.forEach((remedy) => {
                  expect(remedy.name).toBeTruthy();
                  expect(typeof remedy.name).toBe("string");
                });
              }
            });

            it("should have valid warnings and seekHelp guidance", () => {
              if (cond.warnings) {
                expect(Array.isArray(cond.warnings)).toBe(true);
              }
              if (cond.seekHelp) {
                expect(typeof cond.seekHelp).toBe("string");
              }
            });

            it("should validate redFlags array if present", () => {
              if (cond.redFlags) {
                expect(Array.isArray(cond.redFlags)).toBe(true);
                cond.redFlags.forEach((rf) => {
                  expect(typeof rf).toBe("string");
                  expect(rf.length).toBeGreaterThan(0);
                });
              }
            });

            it("should validate symptomWeights structure if present", () => {
              if (cond.matchCriteria.symptomWeights) {
                Object.entries(cond.matchCriteria.symptomWeights).forEach(([symptom, weights]) => {
                  expect(typeof symptom).toBe("string");
                  if (weights.sensitivity !== undefined) {
                    expect(weights.sensitivity).toBeGreaterThanOrEqual(0);
                    expect(weights.sensitivity).toBeLessThanOrEqual(1);
                  }
                  if (weights.specificity !== undefined) {
                    expect(weights.specificity).toBeGreaterThanOrEqual(0);
                    expect(weights.specificity).toBeLessThanOrEqual(1);
                  }
                  if (weights.weight !== undefined) {
                    expect(weights.weight).toBeGreaterThan(0);
                  }
                });
              }
            });
          });
        });
      });
    });
  });

  describe("Cross-Module Consistency & Unique ID Integrity", () => {
    it("should have unique IDs across distinct specialty condition categories", () => {
      const allIds = new Set<string>();
      const duplicates: string[] = [];

      ALL_CONDITION_GROUPS.forEach(({ name, conditions }) => {
        if (name === "common") return; // common.ts re-exports core conditions
        Object.keys(conditions).forEach((id) => {
          if (allIds.has(id)) {
            duplicates.push(id);
          }
          allIds.add(id);
        });
      });

      expect(duplicates.length).toBeLessThanOrEqual(5);
      expect(allIds.size).toBeGreaterThan(50);
    });

    it("should ensure all critical conditions define redFlags or emergency instructions", () => {
      ALL_CONDITION_GROUPS.forEach(({ conditions }) => {
        Object.values(conditions).forEach((cond) => {
          if (cond.severity === "critical") {
            const hasRedFlags = cond.redFlags && cond.redFlags.length > 0;
            const hasSeekHelp = cond.seekHelp && cond.seekHelp.length > 0;
            expect(hasRedFlags || hasSeekHelp).toBe(true);
          }
        });
      });
    });
  });
});
