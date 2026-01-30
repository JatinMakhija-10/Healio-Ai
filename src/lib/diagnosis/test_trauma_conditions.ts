
import { diagnose } from "./engine";
import { UserSymptomData } from "./types";

/**
 * Test Script for Trauma Conditions (Fracture, Sprain, Muscle Strain)
 */

async function runTraumaTests() {
    console.log("=== STARTING TRAUMA CONDITIONS VERIFICATION ===\n");

    // TEST 1: Fracture with deformity
    console.log("--- TEST 1: Severe Fracture (Deformity + Fall) ---");
    const fractureSymptoms: UserSymptomData = {
        location: ["arm"],
        painType: "intense pain",
        triggers: "fell from height",
        additionalNotes: "My arm looks deformed and I can see something poking through the skin."
    } satisfies UserSymptomData;

    const result1 = await diagnose(fractureSymptoms);
    console.log(`Top Diagnosis: ${result1.results[0]?.condition.name} (${result1.results[0]?.confidence.toFixed(1)}%)`);
    if (result1.results[0]?.condition.id === 'fracture') {
        console.log("PASS: Correctly identified Fracture.");
    } else {
        console.log("FAIL: Did not identify Fracture as top result.");
    }
    if (result1.alerts && result1.alerts.length > 0) {
        console.log(`PASS: Found Alerts: ${JSON.stringify(result1.alerts)}`);
    } else {
        console.log("FAIL: No alerts generated for severe fracture.");
    }

    // TEST 2: Muscle Strain (Weightlifting)
    console.log("\n--- TEST 2: Muscle Strain (Gym/Overuse) ---");
    const strainSymptoms: UserSymptomData = {
        location: ["lower back"],
        painType: "aching",
        triggers: "lifting heavy weights at the gym",
        additionalNotes: "I have muscle spasms and it feels very stiff."
    } satisfies UserSymptomData;

    const result2 = await diagnose(strainSymptoms);
    console.log(`Top Diagnosis: ${result2.results[0]?.condition.name} (${result2.results[0]?.confidence.toFixed(1)}%)`);
    if (result2.results[0]?.condition.id === 'muscle_strain') {
        console.log("PASS: Correctly identified Muscle Strain.");
    } else {
        console.log(`FAIL: Top result was ${result2.results[0]?.condition.id}.`);
    }

    // TEST 3: Sprain (Ankle Twist)
    console.log("\n--- TEST 3: Ankle Sprain (Twisted + Popping) ---");
    const sprainSymptoms: UserSymptomData = {
        location: ["ankle"],
        painType: "sharp",
        triggers: "twisted it while running",
        additionalNotes: "I heard a popping sound at injury and it is very bruised."
    } satisfies UserSymptomData;

    const result3 = await diagnose(sprainSymptoms);
    console.log(`Top Diagnosis: ${result3.results[0]?.condition.name} (${result3.results[0]?.confidence.toFixed(1)}%)`);
    if (result3.results[0]?.condition.id === 'sprain') {
        console.log("PASS: Correctly identified Sprain.");
    } else {
        console.log(`FAIL: Top result was ${result3.results[0]?.condition.id}.`);
    }

    console.log("\n=== TRAUMA VERIFICATION COMPLETE ===");
}

runTraumaTests().catch(console.error);
