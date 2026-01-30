
import { diagnose, scanRedFlags } from "./engine";
import { UserSymptomData } from "./types";
import { intentEngine, medicalNER } from "./dialogue";

/*
 * Test Script for Clinical Engine Architecture
 * 
 * Tests:
 * - Emergency detection (speed and accuracy)
 * - Negation detection
 * - Intent classification
 * - Medical NER synonym mapping
 * - Bayesian scoring
 * - Mimic differentiation
 */

async function runTests() {
    console.log("=== STARTING CLINICAL ENGINE VERIFICATION ===\n");
    console.log("Testing enhanced conversation engine with dialogue management\n");

    // ============ NEW TEST: Emergency Detection Speed ============
    console.log("--- TEST 1: Emergency Detection Speed (<200ms) ---");
    const emergencySymptoms: UserSymptomData = {
        location: ["chest"],
        painType: "crushing",
        additionalNotes: "sweating and arm pain, feels like elephant sitting on chest"
    };

    const startTime = performance.now();
    const alerts = scanRedFlags(emergencySymptoms);
    const duration = performance.now() - startTime;

    console.log(`Detection time: ${duration.toFixed(2)}ms`);
    console.log(`Alerts found: ${alerts.length}`);
    alerts.forEach(a => console.log(`  - ${a.substring(0, 60)}...`));

    if (duration < 200 && alerts.length > 0) {
        console.log("PASS: Emergency detected quickly");
    } else if (alerts.length === 0) {
        console.log("FAIL: No emergency detected");
    } else {
        console.log(`WARN: Detection took ${duration.toFixed(2)}ms (target: <200ms)`);
    }

    // ============ NEW TEST: Mental Health Crisis Detection ============
    console.log("\n--- TEST 2: Mental Health Crisis Detection ---");
    const crisisSymptoms: UserSymptomData = {
        location: ["head"],
        additionalNotes: "I feel like I want to end my life, no reason to live"
    };

    const crisisAlerts = scanRedFlags(crisisSymptoms);
    const hasCrisisAlert = crisisAlerts.some(a => a.includes("988") || a.includes("CRISIS"));

    if (hasCrisisAlert) {
        console.log("PASS: Crisis support resources provided");
    } else {
        console.log("FAIL: Crisis not detected");
    }

    // ============ NEW TEST: Intent Classification ============
    console.log("\n--- TEST 3: Intent Classification ---");

    const testCases = [
        { input: "I can't breathe, help me!", expected: "EMERGENCY" },
        { input: "Yes, I have that", expected: "ANSWER_YES" },
        { input: "No, I don't have fever", expected: "ANSWER_NO" },
        { input: "What do you mean by that?", expected: "CLARIFICATION_NEEDED" },
        { input: "I also have a headache", expected: "ADD_SYMPTOM" }
    ];

    let passed = 0;
    for (const tc of testCases) {
        const result = intentEngine.understand(tc.input);
        if (result.primary === tc.expected) {
            console.log(`PASS: "${tc.input.substring(0, 30)}..." → ${result.primary} (${(result.confidence * 100).toFixed(0)}%)`);
            passed++;
        } else {
            console.log(`FAIL: "${tc.input.substring(0, 30)}..." → Got ${result.primary}, expected ${tc.expected}`);
        }
    }
    console.log(`Intent Classification: ${passed}/${testCases.length} passed`);

    // ============ NEW TEST: Medical NER Negation Detection ============
    console.log("\n--- TEST 4: Medical NER Negation Detection ---");

    const nerTestCases = [
        { input: "I have a headache but NO fever", expectPresent: ["headache"], expectNegated: ["fever"] },
        { input: "I don't have nausea or vomiting", expectPresent: [], expectNegated: ["nausea", "vomiting"] },
        { input: "severe chest pain with shortness of breath", expectPresent: ["chest_pain", "shortness_of_breath"], expectNegated: [] }
    ];

    for (const tc of nerTestCases) {
        const entities = medicalNER.extractEntities(tc.input);
        const confirmed = medicalNER.getConfirmedSymptoms(entities);
        const denied = medicalNER.getDeniedSymptoms(entities);

        console.log(`Input: "${tc.input}"`);
        console.log(`  Present: [${confirmed.join(", ")}]`);
        console.log(`  Negated: [${denied.join(", ")}]`);
    }

    // ============ NEW TEST: Emotional State Detection ============
    console.log("\n--- TEST 5: Emotional State Detection ---");

    const emotionTests = [
        { input: "I'm really worried about this", expected: "anxious" },
        { input: "This is frustrating, I already told you", expected: "frustrated" },
        { input: "Help me right now, this is urgent!", expected: "urgent" },
        { input: "I have some pain in my back", expected: "calm" }
    ];

    for (const tc of emotionTests) {
        const result = intentEngine.detectEmotionalState(tc.input);
        if (result === tc.expected) {
            console.log(`PASS: "${tc.input.substring(0, 35)}..." → ${result}`);
        } else {
            console.log(`FAIL: "${tc.input.substring(0, 35)}..." → Got ${result}, expected ${tc.expected}`);
        }
    }

    // ============ EXISTING TEST: Mimic Differentiation ============
    console.log("\n--- TEST 6: Mimic Differentiation (Migraine vs Tension) ---");
    const ambiguousHeadache: UserSymptomData = {
        location: ["head"],
        painType: "throbbing",
        additionalNotes: "My head hurts."
    };

    const result6 = await diagnose(ambiguousHeadache);
    if (result6.question) {
        console.log(`PASS: Generated Question: "${result6.question.question}"`);
        const qText = result6.question.question.toLowerCase();
        const isEffective = qText.includes("nausea") || qText.includes("light") || qText.includes("vomiting") || qText.includes("auras") || qText.includes("following");

        if (isEffective) {
            console.log("PASS: Question targets differentiating symptoms");
        } else {
            console.log("NOTE: Question may be generic");
        }
    } else {
        console.log("FAIL: No differentiator asked");
    }

    // ============ EXISTING TEST: Weighted Scoring ============
    console.log("\n--- TEST 7: Weighted Scoring (GERD vs Heart Attack) ---");
    const burningChest: UserSymptomData = {
        location: ["chest"],
        painType: "burning",
        additionalNotes: "Feels like fire inside."
    };

    const result7 = await diagnose(burningChest);
    const topId = result7.results[0]?.condition.id;
    if (topId === 'acid_reflux' || topId === 'shingles' || topId === 'amlapitta') {
        console.log(`PASS: Correctly identified burning chest pain (Top: ${result7.results[0]?.condition.name})`);
    } else {
        console.log(`WARN: Top result is ${result7.results[0]?.condition.name}`);
    }

    // ============ NEW TEST: Stroke Detection ============
    console.log("\n--- TEST 8: Stroke Detection ---");
    const strokeSymptoms: UserSymptomData = {
        location: ["face", "arm"],
        additionalNotes: "sudden face drooping and slurred speech"
    };

    const strokeAlerts = scanRedFlags(strokeSymptoms);
    const hasStrokeAlert = strokeAlerts.some(a => a.includes("STROKE"));

    if (hasStrokeAlert) {
        console.log("PASS: Stroke warning detected");
    } else {
        console.log("FAIL: Stroke not detected");
    }

    console.log("\n=== VERIFICATION COMPLETE ===");
}

runTests().catch(console.error);
