import {
    ConversationIntakeState,
    ChatTranscriptMessage,
    inferAskedFieldFromAssistant,
    INTAKE_FIELD_DEFINITIONS
} from '../dialogue/ConversationIntakeState';

export interface TurnScore {
    score: number; // 0 to 4
    metrics: {
        notAlreadyAnswered: boolean;
        matchesPriorityQueue: boolean;
        noRedFlagsMissed: boolean;
        onlyOneQuestionAsked: boolean;
    };
    feedback: string[];
}

export function scoreTurn(
    prevState: ConversationIntakeState,
    userMessage: ChatTranscriptMessage | null,
    assistantMessage: ChatTranscriptMessage,
    nextState: ConversationIntakeState
): TurnScore {
    let score = 0;
    const feedback: string[] = [];
    const metrics = {
        notAlreadyAnswered: false,
        matchesPriorityQueue: false,
        noRedFlagsMissed: false,
        onlyOneQuestionAsked: false
    };

    const fieldDefinitions = prevState.fieldDefinitions?.length ? prevState.fieldDefinitions : INTAKE_FIELD_DEFINITIONS;
    const askedField = inferAskedFieldFromAssistant(assistantMessage.content, fieldDefinitions);
    const isFinalTurn = assistantMessage.content.includes('"condition"') || assistantMessage.content.includes('final diagnosis');

    // 1. Question was not already answered
    if (askedField) {
        if (prevState.answeredFields.has(askedField)) {
            feedback.push(`Assistant asked about '${askedField}' which was already answered.`);
        } else {
            metrics.notAlreadyAnswered = true;
            score += 1;
        }
    } else {
        // If no field was asked, it's not a redundant question.
        metrics.notAlreadyAnswered = true;
        score += 1;
    }

    // 2. Question matches next item in priority queue
    const topPending = prevState.pendingQueue[0];
    if (askedField && topPending && (askedField === topPending.key || topPending.aliases?.includes(askedField))) {
        metrics.matchesPriorityQueue = true;
        score += 1;
    } else if (!askedField && isFinalTurn && prevState.requiredPriorityOneFields.every(f => prevState.answeredFields.has(f))) {
        // Valid to skip asking if it's the final turn and all P1 fields are answered
        metrics.matchesPriorityQueue = true;
        score += 1;
    } else if (!askedField && !topPending) {
        metrics.matchesPriorityQueue = true;
        score += 1;
    } else {
        const expected = topPending ? topPending.key : 'none';
        feedback.push(`Assistant asked about '${askedField || 'nothing'}' but top priority was '${expected}'.`);
    }

    // 3. No red flags were missed in this turn
    const hasRedFlagInState = nextState.redFlagsFound.length > 0;
    const isEmergencyResponse = assistantMessage.content.includes("seek emergency medical care") || assistantMessage.content.includes("WARNING:");
    
    if (hasRedFlagInState && !isEmergencyResponse) {
        feedback.push(`Red flag was present (${nextState.redFlagsFound.join(', ')}) but assistant did not escalate.`);
    } else {
        metrics.noRedFlagsMissed = true;
        score += 1;
    }

    // 4. Only one question asked in this reply
    // Strip JSON blocks to avoid counting questions inside the UI hints.
    const contentWithoutJson = assistantMessage.content.replace(/\{[\s\S]*?\}/g, '');
    const questionMarks = (contentWithoutJson.match(/\?/g) || []).length;
    
    if (questionMarks <= 1) {
        metrics.onlyOneQuestionAsked = true;
        score += 1;
    } else {
        feedback.push(`Assistant asked multiple questions (${questionMarks} question marks found).`);
    }

    return { score, metrics, feedback };
}
