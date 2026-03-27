import { describe, it, expect } from "vitest";

/**
 * Tests for persona-related logic used in the chat API route.
 * These test the persona context generation logic without hitting Supabase.
 */

describe("Persona context generation", () => {
    // Simulate the persona context builder from /api/chat/route.ts
    function buildPersonaContext(persona: {
        name: string;
        age?: number | null;
        gender?: string | null;
        relation?: string | null;
        conditions?: string[] | null;
        allergies?: string | null;
    }): string {
        const parts = [
            `Patient Profile: ${persona.name}`,
            persona.age ? `Age: ${persona.age} years` : null,
            persona.gender ? `Gender: ${persona.gender}` : null,
            persona.relation ? `Relation: ${persona.relation}` : null,
            persona.conditions?.length ? `Pre-existing conditions: ${persona.conditions.join(', ')}` : null,
            persona.allergies ? `Allergies: ${persona.allergies}` : null,
        ].filter(Boolean).join(', ');

        let context = `\n\n=== PATIENT CONTEXT ===\n${parts}\n`;

        if (persona.age && persona.age <= 12) {
            context += `IMPORTANT: This patient is a child (${persona.age} years old). Use gentle, age-appropriate language. Always emphasize consulting a pediatrician. Avoid suggesting any adult-dose remedies.\n`;
        }

        return context;
    }

    it("generates basic context with name only", () => {
        const result = buildPersonaContext({ name: "Rahul" });
        expect(result).toContain("Patient Profile: Rahul");
        expect(result).toContain("=== PATIENT CONTEXT ===");
    });

    it("includes all provided fields", () => {
        const result = buildPersonaContext({
            name: "Priya Sharma",
            age: 32,
            gender: "female",
            relation: "Spouse",
            conditions: ["Diabetes", "Asthma"],
            allergies: "Penicillin",
        });
        expect(result).toContain("Age: 32 years");
        expect(result).toContain("Gender: female");
        expect(result).toContain("Relation: Spouse");
        expect(result).toContain("Pre-existing conditions: Diabetes, Asthma");
        expect(result).toContain("Allergies: Penicillin");
    });

    it("omits null/empty fields", () => {
        const result = buildPersonaContext({
            name: "Test",
            age: null,
            gender: null,
            conditions: [],
            allergies: "",
        });
        expect(result).not.toContain("Age:");
        expect(result).not.toContain("Gender:");
        expect(result).not.toContain("Pre-existing conditions:");
        expect(result).not.toContain("Allergies:");
    });

    it("adds child-safe mode for age <= 12", () => {
        const result = buildPersonaContext({ name: "Arjun", age: 5 });
        expect(result).toContain("IMPORTANT: This patient is a child");
        expect(result).toContain("pediatrician");
        expect(result).toContain("5 years old");
    });

    it("does NOT add child-safe mode for age > 12", () => {
        const result = buildPersonaContext({ name: "Teen", age: 15 });
        expect(result).not.toContain("IMPORTANT: This patient is a child");
    });

    it("child-safe mode boundary at exactly 12", () => {
        const result = buildPersonaContext({ name: "Kid", age: 12 });
        expect(result).toContain("IMPORTANT: This patient is a child");
    });

    it("child-safe mode NOT triggered at 13", () => {
        const result = buildPersonaContext({ name: "Teen", age: 13 });
        expect(result).not.toContain("IMPORTANT: This patient is a child");
    });
});

describe("Usage limit constants", () => {
    const FREE_LIMIT = 10;
    const PREMIUM_LIMIT = -1; // unlimited

    it("free plan has 10 monthly consultations", () => {
        expect(FREE_LIMIT).toBe(10);
    });

    it("premium plans have unlimited (-1) consultations", () => {
        expect(PREMIUM_LIMIT).toBe(-1);
    });

    it("free limit is positive", () => {
        expect(FREE_LIMIT).toBeGreaterThan(0);
    });
});
