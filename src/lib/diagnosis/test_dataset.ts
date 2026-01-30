
import { diagnose } from './engine';
import { UserSymptomData } from './types';

async function runTest(name: string, symptoms: UserSymptomData, expectedId: string, expectedRedFlag?: boolean) {
    console.log(`\n--- Test: ${name} ---`);
    console.log(`Input: ${JSON.stringify(symptoms)}`);
    try {
        const result = await diagnose(symptoms);

        const topMatch = result.results[0];
        const redFlags = result.alerts || [];

        console.log(`Top Match: ${topMatch?.condition.name} (Conf: ${topMatch?.confidence.toFixed(1)}%)`);
        if (redFlags.length > 0) console.log(`Red Flags Triggered: ${JSON.stringify(redFlags)}`);

        let passed = true;
        if (topMatch?.condition.id !== expectedId) {
            console.error(`❌ FAILED: Expected ${expectedId}, got ${topMatch?.condition.id}`);
            passed = false;
        }
        if (expectedRedFlag && redFlags.length === 0) {
            console.error(`❌ FAILED: Expected Red Flag trigger, but got none.`);
            passed = false;
        }

        if (passed) console.log(`✅ PASSED`);
    } catch (error) {
        console.error(`❌ CRITICAL ERROR in test ${name}:`, error);
    }
}

async function runAllTests() {
    // 1. Critical Red Flag: Heart Attack
    await runTest("Heart Attack Detection", {
        location: ['chest', 'arm'],
        painType: 'crushing',
        triggers: 'exertion',
        additionalNotes: 'sweating, feeling of doom'
    }, 'heart_attack', true);

    // 2. Critical Red Flag: Appendicitis
    await runTest("Appendicitis Detection", {
        location: ['lower right abdomen'],
        painType: 'severe sharp',
        triggers: '',
        additionalNotes: 'pain moved from navel, rebound tenderness, fever'
    }, 'appendicitis', true);

    // 3. Common: IBS
    await runTest("IBS Detection", {
        location: ['stomach'],
        painType: 'cramping',
        triggers: 'stress, food',
        additionalNotes: 'alternating diarrhea and constipation, relief after stool'
    }, 'ibs');

    // 4. Common: Vertigo (BPPV)
    await runTest("Vertigo Detection", {
        location: ['head'],
        painType: 'dizzy',
        triggers: 'turning head in bed',
        additionalNotes: 'room is spinning, nausea'
    }, 'vertigo');

    // 5. Common: Cervical Spondylosis
    await runTest("Cervical Spon Detection", {
        location: ['neck', 'arm'],
        painType: 'stiff aching',
        triggers: 'computer work',
        additionalNotes: 'numbness in fingers, radiating pain'
    }, 'cervical_spondylosis');

    // 6. Common: Plantar Fasciitis
    await runTest("Plantar Fasciitis Detection", {
        location: ['heel', 'foot'],
        painType: 'sharp stabbing',
        triggers: 'morning first step',
        additionalNotes: 'pain reduces after walking a bit'
    }, 'plantar_fasciitis');

    // 7. Thyroid: Hypothyroidism (Common vs Hyper)
    await runTest("Hypothyroid Detection", {
        location: ['body'],
        painType: 'fatigue',
        triggers: '',
        additionalNotes: 'weight gain, feeling cold, losing hair'
    }, 'hypothyroidism');
}

runAllTests();
