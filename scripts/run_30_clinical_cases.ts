/**
 * Executable Test Runner for 30 Full Multi-Turn Clinical Cases
 *
 * Runs all 30 multi-turn test cases + twist variations through the
 * ConversationIntakeState engine and NextQuestionSelector.
 *
 * Usage:
 *   npx tsx scripts/run_30_clinical_cases.ts
 */

import {
    buildConversationIntakeState,
    ChatTranscriptMessage,
} from '../src/lib/diagnosis/dialogue/ConversationIntakeState';
import { selectNextQuestionDecision } from '../src/lib/diagnosis/dialogue/NextQuestionSelector';
import { scoreTurn } from '../src/lib/diagnosis/testing/QualityScoringEngine';
import {
    CLINICAL_TEST_CASES_30,
    CLINICAL_CASE_TWISTS,
    ClinicalTestCase,
} from '../src/lib/diagnosis/testing/clinical_multi_turn_cases';

interface TurnEvaluationResult {
    turnNumber: number;
    userMessage: string;
    answeredFieldsCount: number;
    redFlagsFound: string[];
    phaseStatus: string;
    decisionType: string;
}

interface CaseEvaluationSummary {
    caseId: number;
    title: string;
    hiddenTargetCondition: string;
    isEmergency: boolean;
    assignedSchema: string;
    totalTurns: number;
    escalatedTurn: number | null;
    finalPhaseStatus: string;
    redFlagsDetected: string[];
    answeredFieldsCount: number;
    passed: boolean;
    failureReason?: string;
}

function runSingleCase(testCase: ClinicalTestCase): CaseEvaluationSummary {
    const messages: ChatTranscriptMessage[] = [
        { role: 'user', content: testCase.start },
    ];

    let state = buildConversationIntakeState(messages);
    let escalatedTurn: number | null = state.phaseStatus === 'escalated' ? 0 : null;

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

        state = buildConversationIntakeState(messages);

        if (state.phaseStatus === 'escalated' && escalatedTurn === null) {
            escalatedTurn = turnNumber;
        }
    });

    const finalDecision = selectNextQuestionDecision(state);

    let passed = true;
    let failureReason: string | undefined;

    if (testCase.isEmergency) {
        if (state.phaseStatus !== 'escalated') {
            passed = false;
            failureReason = `Expected emergency escalation for ${testCase.hiddenTargetCondition}, but phaseStatus was '${state.phaseStatus}'`;
        } else if (finalDecision.type !== 'escalate') {
            passed = false;
            failureReason = `Expected decision type 'escalate', got '${finalDecision.type}'`;
        }
    } else {
        if (state.phaseStatus === 'escalated') {
            passed = false;
            failureReason = `Non-emergency case '${testCase.title}' triggered false-positive escalation (Red flags: ${state.redFlagsFound.join(', ')})`;
        }
    }

    return {
        caseId: testCase.id,
        title: testCase.title,
        hiddenTargetCondition: testCase.hiddenTargetCondition,
        isEmergency: testCase.isEmergency,
        assignedSchema: state.activeSchemaId,
        totalTurns: testCase.followUps.length + 1,
        escalatedTurn,
        finalPhaseStatus: state.phaseStatus,
        redFlagsDetected: state.redFlagsFound,
        answeredFieldsCount: state.answeredFields.size,
        passed,
        failureReason,
    };
}

function main() {
    console.log('\n================================================================');
    console.log('  AROVIA AI CLINICAL DIAGNOSIS ENGINE — 30 MULTI-TURN TEST SUITE');
    console.log('================================================================\n');

    const results: CaseEvaluationSummary[] = [];
    let passedCount = 0;

    for (const testCase of CLINICAL_TEST_CASES_30) {
        const summary = runSingleCase(testCase);
        results.push(summary);

        const statusIcon = summary.passed ? '✓' : '✗';
        const typeLabel = summary.isEmergency ? '[EMERGENCY]' : '[INTAKE]';
        const escInfo = summary.escalatedTurn !== null ? ` (Escalated Turn ${summary.escalatedTurn})` : '';

        console.log(`${statusIcon} Case ${summary.caseId.toString().padStart(2, ' ')} ${typeLabel.padEnd(12, ' ')} ${summary.title.padEnd(36, ' ')} → Schema: ${summary.assignedSchema.padEnd(16, ' ')}${escInfo}`);

        if (!summary.passed) {
            console.log(`    ↳ FAILURE: ${summary.failureReason}`);
        } else {
            passedCount++;
        }
    }

    console.log('\n================================================================');
    console.log(`  RESULTS SUMMARY: ${passedCount} / ${CLINICAL_TEST_CASES_30.length} CASES PASSED (${Math.round((passedCount / CLINICAL_TEST_CASES_30.length) * 100)}%)`);
    console.log('================================================================\n');

    console.log('--- Clinical Case Breakdown ---');
    console.table(
        results.map(r => ({
            ID: r.caseId,
            Title: r.title,
            Condition: r.hiddenTargetCondition,
            Emergency: r.isEmergency ? 'YES' : 'NO',
            Schema: r.assignedSchema,
            EscalationTurn: r.escalatedTurn !== null ? `Turn ${r.escalatedTurn}` : 'N/A',
            RedFlags: r.redFlagsDetected.join(', ') || 'None',
            Status: r.passed ? 'PASS' : 'FAIL',
        }))
    );

    console.log('\n--- Evaluating Case Variations & Twists ---');
    let twistPassCount = 0;

    // Twist T1 Test
    const t1State = buildConversationIntakeState([
        { role: 'user', content: 'I have lower abdominal pain and bleeding.' },
        { role: 'assistant', content: 'How long?' },
        { role: 'user', content: 'Actually, I forgot to mention I am pregnant.' }
    ]);
    if (t1State.phaseStatus === 'escalated') {
        console.log('✓ Twist T1 (Pregnancy announcement): PASSED');
        twistPassCount++;
    } else {
        console.log('✗ Twist T1 (Pregnancy announcement): FAILED');
    }

    // Twist T3 Test
    const t3State = buildConversationIntakeState([
        { role: 'user', content: 'I fell and hit my head yesterday.' },
        { role: 'assistant', content: 'Any symptoms?' },
        { role: 'user', content: 'Worsening headache 8/10, vomited twice, and I take blood thinners.' }
    ]);
    if (t3State.phaseStatus === 'escalated') {
        console.log('✓ Twist T3 (Head trauma + Blood thinners): PASSED');
        twistPassCount++;
    } else {
        console.log('✗ Twist T3 (Head trauma + Blood thinners): FAILED');
    }

    // Twist T7 Test
    const t7State = buildConversationIntakeState([
        { role: 'user', content: 'I have a fever.' },
        { role: 'assistant', content: 'What is your temp?' },
        { role: 'user', content: '99F' },
        { role: 'assistant', content: 'Any other symptoms?' },
        { role: 'user', content: 'Wait, I gave you the wrong temperature, it is 103.2F.' }
    ]);
    if (t7State.collectedData.get('fever.temp_value') === '103.2F') {
        console.log('✓ Twist T7 (Temperature value correction): PASSED');
        twistPassCount++;
    } else {
        console.log('✗ Twist T7 (Temperature value correction): FAILED');
    }

    console.log(`\nTwist Verification: ${twistPassCount} / 3 PASSED\n`);

    if (passedCount < CLINICAL_TEST_CASES_30.length) {
        process.exit(1);
    }
}

main();
