import { describe, it, expect } from "vitest";
import { detectWidget } from "../widgetDetection";

describe("detectWidget", () => {
    it("detects pain scale questions", () => {
        expect(detectWidget("On a scale of 1-10, how bad is your pain?").type).toBe("pain_slider");
        expect(detectWidget("1 se 10 mein kitna dard hai?").type).toBe("pain_slider");
        expect(detectWidget("How bad is the severity?").type).toBe("pain_slider");
    });

    it("detects location questions", () => {
        const result = detectWidget("Where exactly is the pain?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Upper area");
            expect(result.options).toContain("All over");
        }
    });

    it("detects sensation type questions", () => {
        const result = detectWidget("What does it feel like? Is it burning or sharp?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Burning");
            expect(result.options).toContain("Sharp / Stabbing");
        }
    });

    it("detects duration questions", () => {
        const result = detectWidget("How long have you had this pain?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("1-3 days");
        }
    });

    it("detects trigger questions", () => {
        const result = detectWidget("What makes it worse?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Movement");
        }
    });

    it("detects yes/no questions", () => {
        const result = detectWidget("Do you have any allergies?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Yes");
            expect(result.options).toContain("No");
        }
    });

    it("returns none for generic text", () => {
        expect(detectWidget("Thank you for sharing that information.").type).toBe("none");
    });

    it("detects Hindi location questions", () => {
        const result = detectWidget("Dard kahaan hota hai?");
        expect(result.type).toBe("quick_reply");
    });

    it("detects stress/emotional questions", () => {
        const result = detectWidget("Are you experiencing any stress or anxiety lately?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("High stress");
        }
    });

    it("detects radiation questions", () => {
        const result = detectWidget("Does the pain spread or radiate to other areas?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Yes, to back");
        }
    });
});
