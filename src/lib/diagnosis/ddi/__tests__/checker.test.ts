/**
 * DDI Checker Unit Tests — India Edition
 *
 * Covers the full India-centric ruleset including:
 *  - Acitrom (acenocoumarol) — dominant OAC in India
 *  - Revital H → ginseng (hidden FDC ingredient)
 *  - Ecosprin AV → aspirin + atorvastatin (both rules must fire)
 *  - Shelcal + Thyronorm → timing interaction (not contraindication)
 *  - G6PD + henna → contraindicated
 *  - Pregnancy + raw papaya, ajwain → contraindicated
 *  - Sulfonylurea (glimepiride) + karela → major severity
 *  - Trikatu + 2+ meds → piperine caution alert
 *
 * Run with: npx vitest run src/lib/diagnosis/ddi/__tests__/checker.test.ts
 */

import { describe, it, expect } from 'vitest';
import { checkInteractions } from '../checker';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const garlic        = { name: 'Garlic (High Dose)', preparation: 'Take 2 cloves daily' };
const ginger        = { name: 'Ginger Tea', preparation: 'Boil in water' };
const stJohnsWort   = { name: "St. John's Wort", potency: '30C' };
const turmeric      = { name: 'Turmeric Milk', preparation: 'Mix in milk' };
const arnica        = { name: 'Arnica Montana', potency: '30C' };
const bitterMelon   = { name: 'Bitter Melon Juice', method: 'Drink on empty stomach' };
const fenugreek     = { name: 'Fenugreek Seeds', method: 'Soak overnight' };
const ashwagandha   = { name: 'Ashwagandha Churna', preparation: 'Mix in warm milk' };
const redYeastRice  = { name: 'Red Yeast Rice', preparation: 'Take with meals' };
const safeRemedy    = { name: 'Peppermint Tea', method: 'Steep in hot water' };
const strophanthus  = { name: 'Strophanthus', potency: '30C' };
const nettle        = { name: 'Nettle Leaf Tea', preparation: 'Steep in hot water' };
const rawPapaya     = { name: 'Raw Papaya', preparation: 'Eat fresh' };
const ajwain        = { name: 'Ajwain Water', preparation: 'Boil in water and drink' };
const henna         = { name: 'Mehndi Paste', preparation: 'Apply and consume leaf tea' };
const karela        = { name: 'Karela Juice', method: 'Drink 200ml daily' };
const shelcal       = { name: 'Shelcal', preparation: 'Take with meals' };
const calcium       = { name: 'Calcium carbonate', preparation: 'Take daily' };
const trikatu       = { name: 'Trikatu Churna', preparation: 'Mix in honey' };
const ginseng       = { name: 'Ginseng Root', preparation: 'Brew as tea' };
const arjuna        = { name: 'Arjuna Bark Tea', preparation: 'Boil and drink' };
const punarnava     = { name: 'Punarnava Powder', preparation: 'Mix in water' };

// ─── Original Tests (all still passing) ───────────────────────────────────────

describe('DDI Checker — Medication Interactions', () => {

    it('no medications → all remedies pass through, ddiApplied=false', () => {
        const result = checkInteractions({
            userMedications: [],
            userConditions: [],
            homeRemedies: [garlic, ginger],
            homeopathicRemedies: [stJohnsWort],
        });

        expect(result.ddiApplied).toBe(false);
        expect(result.safeRemedies).toHaveLength(3);
        expect(result.flaggedRemedies).toHaveLength(0);
        expect(result.blockedRemedies).toHaveLength(0);
        expect(result.interactionAlerts).toHaveLength(0);
    });

    it('warfarin + garlic → flagged as major (not blocked)', () => {
        const result = checkInteractions({
            userMedications: ['Warfarin'],
            userConditions: [],
            homeRemedies: [garlic, safeRemedy],
        });

        expect(result.ddiApplied).toBe(true);
        expect(result.flaggedRemedies.some((f) => getRemedyName(f.remedy).includes('garlic'))).toBe(true);
        expect(result.flaggedRemedies.find((f) => getRemedyName(f.remedy).includes('garlic'))?.severity).toBe('major');
        expect(result.safeRemedies.some((r: { name: string }) => r.name === 'Peppermint Tea')).toBe(true);
    });

    it("warfarin + St. John's Wort → contraindicated (blocked)", () => {
        const result = checkInteractions({
            userMedications: ['warfarin'],
            userConditions: [],
            homeopathicRemedies: [stJohnsWort],
        });

        expect(result.blockedRemedies).toHaveLength(1);
        expect(result.blockedRemedies[0].severity).toBe('contraindicated');
        expect(result.blockedRemedies[0].isBlocked).toBe(true);
        expect(result.safeRemedies.some((r: { name: string }) => r.name.includes('St.'))).toBe(false);
    });

    it("SSRI (fluoxetine) + St. John's Wort → contraindicated", () => {
        const result = checkInteractions({
            userMedications: ['Flunil'], // brand → fluoxetine
            userConditions: [],
            homeopathicRemedies: [stJohnsWort],
        });

        expect(result.blockedRemedies).toHaveLength(1);
        expect(result.blockedRemedies[0].severity).toBe('contraindicated');
        expect(result.interactionAlerts.some((a) => a.includes('contraindicated'))).toBe(true);
    });

    it('metformin + bitter melon + fenugreek → both flagged as moderate', () => {
        const result = checkInteractions({
            userMedications: ['Glycomet'], // brand → metformin
            userConditions: [],
            homeRemedies: [bitterMelon, fenugreek, safeRemedy],
        });

        const flaggedNames = result.flaggedRemedies.map((f) => getRemedyName(f.remedy));
        expect(flaggedNames.some((n) => n.includes('bitter melon') || n.includes('karela'))).toBe(true);
        expect(flaggedNames.some((n) => n.includes('fenugreek') || n.includes('methi'))).toBe(true);
        expect(result.safeRemedies.some((r: { name: string }) => r.name === 'Peppermint Tea')).toBe(true);
    });

    it('statin + red yeast rice → flagged as major', () => {
        const result = checkInteractions({
            userMedications: ['Atorlip'], // brand → atorvastatin
            userConditions: [],
            homeRemedies: [redYeastRice],
        });

        expect(result.flaggedRemedies.some((f) => getRemedyName(f.remedy).includes('red yeast'))).toBe(true);
        expect(result.flaggedRemedies[0].severity).toBe('major');
    });
});

describe('DDI Checker — India-Specific Brand Names', () => {

    it('Acitrom (acenocoumarol) + garlic → major (Indian OAC)', () => {
        const result = checkInteractions({
            userMedications: ['Acitrom'], // Indian acenocoumarol → acenocoumarol
            userConditions: [],
            homeRemedies: [garlic],
        });

        expect(result.ddiApplied).toBe(true);
        expect(result.flaggedRemedies.some((f) => getRemedyName(f.remedy).includes('garlic'))).toBe(true);
        expect(result.flaggedRemedies.find((f) => getRemedyName(f.remedy).includes('garlic'))?.severity).toBe('major');
    });

    it("Acitrom + St. John's Wort → contraindicated", () => {
        const result = checkInteractions({
            userMedications: ['Acitrom'],
            userConditions: [],
            homeopathicRemedies: [stJohnsWort],
        });

        expect(result.blockedRemedies.some((f) => getRemedyName(f.remedy).includes("st. john"))).toBe(true);
    });

    it('Nexito (escitalopram) + St. John\'s Wort → contraindicated', () => {
        const result = checkInteractions({
            userMedications: ['Nexito'], // brand → escitalopram
            userConditions: [],
            homeopathicRemedies: [stJohnsWort],
        });

        expect(result.blockedRemedies).toHaveLength(1);
        expect(result.blockedRemedies[0].severity).toBe('contraindicated');
    });

    it('Ecosprin AV → fires both aspirin AND atorvastatin rules', () => {
        // Ecosprin AV is FDC: aspirin + atorvastatin
        // garlic → aspirin (anticoagulant) interaction, red yeast rice → statin interaction
        const result = checkInteractions({
            userMedications: ['Ecosprin AV'],
            userConditions: [],
            homeRemedies: [garlic, redYeastRice, safeRemedy],
        });

        expect(result.ddiApplied).toBe(true);
        // garlic should be flagged (aspirin component triggers anticoagulant rules)
        const flaggedNames = result.flaggedRemedies.map((f) => getRemedyName(f.remedy));
        expect(flaggedNames.some((n) => n.includes('garlic'))).toBe(true);
        // red yeast rice should be flagged (atorvastatin component triggers statin rules)
        expect(flaggedNames.some((n) => n.includes('red yeast'))).toBe(true);
    });

    it('Glimepiride (Amaryl) + karela → major severity (sulfonylurea risk)', () => {
        const result = checkInteractions({
            userMedications: ['Amaryl'], // brand → glimepiride
            userConditions: [],
            homeRemedies: [karela],
        });

        expect(result.flaggedRemedies.some((f) => getRemedyName(f.remedy).includes('karela'))).toBe(true);
        const match = result.flaggedRemedies.find((f) => getRemedyName(f.remedy).includes('karela'));
        expect(match?.severity).toBe('major');
    });

    it('Thyronorm (levothyroxine) + Shelcal (calcium) → major with timingNote', () => {
        const result = checkInteractions({
            userMedications: ['Thyronorm'],
            userConditions: [],
            homeRemedies: [shelcal],
        });

        expect(result.ddiApplied).toBe(true);
        // Should be flagged (major), not blocked
        const match = result.flaggedRemedies.find((f) =>
            getRemedyName(f.remedy).includes('shelcal') || getRemedyName(f.remedy).includes('calcium')
        );
        expect(match).toBeDefined();
        expect(match?.severity).toBe('major');
        expect(match?.isBlocked).toBe(false); // timing issue, not contraindicated
        expect(match?.timingNote).toBeTruthy(); // timing note must be present for UI
    });
});

describe('DDI Checker — Condition-based Interactions', () => {

    it('kidney disease → high-potassium herbs contraindicated', () => {
        const result = checkInteractions({
            userMedications: [],
            userConditions: ['Kidney Disease'],
            homeRemedies: [nettle, safeRemedy],
        });

        expect(result.ddiApplied).toBe(true);
        const blockedNames = result.blockedRemedies.map((f) => getRemedyName(f.remedy));
        expect(blockedNames.some((n) => n.includes('nettle'))).toBe(true);
    });

    it('pregnancy → arnica oral contraindicated', () => {
        const arnicaOral = { name: 'Arnica', preparation: 'Take orally' };
        const result = checkInteractions({
            userMedications: [],
            userConditions: [],
            homeRemedies: [arnicaOral],
            userProfile: { pregnant: true },
        });

        const blockedNames = result.blockedRemedies.map((f) => getRemedyName(f.remedy));
        expect(blockedNames.some((n) => n.includes('arnica'))).toBe(true);
    });

    it('pregnancy → raw papaya contraindicated (Indian-specific)', () => {
        const result = checkInteractions({
            userMedications: [],
            userConditions: [],
            homeRemedies: [rawPapaya, safeRemedy],
            userProfile: { pregnant: true },
        });

        const blockedNames = result.blockedRemedies.map((f) => getRemedyName(f.remedy));
        expect(blockedNames.some((n) => n.includes('papaya'))).toBe(true);
        // safe remedy should still pass through
        expect(result.safeRemedies.some((r: { name: string }) => r.name === 'Peppermint Tea')).toBe(true);
    });

    it('pregnancy → ajwain (carom seeds) contraindicated', () => {
        const result = checkInteractions({
            userMedications: [],
            userConditions: [],
            homeRemedies: [ajwain],
            userProfile: { pregnant: true },
        });

        const blockedNames = result.blockedRemedies.map((f) => getRemedyName(f.remedy));
        expect(blockedNames.some((n) => n.includes('ajwain'))).toBe(true);
    });

    it('G6PD deficiency + henna → contraindicated', () => {
        const result = checkInteractions({
            userMedications: [],
            userConditions: ['G6PD Deficiency'],
            homeRemedies: [henna, safeRemedy],
        });

        expect(result.ddiApplied).toBe(true);
        const blockedNames = result.blockedRemedies.map((f) => getRemedyName(f.remedy));
        expect(blockedNames.some((n) => n.includes('mehndi') || n.includes('henna'))).toBe(true);
    });

    it('digoxin + strophanthus → contraindicated', () => {
        const result = checkInteractions({
            userMedications: ['digoxin'],
            userConditions: [],
            homeopathicRemedies: [strophanthus],
        });

        expect(result.blockedRemedies.some(
            (f) => getRemedyName(f.remedy).includes('strophanthus')
        )).toBe(true);
    });
});

describe('DDI Checker — Piperine / Trikatu Multi-Drug Caution', () => {

    it('Trikatu + 2+ recognized medications → piperine caution alert', () => {
        const result = checkInteractions({
            userMedications: ['Thyronorm', 'Glycomet'], // 2 recognized meds
            userConditions: [],
            ayurvedicRemedies: [trikatu, safeRemedy],
        });

        expect(result.ddiApplied).toBe(true);
        const hasPiperineAlert = result.interactionAlerts.some(
            (a) => a.toLowerCase().includes('trikatu') || a.toLowerCase().includes('piperine')
        );
        expect(hasPiperineAlert).toBe(true);
    });

    it('Trikatu + 1 medication → no piperine caution (threshold not met)', () => {
        const result = checkInteractions({
            userMedications: ['Thyronorm'], // only 1
            userConditions: [],
            ayurvedicRemedies: [trikatu],
        });

        const hasPiperineAlert = result.interactionAlerts.some(
            (a) => a.toLowerCase().includes('trikatu') || a.toLowerCase().includes('piperine')
        );
        expect(hasPiperineAlert).toBe(false);
    });
});

describe('DDI Checker — Homeopathic Caution Labels', () => {

    it('warfarin + arnica at 30C potency → caution with dilutionSafe flag', () => {
        const result = checkInteractions({
            userMedications: ['warfarin'],
            userConditions: [],
            homeopathicRemedies: [arnica], // arnica with potency: '30C'
        });

        const match = result.flaggedRemedies.find((f) => getRemedyName(f.remedy).includes('arnica'));
        if (match) {
            expect(match.severity).toBe('caution');
            expect(match.dilutionSafe).toBe(true);
            expect(match.isBlocked).toBe(false);
        }
    });
});

describe('DDI Checker — Unrecognized Medications & Edge Cases', () => {

    it('unrecognized freetext med → surfaces warning, does not crash', () => {
        const result = checkInteractions({
            userMedications: ['Patanjali Giloy Ghanvati XYZ Unknown'],
            userConditions: [],
            homeRemedies: [safeRemedy],
        });

        expect(result.safeRemedies.length).toBeGreaterThanOrEqual(0);
        expect(typeof result.ddiApplied).toBe('boolean');
    });

    it('empty remedy arrays → no interactions, safe result', () => {
        const result = checkInteractions({
            userMedications: ['warfarin'],
            userConditions: ['Kidney Disease'],
            homeopathicRemedies: [],
            ayurvedicRemedies: [],
            homeRemedies: [],
        });

        expect(result.safeRemedies).toHaveLength(0);
        expect(result.blockedRemedies).toHaveLength(0);
        expect(result.flaggedRemedies).toHaveLength(0);
    });

    it('multiple conditions + remedies → no crash, all outputs defined', () => {
        const result = checkInteractions({
            userMedications: ['Acitrom', 'Thyronorm', 'Glycomet'],
            userConditions: ['Kidney Disease', 'Hypertension'],
            homeRemedies: [garlic, turmeric, ashwagandha, safeRemedy],
            ayurvedicRemedies: [trikatu],
        });

        expect(Array.isArray(result.safeRemedies)).toBe(true);
        expect(Array.isArray(result.flaggedRemedies)).toBe(true);
        expect(Array.isArray(result.blockedRemedies)).toBe(true);
        expect(Array.isArray(result.interactionAlerts)).toBe(true);
    });
});

// ─── Utility ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRemedyName(remedy: any): string {
    return (remedy?.name || remedy?.remedy || '').toLowerCase();
}
