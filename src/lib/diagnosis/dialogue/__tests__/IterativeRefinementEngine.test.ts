/**
 * IterativeRefinementEngine Tests — Phase 5
 *
 * Tests:
 *  - detectPlateau: various confidence histories
 *  - computeRefinementDecision: all 4 action branches
 *  - parseYesNoAnswers: transcript parsing
 *  - deriveSymptomUpdates: confirmed / excluded splitting
 *  - extractConfidenceHistory: parsing from assistant messages
 */

import { describe, it, expect } from 'vitest';
import {
    detectPlateau,
    extractConfidenceHistory,
    parseYesNoAnswers,
    deriveSymptomUpdates,
    computeRefinementDecision,
} from '../IterativeRefinementEngine';
import type { ChatTranscriptMessage } from '../ConversationIntakeState';
import { buildConversationIntakeState } from '../ConversationIntakeState';

// ─── detectPlateau ────────────────────────────────────────────────────────────

describe('detectPlateau', () => {
    it('returns false when history is too short', () => {
        const result = detectPlateau([50, 55]);
        expect(result.plateau).toBe(false);
    });

    it('returns true when last 3 turns have < 4% total gain', () => {
        // window = last 3 readings: [60, 61, 62], totalGain = 62 - 60 = 2 < 4
        const result = detectPlateau([40, 50, 60, 61, 62]);
        expect(result.plateau).toBe(true);
    });

    it('returns false when there is significant gain in the window', () => {
        // Window of 3: from 50 to 75 = 25% gain (> 4%)
        const result = detectPlateau([30, 40, 50, 65, 75]);
        expect(result.plateau).toBe(false);
    });

    it('handles exact threshold correctly', () => {
        // window = [60, 62, 64], totalGain = 64 - 60 = 4 which is NOT < 4 → no plateau
        const result = detectPlateau([40, 55, 60, 62, 64]);
        expect(result.plateau).toBe(false);
    });

    it('correctly counts turns without gain', () => {
        const result = detectPlateau([50, 60, 61, 61, 62]);
        expect(result.turnsWithoutGain).toBeGreaterThan(0);
    });
});

// ─── extractConfidenceHistory ─────────────────────────────────────────────────

describe('extractConfidenceHistory', () => {
    it('extracts confidence from JSON pattern in assistant messages', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'user', content: 'I have a headache' },
            { role: 'assistant', content: '{"confidence": 72, "condition": "Tension Headache"}' },
            { role: 'user', content: 'Yes it is throbbing' },
            { role: 'assistant', content: '{"confidence": 85, "condition": "Migraine"}' },
        ];
        const history = extractConfidenceHistory(messages);
        expect(history).toEqual([72, 85]);
    });

    it('extracts confidence from plain text patterns', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'assistant', content: 'Based on your symptoms, I am 78% confident this is a sinus infection.' },
        ];
        const history = extractConfidenceHistory(messages);
        expect(history).toEqual([78]);
    });

    it('ignores user messages', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'user', content: 'confidence: 99%' },
            { role: 'assistant', content: '{"confidence": 45}' },
        ];
        const history = extractConfidenceHistory(messages);
        expect(history).toEqual([45]);
    });

    it('returns empty array when no confidence values found', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'assistant', content: 'How long have you had this headache?' },
        ];
        expect(extractConfidenceHistory(messages)).toEqual([]);
    });
});

// ─── parseYesNoAnswers ────────────────────────────────────────────────────────

describe('parseYesNoAnswers', () => {
    it('parses yes answer to a binary question', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'assistant', content: 'Are you experiencing "nausea" as well?' },
            { role: 'user', content: 'Yes' },
        ];
        const answers = parseYesNoAnswers(messages);
        expect(answers.length).toBe(1);
        expect(answers[0].answer).toBe('yes');
        expect(answers[0].field).toBe('nausea');
    });

    it('parses no answer to a binary question', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'assistant', content: 'Do you have "chills" alongside the fever?' },
            { role: 'user', content: 'No, I do not' },
        ];
        const answers = parseYesNoAnswers(messages);
        expect(answers.length).toBe(1);
        expect(answers[0].answer).toBe('no');
    });

    it('ignores non-binary assistant questions', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'assistant', content: 'How long have you had this pain?' },
            { role: 'user', content: 'Yes, since yesterday' },
        ];
        const answers = parseYesNoAnswers(messages);
        expect(answers.length).toBe(0);
    });

    it('parses Hinglish yes answers', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'assistant', content: 'Do you have "fever" right now?' },
            { role: 'user', content: 'Haan, bukhar hai' },
        ];
        const answers = parseYesNoAnswers(messages);
        expect(answers.length).toBe(1);
        expect(answers[0].answer).toBe('yes');
    });
});

// ─── deriveSymptomUpdates ─────────────────────────────────────────────────────

describe('deriveSymptomUpdates', () => {
    it('splits confirmed and excluded correctly', () => {
        const answers = [
            { field: 'nausea', answer: 'yes' as const, turnIndex: 1 },
            { field: 'chills', answer: 'no' as const, turnIndex: 3 },
            { field: 'vomiting', answer: 'yes' as const, turnIndex: 5 },
        ];
        const { confirmedSymptoms, excludedSymptoms } = deriveSymptomUpdates(answers);
        expect(confirmedSymptoms).toContain('nausea');
        expect(confirmedSymptoms).toContain('vomiting');
        expect(excludedSymptoms).toContain('chills');
        expect(excludedSymptoms).not.toContain('nausea');
    });

    it('handles empty answer list', () => {
        const { confirmedSymptoms, excludedSymptoms } = deriveSymptomUpdates([]);
        expect(confirmedSymptoms).toHaveLength(0);
        expect(excludedSymptoms).toHaveLength(0);
    });
});

// ─── computeRefinementDecision ────────────────────────────────────────────────

describe('computeRefinementDecision', () => {
    const makeMessages = (assistantConf: number[]): ChatTranscriptMessage[] => {
        const msgs: ChatTranscriptMessage[] = [];
        for (const conf of assistantConf) {
            msgs.push({ role: 'user', content: 'some symptom info' });
            msgs.push({ role: 'assistant', content: `{"confidence": ${conf}, "condition": "Test Condition"}` });
        }
        return msgs;
    };

    it('returns finalize when confidence >= 90', () => {
        const messages = makeMessages([60, 75, 92]);
        const state = buildConversationIntakeState(messages);
        const decision = computeRefinementDecision(state, messages);
        expect(decision.action).toBe('finalize');
        expect(decision.topConfidence).toBe(92);
    });

    it('returns finalize_best_guess on plateau', () => {
        // window = last 3 readings: [60, 61, 62], totalGain = 2 < 4 → plateau
        const messages = makeMessages([45, 55, 60, 61, 62]);
        const state = buildConversationIntakeState(messages);
        const decision = computeRefinementDecision(state, messages);
        expect(decision.action).toBe('finalize_best_guess');
        expect(decision.plateauDetected).toBe(true);
    });

    it('returns continue on early turns with low confidence', () => {
        const messages = makeMessages([30, 40]);
        const state = buildConversationIntakeState(messages);
        const decision = computeRefinementDecision(state, messages);
        // With only 2 turns and no plateau, no ambiguity can be computed (need 2 named candidates)
        // should fall through to continue or ask_info_gain
        expect(['continue', 'ask_info_gain']).toContain(decision.action);
    });

    it('returns continue when history is empty', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'user', content: 'I have a headache' },
            { role: 'assistant', content: 'How long have you had this headache?' },
        ];
        const state = buildConversationIntakeState(messages);
        const decision = computeRefinementDecision(state, messages);
        expect(decision.action).toBe('continue');
        expect(decision.topConfidence).toBe(0);
    });
});
