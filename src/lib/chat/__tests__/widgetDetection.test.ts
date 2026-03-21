import { describe, it, expect } from "vitest";
import { detectWidget } from "../widgetDetection";

describe("detectWidget", () => {
    it("detects pain scale questions", () => {
        expect(detectWidget("On a scale of 1-10, how bad is your pain?").type).toBe("pain_slider");
        expect(detectWidget("1 se 10 mein kitna dard hai?").type).toBe("pain_slider");
        expect(detectWidget("How bad is the severity?").type).toBe("pain_slider");
        expect(detectWidget("What is your pain level?").type).toBe("pain_slider");
        expect(detectWidget("Rate your pain please").type).toBe("pain_slider");
    });

    it("detects pain location questions", () => {
        const result = detectWidget("Which body part has pain?");
        expect(result.type).toBe("pain_location");

        expect(detectWidget("Point to the area where it hurts").type).toBe("pain_location");
        expect(detectWidget("Sharir ka kaunsa hissa dard kar raha hai?").type).toBe("pain_location");
        expect(detectWidget("Dard kahan ho raha hai — kis hisse mein?").type).toBe("pain_location");
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

        expect(detectWidget("Kitne din se ho raha hai?").type).toBe("quick_reply");
    });

    it("detects trigger questions", () => {
        const result = detectWidget("What makes it worse?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Movement");
        }

        expect(detectWidget("Kya karne se zyada hota hai?").type).toBe("quick_reply");
    });

    it("detects diet/food habit questions", () => {
        const result = detectWidget("What is your diet like? Any eating habits?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Normal diet");
            expect(result.options).toContain("Spicy food");
        }

        expect(detectWidget("Aap kya khate hain?").type).toBe("quick_reply");
    });

    it("detects medication history questions", () => {
        const result = detectWidget("Are you taking any medication?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Yes, prescribed");
            expect(result.options).toContain("No medication");
        }

        expect(detectWidget("Koi dawai le rahe hain?").type).toBe("quick_reply");
    });

    it("detects yes/no questions", () => {
        const result = detectWidget("Do you have any allergies?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Yes");
            expect(result.options).toContain("No");
        }

        expect(detectWidget("Kya aap ko pehle kabhi hua hai?").type).toBe("quick_reply");
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

        expect(detectWidget("Aapko chinta ya ghabrahat ho rahi hai?").type).toBe("quick_reply");
    });

    it("detects radiation questions", () => {
        const result = detectWidget("Does the pain spread or radiate to other areas?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Yes, to back");
        }
    });

    // ═══════════════════════════════════════════════════════════════════
    // MISMATCH FIX TESTS — These validate that the correct dropdown
    // options appear for the correct questions, preventing overlap.
    // ═══════════════════════════════════════════════════════════════════

    it("shows RELIEF options (not location) for 'What reduces your pain?'", () => {
        const result = detectWidget("What reduces your pain?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Rest");
            expect(result.options).toContain("Nothing helps");
            // Must NOT contain location options
            expect(result.options).not.toContain("Upper area");
            expect(result.options).not.toContain("All over");
        }
    });

    it("shows RELIEF options (not location) for 'Kya karne se dard kam hota hai?'", () => {
        const result = detectWidget("Kya karne se dard kam hota hai?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Rest");
        }
    });

    it("shows RELIEF options for 'What makes it better or gives relief?'", () => {
        const result = detectWidget("What makes it better or gives relief?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Rest");
            expect(result.options).toContain("Warm water");
        }
    });

    it("shows TRIGGER options (not location) for 'What makes your pain worse?'", () => {
        const result = detectWidget("What makes your pain worse?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Eating");
            expect(result.options).toContain("Movement");
            // Must NOT contain location options
            expect(result.options).not.toContain("Upper area");
        }
    });

    it("shows TRIGGER options for 'Dard kisse badhta hai?'", () => {
        const result = detectWidget("Dard kisse badhta hai?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Eating");
            expect(result.options).toContain("Movement");
        }
    });

    it("shows TRIGGER options (not pain scale) when AI acknowledges severity then asks about triggers", () => {
        const text = "A moderate 5 out of 10. That helps me understand the severity. What makes the pressure and nausea worse - is it eating certain foods, moving around, stress, or something else?";
        const result = detectWidget(text);
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Eating");
            expect(result.options).toContain("Movement");
            expect(result.options).toContain("Stress");
        }
    });

    it("shows SENSATION options (not location) for 'What kind of pain do you feel?'", () => {
        const result = detectWidget("What kind of pain do you feel?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Burning");
            expect(result.options).toContain("Sharp / Stabbing");
            expect(result.options).toContain("Dull ache");
        }
    });

    it("shows SENSATION options for 'Dard kaisa hai — jalan ya tez chubhan?'", () => {
        const result = detectWidget("Dard kaisa hai — jalan ya tez chubhan?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Burning");
        }
    });

    it("shows DURATION options (not location) for 'How long have you been experiencing this pain?'", () => {
        const result = detectWidget("How long have you been experiencing this pain?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Today / Few hours");
            expect(result.options).toContain("1-3 days");
        }
    });

    it("still shows PAIN LOCATION for pure location questions", () => {
        expect(detectWidget("Where is the pain located in your body?").type).toBe("pain_location");
        expect(detectWidget("Which body part hurts?").type).toBe("pain_location");
        expect(detectWidget("Sharir mein kahan dard hai?").type).toBe("pain_location");
    });

    it("shows FREQUENCY options for 'How often does the pain occur?'", () => {
        const result = detectWidget("How often does the pain occur?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Constant");
            expect(result.options).toContain("Comes & goes");
        }
    });

    it("shows RELIEF options for Hindi relief question with pain context", () => {
        const result = detectWidget("Kaise aram milta hai aapko dard se?");
        expect(result.type).toBe("quick_reply");
        if (result.type === "quick_reply") {
            expect(result.options).toContain("Rest");
        }
    });
});
