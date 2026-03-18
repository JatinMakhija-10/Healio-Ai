/**
 * Widget detection for the conversational chat flow.
 *
 * Determines which interactive widget (pain slider, quick-reply chips,
 * pain location picker) to show based on the content of the last
 * assistant message.
 */

export type WidgetHint =
    | { type: "pain_slider" }
    | { type: "pain_location" }
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
        t.includes("how bad") ||
        t.includes("kitni taklif") ||
        t.includes("pain level") ||
        t.includes("rate your pain") ||
        t.includes("dard ka star")
    ) {
        return { type: "pain_slider" };
    }

    // Pain Location (body region picker) — must come before generic location
    if (
        t.includes("point to the area") || t.includes("body part") ||
        t.includes("sharir mein kahan") || t.includes("body mein kahan") ||
        (t.includes("location") && (t.includes("pain") || t.includes("dard"))) ||
        (t.includes("dard") && t.includes("kahan")) ||
        (t.includes("dard") && (t.includes("hissa") || t.includes("hisse"))) ||
        (t.includes("sharir") && t.includes("dard")) ||
        t.includes("kis hisse mein") || t.includes("konse ang mein") ||
        t.includes("which body") || t.includes("area of your body")
    ) {
        return { type: "pain_location" };
    }

    // Location (sub-location / upper-lower selection)
    if (
        t.includes("where exactly") || t.includes("which area") || t.includes("which part") ||
        t.includes("kahaan") || t.includes("kahan") || t.includes("kidhar") ||
        t.includes("jagah") || t.includes("hissa") ||
        t.includes("oopar ya neeche") || (t.includes("oopar") && t.includes("neeche")) ||
        (t.includes("upper") && t.includes("lower")) ||
        t.includes("kis taraf") || t.includes("daayein ya baayein") ||
        t.includes("right side") || t.includes("left side")
    ) {
        return { type: "quick_reply", options: ["Upper area", "Lower area", "Left side", "Right side", "Center", "All over"] };
    }

    // Sensation type
    if (
        t.includes("feel like") || t.includes("type of pain") || t.includes("kaisa dard") ||
        t.includes("kaisa lagta") || t.includes("sensation") ||
        t.includes("burning") || t.includes("jalan") || t.includes("dull") || t.includes("sharp") ||
        t.includes("what kind") || t.includes("nature of") ||
        t.includes("dard ki prakar") || t.includes("kis tarah ka dard") ||
        t.includes("chubhan") || t.includes("dhadakta") || t.includes("bharipan")
    ) {
        return { type: "quick_reply", options: ["Burning", "Sharp / Stabbing", "Dull ache", "Throbbing", "Cramping", "Pressure"] };
    }

    // Duration
    if (
        t.includes("how long") || t.includes("kitne samay") || t.includes("kitne dino") ||
        t.includes("kab se") || t.includes("since when") || t.includes("duration") ||
        t.includes("started when") || t.includes("shuru hua") ||
        t.includes("kitne din se") || t.includes("kitne waqt se") ||
        t.includes("time period") || t.includes("kitni der se")
    ) {
        return { type: "quick_reply", options: ["Today / Few hours", "1-3 days", "1 week", "2-4 weeks", "1+ month", "Chronic / Long time"] };
    }

    // Triggers / worse
    if (
        t.includes("makes it worse") || t.includes("badh jata hai") || t.includes("worse") ||
        t.includes("trigger") || t.includes("aggravat") || t.includes("badhta") ||
        t.includes("kya karne se") || t.includes("kisse badhta") ||
        t.includes("kya karne se zyada hota") || t.includes("kisse zyada hota") ||
        t.includes("worsen") || t.includes("increase") ||
        t.includes("kab badhta") || t.includes("kis cheez se")
    ) {
        return { type: "quick_reply", options: ["Eating", "Movement", "Cold", "Heat", "Stress", "Nothing specific"] };
    }

    // Relief / better
    if (
        t.includes("makes it better") || t.includes("relief") || t.includes("aram") ||
        t.includes("kam hota") || t.includes("better") || t.includes("soothe") ||
        t.includes("kya karne se kam") || t.includes("ease") ||
        t.includes("kaise aram milta") || t.includes("thik hota") ||
        t.includes("kya se rahat milti") || t.includes("sudhaar")
    ) {
        return { type: "quick_reply", options: ["Rest", "Warm water", "Lying down", "Eating", "Medicine", "Nothing helps"] };
    }

    // Frequency
    if (
        t.includes("how often") || t.includes("kitni baar") || t.includes("frequency") ||
        t.includes("baar baar") || t.includes("recurring") || t.includes("regularly") ||
        t.includes("hamesha") || t.includes("constant") ||
        t.includes("roz hota") || t.includes("din mein kitni baar") ||
        t.includes("intermittent") || t.includes("kabhi kabhi")
    ) {
        return { type: "quick_reply", options: ["Constant", "Comes & goes", "Morning only", "Night only", "After eating", "Weekly"] };
    }

    // Onset / history
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

    // Associated symptoms
    if (
        t.includes("other symptom") || t.includes("aur koi taklif") || t.includes("along with") ||
        t.includes("saath mein") || t.includes("accompanied") || t.includes("besides") ||
        t.includes("aur kuch") || t.includes("also experiencing") || t.includes("additional") ||
        t.includes("aur kya dikkat") || t.includes("aur kya ho raha")
    ) {
        return { type: "quick_reply", options: ["Fever", "Nausea", "Headache", "Fatigue", "Vomiting", "None"] };
    }

    // Diet / food habits
    if (
        t.includes("diet") || t.includes("eating habit") || t.includes("food") ||
        t.includes("khana") || t.includes("khaane") || t.includes("bhojan") ||
        t.includes("what do you eat") || t.includes("kya khate") ||
        t.includes("appetite") || t.includes("bhookh")
    ) {
        return { type: "quick_reply", options: ["Normal diet", "Spicy food", "Irregular meals", "Loss of appetite", "Overeating", "Junk food"] };
    }

    // Medication history
    if (
        t.includes("medication") || t.includes("medicine") || t.includes("dawai") ||
        t.includes("dawa") || t.includes("taking any") || t.includes("koi dawai") ||
        t.includes("treatment") || t.includes("ilaaj") || t.includes("prescribed")
    ) {
        return { type: "quick_reply", options: ["Yes, prescribed", "Yes, over-the-counter", "Homeopathic", "Ayurvedic", "No medication", "Home remedies only"] };
    }

    // Stress / emotional
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

    // Radiation / spreading
    if (
        t.includes("spread") || t.includes("radiat") || t.includes("faila") ||
        t.includes("travel") || t.includes("other area") || t.includes("dusri jagah") ||
        t.includes("failta") || t.includes("aur kahi")
    ) {
        return { type: "quick_reply", options: ["Yes, to back", "Yes, to shoulder", "Yes, to legs", "Yes, to arm", "No, stays in one place"] };
    }

    // Generic yes/no
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
