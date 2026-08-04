/**
 * Output Validator Middleware
 * 
 * Inspects AI-generated response payloads against authenticated patient demographics
 * (gender, age) to guarantee that non-sensical or contraindicated questions/advice
 * (e.g. pregnancy checks for male patients, aspirin for children under 12) are never returned.
 */

export interface ValidationProfile {
    gender?: string | null;
    age?: number | string | null;
}

export interface OutputValidationResult {
    isValid: boolean;
    violations: string[];
    sanitizedJson?: Record<string, any>;
}

/**
 * Validates AI JSON response against patient profile demographics.
 *
 * @param jsonResponse The parsed JSON response object from LLM inference
 * @param profile Patient profile containing gender and age
 */
export function validateOutputAgainstProfile(
    jsonResponse: Record<string, any>,
    profile?: ValidationProfile | null
): OutputValidationResult {
    if (!jsonResponse || typeof jsonResponse !== 'object') {
        return { isValid: true, violations: [] };
    }

    const violations: string[] = [];
    const normalizedGender = (profile?.gender || '').toLowerCase().trim();
    const isMale = ['male', 'm', 'man'].includes(normalizedGender);

    const parsedAge = (() => {
        if (!profile?.age) return null;
        const n = parseInt(String(profile.age), 10);
        return isNaN(n) ? null : n;
    })();

    // 1. Male Patient Gender Safety Rule
    // Male users MUST NOT be asked about pregnancy, ectopic pregnancy, or uterine/ovarian issues.
    if (isMale) {
        const femaleReproductiveTerms = [
            'pregnant',
            'pregnancy',
            'ectopic pregnancy',
            'missed period',
            'trimester',
            'breastfeeding',
            'uterus',
            'ovarian',
        ];

        // Helper to recursively scan text
        const textToScan = JSON.stringify(jsonResponse).toLowerCase();

        for (const term of femaleReproductiveTerms) {
            // Regex with word boundaries to avoid false positives (e.g., 'pregnant' inside 'impregnate')
            const termRegex = new RegExp(`\\b${term}\\b`, 'i');
            if (termRegex.test(textToScan)) {
                violations.push(`Male profile received female reproductive term: "${term}"`);
            }
        }
    }

    // 2. Pediatric Age Safety Rule (< 12 years)
    // Children under 12 MUST NOT receive recommendations for Aspirin due to Reye's syndrome risk.
    if (parsedAge !== null && parsedAge < 12) {
        const textToScan = JSON.stringify(jsonResponse).toLowerCase();
        if (/\baspirin\b|\bacetylsalicylic\b/i.test(textToScan)) {
            violations.push(`Pediatric patient (age ${parsedAge}) received Aspirin recommendation`);
        }
    }

    if (violations.length > 0) {
        console.warn(`[OutputValidator] Demographic violations detected:`, violations);

        // Sanitize response: strip problematic pregnancy questions/warnings if male
        const sanitized = JSON.parse(JSON.stringify(jsonResponse));
        if (isMale) {
            if (Array.isArray(sanitized.warnings)) {
                sanitized.warnings = sanitized.warnings.filter(
                    (w: string) => !/pregnant|pregnancy|ectopic/i.test(w)
                );
            }
            if (typeof sanitized.rationale === 'string') {
                sanitized.rationale = sanitized.rationale
                    .replace(/or pregnancy possibility\??/gi, '')
                    .replace(/or possibility of pregnancy\??/gi, '');
            }
            if (typeof sanitized.description === 'string') {
                sanitized.description = sanitized.description
                    .replace(/or pregnancy possibility\??/gi, '')
                    .replace(/or possibility of pregnancy\??/gi, '');
            }
        }

        return {
            isValid: false,
            violations,
            sanitizedJson: sanitized,
        };
    }

    return {
        isValid: true,
        violations: [],
        sanitizedJson: jsonResponse,
    };
}
