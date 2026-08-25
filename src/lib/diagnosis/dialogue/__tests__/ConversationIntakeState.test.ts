import { describe, expect, it } from 'vitest';
import {
    buildConversationIntakeState,
    formatConversationIntakeStateForPrompt,
    hasMinimumDiagnosticData,
    inferAskedFieldFromAssistant,
} from '../ConversationIntakeState';
import { selectSymptomQuestionSchema } from '../SymptomQuestionSchemas';

describe('ConversationIntakeState', () => {
    it('infers the asked field from ui_hint question_type', () => {
        expect(inferAskedFieldFromAssistant(
            'How long has this been happening?\n{"ui_hint":{"type":"chips","question_type":"duration"}}'
        )).toBe('duration');

        expect(inferAskedFieldFromAssistant(
            'How would you rate it on a scale of 1 to 10?'
        )).toBe('severity');
    });

    it('marks a pending duration answered from a short reply', () => {
        const state = buildConversationIntakeState([
            { role: 'user', content: 'I have fever' },
            { role: 'assistant', content: 'How long have you had the fever?' },
            { role: 'user', content: '3 days' },
        ]);

        expect(state.answeredFields.has('chief_complaint')).toBe(true);
        expect(state.answeredFields.has('fever.duration')).toBe(true);
        expect(state.collectedData.get('fever.duration')).toBe('3 days');
        expect(state.pendingQueue[0].key).toBe('fever.temp_value');
    });

    it('does not ask duration again when it was already answered in free text', () => {
        const state = buildConversationIntakeState([
            { role: 'user', content: 'I have fever for 3 days and chills' },
        ]);

        expect(state.answeredFields.has('chief_complaint')).toBe(true);
        expect(state.answeredFields.has('fever.duration')).toBe(true);
        expect(state.pendingQueue.some((field) => field.key === 'fever.duration')).toBe(false);
    });

    it('requires priority-one fields before final diagnosis or advice', () => {
        const incomplete = buildConversationIntakeState([
            { role: 'user', content: 'I have a cough. What remedy should I take?' },
        ]);
        expect(hasMinimumDiagnosticData(incomplete)).toBe(false);

        const complete = buildConversationIntakeState([
            { role: 'user', content: 'I have nausea for 2 days and it is 4/10' },
        ]);
        expect(hasMinimumDiagnosticData(complete)).toBe(true);
    });

    it('surfaces clarifyPending when the latest answer is unusable', () => {
        const state = buildConversationIntakeState([
            { role: 'user', content: 'I have a headache' },
            { role: 'assistant', content: 'How long has this been happening?' },
            { role: 'user', content: 'not sure what you mean' },
        ]);

        expect(state.clarifyPending?.field).toBe('headache.duration');
        expect(formatConversationIntakeStateForPrompt(state)).toContain('nextFieldToAsk: headache.duration');
    });

    it('moves to escalated state when a red flag appears', () => {
        const state = buildConversationIntakeState([
            { role: 'user', content: 'I have chest pain and shortness of breath' },
        ]);

        expect(state.phaseStatus).toBe('escalated');
        expect(state.redFlagsFound).toContain('chest pain');
        expect(state.redFlagsFound).toContain('breathing difficulty');
    });

    it('selects fever schema and uses fever-specific priority fields', () => {
        const schema = selectSymptomQuestionSchema('fever with chills');
        expect(schema.id).toBe('fever');

        const state = buildConversationIntakeState([
            { role: 'user', content: 'I have fever for 3 days, temperature is 101F, with chills' },
        ]);

        expect(state.activeSchemaId).toBe('fever');
        expect(state.answeredFields.has('fever.temp_value')).toBe(true);
        expect(state.answeredFields.has('fever.duration')).toBe(true);
        expect(state.answeredFields.has('fever.rigors')).toBe(true);
        expect(state.pendingQueue[0].key).toBe('fever.danger_signs');
    });

    it('marks fever boolean answers without treating yes/no as useless', () => {
        const state = buildConversationIntakeState([
            { role: 'user', content: 'I have fever for 3 days, temperature is 101F' },
            { role: 'assistant', content: 'Any chills or shaking?' },
            { role: 'user', content: 'No' },
        ]);

        expect(state.collectedData.get('fever.rigors')).toBe('no');
        expect(state.pendingQueue.some((field) => field.key === 'fever.rigors')).toBe(false);
    });

    it('extracts temperature from ranges and handles Celsius/Fahrenheit mismatches', () => {
        const state = buildConversationIntakeState([
            { role: 'user', content: 'I have fever since yesterday' },
            { role: 'assistant', content: 'What is your temperature?' },
            { role: 'user', content: 'Between 99-101 degree celcius' }
        ]);

        expect(state.activeSchemaId).toBe('fever');
        expect(state.answeredFields.has('fever.temp_value')).toBe(true);
        expect(state.collectedData.get('fever.temp_value')).toBe('101F');
    });

    it('correctly maps nausea to vomiting_diarrhea schema and suppresses body location and pain sensation questions', () => {
        const schema = selectSymptomQuestionSchema('i feel nauseous since morning');
        expect(schema.id).toBe('vomiting_diarrhea');

        const state = buildConversationIntakeState([
            { role: 'user', content: 'i feel nauseous since morning' },
        ]);

        expect(state.activeSchemaId).toBe('vomiting_diarrhea');
        // Ensure body location ("Where in your body") is NOT queued for nausea/vomiting
        expect(state.pendingQueue.some((field) => field.key === 'location')).toBe(false);
        // Ensure generic pain sensation is NOT queued
        expect(state.pendingQueue.some((field) => field.key === 'sensation')).toBe(false);
    });
});
