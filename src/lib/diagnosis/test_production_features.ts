
import { diagnose } from './engine';
import { symptomCorrelationDetector } from './advanced/SymptomCorrelations';
import { clinicalRules } from './advanced/ClinicalDecisionRules';
import { uncertaintyQuantifier } from './advanced/UncertaintyQuantification';
import { UserSymptomData } from './types';

async function testProductionFeatures() {
    console.log("=== TESTING PRODUCTION FEATURES ===");

    // TEST 1: Symptom Correlation Detection
    console.log("\n--- TEST 1: Symptom Correlation (Bacterial Pneumonia) ---");
    const pneumoniaSymptoms: UserSymptomData = {
        location: ['chest'],
        painType: 'sharp',
        additionalNotes: 'fever high productive cough',
        duration: '3 days',
        userProfile: { age: '45' }
    };

    const diagnosis1 = await diagnose(pneumoniaSymptoms);

    // Check for pattern detection in reasoning trace
    const topResult = diagnosis1.results[0];
    const patternTrace = topResult.reasoningTrace?.find(t => t.type === 'pattern');

    if (patternTrace) {
        console.log("✅ PASSED: Detected Symptom Pattern");
        console.log(`   Pattern: ${patternTrace.factor}`);
        console.log(`   Impact: +${patternTrace.impact.toFixed(2)} log-odds`);
    } else {
        console.log("❌ FAILED: Did not detect pneumonia pattern");
        console.log("   Trace types found:", topResult.reasoningTrace?.map(t => t.type));
    }

    // TEST 2: Clinical Decision Rules (Wells Score for DVT)
    console.log("\n--- TEST 2: Clinical Decision Rules (Wells DVT) ---");
    const dvtSymptoms: UserSymptomData = {
        location: ['leg'],
        painType: 'swelling',
        additionalNotes: 'calf tenderness bedridden recently cancer',
        duration: '2 days',
        userProfile: { age: '60' }
    };

    const diagnosis2 = await diagnose(dvtSymptoms);

    // Check if clinical rules were returned
    const wellsResult = diagnosis2.clinicalRules?.find(r => r.rule.includes('Wells'));

    if (wellsResult) {
        console.log("✅ PASSED: Calculated Clinical Rule");
        console.log(`   Rule: ${wellsResult.rule}`);
        console.log(`   Score: ${wellsResult.score}`);
        console.log(`   Recommendation: ${wellsResult.recommendation}`);

        // Additional Points Check
        if (wellsResult.score >= 2) {
            console.log("   ✅ Score calculation seems correct (High risk)");
        } else {
            console.log(`   ⚠️ Score ${wellsResult.score} seems low for cancer+bedridden+tenderness`);
        }
    } else {
        console.log("❌ FAILED: Did not return Wells Score result");
    }

    // TEST 3: Uncertainty Quantification
    console.log("\n--- TEST 3: Uncertainty Quantification ---");

    // Use the pneumonia result which likely has high confidence
    if (diagnosis1.uncertainty) {
        console.log("✅ PASSED: Generated Uncertainty Estimate");
        console.log(`   Point Estimate: ${diagnosis1.uncertainty.pointEstimate.toFixed(1)}%`);
        console.log(`   Confidence Interval: ${diagnosis1.uncertainty.confidenceInterval.lower.toFixed(1)}% - ${diagnosis1.uncertainty.confidenceInterval.upper.toFixed(1)}%`);
        console.log(`   Quality: ${diagnosis1.uncertainty.calibrationQuality}`);
        console.log(`   Explanation: ${diagnosis1.uncertainty.explanation}`);
    } else {
        console.log("❌ FAILED: Did not generate uncertainty estimate");
    }

    // TEST 4: Clinical Rule Alerts
    console.log("\n--- TEST 4: Clinical Rule Alerts ---");
    // DVT should trigger an alert because DVT is dangerous
    const hasDvtAlert = diagnosis2.alerts?.some(a => a.includes('DVT') || a.includes('Wells'));

    if (hasDvtAlert) {
        console.log("✅ PASSED: Clinical Rule triggered Alert");
        console.log(`   Alert: ${diagnosis2.alerts?.find(a => a.includes('DVT') || a.includes('Wells'))}`);
    } else {
        console.log("❌ FAILED: No alert generated for high-risk DVT");
        console.log("   Alerts found:", diagnosis2.alerts);
    }
}

testProductionFeatures().catch(console.error);
