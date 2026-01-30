export type Severity = 'mild' | 'moderate' | 'severe' | 'mild-moderate' | 'moderate-severe' | 'benign' | 'chronic' | 'critical';

export interface Remedy {
    name: string;
    description: string;
    ingredients: string[];
    method: string;
    videoUrl?: string | null;
    videoTitle?: string | null;
}

export interface Exercise {
    name: string;
    description: string;
    duration: string;
    frequency: string;
    videoUrl?: string | null;
    videoTitle?: string | null;
}

// Circular dependency avoidance: Define minimal interface here if needed, 
// or move shared types to a common file. 
// For now, let's define it here to fix the valid error.
export interface UncertaintyEstimate {
    pointEstimate: number;
    confidenceInterval: {
        lower: number;
        upper: number;
        width: number;
    };
    calibrationQuality: 'excellent' | 'good' | 'moderate' | 'poor';
    evidenceQuality: 'strong' | 'moderate' | 'weak';
    explanation: string;
    shouldRequestMoreInfo: boolean;
}

export interface MatchCriteria {
    locations: string[];
    types?: string[];
    triggers?: string[];
    frequency?: string[];
    intensity?: number[];
    durationHint?: 'acute' | 'chronic' | 'any';
    specialSymptoms?: string[]; // Significant keywords (numbness, tingling)
    absentSymptoms?: string[];  // Symptoms that SHOULD NOT be present (negative likelihoods)
    onset?: 'sudden' | 'gradual' | 'episodic'; // Temporal: how it started
    progression?: 'worsening' | 'stable' | 'fluctuating' | 'improving'; // Temporal: how it evolves
    symptomWeights?: Record<string, {
        sensitivity?: number; // 0-1: Probability user has this IF they have the condition. High = present in most cases. Missing it penalizes.
        specificity?: number; // 0-1: Probability user does NOT have this if they DON'T have condition. High = characteristic. Present boosts.
        weight?: number;      // Manual override multiplier (default 1.0)
    }>;
}

export type Prevalence = 'very_common' | 'common' | 'uncommon' | 'rare' | 'very_rare';

export interface Condition {
    id: string;
    name: string;
    description: string;
    matchCriteria: MatchCriteria;
    severity: Severity;
    prevalence?: Prevalence; // Prior probability: very_common (high prior) vs rare (low prior)
    redFlags?: string[]; // Urgent symptoms requiring immediate triage (e.g. "chest pain + sweating")
    mandatorySymptoms?: string[]; // Must be present to consider this condition (hard constraint)
    mimics?: string[]; // Condition IDs that commonly mimic this one (force extra differentiation)
    remedies: Remedy[];
    indianHomeRemedies: Remedy[];
    exercises: Exercise[];
    warnings: string[];
    seekHelp: string;
}

// Health Risk Profile - calculated from onboarding data
export interface HealthRiskProfile {
    bmi: {
        value: number;
        category: string;
        interpretation: string;
        ayurvedicInsight: string;
    };
    cardiovascularRisk: {
        score: number;
        level: 'low' | 'moderate' | 'high' | 'very_high';
        factors: string[];
        recommendations: string[];
    };
    diabetesRisk: {
        score: number;
        level: 'low' | 'moderate' | 'high' | 'very_high';
        factors: string[];
        recommendations: string[];
    };
    respiratoryRisk: {
        score: number;
        level: 'low' | 'moderate' | 'high' | 'very_high';
        factors: string[];
        recommendations: string[];
    };
    liverRisk: {
        score: number;
        level: 'low' | 'moderate' | 'high' | 'very_high';
        factors: string[];
        recommendations: string[];
    };
    lifestyleScore: {
        score: number;
        rating: string;
        breakdown: {
            exercise: number;
            diet: number;
            sleep: number;
            habits: number;
        };
        ayurvedicBalance: string;
    };
    overallHealthScore: number;
    priorityWarnings: string[];
}

// Ayurvedic Constitution Profile
export interface AyurvedicProfile {
    prakriti: string;
    primaryDosha: 'vata' | 'pitta' | 'kapha';
    secondaryDosha: 'vata' | 'pitta' | 'kapha' | null;
    doshicTendencies: {
        vata: number;
        pitta: number;
        kapha: number;
    };
    characteristics: string[];
    strengths: string[];
    vulnerabilities: string[];
    dietaryRecommendations: string[];
    lifestyleRecommendations: string[];
    balancingHerbs: string[];
    balancingPractices: string[];
}

export interface UserSymptomData {
    location: string[];
    painType?: string;
    triggers?: string;
    duration?: string;
    frequency?: string;
    intensity?: number;
    additionalNotes?: string;
    excludedSymptoms?: string[]; // Track negative answers
    userProfile?: {
        age?: string;
        gender?: string;
        weight?: string;
        height?: string;
        conditions?: string[];
        allergies?: string;
        smoking?: string;
        alcohol?: string;
        exercise?: string;
        diet?: string;
        sleepHours?: string;
        bloodPressure?: string;
        medications?: string;
        pregnant?: boolean;
        recentSurgery?: boolean;
        familyHistory?: string[];
        occupation?: string;
        // Computed profiles
        healthRiskProfile?: HealthRiskProfile;
        ayurvedicProfile?: AyurvedicProfile;
    };
}

// Reasoning trace entry for explainability
export interface ReasoningTraceEntry {
    factor: string;       // e.g., "symptom: chest pain", "absent: no fever"
    impact: number;       // Positive = supports, Negative = against
    type: 'symptom' | 'absent' | 'trigger' | 'location' | 'temporal' | 'profile' | 'prior' | 'pattern';
}

export interface DiagnosisResult {
    condition: Condition;
    confidence: number;
    matchedKeywords: string[];
    reasoningTrace?: ReasoningTraceEntry[]; // Explainability: why this diagnosis
    uncertainty?: UncertaintyEstimate; // Confidence interval & quality metrics
    uncertaintyFlag?: boolean; // True if multiple conditions remain plausible
}

export interface ClarificationQuestion {
    type: 'clarification' | 'multi_choice';
    question: string;
    options: string[];
    symptomKey?: string; // The specific symptom/trigger being asked about
    relatedConditions: string[]; // IDs of conditions this question helps differentiate
    multiSelectTokens?: string[]; // For multi_choice, the raw tokens corresponding to options 0..N
}

// Database Model (matches Supabase 'conditions' table)
export interface DatabaseCondition {
    id: string; // UUID
    code?: string;
    name: string;
    description?: string;
    match_criteria: MatchCriteria; // JSONB
    prevalence?: Prevalence;
    severity?: Severity;
    red_flags?: string[];
    mandatory_symptoms?: string[];
    mimics?: string[];
    remedies?: Remedy[]; // JSONB
    indian_home_remedies?: Remedy[]; // JSONB
    exercises?: Exercise[]; // JSONB
    warnings?: string[];
    seek_help?: string;
    embedding?: number[]; // Vector
    created_at?: string;
}
