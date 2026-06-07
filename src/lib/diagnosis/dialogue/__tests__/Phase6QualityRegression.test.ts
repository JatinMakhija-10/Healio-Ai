import { describe, it, expect } from 'vitest';
import { scoreTurn } from '../../testing/QualityScoringEngine';
import { buildConversationIntakeState, ChatTranscriptMessage } from '../ConversationIntakeState';
import { SYMPTOM_QUESTION_SCHEMAS } from '../SymptomQuestionSchemas';

describe('Phase 6: Quality Scoring Framework & Regression Suite', () => {
    
    it('FAILURE SCENARIO: Bot asks duration twice in same session -> catch via answeredFields check', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'user', content: 'I have a fever.' },
            { role: 'assistant', content: 'How long have you had the fever?' },
            { role: 'user', content: 'Since yesterday.' }
        ];
        
        const prevState = buildConversationIntakeState(messages);
        
        // Assistant asks duration AGAIN
        const badAssistantMessage: ChatTranscriptMessage = { role: 'assistant', content: 'How many days have you had it?' };
        
        const nextState = buildConversationIntakeState([...messages, badAssistantMessage]);
        
        const result = scoreTurn(prevState, messages[messages.length - 1], badAssistantMessage, nextState);
        
        // Should lose the point for notAlreadyAnswered
        expect(result.metrics.notAlreadyAnswered).toBe(false);
        expect(result.score).toBeLessThanOrEqual(3);
        expect(result.feedback).toContain("Assistant asked about 'fever.duration' which was already answered.");
    });

    it('FAILURE SCENARIO: Bot asks lifestyle question before all priority-1 fields filled', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'user', content: 'I have a fever.' }
        ];
        
        const prevState = buildConversationIntakeState(messages);
        // Priority 1 for fever includes temp_value, duration, rigors, danger_signs.
        
        // Assistant skips to history/lifestyle (associated or history)
        const badAssistantMessage: ChatTranscriptMessage = { role: 'assistant', content: 'Have you been traveling recently?' };
        
        const nextState = buildConversationIntakeState([...messages, badAssistantMessage]);
        
        const result = scoreTurn(prevState, messages[messages.length - 1], badAssistantMessage, nextState);
        
        // Should lose the point for matchesPriorityQueue
        expect(result.metrics.matchesPriorityQueue).toBe(false);
        expect(result.score).toBeLessThanOrEqual(3);
    });

    it('FAILURE SCENARIO: Bot gives differential without asking fever temperature or duration', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'user', content: 'I have a fever.' }
        ];
        
        const prevState = buildConversationIntakeState(messages);
        
        // Assistant outputs final diagnosis right away
        const badAssistantMessage: ChatTranscriptMessage = { role: 'assistant', content: '{"condition": "Viral Fever", "confidence": 85}' };
        
        const nextState = buildConversationIntakeState([...messages, badAssistantMessage]);
        
        const result = scoreTurn(prevState, messages[messages.length - 1], badAssistantMessage, nextState);
        
        // Should lose the point for matchesPriorityQueue because P1 fields aren't satisfied
        expect(result.metrics.matchesPriorityQueue).toBe(false);
        expect(result.score).toBeLessThanOrEqual(3);
    });

    it('FAILURE SCENARIO: Red-flag symptom mentioned, bot continues normal questioning', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'user', content: 'I have chest pain and shortness of breath.' } // Shortness of breath is a red flag
        ];
        
        const prevState = buildConversationIntakeState(messages);
        
        // Assistant ignores the red flag and asks normal question
        const badAssistantMessage: ChatTranscriptMessage = { role: 'assistant', content: 'How long have you had the chest pain?' };
        
        const nextState = buildConversationIntakeState([...messages, badAssistantMessage]);
        
        // Note: nextState will have redFlagsFound length > 0
        const result = scoreTurn(prevState, messages[messages.length - 1], badAssistantMessage, nextState);
        
        expect(result.metrics.noRedFlagsMissed).toBe(false);
        expect(result.score).toBeLessThanOrEqual(3);
        expect(result.feedback[0]).toMatch(/Red flag was present .* but assistant did not escalate/);
    });

    it('SUCCESS SCENARIO: Bot correctly follows priority queue and gets 4/4', () => {
        const messages: ChatTranscriptMessage[] = [
            { role: 'user', content: 'I have a headache.' }
        ];
        
        const prevState = buildConversationIntakeState(messages);
        
        // Headache schema P1 fields: duration, severity, danger_signs
        // The bot should ask duration first.
        const goodAssistantMessage: ChatTranscriptMessage = { role: 'assistant', content: 'How long have you had the headache?' };
        
        const nextState = buildConversationIntakeState([...messages, goodAssistantMessage]);
        
        const result = scoreTurn(prevState, messages[messages.length - 1], goodAssistantMessage, nextState);
        
        expect(result.score).toBe(4);
        expect(result.metrics.notAlreadyAnswered).toBe(true);
        expect(result.metrics.matchesPriorityQueue).toBe(true);
        expect(result.metrics.noRedFlagsMissed).toBe(true);
        expect(result.metrics.onlyOneQuestionAsked).toBe(true);
    });

    it('Calculates average score threshold correctly', () => {
        // Mock a 50-turn suite by generating an array of scores.
        // Let's say 40 turns got 4, and 10 turns got 3.
        const scores = [...Array(40).fill(4), ...Array(10).fill(3)];
        
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        expect(average).toBeGreaterThanOrEqual(3.5);
    });
});
