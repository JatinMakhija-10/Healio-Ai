import { describe, expect, it } from 'vitest';
import { buildConversationIntakeState } from '../ConversationIntakeState';
import { selectNextQuestionDecision } from '../NextQuestionSelector';

describe('NextQuestionSelector', () => {
    it('escalates immediately when red flags are present', () => {
        const state = buildConversationIntakeState([
            { role: 'user', content: 'I have chest pain and shortness of breath' },
        ]);

        const decision = selectNextQuestionDecision(state);

        expect(decision.type).toBe('escalate');
        expect(decision.stopQuestioning).toBe(true);
    });

    it('keeps clarification on the same field before advancing', () => {
        const state = buildConversationIntakeState([
            { role: 'user', content: 'I have a headache' },
            { role: 'assistant', content: 'How long have you had the headache?' },
            { role: 'user', content: 'not sure what you mean' },
        ]);

        const decision = selectNextQuestionDecision(state);

        expect(decision.type).toBe('clarify');
        expect(decision.field?.key).toBe('headache.duration');
    });

    it('asks the highest-priority required field before contextual fields', () => {
        const state = buildConversationIntakeState([
            { role: 'user', content: 'I have fever for 3 days' },
        ]);

        const decision = selectNextQuestionDecision(state);

        expect(decision.type).toBe('ask_required');
        expect(decision.field?.key).toBe('fever.temp_value');
    });

    it('asks a triggered fever travel field only after contextual prerequisites are met', () => {
        const state = buildConversationIntakeState([
            { role: 'user', content: 'I have fever for 5 days, temperature is 101F, with chills' },
            { role: 'assistant', content: 'Any confusion, difficulty breathing, stiff neck, or persistent high fever?' },
            { role: 'user', content: 'No' },
            { role: 'assistant', content: 'Any cough, sore throat, burning urine, rash, vomiting, or headache?' },
            { role: 'user', content: 'cough' },
        ]);

        const decision = selectNextQuestionDecision(state);

        expect(decision.type).toBe('ask_contextual');
        expect(decision.field?.key).toBe('fever.travel');
    });

    it('summarizes instead of asking an untriggered contextual field', () => {
        const state = buildConversationIntakeState([
            { role: 'user', content: 'I have fever for 3 days, temperature is 101F, with chills' },
            { role: 'assistant', content: 'Any confusion, difficulty breathing, stiff neck, or persistent high fever?' },
            { role: 'user', content: 'No' },
            { role: 'assistant', content: 'Any cough, sore throat, burning urine, rash, vomiting, or headache?' },
            { role: 'user', content: 'cough' },
        ]);

        const decision = selectNextQuestionDecision(state);

        expect(decision.type).toBe('summarize');
        expect(decision.stopQuestioning).toBe(true);
    });
});
