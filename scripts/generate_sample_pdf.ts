import React from 'react';
import fs from 'fs';
import path from 'path';
import { pdf } from '@react-pdf/renderer';
import { MedicalReportDocument } from '../src/components/chat/MedicalReportPDF';
import { Condition } from '../src/lib/diagnosis/types';

async function generateSampleReport() {
    console.log('Generating sample Medical Report PDF...');

    const sampleCondition: Condition = {
        id: 'gastroenteritis-mild',
        name: 'Mild acute gastroenteritis / indigestion pattern',
        description: 'A temporary digestive irritation causing upper abdominal discomfort, mild nausea, and diarrhea. In a 19-year-old, this frequently stems from dietary shifts or mild stomach upset.',
        severity: 'Mild',
        prevalence: 'common',
        home_remedies: [
            {
                name: 'Cumin and Ginger Infusion',
                description: 'Soothes upper abdominal discomfort and relieves mild nausea.',
                method: 'Boil 1/2 teaspoon cumin seeds and a slice of fresh crushed ginger in 2 cups of water for 5 minutes. Strain and sip warm throughout the day.'
            },
            {
                name: 'Rice Starch Water with Rock Salt',
                description: 'Provides gentle gut hydration and binds loose stools without causing digestive strain.',
                method: 'Drain warm starch water after boiling plain white rice, allow to cool to room temperature, add a tiny pinch of rock salt, and drink slowly.'
            }
        ],
        ayurvedic_remedies: [
            {
                name: 'Bilwadi Churna',
                description: 'Helps calm hyperactive bowel movements and eases mild stomach discomfort.',
                method: '1/2 teaspoon with plain lukewarm water twice daily after food.'
            },
            {
                name: 'Musta (Cyperus rotundus) Decoction',
                description: 'Promotes digestive absorption and relieves mild nausea and loose stools.',
                method: '3 grams Musta powder boiled in 1 cup of water down to half a cup; sip warm twice daily.'
            }
        ],
        homeopathic_remedies: [
            {
                name: 'Arsenicum Album',
                description: 'Suits acute gastrointestinal upset accompanied by nausea, loose stools, and physical fatigue.',
                method: 'Consult a registered homeopathic practitioner for appropriate selection and timing.'
            },
            {
                name: 'Nux Vomica',
                description: 'Helpful when upper abdominal heaviness, mild nausea, and irregular digestion follow dietary changes.',
                method: 'Consult a registered homeopathic practitioner for appropriate selection and timing.'
            }
        ],
        seekHelp: 'Seek immediate medical attention if you experience severe persistent abdominal pain, persistent vomiting, high fever, or blood in stool.',
        redFlags: [
            'Persistent high fever (>102°F / 38.9°C)',
            'Severe focal abdominal pain or rigidity',
            'Inability to retain fluids for >24 hours'
        ]
    };

    const doc = React.createElement(MedicalReportDocument, {
        condition: sampleCondition,
        confidence: 75,
        uncertainty: {
            pointEstimate: 75,
            confidenceInterval: { lower: 68, upper: 82 },
            evidenceQuality: 'MODERATE',
            calibrationQuality: 'WELL-CALIBRATED',
            recommendationConfidence: 0.78,
            ruleBasedConfidence: 0.75,
            entropy: 0.32,
            entropyReduction: 0.15,
            calibrationFactor: 1.0,
            epistemicUncertainty: 0.12,
            aleatoricUncertainty: 0.13
        },
        alerts: [],
        symptoms: [
            'Upper abdominal discomfort',
            'Mild nausea',
            'Loose stools'
        ],
        userName: 'Jatin',
        reportId: 'HA-20260904-D540',
        generatedAt: new Date('2026-09-04T23:36:00+05:30'),
        userProfile: {
            age: '19',
            gender: 'Male',
            weight: '68 kg',
            medications: 'Antacids (over-the-counter) as needed',
            allergies: 'None reported',
            conditions: ['Mild Acid Reflux'],
            smoking: 'Non-smoker',
            alcohol: 'Occasional social',
            exercise: 'Moderate (3x/week)'
        },
        symptomDetails: {
            duration: '24-48 hours',
            intensity: 4,
            frequency: 'Intermittent'
        },
        clinicalRules: [
            {
                rule: 'GI-RULE-101',
                interpretation: 'Acute onset of mild upper abdominal discomfort following dietary variation aligns with transient gastroenteritis.',
                confidenceBonus: 10,
                triggered: true
            },
            {
                rule: 'RED-FLAG-CHECK',
                interpretation: 'Absence of fever, bloody stool, or severe acute localized pain excludes high-risk acute abdomen.',
                confidenceBonus: 5,
                triggered: true
            }
        ],
        reasoningTrace: [
            { factor: 'Acute upper abdominal discomfort', impact: 2.5, type: 'supporting' },
            { factor: 'Mild nausea & loose stools', impact: 2.1, type: 'supporting' },
            { factor: 'Age 19 (Young Adult Profile)', impact: 1.2, type: 'supporting' },
            { factor: 'Absence of High Fever', impact: -0.8, type: 'refuting' }
        ]
    });

    const blob = await pdf(doc).toBlob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to workspace root
    const rootPath = path.join(process.cwd(), 'Arovia_Sample_Medical_Report.pdf');
    fs.writeFileSync(rootPath, buffer);
    console.log(`Saved sample PDF to workspace root: ${rootPath}`);

    // Save to artifacts directory
    const artifactDir = 'C:\\Users\\JATIN\\.gemini\\antigravity-ide\\brain\\c64eaa9a-d34e-4ace-8934-375dc3b8fca7';
    if (fs.existsSync(artifactDir)) {
        const artifactPath = path.join(artifactDir, 'Arovia_Sample_Medical_Report.pdf');
        fs.writeFileSync(artifactPath, buffer);
        console.log(`Saved sample PDF to artifacts: ${artifactPath}`);
    }
}

generateSampleReport().catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
});
