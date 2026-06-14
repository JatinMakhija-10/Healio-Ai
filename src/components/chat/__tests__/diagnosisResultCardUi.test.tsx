import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DiagnosisResultCard } from "../DiagnosisResultCard";
import { EmergencyRedirect } from "../EmergencyRedirect";
import type { Condition } from "@/lib/diagnosis/types";

vi.mock("@/context/AuthContext", () => ({
    useAuth: () => ({ user: null }),
}));

vi.mock("@/lib/stripe/mockClient", () => ({
    PLANS: {
        plus: { name: "Plus", price: 149, features: [] },
        pro: { name: "Pro", price: 399, features: [] },
    },
    createCheckoutSession: vi.fn(async () => ({ url: "/dashboard/billing" })),
    getSubscriptionStatus: vi.fn(async () => "free"),
}));

vi.mock("@/components/subscription/PlanSelectionModal", () => ({
    PlanSelectionModal: () => null,
}));

const baseCondition = {
    name: "Tension Headache",
    description: "A common headache pattern with mild neck tension.",
    severity: "mild",
    home_remedies: [
        {
            name: "Warm compress",
            description: "May ease muscle tightness.",
            method: "Apply for 10 minutes.",
            source: "Self-care",
        },
    ],
    ayurvedic_remedies: [
        {
            name: "Tulsi tea",
            indication: "Comfort care for mild congestion and fatigue.",
            preparation: "Steep fresh leaves in warm water.",
            source: "CCRAS",
        },
    ],
    homeopathic_remedies: [
        {
            name: "Nux Vomica",
            potency: "30C",
            indication: "Traditional context only.",
            source: "Boericke",
        },
    ],
} as unknown as Condition;

describe("EmergencyRedirect", () => {
    it("renders emergency telephone links and detected symptoms", () => {
        const html = renderToStaticMarkup(
            <EmergencyRedirect detectedSymptoms={["chest pain", "shortness of breath"]} />
        );

        expect(html).toContain("href=\"tel:112\"");
        expect(html).toContain("href=\"tel:911\"");
        expect(html).toContain("chest pain");
        expect(html).toContain("shortness of breath");
    });
});

describe("DiagnosisResultCard safety UI", () => {
    it("renders a visible disclaimer instead of a hidden disclaimer", () => {
        const html = renderToStaticMarkup(
            <DiagnosisResultCard condition={baseCondition} confidence={82} />
        );

        expect(html).toContain("Not a Medical Diagnosis");
        expect(html).not.toContain("class=\"hidden\"");
    });

    it("renders the emergency redirect when emergency language is present", () => {
        const html = renderToStaticMarkup(
            <DiagnosisResultCard
                condition={baseCondition}
                confidence={45}
                alerts={["Seek emergency care immediately. Call 112."]}
            />
        );

        expect(html).toContain("Seek Emergency Medical Care");
        expect(html).toContain("href=\"tel:112\"");
    });

    it("renders care tabs with accessible tab semantics", () => {
        const html = renderToStaticMarkup(
            <DiagnosisResultCard condition={baseCondition} confidence={82} />
        );

        expect(html).toContain("role=\"tablist\"");
        expect(html).toContain("role=\"tab\"");
        expect(html).toContain("aria-selected=\"true\"");
        expect(html).toContain("role=\"tabpanel\"");
    });
});
