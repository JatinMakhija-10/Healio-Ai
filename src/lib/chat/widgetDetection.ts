/**
 * Widget detection for the conversational chat flow.
 *
 * Determines which interactive widget (pain slider, quick-reply chips)
 * to show based on the content of the last assistant message.
 */

export type WidgetHint =
    | { type: "pain_slider" }
    | { type: "quick_reply"; options: string[] }
    | { type: "none" };

/**
 * Analyzes the last assistant message text and returns a hint for
 * which interactive widget should be rendered beneath it.
 */
export function detectWidget(text: string): WidgetHint {
    const t = text.toLowerCase();

    // Pain scale (1-10)
    if (
        t.includes("1-10") ||
        t.includes("1 se 10") ||
        t.includes("1 to 10") ||
        t.includes("scale of 1") ||
        t.includes("kitna dard") ||
        t.includes("severity") ||
        t.includes("how bad")
    ) {
        return { type: "pain_slider" };
    }

    // Location
    if (
        t.includes("where exactly") || t.includes("which area") || t.includes("which part") ||
        t.includes("kahaan") || t.includes("kahan") || t.includes("kidhar") ||
        t.includes("jagah") || t.includes("hissa") ||
        t.includes("oopar ya neeche") || (t.includes("oopar") && t.includes("neeche")) ||
        (t.includes("upper") && t.includes("lower"))
    ) {
        return { type: "quick_reply", options: ["Upper area", "Lower area", "Left side", "Right side", "Center", "All over"] };
    }

    // Sensation type
    if (
        t.includes("feel like") || t.includes("type of pain") || t.includes("kaisa dard") ||
        t.includes("kaisa lagta") || t.includes("sensation") ||
        t.includes("burning") || t.includes("jalan") || t.includes("dull") || t.includes("sharp") ||
        t.includes("what kind") || t.includes("nature of")
    ) {
        return { type: "quick_reply", options: ["Burning", "Sharp / Stabbing", "Dull ache", "Throbbing", "Cramping", "Pressure"] };
    }

    // Duration
    if (
        t.includes("how long") || t.includes("kitne samay") || t.includes("kitne dino") ||
        t.includes("kab se") || t.includes("since when") || t.includes("duration") ||
        t.includes("started when") || t.includes("shuru hua")
    ) {
        return { type: "quick_reply", options: ["Today / Few hours", "1-3 days", "1 week", "2-4 weeks", "1+ month", "Chronic / Long time"] };
    }

    // Triggers / worse
    if (
        t.includes("makes it worse") || t.includes("badh jata hai") || t.includes("worse") ||
        t.includes("trigger") || t.includes("aggravat") || t.includes("badhta") ||
        t.includes("kya karne se") || t.includes("kisse badhta")
    ) {
        return { type: "quick_reply", options: ["Eating", "Movement", "Cold", "Heat", "Stress", "Nothing specific"] };
    }

    // Relief / better
    if (
        t.includes("makes it better") || t.includes("relief") || t.includes("aram") ||
        t.includes("kam hota") || t.includes("better") || t.includes("soothe") ||
        t.includes("kya karne se kam") || t.includes("ease")
    ) {
        return { type: "quick_reply", options: ["Rest", "Warm water", "Lying down", "Eating", "Medicine", "Nothing helps"] };
    }

    // Frequency
    if (
        t.includes("how often") || t.includes("kitni baar") || t.includes("frequency") ||
        t.includes("baar baar") || t.includes("recurring") || t.includes("regularly") ||
        t.includes("hamesha") || t.includes("constant")
    ) {
        return { type: "quick_reply", options: ["Constant", "Comes & goes", "Morning only", "Night only", "After eating", "Weekly"] };
    }

    // Onset / history
    if (
        t.includes("how did it start") || t.includes("kaise shuru") || t.includes("suddenly") ||
        t.includes("achanak") || t.includes("gradually") || t.includes("onset") ||
        t.includes("pehli baar") || t.includes("first time") ||
        t.includes("happened before") || t.includes("pehle kabhi") || t.includes("earlier") ||
        t.includes("history") || t.includes("hua hai")
    ) {
        return { type: "quick_reply", options: ["Suddenly / Acute onset", "Gradually over time", "After an injury", "After physical activity", "Woke up with it", "Don't remember"] };
    }

    // Associated symptoms
    if (
        t.includes("other symptom") || t.includes("aur koi taklif") || t.includes("along with") ||
        t.includes("saath mein") || t.includes("accompanied") || t.includes("besides") ||
        t.includes("aur kuch") || t.includes("also experiencing") || t.includes("additional")
    ) {
        return { type: "quick_reply", options: ["Fever", "Nausea", "Headache", "Fatigue", "Vomiting", "None"] };
    }

    // Stress / emotional
    if (
        t.includes("stress") || t.includes("tension") || t.includes("emotional") ||
        t.includes("mental") || t.includes("anxiety") || t.includes("pareshani") ||
        t.includes("neend") || t.includes("sleep") || t.includes("mood") ||
        t.includes("neend mein dikkat") || t.includes("aajkal tension")
    ) {
        return { type: "quick_reply", options: ["High stress", "Some stress", "No stress", "Poor sleep", "Everything is okay"] };
    }

    // Radiation / spreading
    if (
        t.includes("spread") || t.includes("radiat") || t.includes("faila") ||
        t.includes("travel") || t.includes("other area") || t.includes("dusri jagah")
    ) {
        return { type: "quick_reply", options: ["Yes, to back", "Yes, to shoulder", "Yes, to legs", "Yes, to arm", "No, stays in one place"] };
    }

    // Generic yes/no
    if (
        t.endsWith("?") &&
        (t.includes("kya aapko") || t.includes("do you") || t.includes("have you") ||
         t.includes("are you") || t.includes("is there") || t.includes("did you") ||
         t.includes("pehle kabhi") || t.includes("ever had") || t.includes("does it"))
    ) {
        return { type: "quick_reply", options: ["Yes", "No", "Not sure"] };
    }

    return { type: "none" };
}
