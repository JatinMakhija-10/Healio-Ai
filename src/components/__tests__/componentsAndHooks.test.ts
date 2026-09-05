import { describe, it, expect } from "vitest";
import { extractSymptomTerm } from "../../app/dashboard/consult/components/PainSliderWidget";
import { getDailyTip } from "../dashboard/DailyTipCard";

describe("UI Components & Custom Widget Helper Functions", () => {
  describe("extractSymptomTerm (Pain Slider Widget)", () => {
    it("should return explicit term if provided and non-empty", () => {
      expect(extractSymptomTerm("How bad is it?", "Joint Stiffness")).toBe("Joint Stiffness");
    });

    it("should default to 'Pain' if question text is undefined or empty", () => {
      expect(extractSymptomTerm(undefined)).toBe("Pain");
      expect(extractSymptomTerm("")).toBe("Pain");
    });

    it("should extract explicit English and Hinglish symptom terms", () => {
      expect(extractSymptomTerm("Rate your headache intensity")).toBe("Headache");
      expect(extractSymptomTerm("sir dard kaisa hai")).toBe("Headache");
      expect(extractSymptomTerm("how severe is your nausea")).toBe("Nausea");
      expect(extractSymptomTerm("pet dard kitna hai")).toBe("Stomach Pain");
      expect(extractSymptomTerm("kamar dard rating")).toBe("Back Pain");
      expect(extractSymptomTerm("khansi ki intensity")).toBe("Cough");
      expect(extractSymptomTerm("chhati mein dard")).toBe("Chest Pain");
    });

    it("should dynamically extract capitalized noun phrases from question patterns", () => {
      expect(extractSymptomTerm("How severe is your shoulder ache right now?")).toBe("Shoulder Ache");
      expect(extractSymptomTerm("Rate the intensity of the muscle soreness on scale")).toBe("Muscle Soreness");
    });
  });

  describe("getDailyTip (Daily Tip Card)", () => {
    it("should return identical tip object for the same date", () => {
      const fixedDate = new Date("2026-09-05T12:00:00Z");
      const tip1 = getDailyTip(fixedDate, 0);
      const tip2 = getDailyTip(fixedDate, 0);

      expect(tip1.title).toBe(tip2.title);
      expect(tip1.content).toBe(tip2.content);
    });

    it("should advance tips deterministically when offset changes", () => {
      const fixedDate = new Date("2026-09-05T12:00:00Z");
      const tip0 = getDailyTip(fixedDate, 0);
      const tip1 = getDailyTip(fixedDate, 1);

      expect(tip0.title).not.toBe(tip1.title);
    });
  });
});
