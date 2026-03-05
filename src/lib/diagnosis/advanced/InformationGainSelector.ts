/**
 * Information Gain Selector for Healio.AI
 * 
 * Uses MCMC posteriors (or Bayesian scores) to select the next best question
 * by maximizing expected information gain (entropy reduction).
 */

import { CONDITIONS } from '../conditions';

export interface CandidateCondition {
    conditionName: string;
    score: number; // Represents probability (0-100)
}

export interface QuestionData {
    symptomKey: string;
    type: 'symptom' | 'trigger' | 'type';
    question: string;
    options: string[];
}

export class InformationGainSelector {
    /**
     * Calculates the Shannon entropy of a probability distribution
     */
    private calculateEntropy(probabilities: number[]): number {
        let entropy = 0;
        for (const p of probabilities) {
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        }
        return entropy;
    }

    /**
     * Normalizes scores into a probability distribution summing to 1
     */
    private normalizeScores(candidates: CandidateCondition[]): number[] {
        const totalScore = candidates.reduce((sum, c) => sum + c.score, 0);
        if (totalScore === 0) {
            // Uniform distribution if all scores are 0
            return candidates.map(() => 1 / candidates.length);
        }
        return candidates.map(c => c.score / totalScore);
    }

    /**
     * Simulates the updated probability distribution if a feature is present/absent
     */
    private simulatePosterior(
        candidates: CandidateCondition[],
        featureLabel: string,
        featurePresent: boolean
    ): number[] {
        const simulatedScores = candidates.map(candidate => {
            const conditionDef = Object.values(CONDITIONS).find(c => c.name === candidate.conditionName);
            if (!conditionDef) return candidate.score;

            // Check if feature is associated with condition
            const hasFeature =
                conditionDef.matchCriteria.specialSymptoms?.includes(featureLabel) ||
                conditionDef.matchCriteria.locations?.includes(featureLabel) ||
                conditionDef.matchCriteria.types?.includes(featureLabel) ||
                conditionDef.matchCriteria.triggers?.includes(featureLabel);

            // Simple Bayesian update simulation:
            // P(Condition | Feature present) ~ P(Feature | Condition) * P(Condition)
            // If condition has feature, likelihood is high (e.g. 0.8), else low (e.g. 0.1)
            let likelihood = 0.5;
            if (featurePresent) {
                likelihood = hasFeature ? 0.8 : 0.1;
            } else {
                likelihood = hasFeature ? 0.2 : 0.9;
            }

            return candidate.score * likelihood;
        });

        // Normalize back to probabilities
        const total = simulatedScores.reduce((sum, s) => sum + s, 0);
        if (total === 0) return candidates.map(() => 1 / candidates.length);
        return simulatedScores.map(s => s / total);
    }

    /**
     * Gets all possible features (symptoms, triggers) from top candidates
     */
    private getCandidateFeatures(candidates: CandidateCondition[]): Set<{ label: string; type: 'symptom' | 'trigger' | 'type' }> {
        const features = new Set<{ label: string; type: 'symptom' | 'trigger' | 'type' }>();
        const seenLabels = new Set<string>();

        for (const candidate of candidates.slice(0, 5)) { // Look at top 5 candidates
            const conditionDef = Object.values(CONDITIONS).find(c => c.name === candidate.conditionName);
            if (!conditionDef) continue;

            conditionDef.matchCriteria.specialSymptoms?.forEach(s => {
                const label = s.toLowerCase();
                if (!seenLabels.has(label)) {
                    seenLabels.add(label);
                    features.add({ label: s, type: 'symptom' });
                }
            });

            conditionDef.matchCriteria.triggers?.forEach(t => {
                const label = t.toLowerCase();
                if (!seenLabels.has(label)) {
                    seenLabels.add(label);
                    features.add({ label: t, type: 'trigger' });
                }
            });

            conditionDef.matchCriteria.types?.forEach(t => {
                const label = t.toLowerCase();
                if (!seenLabels.has(label)) {
                    seenLabels.add(label);
                    features.add({ label: t, type: 'type' });
                }
            });
        }

        return features;
    }

    /**
     * Selects the question that maximizes information gain for the given Bayesian candidates.
     */
    public selectBestQuestion(
        candidates: CandidateCondition[],
        knownSymptoms: string[],
        excludedSymptoms: string[],
        language: 'en' | 'hi' | 'hinglish' = 'en'
    ): QuestionData | null {
        if (candidates.length < 2) return null; // No need to ask if only 1 confident candidate

        const currentProbs = this.normalizeScores(candidates);
        const currentEntropy = this.calculateEntropy(currentProbs);

        const allFeatures = this.getCandidateFeatures(candidates);
        const knownSet = new Set([...knownSymptoms, ...excludedSymptoms].map(s => s.toLowerCase()));

        let maxInfoGain = -1;
        let bestFeature: { label: string; type: 'symptom' | 'trigger' | 'type' } | null = null;

        // Roughly estimate P(Feature is present) dynamically across all conditions
        // A better approach would be user population priors, but we use uniform 0.5 for now
        const pPresent = 0.5;
        const pAbsent = 0.5;

        for (const feature of allFeatures) {
            if (knownSet.has(feature.label.toLowerCase())) continue;

            const probsIfPresent = this.simulatePosterior(candidates, feature.label, true);
            const probsIfAbsent = this.simulatePosterior(candidates, feature.label, false);

            const entropyIfPresent = this.calculateEntropy(probsIfPresent);
            const entropyIfAbsent = this.calculateEntropy(probsIfAbsent);

            // Expected entropy after asking the question
            const expectedEntropy = (pPresent * entropyIfPresent) + (pAbsent * entropyIfAbsent);

            // Information Gain = Current Entropy - Expected Entropy
            const infoGain = currentEntropy - expectedEntropy;

            if (infoGain > maxInfoGain) {
                maxInfoGain = infoGain;
                bestFeature = feature;
            }
        }

        if (!bestFeature) return null;

        // Generate the properly formatted question
        return this.formatQuestion(bestFeature, language);
    }

    private formatQuestion(
        feature: { label: string; type: 'symptom' | 'trigger' | 'type' },
        language: 'en' | 'hi' | 'hinglish'
    ): QuestionData {
        const readableFeature = feature.label.replace(/_/g, ' ');

        let question = '';
        if (language === 'hi') {
            if (feature.type === 'trigger') {
                question = `क्या "${readableFeature}" से समस्या बढ़ जाती है या शुरू होती है?`;
            } else if (feature.type === 'type') {
                question = `किस प्रकार का: ${readableFeature}?`;
            } else {
                question = `क्या आपको "${readableFeature}" का अनुभव हो रहा है?`;
            }
        } else if (language === 'hinglish') {
            if (feature.type === 'trigger') {
                question = `Kya "${readableFeature}" se problem badh jati hai ya start hoti hai?`;
            } else if (feature.type === 'type') {
                question = `Kis type ka: ${readableFeature}?`;
            } else {
                question = `Kya aapko "${readableFeature}" feel ho raha hai?`;
            }
        } else {
            if (feature.type === 'trigger') {
                question = `Does "${readableFeature}" trigger or worsen your symptoms?`;
            } else if (feature.type === 'type') {
                question = `Would you describe the type as: ${readableFeature}?`;
            } else {
                question = `Are you experiencing "${readableFeature}"?`;
            }
        }

        return {
            symptomKey: `${feature.type}:${feature.label}`,
            type: feature.type,
            question,
            options: language === 'hi' ? ['हाँ', 'नहीं'] : language === 'hinglish' ? ['Haan', 'Nahi'] : ['Yes', 'No']
        };
    }
}

// Export singleton
export const infoGainSelector = new InformationGainSelector();
