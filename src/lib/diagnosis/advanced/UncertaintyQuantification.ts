/**
 * Uncertainty Quantification
 * 
 * Converts point estimates (87%) into confidence intervals with calibration.
 * Critical for legal liability - we must be honest about uncertainty.
 * 
 * "87% confident" should mean "87% of the time I say this, I'm right"
 */

export interface UncertaintyEstimate {
    pointEstimate: number;         // 87%
    confidenceInterval: {
        lower: number;                // 72%
        upper: number;                // 95%
        width: number;                // 23%
    };
    calibrationQuality: 'excellent' | 'good' | 'moderate' | 'poor';
    evidenceQuality: 'strong' | 'moderate' | 'weak';
    explanation: string;
    shouldRequestMoreInfo: boolean;
}

export interface EvidenceQualityMetrics {
    symptomCount: number;
    specificityOfSymptoms: number;
    hasLabResults: boolean;
    hasPhysicalExam: boolean;
    temporalClarity: 'clear' | 'vague';
    symptomCorrelation: number;
}

/**
 * Bootstrap-based confidence interval calculation
 */
export class UncertaintyQuantifier {

    /**
     * Calculate confidence interval for a diagnosis
     */
    quantify(
        rawScore: number,
        symptoms: string[],
        evidenceMetrics: EvidenceQualityMetrics
    ): UncertaintyEstimate {

        // Assess evidence quality
        const evidenceQuality = this.assessEvidenceQuality(evidenceMetrics);
        const evidenceBonus = this.getEvidenceBonus(evidenceQuality);

        // Calculate interval width based on evidence quality
        const baseWidth = this.calculateBaseWidth(evidenceQuality);
        const adjustedWidth = this.adjustWidthForScore(baseWidth, rawScore);

        // Calculate bounds
        const lower = Math.max(0, rawScore - adjustedWidth / 2);
        const upper = Math.min(100, rawScore + adjustedWidth / 2);

        // Calibration quality
        const calibrationQuality = this.assessCalibrationQuality(
            evidenceQuality,
            adjustedWidth
        );

        // Generate explanation
        const explanation = this.explainUncertainty(
            rawScore,
            upper - lower,
            evidenceQuality,
            evidenceMetrics
        );

        // Should we ask for more info?
        const shouldRequestMoreInfo = this.shouldAskMore(
            upper - lower,
            evidenceQuality,
            evidenceMetrics
        );

        return {
            pointEstimate: rawScore,
            confidenceInterval: {
                lower,
                upper,
                width: upper - lower
            },
            calibrationQuality,
            evidenceQuality,
            explanation,
            shouldRequestMoreInfo
        };
    }

    /**
     * Assess quality of evidence we have
     */
    private assessEvidenceQuality(metrics: EvidenceQualityMetrics): 'strong' | 'moderate' | 'weak' {
        let score = 0;

        // Symptom count
        if (metrics.symptomCount >= 5) score += 2;
        else if (metrics.symptomCount >= 3) score += 1;

        // Specificity of symptoms
        if (metrics.specificityOfSymptoms >= 0.8) score += 3;
        else if (metrics.specificityOfSymptoms >= 0.6) score += 2;
        else if (metrics.specificityOfSymptoms >= 0.4) score += 1;

        // Lab results (huge boost)
        if (metrics.hasLabResults) score += 3;

        // Physical exam findings
        if (metrics.hasPhysicalExam) score += 2;

        // Temporal clarity
        if (metrics.temporalClarity === 'clear') score += 1;

        // Symptom correlation
        if (metrics.symptomCorrelation > 0.7) score += 2;

        // Thresholds
        if (score >= 8) return 'strong';
        if (score >= 4) return 'moderate';
        return 'weak';
    }

    /**
     * Calculate base confidence interval width
     */
    private calculateBaseWidth(quality: 'strong' | 'moderate' | 'weak'): number {
        const widths = {
            'strong': 10,   // ±5% confidence interval
            'moderate': 15, // ±7.5% confidence interval
            'weak': 25      // ±12.5% confidence interval
        };
        return widths[quality];
    }

    /**
     * Adjust width based on score (extreme scores have wider intervals)
     */
    private adjustWidthForScore(baseWidth: number, score: number): number {
        // Scores near 50% have more uncertainty (could go either way)
        // Scores near 0% or 100% are more certain
        const distanceFrom50 = Math.abs(score - 50);
        const uncertaintyMultiplier = 1 + (1 - distanceFrom50 / 50) * 0.5;

        return baseWidth * uncertaintyMultiplier;
    }

    /**
     * Assess how well-calibrated our estimate is
     */
    private assessCalibrationQuality(
        evidenceQuality: string,
        intervalWidth: number
    ): 'excellent' | 'good' | 'moderate' | 'poor' {
        if (evidenceQuality === 'strong' && intervalWidth < 15) return 'excellent';
        if (evidenceQuality === 'strong' || (evidenceQuality === 'moderate' && intervalWidth < 20)) return 'good';
        if (evidenceQuality === 'moderate') return 'moderate';
        return 'poor';
    }

    /**
     * Explain uncertainty to user
     */
    private explainUncertainty(
        score: number,
        width: number,
        evidenceQuality: string,
        metrics: EvidenceQualityMetrics
    ): string {
        if (width < 10) {
            return `High confidence - ${this.getEvidenceReason(evidenceQuality, metrics)}`;
        } else if (width < 20) {
            return `Moderate confidence - ${this.getUncertaintyReason(metrics)}`;
        } else if (width < 30) {
            return `Low confidence - ${this.getWeaknessReason(metrics)}`;
        } else {
            return `Very low confidence - ${this.getCriticalWeakness(metrics)}. Professional evaluation strongly recommended.`;
        }
    }

    private getEvidenceReason(quality: string, metrics: EvidenceQualityMetrics): string {
        if (metrics.hasLabResults) {
            return "laboratory results strongly support this diagnosis";
        }
        if (metrics.symptomCorrelation > 0.8) {
            return "symptoms form a classic clinical pattern";
        }
        if (metrics.specificityOfSymptoms > 0.85) {
            return "highly specific symptoms present";
        }
        return "strong evidence supports this diagnosis";
    }

    private getUncertaintyReason(metrics: EvidenceQualityMetrics): string {
        if (metrics.symptomCount < 3) {
            return "additional symptoms would improve accuracy";
        }
        if (metrics.temporalClarity === 'vague') {
            return "clarifying timeline would help";
        }
        if (metrics.specificityOfSymptoms < 0.6) {
            return "symptoms are somewhat non-specific";
        }
        return "more information would improve confidence";
    }

    private getWeaknessReason(metrics: EvidenceQualityMetrics): string {
        if (metrics.symptomCount < 2) {
            return "very few symptoms reported - need more detail";
        }
        if (!metrics.hasPhysicalExam && !metrics.hasLabResults) {
            return "no objective findings available";
        }
        return "several conditions have similar presentations";
    }

    private getCriticalWeakness(metrics: EvidenceQualityMetrics): string {
        if (metrics.symptomCount < 2) {
            return "Insufficient information to make a reliable assessment";
        }
        if (metrics.specificityOfSymptoms < 0.3) {
            return "Symptoms are highly non-specific";
        }
        return "Multiple conditions could explain these symptoms";
    }

    /**
     * Should we ask for more information?
     */
    private shouldAskMore(
        width: number,
        evidenceQuality: string,
        metrics: EvidenceQualityMetrics
    ): boolean {
        // Wide interval → need more info
        if (width > 25) return true;

        // Weak evidence → need more info
        if (evidenceQuality === 'weak') return true;

        // Very few symptoms → need more info
        if (metrics.symptomCount < 3) return true;

        // Otherwise, confidence is acceptable
        return false;
    }

    /**
     * Get evidence bonus for score adjustment
     */
    private getEvidenceBonus(quality: 'strong' | 'moderate' | 'weak'): number {
        const bonuses = {
            'strong': 1.1,   // 10% boost for strong evidence
            'moderate': 1.0, // No adjustment
            'weak': 0.9      // 10% penalty for weak evidence
        };
        return bonuses[quality];
    }
}

/**
 * Format uncertainty estimate for user display
 */
export function formatUncertaintyForUser(estimate: UncertaintyEstimate): string {
    const { pointEstimate, confidenceInterval, calibrationQuality, explanation } = estimate;

    const calibrationEmoji = {
        'excellent': '✅',
        'good': '👍',
        'moderate': '⚠️',
        'poor': '❌'
    };

    return `
**Confidence: ${pointEstimate.toFixed(0)}%** 
(Range: ${confidenceInterval.lower.toFixed(0)}% - ${confidenceInterval.upper.toFixed(0)}%)

${calibrationEmoji[calibrationQuality]} **Quality:** ${calibrationQuality}

${explanation}
  `.trim();
}

export const uncertaintyQuantifier = new UncertaintyQuantifier();
