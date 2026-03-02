const fs = require('fs');
const path = require('path');

const enginePath = path.join(process.cwd(), 'src', 'lib', 'diagnosis', 'engine.ts');
let content = fs.readFileSync(enginePath, 'utf8');

// Find the start of the diagnose function
const index = content.indexOf('export async function diagnose(symptoms: UserSymptomData)');
if (index !== -1) {
    // Keep everything before the function
    const newContent = content.substring(0, index) + `export async function diagnose(symptoms: UserSymptomData): Promise<{
    results: DiagnosisResult[],
    question?: ClarificationQuestion,
    alerts?: string[],
    uncertainty?: UncertaintyEstimate,
    clinicalRules?: RuleResult[]
}> {
    const alerts = scanRedFlags(symptoms);

    try {
        const response = await fetch('/api/diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symptoms, userProfile: symptoms.userProfile })
        });

        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();

        if (data.diagnosis) {
            const aiDiag = data.diagnosis;
            
            const result: DiagnosisResult = {
                condition: {
                    id: 'ai_diagnosis',
                    name: aiDiag.conditionName || 'Homeopathic Assessment',
                    description: aiDiag.description || '',
                    severity: aiDiag.severity || 'moderate',
                    matchCriteria: { locations: [], types: [] },
                    remedies: aiDiag.remedies || [],
                    indianHomeRemedies: [],
                    exercises: [],
                    warnings: aiDiag.warnings || [],
                    seekHelp: aiDiag.seekHelp ? 'Please consult a doctor immediately.' : ''
                },
                confidence: aiDiag.confidence || 85,
                matchedKeywords: [],
                reasoningTrace: [{ factor: 'AI Assessment', impact: 100, type: 'prior' }]
            };
            
            if (aiDiag.reasoningTrace) {
                result.reasoningTrace.push({ factor: aiDiag.reasoningTrace, impact: 100, type: 'pattern' });
            }

            return { results: [result], alerts };
        }
    } catch (e) {
        console.error("AI diagnosis failed:", e);
    }
    
    return { results: [], alerts };
}
`;
    fs.writeFileSync(enginePath, newContent);
    console.log("Patched engine.ts successfully.");
} else {
    console.log("Could not find diagnose function.");
}
