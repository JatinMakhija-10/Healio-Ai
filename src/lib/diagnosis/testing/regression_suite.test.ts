import { describe, it, expect } from 'vitest';
import { buildConversationIntakeState } from '../dialogue/ConversationIntakeState';
import { selectNextQuestionDecision } from '../dialogue/NextQuestionSelector';
import { SYMPTOM_QUESTION_SCHEMAS } from '../dialogue/SymptomQuestionSchemas';

// Helper to get exact question string for testing
function getQ(schemaId: string, key: string) {
    const schema = SYMPTOM_QUESTION_SCHEMAS.find(s => s.id === schemaId);
    return schema?.fields.find(f => f.key === key)?.question ?? '';
}

describe('Healio AI Quality Optimization v2.0 Regression Suite', () => {

    it('TC-01: Correctly identifies schema and queues P1 fields', () => {
        const messages = [{ role: 'user', content: 'I have a terrible headache.' }];
        const state = buildConversationIntakeState(messages);
        
        expect(state.activeSchemaId).toBe('headache');
        expect(state.answeredFields.has('chief_complaint')).toBe(true);
        expect(state.pendingQueue[0].priority).toBe(1);
        expect(state.coverageScore).toBeLessThan(100);
    });

    it('TC-02: Extracts implicit duration answers correctly', () => {
        const messages = [{ role: 'user', content: 'I have a fever since yesterday and it feels like 101F.' }];
        const state = buildConversationIntakeState(messages);
        
        expect(state.activeSchemaId).toBe('fever');
        expect(state.collectedData.get('fever.duration')).toBe('yesterday');
        expect(state.collectedData.get('fever.temp_value')).toBe('101F');
    });

    it('TC-03: Triggers red-flag escalation on generic "worst headache"', () => {
        const messages = [{ role: 'user', content: 'This is the worst headache of my life.' }];
        const state = buildConversationIntakeState(messages);
        const decision = selectNextQuestionDecision(state);
        
        expect(state.phaseStatus).toBe('escalated');
        expect(decision.type).toBe('escalate');
    });

    it('TC-04: Triggers red-flag escalation on "fever > 40C" via redFlagFn', () => {
        const messages = [
            { role: 'user', content: 'I have a fever' },
            { role: 'assistant', content: getQ('fever', 'fever.temp_value') },
            { role: 'user', content: 'It is 40.5C degrees' }
        ];
        const state = buildConversationIntakeState(messages);
        const decision = selectNextQuestionDecision(state);
        
        expect(state.redFlagsFound).toContain('fever.temp_value');
        expect(state.phaseStatus).toBe('escalated');
        expect(decision.type).toBe('escalate');
    });

    it('TC-05: P2 contextual question only triggers when condition met', () => {
        const messages = [
            { role: 'user', content: 'I have a fever' },
            { role: 'assistant', content: getQ('fever', 'fever.temp_value') },
            { role: 'user', content: '99F' },
            { role: 'assistant', content: getQ('fever', 'fever.duration') },
            { role: 'user', content: '1 day' },
            { role: 'assistant', content: getQ('fever', 'fever.rigors') },
            { role: 'user', content: 'No' },
            { role: 'assistant', content: getQ('fever', 'fever.danger_signs') },
            { role: 'user', content: 'No' },
            { role: 'assistant', content: getQ('fever', 'fever.associated') },
            { role: 'user', content: 'None' },
        ];
        const state = buildConversationIntakeState(messages);
        const decision = selectNextQuestionDecision(state);
        
        // duration is 1 day, travel P2 triggers if duration > 3 days.
        // all P1 answered, so it should summarize.
        expect(decision.type).toBe('summarize');
    });

    it('TC-06: Summarizes ONLY when coverageScore == 100', () => {
        const messages = [
            { role: 'user', content: 'Headache' }
        ];
        let state = buildConversationIntakeState(messages);
        let decision = selectNextQuestionDecision(state);
        expect(decision.type).not.toBe('summarize');
        expect(state.coverageScore).toBeLessThan(100);
        
        messages.push({ role: 'assistant', content: getQ('headache', 'headache.duration') });
        messages.push({ role: 'user', content: '2 days' });
        messages.push({ role: 'assistant', content: getQ('headache', 'headache.severity') });
        messages.push({ role: 'user', content: '5/10' });
        messages.push({ role: 'assistant', content: getQ('headache', 'headache.danger_signs') });
        messages.push({ role: 'user', content: 'no' });
        
        state = buildConversationIntakeState(messages);
        decision = selectNextQuestionDecision(state);
        expect(state.coverageScore).toBe(100);
    });

    it('TC-07: Anti-hallucination: Does not ask answered questions', () => {
        const messages = [
            { role: 'user', content: 'I have a headache for 5 days and it is 8/10 severe.' }
        ];
        const state = buildConversationIntakeState(messages);
        const decision = selectNextQuestionDecision(state);
        
        expect(state.answeredFields.has('headache.duration')).toBe(true);
        expect(state.answeredFields.has('headache.severity')).toBe(true);
        expect(decision.field?.key).not.toBe('headache.duration');
        expect(decision.field?.key).not.toBe('headache.severity');
    });

    it('TC-08: Prevents early exit if coverageScore < 100', () => {
        const messages = [
            { role: 'user', content: 'I have stomach ache.' }
        ];
        const state = buildConversationIntakeState(messages);
        const decision = selectNextQuestionDecision(state);
        
        expect(decision.type).toBe('ask_required');
    });

    it('TC-09: Recognizes yes/no answers for clarification correctly', () => {
        const messages = [
            { role: 'user', content: 'I feel dizzy' },
            { role: 'assistant', content: getQ('dizziness', 'dizziness.neuro_red_flags') },
            { role: 'user', content: 'yes' }
        ];
        const state = buildConversationIntakeState(messages);
        
        expect(state.collectedData.get('dizziness.neuro_red_flags')).toBe('yes');
    });

    it('TC-10: Asks P3 questions if available before summarizing', () => {
        const messages = [
            { role: 'user', content: 'I have abdominal pain' },
            { role: 'assistant', content: getQ('abdominal_pain', 'abdominal_pain.location') },
            { role: 'user', content: 'lower right' },
            { role: 'assistant', content: getQ('abdominal_pain', 'abdominal_pain.duration') },
            { role: 'user', content: '2 days' },
            { role: 'assistant', content: getQ('abdominal_pain', 'abdominal_pain.severity') },
            { role: 'user', content: '5/10' },
            { role: 'assistant', content: getQ('abdominal_pain', 'abdominal_pain.danger_signs') },
            { role: 'user', content: 'no' },
            { role: 'assistant', content: getQ('abdominal_pain', 'abdominal_pain.associated') },
            { role: 'user', content: 'none' }
        ];
        const state = buildConversationIntakeState(messages);
        const decision = selectNextQuestionDecision(state);
        
        expect(state.coverageScore).toBe(100);
        expect(decision.type).toBe('ask_optional');
        expect(decision.field?.key).toBe('abdominal_pain.food_stool');
    });

    it('TC-11: Correctly identifies body_pain schema and checks required P1 fields', () => {
        const messages = [{ role: 'user', content: 'I have sharp pain in my right thumb toe.' }];
        const state = buildConversationIntakeState(messages);
        
        expect(state.activeSchemaId).toBe('body_pain');
        expect(state.answeredFields.has('chief_complaint')).toBe(true);
        expect(state.requiredPriorityOneFields).toContain('body_pain.duration');
        expect(state.requiredPriorityOneFields).toContain('body_pain.severity');
        expect(state.requiredPriorityOneFields).toContain('body_pain.red_flags');
        expect(state.coverageScore).toBeLessThan(100);
    });
});
