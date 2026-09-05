import { describe, it, expect, beforeEach } from "vitest";
import { languageDetector } from "../LanguageDetector";
import { medicalNER, MedicalNER } from "../MedicalNER";
import { CHIP_OPTIONS, resolveChipOptionsForSchema } from "../ChipOptionsRegistry";
import { buildConversationIntakeState } from "../ConversationIntakeState";
import { responseGenerator } from "../EmpatheticResponseGenerator";

describe("Clinical Dialogue, Intake & NLP Engines", () => {
  describe("Language Detector", () => {
    it("should default to English for empty or whitespace inputs", () => {
      expect(languageDetector.detect("").language).toBe("en");
      expect(languageDetector.detect("   ").language).toBe("en");
    });

    it("should correctly detect pure English inputs", () => {
      const result = languageDetector.detect("I have a severe headache and high fever for 3 days");
      expect(result.language).toBe("en");
      expect(result.script).toBe("latin");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should correctly detect Hindi in Devanagari script", () => {
      const result = languageDetector.detect("मुझे पिछले दो दिनों से बहुत तेज़ सिर दर्द हो रहा है");
      expect(result.language).toBe("hi");
      expect(result.script).toBe("devanagari");
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("should correctly detect Hinglish (Hindi words in Latin script)", () => {
      const result = languageDetector.detect("mujhe 2 din se bahut tez pet dard aur bukhar hai");
      expect(result.language).toBe("hinglish");
      expect(result.script).toBe("latin");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should handle mixed Devanagari and Latin script as Hindi", () => {
      const result = languageDetector.detect("mujhe headache हो रहा है");
      expect(result.language).toBe("hi");
      expect(result.script).toBe("mixed");
    });
  });

  describe("Medical Named Entity Recognition (NER)", () => {
    let ner: MedicalNER;

    beforeEach(() => {
      ner = new MedicalNER();
    });

    it("should normalize layman symptom descriptions to medical terms", () => {
      expect(ner.normalizeSymptom("head hurts")).toBe("headache");
      expect(ner.normalizeSymptom("tummy ache")).toBe("stomach_pain");
      expect(ner.normalizeSymptom("loose motion")).toBe("diarrhea");
      expect(ner.normalizeSymptom("bukhar")).toBe("fever");
      expect(ner.normalizeSymptom("sir dard")).toBe("headache");
    });

    it("should extract symptoms from complex text", () => {
      const text = "I am having head hurts and tummy ache";
      const entities = ner.extractEntities(text);
      const confirmed = ner.getConfirmedSymptoms(entities);

      expect(confirmed).toContain("headache");
      expect(confirmed).toContain("stomach_pain");
    });

    it("should detect negated symptoms accurately via NegEx logic", () => {
      const text = "I have a severe headache but no fever";
      const entities = ner.extractEntities(text);

      const confirmed = ner.getConfirmedSymptoms(entities);
      const denied = ner.getDeniedSymptoms(entities);

      expect(confirmed).toContain("headache");
      expect(denied).toContain("fever");
    });

    it("should extract duration expressions from user input", () => {
      const text = "I have been coughing for 5 days";
      const entities = ner.extractEntities(text);

      const durationEntity = entities.find((e) => e.type === "duration");
      expect(durationEntity).toBeDefined();
      expect(durationEntity?.text).toContain("for 5 days");
    });
  });

  describe("Chip Options Registry", () => {
    it("should return predefined options from CHIP_OPTIONS dictionary", () => {
      expect(CHIP_OPTIONS).toBeDefined();
      expect(typeof CHIP_OPTIONS).toBe("object");
    });

    it("should resolve chip options for registered schemas", () => {
      const options = resolveChipOptionsForSchema("duration", "headache");
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThan(0);
    });
  });

  describe("Conversation Intake State", () => {
    it("should initialize intake state from transcript messages", () => {
      const state = buildConversationIntakeState([
        { role: "user", content: "I have had a high fever" }
      ]);
      expect(state.activeSchemaId).toBeDefined();
      expect(state.chiefComplaint).toBeDefined();
    });

    it("should detect red flags in user transcript", () => {
      const state = buildConversationIntakeState([
        { role: "user", content: "I am having severe crushing chest pain radiating to left arm" }
      ]);
      expect(state.redFlagsFound.length).toBeGreaterThan(0);
      expect(state.phaseStatus).toBe("escalated");
    });
  });

  describe("Empathetic Response Generator", () => {
    it("should generate emergency responses for critical triggers", () => {
      const response = responseGenerator.generateEmergencyResponse("cardiac");
      expect(response).toContain("EMERGENCY");
      expect(response).toContain("911");
    });

    it("should add empathy prefixes based on emotional state", () => {
      const response = responseGenerator.addEmpathyPrefix("What seems to be the problem?", "anxious", "en");
      expect(typeof response).toBe("string");
      expect(response.length).toBeGreaterThan(10);
    });
  });
});
