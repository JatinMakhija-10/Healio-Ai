/**
 * IterativeRefinementEngine — Phase 5
 *
 * Implements the Bayesian Iterative Refinement Loop:
 *   1. User answers question
 *   2. Update symptom data (Yes → confirmed, No → excluded)
 *   3. Re-run Bayesian scoring (via ConversationIntakeState)
 *   4. If top confidence ≥ 90% → finalize diagnosis
 *   5. If ambiguous (top 2 within 15% gap) → ask highest-gain question
 *   6. If plateau detected → stop & present best guess
 *
 * This layer sits ABOVE the field-queue (NextQuestionSelector).
 * It reads the LLM's emitted confidence scores from assistant messages
 * across turns and decides when the iterative loop should terminate.
 */

import type { ConversationIntakeState, ChatTranscriptMessage } from './ConversationIntakeState';
import { infoGainSelector, type CandidateCondition } from '../advanced/InformationGainSelector';

// ─── Types ───────────────────────────────────────────────────────────────────

/** The action the refinement engine recommends for this turn */
export type RefinementAction =
    | 'finalize'            // Confidence ≥ 90% → output final diagnosis now
    | 'finalize_best_guess' // Plateau detected → stop and present best available answer
    | 'ask_info_gain'       // Top-2 gap < 15% → ask a discriminating info-gain question
    | 'continue';           // Keep gathering intake fields normally

export interface RefinementDecision {
    action: RefinementAction;
    topConfidence: number;
    top2Gap: number | null;
    plateauDetected: boolean;
    turnsWithoutGain: number;
    infoGainQuestion: string | null;      // The actual question text, if action = ask_info_gain
    infoGainSymptomKey: string | null;    // Symptom key for the info-gain question
    reason: string;
}

/** Parsed yes/no tracking for binary symptom questions */
export interface YesNoAnswer {
    field: string;
    answer: 'yes' | 'no';
    turnIndex: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Confidence threshold above which we finalize the diagnosis immediately */
const HIGH_CONFIDENCE_THRESHOLD = 90;

/**
 * If the top-2 candidates are within this percentage gap,
 * the diagnosis is ambiguous → ask an info-gain question.
 */
const AMBIGUITY_GAP_THRESHOLD = 15;

/**
 * Number of turns to look back for plateau detection.
 * If gain across this window is below MIN_GAIN_PER_TURN, plateau is declared.
 */
const PLATEAU_WINDOW = 3;

/** Minimum confidence gain per turn (%) to not declare a plateau */
const MIN_GAIN_PER_TURN = 4;

/**
 * Regex to extract the JSON confidence block from an assistant message.
 * The diagnosis JSON may contain "confidence": 75 or "confidence":75 etc.
 */
const CONFIDENCE_JSON_RE = /"confidence"\s*:\s*(\d+(?:\.\d+)?)/;

/**
 * Regex to detect the top condition name from diagnosis JSON for candidate tracking.
 * Matches "condition": "Tension Headache" patterns.
 */
const CONDITION_JSON_RE = /"condition(?:_?name)?"\s*:\s*"([^"]+)"/i;

/**
 * Regex to detect a score/probability in a JSON top_conditions array.
 * Matches "score": 72 or "probability": 72
 */
const SCORE_JSON_RE = /"(?:score|probability|bayesian_score)"\s*:\s*(\d+(?:\.\d+)?)/g;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extracts the confidence value emitted by the assistant in a given message.
 * Looks for JSON patterns like "confidence": 78 or legacy plain text "78% confident".
 */
function extractConfidenceFromMessage(content: string): number | null {
    // Primary: JSON emission pattern
    const jsonMatch = content.match(CONFIDENCE_JSON_RE);
    if (jsonMatch) {
        const val = parseFloat(jsonMatch[1]);
        if (val >= 0 && val <= 100) return val;
    }

    // Secondary: plain text patterns like "78% confident" or "confidence: 78%"
    const plainMatch = content.match(/\b(\d{1,3})%\s*(?:confident|confidence|certainty|probability)\b/i)
        ?? content.match(/\bconfidence[:\s]+(\d{1,3})%/i);
    if (plainMatch) {
        const val = parseInt(plainMatch[1], 10);
        if (val >= 0 && val <= 100) return val;
    }

    return null;
}

/**
 * Extracts the top-2 candidate scores from a diagnosis JSON in an assistant message.
 * Returns scores sorted descending, or [] if no scores found.
 */
function extractTop2ScoresFromMessage(content: string): number[] {
    const scores: number[] = [];
    let match: RegExpExecArray | null;
    const re = new RegExp(SCORE_JSON_RE.source, 'g');
    while ((match = re.exec(content)) !== null) {
        scores.push(parseFloat(match[1]));
        if (scores.length >= 2) break;
    }
    return scores.sort((a, b) => b - a);
}

/**
 * Parses the transcript to build a confidence history array (one entry per assistant turn).
 * Only includes turns where the assistant emitted a confidence value.
 */
export function extractConfidenceHistory(messages: ChatTranscriptMessage[]): number[] {
    const history: number[] = [];
    for (const msg of messages) {
        if (msg.role !== 'assistant') continue;
        const conf = extractConfidenceFromMessage(msg.content);
        if (conf !== null) {
            history.push(conf);
        }
    }
    return history;
}

/**
 * Detects a confidence plateau: if the last `windowSize` confidence readings
 * have accumulated less than `minGainPercent` total improvement, plateau is declared.
 *
 * Example: history = [40, 50, 60, 61, 62], windowSize = 3
 *   window = [60, 61, 62], totalGain = 62 - 60 = 2  →  plateau (< 4)
 */
export function detectPlateau(
    history: number[],
    windowSize = PLATEAU_WINDOW,
    minGainPercent = MIN_GAIN_PER_TURN
): { plateau: boolean; turnsWithoutGain: number } {
    if (history.length < windowSize) {
        return { plateau: false, turnsWithoutGain: 0 };
    }

    const window = history.slice(-windowSize);
    // Gain is measured from the FIRST to the LAST reading within this window
    const totalGain = window[window.length - 1] - window[0];
    const turnsWithoutGain = window.filter((v, i) => i > 0 && v - window[i - 1] < 1).length;

    return {
        plateau: totalGain < minGainPercent,
        turnsWithoutGain,
    };
}

/**
 * Parses yes/no answers from the transcript.
 * Scans pairs: assistant asks a binary question → user replies yes/no.
 *
 * Binary question detection is START-ANCHORED to avoid matching context questions
 * like "How long have you had this?" which contain "have you" but are NOT binary.
 */
export function parseYesNoAnswers(messages: ChatTranscriptMessage[]): YesNoAnswer[] {
    const answers: YesNoAnswer[] = [];
    const YES_RE = /^(yes|yeah|yep|haan|ha|correct|true|definitely|absolutely|sure)\b/i;
    const NO_RE = /^(no|nope|nah|nahi|not|never|false|don't|dont|na)\b/i;
    // Anchored at start of sentence (after optional whitespace) so "How long have you..." won't match
    const BINARY_QUESTION_RE = /^\s*(?:do you|are you|have you|did you|is there|does it|can you|would you)\b.*\?/i;

    let lastAskedField: string | null = null;
    messages.forEach((msg, index) => {
        if (msg.role === 'assistant') {
            if (BINARY_QUESTION_RE.test(msg.content)) {
                // Extract the quoted symptom keyword as the field identifier
                const condMatch = msg.content.match(/"([^"]{2,40})"/);
                lastAskedField = condMatch?.[1] ?? `q_${index}`;
            } else {
                // Non-binary assistant turn resets the pending binary field
                lastAskedField = null;
            }
            return;
        }

        if (msg.role === 'user' && lastAskedField) {
            const trimmed = msg.content.trim();
            if (YES_RE.test(trimmed)) {
                answers.push({ field: lastAskedField, answer: 'yes', turnIndex: index });
                lastAskedField = null;
            } else if (NO_RE.test(trimmed)) {
                answers.push({ field: lastAskedField, answer: 'no', turnIndex: index });
                lastAskedField = null;
            }
        }
    });

    return answers;
}

/**
 * Derives the confirmed and excluded symptom lists from yes/no answers.
 * Used to feed back into the Bayesian scoring on the next turn.
 */
export function deriveSymptomUpdates(answers: YesNoAnswer[]): {
    confirmedSymptoms: string[];
    excludedSymptoms: string[];
} {
    const confirmedSymptoms: string[] = [];
    const excludedSymptoms: string[] = [];

    for (const answer of answers) {
        if (answer.answer === 'yes') {
            confirmedSymptoms.push(answer.field);
        } else {
            excludedSymptoms.push(answer.field);
        }
    }

    return { confirmedSymptoms, excludedSymptoms };
}

// ─── Core Decision Function ───────────────────────────────────────────────────

/**
 * Computes the Phase 5 Iterative Refinement decision for this turn.
 *
 * Priority order:
 * 1. High confidence early exit (≥ 90%)
 * 2. Plateau detection → best guess
 * 3. Ambiguity detection → info-gain question
 * 4. Continue normal intake
 */
export function computeRefinementDecision(
    state: ConversationIntakeState,
    messages: ChatTranscriptMessage[],
    detectedLanguage: 'en' | 'hi' | 'hinglish' = 'en'
): RefinementDecision {
    const confidenceHistory = extractConfidenceHistory(messages);
    const latestConfidence = confidenceHistory[confidenceHistory.length - 1] ?? 0;

    // ── 1. High confidence early exit ─────────────────────────────────────────
    if (latestConfidence >= HIGH_CONFIDENCE_THRESHOLD) {
        return {
            action: 'finalize',
            topConfidence: latestConfidence,
            top2Gap: null,
            plateauDetected: false,
            turnsWithoutGain: 0,
            infoGainQuestion: null,
            infoGainSymptomKey: null,
            reason: `Top confidence ${latestConfidence.toFixed(1)}% ≥ ${HIGH_CONFIDENCE_THRESHOLD}% threshold — finalizing diagnosis now.`,
        };
    }

    // ── 2. Plateau detection ───────────────────────────────────────────────────
    const { plateau, turnsWithoutGain } = detectPlateau(confidenceHistory);
    if (plateau && confidenceHistory.length >= PLATEAU_WINDOW) {
        return {
            action: 'finalize_best_guess',
            topConfidence: latestConfidence,
            top2Gap: null,
            plateauDetected: true,
            turnsWithoutGain,
            infoGainQuestion: null,
            infoGainSymptomKey: null,
            reason: `Confidence plateau detected over last ${PLATEAU_WINDOW} turns (total gain < ${MIN_GAIN_PER_TURN}%) — stopping and presenting best available diagnosis.`,
        };
    }

    // ── 3. Ambiguity detection → info-gain question ───────────────────────────
    // Look at the latest assistant message for top-2 scores
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    const lastConditionMatch = lastAssistantMsg?.content.match(CONDITION_JSON_RE);
    const lastTop2Scores = lastAssistantMsg ? extractTop2ScoresFromMessage(lastAssistantMsg.content) : [];

    let top2Gap: number | null = null;
    if (lastTop2Scores.length >= 2) {
        top2Gap = lastTop2Scores[0] - lastTop2Scores[1];
    }

    // Also check: if latestConfidence is non-trivial and gap is small, trigger info-gain
    const isAmbiguous = (top2Gap !== null && top2Gap < AMBIGUITY_GAP_THRESHOLD && latestConfidence >= 30)
        || (latestConfidence > 0 && latestConfidence < 70 && confidenceHistory.length >= 2);

    if (isAmbiguous) {
        // Build candidate list from collected data for info-gain selection
        const candidates: CandidateCondition[] = [];

        // Try to extract top conditions from the last assistant message
        const topConditionMatch = lastConditionMatch?.[1];
        if (topConditionMatch) {
            candidates.push({
                conditionName: topConditionMatch,
                score: lastTop2Scores[0] ?? latestConfidence,
            });
        }
        // Add second candidate from top2 scores if we have it
        if (lastTop2Scores.length >= 2 && candidates.length >= 1) {
            // We don't have the name of condition 2 from regex, use generic placeholder
            // The info-gain selector uses condition names to look up symptoms
            // If we only have 1 named candidate, we skip info-gain to avoid noise
        }

        // Only fire info-gain if we have at least 2 candidates
        const knownSymptoms = [...state.collectedData.values()].slice(0, 10);
        const yesNoAnswers = parseYesNoAnswers(messages);
        const { excludedSymptoms } = deriveSymptomUpdates(yesNoAnswers);

        if (candidates.length >= 2) {
            const question = infoGainSelector.selectBestQuestion(
                candidates,
                knownSymptoms,
                excludedSymptoms,
                detectedLanguage
            );

            if (question) {
                return {
                    action: 'ask_info_gain',
                    topConfidence: latestConfidence,
                    top2Gap,
                    plateauDetected: false,
                    turnsWithoutGain,
                    infoGainQuestion: question.question,
                    infoGainSymptomKey: question.symptomKey,
                    reason: `Ambiguous differential (top-2 gap=${top2Gap !== null ? top2Gap.toFixed(1) : 'N/A'}%, < ${AMBIGUITY_GAP_THRESHOLD}%) — asking highest-gain discriminating question.`,
                };
            }
        }
    }

    // ── 4. Continue normal intake ──────────────────────────────────────────────
    return {
        action: 'continue',
        topConfidence: latestConfidence,
        top2Gap,
        plateauDetected: false,
        turnsWithoutGain,
        infoGainQuestion: null,
        infoGainSymptomKey: null,
        reason: `Continuing normal intake — confidence ${latestConfidence.toFixed(1)}%, no plateau, no ambiguity trigger.`,
    };
}

// ─── Prompt Formatter ─────────────────────────────────────────────────────────

/**
 * Formats the refinement decision as a system prompt block for the LLM.
 * Appended to the system prompt each turn alongside the intake state.
 */
export function formatRefinementDecisionForPrompt(decision: RefinementDecision): string {
    const lines: string[] = [
        '\n\n=== PHASE 5: ITERATIVE REFINEMENT LOOP ===',
        `action: ${decision.action}`,
        `topConfidence: ${decision.topConfidence.toFixed(1)}%`,
        `top2Gap: ${decision.top2Gap !== null ? decision.top2Gap.toFixed(1) + '%' : 'N/A'}`,
        `plateauDetected: ${decision.plateauDetected}`,
        `turnsWithoutGain: ${decision.turnsWithoutGain}`,
        `reason: ${decision.reason}`,
    ];

    if (decision.infoGainQuestion) {
        lines.push(`infoGainQuestion: ${decision.infoGainQuestion}`);
    }

    lines.push('RULES:');

    switch (decision.action) {
        case 'finalize':
            lines.push(
                `- Confidence has reached ${decision.topConfidence.toFixed(1)}% (≥ 90%). Output the FINAL DIAGNOSIS JSON block immediately.`,
                '- Do NOT ask any more questions.',
                '- Use the collected symptoms to produce a complete structured output.'
            );
            break;

        case 'finalize_best_guess':
            lines.push(
                `- A confidence plateau has been detected (${decision.turnsWithoutGain} turns without meaningful gain).`,
                '- Stop asking questions. Output your BEST AVAILABLE DIAGNOSIS with appropriate uncertainty language.',
                '- Use phrasing like "Based on your symptoms, the most likely possibility is..." with a clear "consult a doctor" recommendation.',
                '- Output the final JSON block with confidence as currently estimated.'
            );
            break;

        case 'ask_info_gain':
            lines.push(
                `- The differential is ambiguous (top-2 candidates are within ${decision.top2Gap?.toFixed(1) ?? '?'}%).`,
                `- Ask this single discriminating question to reduce uncertainty: "${decision.infoGainQuestion}"`,
                '- Do NOT ask any other question. Do NOT output a final diagnosis yet.',
                '- Keep the question conversational and empathetic.'
            );
            break;

        case 'continue':
        default:
            lines.push(
                '- Continue gathering intake fields normally following the NextQuestionSelector decision.',
                '- Do NOT output a final diagnosis yet unless the NextQuestionSelector says summarize.'
            );
            break;
    }

    lines.push('=== END PHASE 5: ITERATIVE REFINEMENT LOOP ===');
    return lines.join('\n');
}
