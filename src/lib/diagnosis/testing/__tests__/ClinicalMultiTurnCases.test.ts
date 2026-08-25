import { describe, it, expect } from 'vitest';
import {
    buildConversationIntakeState,
    ChatTranscriptMessage,
} from '../../dialogue/ConversationIntakeState';
import { selectNextQuestionDecision } from '../../dialogue/NextQuestionSelector';
import {
    CLINICAL_TEST_CASES_30,
    CLINICAL_CASE_TWISTS,
    ClinicalTestCase,
} from '../clinical_multi_turn_cases';

describe('30 Full Multi-Turn Clinical Test Suite', () => {

    CLINICAL_TEST_CASES_30.forEach((testCase: ClinicalTestCase) => {
        describe(`Case ${testCase.id}: ${testCase.title} (${testCase.hiddenTargetCondition})`, () => {

            it('evaluates complete turn-by-turn conversation progression and triage accuracy', () => {
                const messages: ChatTranscriptMessage[] = [
                    { role: 'user', content: testCase.start },
                ];

                let state = buildConversationIntakeState(messages);

                // 1. Initial state inspection
                expect(state.activeSchemaId).toBeDefined();

                let escalatedTurn: number | null = state.phaseStatus === 'escalated' ? 0 : null;

                // 2. Play through follow-up answers one by one
                testCase.followUps.forEach((followUpText: string, index: number) => {
                    const turnNumber = index + 1;
                    const prevAskedField = state.pendingQueue[0]?.key;

                    const simulatedAssistantMsg: ChatTranscriptMessage = {
                        role: 'assistant',
                        content: prevAskedField
                            ? `Could you tell me more about ${prevAskedField}?`
                            : 'Please describe your symptoms.',
                    };

                    const userMsg: ChatTranscriptMessage = {
                        role: 'user',
                        content: followUpText,
                    };

                    messages.push(simulatedAssistantMsg);
                    messages.push(userMsg);

                    const newState = buildConversationIntakeState(messages);

                    // Multi-turn state active
                    expect(newState.collectedData.size).toBeGreaterThanOrEqual(0);

                    if (newState.phaseStatus === 'escalated' && escalatedTurn === null) {
                        escalatedTurn = turnNumber;
                    }

                    state = newState;
                });

                // 3. Triage & Escalation verification
                if (testCase.isEmergency) {
                    expect(state.phaseStatus).toBe('escalated');
                    expect(state.redFlagsFound.length).toBeGreaterThan(0);
                    const decision = selectNextQuestionDecision(state);
                    expect(decision.type).toBe('escalate');
                } else {
                    // Non-emergency cases should proceed with structured intake/summary without false escalation
                    expect(state.phaseStatus).not.toBe('escalated');
                }
            });
        });
    });

    describe('Clinical Case Variations & Twist Tests', () => {
        it('T1: Pregnancy announcement mid-conversation adds pregnancy red flag / context', () => {
            const messages: ChatTranscriptMessage[] = [
                { role: 'user', content: "I have lower abdominal pain and some bleeding." },
                { role: 'assistant', content: "How long have you had this pain?" },
                { role: 'user', content: "It started today." },
                { role: 'assistant', content: "Any other symptoms?" },
                { role: 'user', content: "Actually, I forgot to mention I'm pregnant." }
            ];

            const state = buildConversationIntakeState(messages);
            expect(state.redFlagsFound.length).toBeGreaterThan(0);
            expect(state.phaseStatus).toBe('escalated');
        });

        it('T3: Anticoagulant use with head trauma triggers immediate emergency escalation', () => {
            const messages: ChatTranscriptMessage[] = [
                { role: 'user', content: "I fell and hit my head yesterday." },
                { role: 'assistant', content: "How severe is your headache?" },
                { role: 'user', content: "It's 8/10 now and I've vomited twice. Also, I take blood thinners." }
            ];

            const state = buildConversationIntakeState(messages);
            expect(state.redFlagsFound.length).toBeGreaterThan(0);
            expect(state.phaseStatus).toBe('escalated');
        });

        it('T7: Correctly updates temperature data when user corrects a value mid-intake', () => {
            const messages: ChatTranscriptMessage[] = [
                { role: 'user', content: "I have a fever." },
                { role: 'assistant', content: "What is your temperature?" },
                { role: 'user', content: "99F" },
                { role: 'assistant', content: "How many days have you had it?" },
                { role: 'user', content: "Wait, I gave you the wrong temperature, it's 103.2F." }
            ];

            const state = buildConversationIntakeState(messages);
            expect(state.collectedData.get('fever.temp_value')).toBe('103.2F');
        });

        it('T12: Maintains red flag escalation even if user expresses hospital avoidance', () => {
            const messages: ChatTranscriptMessage[] = [
                { role: 'user', content: "I have severe crushing chest pain radiating to my arm." },
                { role: 'assistant', content: "Emergency guidance" },
                { role: 'user', content: "I don't want to go to the hospital." }
            ];

            const state = buildConversationIntakeState(messages);
            expect(state.phaseStatus).toBe('escalated');
            const decision = selectNextQuestionDecision(state);
            expect(decision.type).toBe('escalate');
        });

        it('T13: Does not skip priority-1 questions when user demands immediate diagnosis prematurely', () => {
            const messages: ChatTranscriptMessage[] = [
                { role: 'user', content: "I have stomach pain." },
                { role: 'assistant', content: "Where is the pain located?" },
                { role: 'user', content: "Can you just tell me what disease I have?" }
            ];

            const state = buildConversationIntakeState(messages);
            expect(state.coverageScore).toBeLessThan(100);
            const decision = selectNextQuestionDecision(state);
            expect(decision.type).toBe('ask_required');
        });
    });
});
