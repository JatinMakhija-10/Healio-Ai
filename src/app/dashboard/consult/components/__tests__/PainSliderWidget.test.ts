import { describe, it, expect } from "vitest";
import { extractSymptomTerm } from "../PainSliderWidget";

describe("extractSymptomTerm", () => {
    it("extracts Discomfort when bot asks about discomfort", () => {
        const text = "Dealing with diarrhea alongside upper stomach pain and nausea can be exhausting. On a scale of 1 to 10, how severe is your discomfort right now?";
        expect(extractSymptomTerm(text)).toBe("Discomfort");
    });

    it("extracts Nausea when bot asks about nausea severity", () => {
        const text = "On a scale of 1 to 10, how severe is your nausea right now?";
        expect(extractSymptomTerm(text)).toBe("Nausea");
    });

    it("extracts Headache when bot asks about headache intensity", () => {
        const text = "How would you rate the intensity of your headache from 0 to 10?";
        expect(extractSymptomTerm(text)).toBe("Headache");
    });

    it("extracts Fever when bot asks about fever", () => {
        const text = "How severe is your fever on a scale of 1-10?";
        expect(extractSymptomTerm(text)).toBe("Fever");
    });

    it("extracts Stomach Pain when bot asks about stomach pain", () => {
        const text = "How bad is your stomach pain on a scale of 1 to 10?";
        expect(extractSymptomTerm(text)).toBe("Stomach Pain");
    });

    it("extracts Itching when bot asks about itching", () => {
        const text = "On a scale of 1 to 10, how bad is the itching?";
        expect(extractSymptomTerm(text)).toBe("Itching");
    });

    it("extracts Symptoms when bot asks about symptoms in general", () => {
        const text = "Rate your symptoms on a scale of 1 to 10.";
        expect(extractSymptomTerm(text)).toBe("Symptoms");
    });

    it("defaults to Pain when asking about pain", () => {
        const text = "On a scale of 1-10, how bad is your pain?";
        expect(extractSymptomTerm(text)).toBe("Pain");
    });

    it("uses explicitTerm if provided", () => {
        expect(extractSymptomTerm("Some question", "Nausea")).toBe("Nausea");
    });
});
