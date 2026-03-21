/**
 * Widget detection for the conversational chat flow.
 *
 * Determines which interactive widget (pain slider, quick-reply chips,
 * pain location picker) to show based on the content of the last
 * assistant message.
 *
 * IMPORTANT: Detection order matters — more specific/contextual questions
 * (sensation, triggers, relief, duration) are checked BEFORE generic
 * location questions to avoid keyword overlap (e.g. "pain" appearing in
 * both "What reduces your pain?" and "Where is the pain?").
 */

export type WidgetHint =
    | { type: "pain_slider" }
    | { type: "pain_location" }
    | { type: "quick_reply"; options: string[] }
    | { type: "none" };

// ── Negative guard sets ──────────────────────────────────────────────
// Keywords that indicate the question is about relief / triggers / sensation
// rather than asking WHERE the pain is.
const RELIEF_KEYWORDS = [
    "better", "relief", "aram", "kam hota", "soothe", "ease",
    "kya karne se kam", "kaise aram", "thik hota", "rahat",
    "sudhaar", "reduce", "lessen", "decrease", "helps",
    "what helps", "kya se rahat", "kaise kam", "kam karta",
    "relief milta", "ameliorat",
];

const TRIGGER_KEYWORDS = [
    "makes it worse", "worse", "trigger", "aggravat", "badhta",
    "kya karne se", "kisse badhta", "zyada hota", "worsen",
    "increase", "kab badhta", "kis cheez se", "badh jata",
];

const SENSATION_KEYWORDS = [
    "feel like", "type of pain", "kaisa dard", "kaisa lagta",
    "sensation", "what kind", "nature of", "dard ki prakar",
    "kis tarah ka dard", "chubhan", "dhadakta", "bharipan",
];

const DURATION_KEYWORDS = [
    "how long", "kitne samay", "kitne dino", "kab se", "since when",
    "duration", "started when", "shuru hua", "kitne din se",
    "kitne waqt se", "time period", "kitni der se",
];

const FREQUENCY_KEYWORDS = [
    "how often", "kitni baar", "frequency", "baar baar",
    "recurring", "regularly", "hamesha", "constant",
    "roz hota", "din mein kitni baar", "intermittent", "kabhi kabhi",
];

/**
 * Returns true if the text contains any of the given keyword phrases.
 */
function hasAny(text: string, keywords: string[]): boolean {
    return keywords.some(kw => text.includes(kw));
}

/**
 * Analyzes the last assistant message text and returns a hint for
 * which interactive widget should be rendered beneath it.
 */
export function detectWidget(text: string): WidgetHint {
    const t = text.toLowerCase();

    // ─── 1. Pain scale (1-10) — very specific patterns ────────────────
    if (
        t.includes("1-10") ||
        t.includes("1 se 10") ||
        t.includes("1 to 10") ||
        t.includes("scale of 1") ||
        t.includes("kitna dard") ||
        t.includes("severity") ||
        t.includes("how bad") ||
        t.includes("kitni taklif") ||
        t.includes("pain level") ||
        t.includes("rate your pain") ||
        t.includes("dard ka star")
    ) {
        return { type: "pain_slider" };
    }

    // ─── 2. Sensation / pain type — BEFORE location ───────────────────
    if (hasAny(t, SENSATION_KEYWORDS) ||
        // Additional patterns that indicate sensation question
        (t.includes("burning") && !hasAny(t, TRIGGER_KEYWORDS)) ||
        (t.includes("jalan") && !hasAny(t, TRIGGER_KEYWORDS)) ||
        t.includes("dull") || t.includes("sharp")
    ) {
        return { type: "quick_reply", options: ["Burning", "Sharp / Stabbing", "Dull ache", "Throbbing", "Cramping", "Pressure"] };
    }

    // ─── 3. Relief / what makes it better — BEFORE triggers ───────────
    // Relief is checked BEFORE triggers because some Hindi phrases like
    // "kya karne se kam" overlap with trigger keywords ("kya karne se").
    // By checking relief first, phrases containing "kam", "aram", "relief"
    // correctly route to relief options.
    if (hasAny(t, RELIEF_KEYWORDS)) {
        return { type: "quick_reply", options: ["Rest", "Warm water", "Lying down", "Eating", "Medicine", "Nothing helps"] };
    }

    // ─── 4. Triggers / what makes it worse — BEFORE location ──────────
    if (hasAny(t, TRIGGER_KEYWORDS)) {
        return { type: "quick_reply", options: ["Eating", "Movement", "Cold", "Heat", "Stress", "Nothing specific"] };
    }

    // ─── 5. Duration — BEFORE location ────────────────────────────────
    if (hasAny(t, DURATION_KEYWORDS)) {
        return { type: "quick_reply", options: ["Today / Few hours", "1-3 days", "1 week", "2-4 weeks", "1+ month", "Chronic / Long time"] };
    }

    // ─── 6. Frequency — BEFORE location ───────────────────────────────
    if (hasAny(t, FREQUENCY_KEYWORDS)) {
        return { type: "quick_reply", options: ["Constant", "Comes & goes", "Morning only", "Night only", "After eating", "Weekly"] };
    }

    // ─── 7. Pain Location (body region picker) — with negative guards ─
    // Only match if the question is actually asking WHERE/WHICH BODY PART,
    // not about triggers, relief, duration, or sensation.
    const isNotContextual = !hasAny(t, [
        ...RELIEF_KEYWORDS, ...TRIGGER_KEYWORDS,
        ...SENSATION_KEYWORDS, ...DURATION_KEYWORDS,
        ...FREQUENCY_KEYWORDS,
    ]);

    if (isNotContextual && (
        t.includes("point to the area") || t.includes("body part") ||
        t.includes("sharir mein kahan") || t.includes("body mein kahan") ||
        (t.includes("location") && (t.includes("pain") || t.includes("dard"))) ||
        (t.includes("located") && (t.includes("pain") || t.includes("dard") || t.includes("body"))) ||
        (t.includes("dard") && t.includes("kahan")) ||
        (t.includes("dard") && (t.includes("hissa") || t.includes("hisse"))) ||
        (t.includes("sharir") && t.includes("dard")) ||
        t.includes("kis hisse mein") || t.includes("konse ang mein") ||
        t.includes("which body") || t.includes("area of your body")
    )) {
        return { type: "pain_location" };
    }

    // ─── 8. Sub-location (upper/lower/sides) — with negative guards ───
    if (isNotContextual && (
        t.includes("where exactly") || t.includes("which area") || t.includes("which part") ||
        t.includes("kahaan") || t.includes("kidhar") ||
        t.includes("jagah") ||
        t.includes("oopar ya neeche") || (t.includes("oopar") && t.includes("neeche")) ||
        (t.includes("upper") && t.includes("lower")) ||
        t.includes("kis taraf") || t.includes("daayein ya baayein") ||
        t.includes("right side") || t.includes("left side")
    )) {
        return { type: "quick_reply", options: ["Upper area", "Lower area", "Left side", "Right side", "Center", "All over"] };
    }

    // ─── 9. Onset / history ───────────────────────────────────────────
    if (
        t.includes("how did it start") || t.includes("kaise shuru") || t.includes("suddenly") ||
        t.includes("achanak") || t.includes("gradually") || t.includes("onset") ||
        t.includes("pehli baar") || t.includes("first time") ||
        t.includes("happened before") || t.includes("pehle kabhi") || t.includes("earlier") ||
        t.includes("history") || t.includes("hua hai") ||
        t.includes("kaise hua") || t.includes("kab shuru")
    ) {
        return { type: "quick_reply", options: ["Suddenly / Acute onset", "Gradually over time", "After an injury", "After physical activity", "Woke up with it", "Don't remember"] };
    }

    // ─── 10. Associated symptoms ──────────────────────────────────────
    if (
        t.includes("other symptom") || t.includes("aur koi taklif") || t.includes("along with") ||
        t.includes("saath mein") || t.includes("accompanied") || t.includes("besides") ||
        t.includes("aur kuch") || t.includes("also experiencing") || t.includes("additional") ||
        t.includes("aur kya dikkat") || t.includes("aur kya ho raha")
    ) {
        return { type: "quick_reply", options: ["Fever", "Nausea", "Headache", "Fatigue", "Vomiting", "None"] };
    }

    // ─── 11. Diet / food habits ───────────────────────────────────────
    if (
        t.includes("diet") || t.includes("eating habit") || t.includes("food") ||
        t.includes("khana") || t.includes("khaane") || t.includes("bhojan") ||
        t.includes("what do you eat") || t.includes("kya khate") ||
        t.includes("appetite") || t.includes("bhookh")
    ) {
        return { type: "quick_reply", options: ["Normal diet", "Spicy food", "Irregular meals", "Loss of appetite", "Overeating", "Junk food"] };
    }

    // ─── 12. Medication history ───────────────────────────────────────
    if (
        t.includes("medication") || t.includes("medicine") || t.includes("dawai") ||
        t.includes("dawa") || t.includes("taking any") || t.includes("koi dawai") ||
        t.includes("treatment") || t.includes("ilaaj") || t.includes("prescribed")
    ) {
        return { type: "quick_reply", options: ["Yes, prescribed", "Yes, over-the-counter", "Homeopathic", "Ayurvedic", "No medication", "Home remedies only"] };
    }

    // ─── 13. Stress / emotional ───────────────────────────────────────
    if (
        t.includes("stress") || t.includes("tension") || t.includes("emotional") ||
        t.includes("mental") || t.includes("anxiety") || t.includes("pareshani") ||
        t.includes("neend") || t.includes("sleep") || t.includes("mood") ||
        t.includes("neend mein dikkat") || t.includes("aajkal tension") ||
        t.includes("chinta") || t.includes("ghabrahat") ||
        t.includes("nind") || t.includes("nींद")
    ) {
        return { type: "quick_reply", options: ["High stress", "Some stress", "No stress", "Poor sleep", "Everything is okay"] };
    }

    // ─── 14. Radiation / spreading ────────────────────────────────────
    if (
        t.includes("spread") || t.includes("radiat") || t.includes("faila") ||
        t.includes("travel") || t.includes("other area") || t.includes("dusri jagah") ||
        t.includes("failta") || t.includes("aur kahi")
    ) {
        return { type: "quick_reply", options: ["Yes, to back", "Yes, to shoulder", "Yes, to legs", "Yes, to arm", "No, stays in one place"] };
    }

    // ─── 15. Generic yes/no — last resort ─────────────────────────────
    if (
        t.endsWith("?") &&
        (t.includes("kya aapko") || t.includes("do you") || t.includes("have you") ||
         t.includes("are you") || t.includes("is there") || t.includes("did you") ||
         t.includes("pehle kabhi") || t.includes("ever had") || t.includes("does it") ||
         t.includes("kya aap") || t.includes("kya yeh") || t.includes("kya kabhi"))
    ) {
        return { type: "quick_reply", options: ["Yes", "No", "Not sure"] };
    }

    return { type: "none" };
}
