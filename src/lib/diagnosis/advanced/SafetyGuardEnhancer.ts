/**
 * SafetyGuardEnhancer — v1 (Goals 5, 12, 14)
 *
 *   5.  Rare Disease Escalation — integrated from ClinicalKnowledgeBase
 *  12.  Conservative Medical Safety — enhanced safety guards
 *  14.  Advanced Diagnostic Behaviors — complex diagnostic patterns
 *
 * The most safety-critical module in the intelligence layer.
 * Merges signals from all other modules into a unified safety assessment.
 *
 * AUGMENTS existing red-flag scanning — does NOT replace it.
 */

import type {
    SafetyAssessment,
    SafetyAlert,
    RareDiseaseAlert,
    IntelligenceContext,
    MedicationReasoningResult,
    CrossSystemCorrelation,
    LongitudinalInsight,
    DynamicConfidenceResult,
} from './intelligenceTypes';

// ═══════════════════════════════════════════════════════════════════════════════
// AGE-SPECIFIC SAFETY RULES
// Conditions that require different handling at age extremes
// ═══════════════════════════════════════════════════════════════════════════════

interface AgeSafetyRule {
    ageRange: [number, number];
    symptomTriggers: string[];
    minTriggerCount: number;
    alert: SafetyAlert;
}

const AGE_SAFETY_RULES: AgeSafetyRule[] = [
    // ── PEDIATRIC (<5 years) ────────────────────────────────────────────────
    {
        ageRange: [0, 5],
        symptomTriggers: ['fever', 'lethargy', 'poor_feeding', 'irritability'],
        minTriggerCount: 2,
        alert: {
            type: 'age_risk',
            severity: 'critical',
            message: "Infant/toddler with fever + lethargy: serious bacterial infection must be ruled out",
            recommendation: "Urgent pediatric evaluation recommended — young children decompensate rapidly",
        },
    },
    {
        ageRange: [0, 5],
        symptomTriggers: ['fever', 'rash', 'irritability', 'conjunctivitis'],
        minTriggerCount: 3,
        alert: {
            type: 'age_risk',
            severity: 'critical',
            message: "Young child with fever + rash + irritability: Kawasaki disease must be considered",
            recommendation: "Pediatric cardiology evaluation within 10 days of fever onset to prevent coronary aneurysms",
        },
    },

    // ── ELDERLY (>70 years) ─────────────────────────────────────────────────
    {
        ageRange: [70, 120],
        symptomTriggers: ['confusion', 'fatigue', 'weakness'],
        minTriggerCount: 2,
        alert: {
            type: 'age_risk',
            severity: 'warning',
            message: "Elderly patient with confusion: UTI, medication toxicity, and metabolic causes must be excluded",
            recommendation: "Check urinalysis, metabolic panel, medication list review, and ECG before assuming benign cause",
        },
    },
    {
        ageRange: [70, 120],
        symptomTriggers: ['abdominal_pain', 'fever'],
        minTriggerCount: 2,
        alert: {
            type: 'age_risk',
            severity: 'warning',
            message: "Elderly patient with abdominal pain + fever: surgical emergencies present atypically in the elderly",
            recommendation: "Low threshold for imaging — elderly patients may not mount normal inflammatory response",
        },
    },
    {
        ageRange: [65, 120],
        symptomTriggers: ['fall', 'dizziness', 'syncope'],
        minTriggerCount: 1,
        alert: {
            type: 'age_risk',
            severity: 'warning',
            message: "Elderly fall risk: consider cardiac syncope, orthostatic hypotension, medication effects",
            recommendation: "ECG, orthostatic vitals, medication review, and bone density assessment recommended",
        },
    },

    // ── REPRODUCTIVE AGE FEMALE (15-50) ─────────────────────────────────────
    {
        ageRange: [15, 50],
        symptomTriggers: ['abdominal_pain', 'pelvic_pain', 'vaginal_bleeding'],
        minTriggerCount: 2,
        alert: {
            type: 'age_risk',
            severity: 'critical',
            message: "Reproductive-age female with abdominal/pelvic pain: ectopic pregnancy must be excluded",
            recommendation: "Urine β-hCG MUST be checked regardless of reported contraception or last menstrual period",
        },
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SYMPTOM COMBINATION RED FLAGS (Goal 12)
// Dangerous symptom combinations that require immediate attention
// ═══════════════════════════════════════════════════════════════════════════════

interface SymptomCombinationRule {
    symptoms: string[];
    minMatch: number;
    alert: SafetyAlert;
    forceSeekHelp: boolean;
}

const SYMPTOM_COMBINATION_RULES: SymptomCombinationRule[] = [
    {
        symptoms: ['chest_pain', 'shortness_of_breath', 'sweating', 'nausea'],
        minMatch: 3,
        alert: {
            type: 'symptom_combination',
            severity: 'critical',
            message: "Chest pain + dyspnea + diaphoresis: acute coronary syndrome pattern",
            recommendation: "Call emergency services immediately. Chew aspirin 325mg if not allergic",
        },
        forceSeekHelp: true,
    },
    {
        symptoms: ['sudden_headache', 'worst_headache', 'neck_stiffness', 'vomiting'],
        minMatch: 2,
        alert: {
            type: 'symptom_combination',
            severity: 'critical',
            message: "Thunderclap headache + neck stiffness: subarachnoid hemorrhage pattern",
            recommendation: "Emergency room immediately — CT head within 6 hours of onset",
        },
        forceSeekHelp: true,
    },
    {
        symptoms: ['face_drooping', 'arm_weakness', 'slurred_speech'],
        minMatch: 2,
        alert: {
            type: 'symptom_combination',
            severity: 'critical',
            message: "FAST positive: Face drooping + Arm weakness + Speech difficulty = Stroke",
            recommendation: "Call emergency services immediately — tPA window is 4.5 hours",
        },
        forceSeekHelp: true,
    },
    {
        symptoms: ['fever', 'neck_stiffness', 'headache', 'photophobia', 'rash'],
        minMatch: 3,
        alert: {
            type: 'symptom_combination',
            severity: 'critical',
            message: "Meningitis triad: fever + headache + neck stiffness",
            recommendation: "Emergency evaluation immediately — delay in antibiotics increases mortality",
        },
        forceSeekHelp: true,
    },
    {
        symptoms: ['urticaria', 'angioedema', 'difficulty_breathing', 'hypotension'],
        minMatch: 2,
        alert: {
            type: 'symptom_combination',
            severity: 'critical',
            message: "Anaphylaxis pattern: urticaria/angioedema + breathing difficulty/hypotension",
            recommendation: "Administer epinephrine (EpiPen) immediately. Call emergency services",
        },
        forceSeekHelp: true,
    },
    {
        symptoms: ['saddle_anesthesia', 'urinary_retention', 'bilateral_leg_weakness'],
        minMatch: 2,
        alert: {
            type: 'symptom_combination',
            severity: 'critical',
            message: "Cauda equina syndrome: saddle anesthesia + urinary/bowel dysfunction",
            recommendation: "Surgical emergency — decompression within 48 hours to prevent permanent paralysis",
        },
        forceSeekHelp: true,
    },
    {
        symptoms: ['severe_abdominal_pain', 'board_like_rigidity', 'rebound_tenderness'],
        minMatch: 2,
        alert: {
            type: 'symptom_combination',
            severity: 'critical',
            message: "Peritonitis pattern: severe pain + rigidity + rebound tenderness",
            recommendation: "Surgical emergency — immediate evaluation for perforated viscus",
        },
        forceSeekHelp: true,
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCED DIAGNOSTIC BEHAVIORS (Goal 14)
// Complex patterns that require special handling
// ═══════════════════════════════════════════════════════════════════════════════

interface AdvancedBehavior {
    id: string;
    name: string;
    condition: (ctx: IntelligenceContext) => boolean;
    alerts: string[];
    forceSeekHelp: boolean;
}

const ADVANCED_BEHAVIORS: AdvancedBehavior[] = [
    {
        id: "undifferentiated_multi_system",
        name: "Undifferentiated Multi-System Complaint",
        condition: (ctx) => {
            const topScore = ctx.bayesianCandidates[0]?.score || 0;
            return topScore < 40 && ctx.symptomList.length >= 5;
        },
        alerts: [
            "ℹ️ Complex presentation with low diagnostic certainty across multiple symptoms — comprehensive medical evaluation recommended",
        ],
        forceSeekHelp: true,
    },
    {
        id: "recurrent_er_presentation",
        name: "Symptom Pattern Suggesting Recurrent Presentation",
        condition: (ctx) => {
            // Multiple sessions with same unresolved symptoms
            return (ctx.previousSessions?.length || 0) >= 3;
        },
        alerts: [
            "⚠️ Persistent symptoms across multiple consultations — consider referral to specialist for definitive workup",
        ],
        forceSeekHelp: true,
    },
    {
        id: "constitutional_symptoms_cluster",
        name: "Constitutional Symptom Cluster",
        condition: (ctx) => {
            const constitutional = ['fatigue', 'weight_loss', 'night_sweats', 'fever', 'loss_of_appetite'];
            const matches = constitutional.filter(s =>
                ctx.symptomList.some(us => us.toLowerCase().includes(s))
            );
            return matches.length >= 3;
        },
        alerts: [
            "⚠️ Constitutional symptom cluster (fatigue + weight loss + night sweats/fever): consider malignancy, TB, HIV, lymphoma, autoimmune workup",
        ],
        forceSeekHelp: true,
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SAFETY GUARD ENHANCER
// ═══════════════════════════════════════════════════════════════════════════════

export class SafetyGuardEnhancer {

    /**
     * Generate comprehensive safety assessment by merging all safety signals.
     */
    assess(
        ctx: IntelligenceContext,
        rareDiseaseAlerts: RareDiseaseAlert[],
        medicationResult?: MedicationReasoningResult,
        crossSystemResult?: CrossSystemCorrelation | null,
        longitudinalResult?: LongitudinalInsight | null,
        confidenceResult?: DynamicConfidenceResult,
    ): SafetyAssessment {
        const alerts: SafetyAlert[] = [];
        let forceSeekHelp = false;
        let seekHelpReason: string | undefined;
        const mergedRedFlags: string[] = [...ctx.existingAlerts];

        // 1. Existing posterior red flags
        for (const candidate of ctx.bayesianCandidates) {
            if (candidate.posteriorRedFlags.length > 0) {
                mergedRedFlags.push(...candidate.posteriorRedFlags);
                forceSeekHelp = true;
                seekHelpReason = candidate.posteriorRedFlags[0];
            }
        }

        // 2. Age-specific safety rules
        const age = ctx.symptoms.userProfile?.age ? parseInt(ctx.symptoms.userProfile.age) : null;
        const gender = ctx.symptoms.userProfile?.gender?.toLowerCase() || null;

        if (age !== null) {
            for (const rule of AGE_SAFETY_RULES) {
                if (age >= rule.ageRange[0] && age <= rule.ageRange[1]) {
                    // Gender filter for reproductive age
                    if (rule.alert.message.includes('Reproductive-age female') &&
                        gender && !['female', 'f'].includes(gender)) {
                        continue;
                    }

                    const matched = rule.symptomTriggers.filter(s =>
                        ctx.symptomList.some(us => us.toLowerCase().includes(s))
                    );
                    if (matched.length >= rule.minTriggerCount) {
                        alerts.push(rule.alert);
                        if (rule.alert.severity === 'critical') {
                            forceSeekHelp = true;
                            seekHelpReason = seekHelpReason || rule.alert.message;
                        }
                    }
                }
            }
        }

        // 3. Symptom combination red flags
        const normalizedSymptoms = ctx.symptomList.map(s => s.toLowerCase());
        for (const rule of SYMPTOM_COMBINATION_RULES) {
            const matched = rule.symptoms.filter(s =>
                normalizedSymptoms.some(us => us.includes(s))
            );
            if (matched.length >= rule.minMatch) {
                alerts.push(rule.alert);
                if (rule.forceSeekHelp) {
                    forceSeekHelp = true;
                    seekHelpReason = seekHelpReason || rule.alert.message;
                }
                mergedRedFlags.push(rule.alert.message);
            }
        }

        // 4. Rare disease escalation
        for (const rare of rareDiseaseAlerts) {
            alerts.push({
                type: 'rare_disease',
                severity: rare.urgency === 'emergency' ? 'critical' : 'warning',
                message: `Possible ${rare.conditionName} (matched: ${rare.matchedSymptoms.join(', ')})`,
                recommendation: `Refer to ${rare.specialistReferral}: ${rare.rationale}`,
            });
            if (rare.urgency === 'emergency' || rare.urgency === 'urgent_referral') {
                forceSeekHelp = true;
                seekHelpReason = seekHelpReason || `Possible ${rare.conditionName} requires specialist evaluation`;
            }
        }

        // 5. Medication safety alerts
        if (medicationResult) {
            for (const se of medicationResult.potentialSideEffects) {
                if (se.attributableFraction >= 0.20) {
                    alerts.push({
                        type: 'medication_risk',
                        severity: 'warning',
                        message: `${se.symptom.replace(/_/g, ' ')} may be caused by ${se.medication}`,
                        recommendation: se.recommendation,
                    });
                }
            }
            for (const masking of medicationResult.maskingAlerts) {
                if (masking.effect === 'masks') {
                    alerts.push({
                        type: 'medication_risk',
                        severity: 'warning',
                        message: `${masking.medication} may be masking signs of ${masking.conditionId.replace(/_/g, ' ')}`,
                        recommendation: masking.explanation,
                    });
                }
            }
        }

        // 6. Multi-system involvement
        if (crossSystemResult && crossSystemResult.multiSystemConditions.length >= 2) {
            alerts.push({
                type: 'multi_system',
                severity: 'warning',
                message: `Symptoms span ${crossSystemResult.secondarySystems.length + 1} body systems — multi-organ pathology possible`,
                recommendation: "Comprehensive medical evaluation recommended to assess systemic conditions",
            });
        }

        // 7. Longitudinal progression alerts
        if (longitudinalResult) {
            for (const alert of longitudinalResult.temporalAlerts) {
                alerts.push({
                    type: 'progression_risk',
                    severity: 'warning',
                    message: alert,
                    recommendation: "Follow up with healthcare provider regarding persistent symptoms",
                });
            }
            if (longitudinalResult.progressionPattern === 'worsening') {
                forceSeekHelp = true;
                seekHelpReason = seekHelpReason || "Symptoms are progressively worsening across sessions";
            }
        }

        // 8. Low confidence + severe condition → safety escalation
        if (confidenceResult && confidenceResult.grade === 'very_low') {
            alerts.push({
                type: 'symptom_combination',
                severity: 'warning',
                message: "Very low diagnostic confidence — symptom picture does not clearly match known conditions",
                recommendation: "Professional medical evaluation strongly recommended for proper diagnosis",
            });
            forceSeekHelp = true;
            seekHelpReason = seekHelpReason || "Diagnostic confidence is too low for safe self-management";
        }

        // 9. Advanced diagnostic behaviors
        for (const behavior of ADVANCED_BEHAVIORS) {
            try {
                if (behavior.condition(ctx)) {
                    for (const alertMsg of behavior.alerts) {
                        alerts.push({
                            type: 'symptom_combination',
                            severity: 'warning',
                            message: alertMsg,
                            recommendation: "See a healthcare provider for comprehensive evaluation",
                        });
                        mergedRedFlags.push(alertMsg);
                    }
                    if (behavior.forceSeekHelp) {
                        forceSeekHelp = true;
                        seekHelpReason = seekHelpReason || behavior.alerts[0];
                    }
                }
            } catch {
                // Safety: never let a behavior rule crash the safety layer
            }
        }

        // Determine overall safety level
        const safetyLevel = this.determineSafetyLevel(alerts, forceSeekHelp);

        // Map to plan's L1-L5 escalation ladder (plan ref: Part II §3.5 + Part IV §4.10)
        const SAFETY_TO_ESCALATION: Record<SafetyAssessment['safetyLevel'], SafetyAssessment['escalationLevel']> = {
            safe:      'L1',
            caution:   'L2',
            warning:   'L3',
            danger:    'L4',
            emergency: 'L5',
        };

        return {
            safetyLevel,
            alerts,
            forceSeekHelp,
            seekHelpReason,
            mergedRedFlags: [...new Set(mergedRedFlags)], // Deduplicate
            escalationLevel: SAFETY_TO_ESCALATION[safetyLevel],
        };
    }

    private determineSafetyLevel(alerts: SafetyAlert[], forceSeekHelp: boolean): SafetyAssessment['safetyLevel'] {
        const hasCritical = alerts.some(a => a.severity === 'critical');
        const warningCount = alerts.filter(a => a.severity === 'warning').length;

        if (hasCritical) return 'emergency';
        if (forceSeekHelp || warningCount >= 3) return 'danger';
        if (warningCount >= 2) return 'warning';
        if (warningCount >= 1) return 'caution';
        return 'safe';
    }
}

export const safetyGuardEnhancer = new SafetyGuardEnhancer();
