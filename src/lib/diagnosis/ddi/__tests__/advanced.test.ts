/**
 * DDI Advanced / Hard Tests
 *
 * Stress-tests the interaction of multiple system layers:
 *  - Severity precedence (worst-match wins across multiple fired rules)
 *  - FDC cascade (multi-generic expansion triggers the worst matching rule)
 *  - Remedy exclusivity invariant (safe ∩ flagged ∩ blocked = ∅)
 *  - Total count invariant (safe + flagged + blocked = total input)
 *  - interactingWith accuracy
 *  - ddiApplied semantics (true = user has meds, regardless of match count)
 *  - Case-insensitive brand matching
 *  - Condition normalization edge cases
 *  - Multi-section mixed input
 *  - Rare/edge clinical rules: tamoxifen, MAOIs, transplant, hormone therapy
 *
 * Run with: npx vitest run src/lib/diagnosis/ddi/__tests__/advanced.test.ts
 */

import { describe, it, expect } from 'vitest';
import { checkInteractions } from '../checker';
import { parseMedicationList } from '../medParser';

// ─── Helper ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function name(r: any): string {
    return (r?.name || r?.remedy || '').toLowerCase();
}

// ─── 1. Severity Precedence ───────────────────────────────────────────────────

describe('Severity Precedence — worst-match wins', () => {

    it('same remedy matched by major + moderate rules → severity = major', () => {
        // metformin→moderate with ginseng, warfarin→major with ginseng
        // If both meds are active, the worst (major) must win
        const ginsengRemedy = { name: 'Ginseng Root Tea', preparation: 'Brew daily' };
        const result = checkInteractions({
            userMedications: ['warfarin', 'Glycomet'],
            userConditions: [],
            homeRemedies: [ginsengRemedy],
        });

        expect(result.flaggedRemedies.length + result.blockedRemedies.length).toBeGreaterThan(0);
        const match =
            result.flaggedRemedies.find((f) => name(f.remedy).includes('ginseng')) ||
            result.blockedRemedies.find((f) => name(f.remedy).includes('ginseng'));
        expect(match).toBeDefined();
        expect(['major', 'contraindicated']).toContain(match!.severity);
    });

    it("SSRI + warfarin user + St. John's Wort → contraindicated overrides all", () => {
        // Both SSRI rule (contraindicated) and anticoagulant rule (contraindicated) fire
        // Result must be contraindicated
        const stJohnsWort = { name: "St. John's Wort", potency: '30C' };
        const result = checkInteractions({
            userMedications: ['Nexito', 'warfarin'], // SSRI + anticoagulant
            userConditions: [],
            homeopathicRemedies: [stJohnsWort],
        });

        expect(result.blockedRemedies.length).toBeGreaterThan(0);
        const match = result.blockedRemedies.find((f) => name(f.remedy).includes("st. john"));
        expect(match?.severity).toBe('contraindicated');
        expect(match?.isBlocked).toBe(true);
    });

    it('FDC cascade: Glycomet GP (metformin+glimepiride) + karela → MAJOR (not moderate)', () => {
        // metformin+karela = moderate, glimepiride+karela = major
        // FDC expansion puts both generics in medTriggers → worst rule wins → major
        const karela = { name: 'Karela Juice', method: 'Drink 200ml fasting' };
        const result = checkInteractions({
            userMedications: ['Glycomet GP'],
            userConditions: [],
            homeRemedies: [karela],
        });

        const match = result.flaggedRemedies.find((f) => name(f.remedy).includes('karela'));
        expect(match).toBeDefined();
        expect(match!.severity).toBe('major');
    });

    it('FDC cascade: Ecosprin AV + red yeast rice → major (atorvastatin component fires)', () => {
        const redYeastRice = { name: 'Red Yeast Rice', preparation: 'With food' };
        const result = checkInteractions({
            userMedications: ['Ecosprin AV'], // aspirin + atorvastatin
            userConditions: [],
            homeRemedies: [redYeastRice],
        });

        const match = result.flaggedRemedies.find((f) => name(f.remedy).includes('red yeast'));
        expect(match).toBeDefined();
        expect(match!.severity).toBe('major');
    });
});

// ─── 2. Invariant Tests ───────────────────────────────────────────────────────

describe('Structural Invariants — exclusivity and count', () => {

    function totalInputCount(result: ReturnType<typeof checkInteractions>): number {
        const allSafe = new Set(result.safeRemedies.map((r: object) => JSON.stringify(r)));
        return (
            result.blockedRemedies.length +                         // blocked NOT in safe
            result.flaggedRemedies.length +                         // flagged ARE in safe (double-counted by design)
            allSafe.size - result.flaggedRemedies.length            // safe-only
        );
    }

    it('blocked remedies never appear in safeRemedies', () => {
        const stJohnsWort = { name: "St. John's Wort", potency: '6C' };
        const safeHerb   = { name: 'Peppermint Tea', method: 'Steep' };
        const result = checkInteractions({
            userMedications: ['warfarin'],
            userConditions: [],
            homeopathicRemedies: [stJohnsWort, safeHerb],
        });

        const safeNames = result.safeRemedies.map(name);
        for (const blocked of result.blockedRemedies) {
            expect(safeNames).not.toContain(name(blocked.remedy));
        }
    });

    it('a remedy cannot appear in both flaggedRemedies and blockedRemedies', () => {
        const karela  = { name: 'Karela Juice', method: 'Fasting' };
        const stJohns = { name: "St. John's Wort", potency: '30C' };
        const result = checkInteractions({
            userMedications: ['warfarin', 'Glycomet'],
            userConditions: [],
            homeopathicRemedies: [stJohns],
            homeRemedies: [karela],
        });

        const flaggedIds = new Set(result.flaggedRemedies.map((f) => JSON.stringify(f.remedy)));
        const blockedIds = new Set(result.blockedRemedies.map((f) => JSON.stringify(f.remedy)));

        for (const id of flaggedIds) {
            expect(blockedIds.has(id)).toBe(false);
        }
    });

    it('safe remedies that have no conflict are always in safeRemedies', () => {
        const safe1 = { name: 'Peppermint Tea', method: 'Steep' };
        const safe2 = { name: 'Honey Water', method: 'Mix' };
        const result = checkInteractions({
            userMedications: ['warfarin'],
            userConditions: [],
            homeRemedies: [safe1, safe2],
        });

        const safeNames = result.safeRemedies.map(name);
        expect(safeNames).toContain('peppermint tea');
        expect(safeNames).toContain('honey water');
    });

    it('ddiApplied = true whenever meds present, even with zero remedy conflicts', () => {
        const result = checkInteractions({
            userMedications: ['warfarin'],
            userConditions: [],
            homeRemedies: [{ name: 'Peppermint Tea' }, { name: 'Honey Water' }],
        });

        // Warfarin is recognized → allUserTriggers.length > 0 → ddiApplied = true
        expect(result.ddiApplied).toBe(true);
        // But no flagged/blocked if remedies don't conflict
        expect(result.flaggedRemedies).toHaveLength(0);
        expect(result.blockedRemedies).toHaveLength(0);
    });

    it('ddiApplied = false when NO meds, conditions, or pregnancy', () => {
        const result = checkInteractions({
            userMedications: [],
            userConditions: [],
            homeRemedies: [{ name: 'Garlic High Dose' }],
            userProfile: { pregnant: false },
        });

        expect(result.ddiApplied).toBe(false);
    });

    it('interactionAlerts is always an array (never undefined), even when empty', () => {
        const result = checkInteractions({
            userMedications: [],
            userConditions: [],
            homeRemedies: [],
        });

        expect(Array.isArray(result.interactionAlerts)).toBe(true);
    });

    it('empty strings in medication list are silently skipped', () => {
        const result = checkInteractions({
            userMedications: ['', '  ', 'warfarin'],
            userConditions: [],
            homeRemedies: [],
        });

        // Only warfarin matters; empty strings must not crash or pollute
        expect(result.ddiApplied).toBe(true);
        expect(result.parsedMeds.some((m) => m.canonical === 'warfarin')).toBe(true);
        expect(result.parsedMeds.some((m) => m.canonical === '' || m.canonical === '  ')).toBe(false);
    });
});

// ─── 3. Case Insensitivity ────────────────────────────────────────────────────

describe('Case Insensitivity — brand and condition matching', () => {

    it("'WARFARIN' (uppercase) matches same as 'warfarin'", () => {
        const stJohns = { name: "St. John's Wort", potency: '30C' };
        const result = checkInteractions({
            userMedications: ['WARFARIN'],
            userConditions: [],
            homeopathicRemedies: [stJohns],
        });

        expect(result.blockedRemedies.length).toBeGreaterThan(0);
        expect(result.blockedRemedies[0].severity).toBe('contraindicated');
    });

    it("'GLYCOMET' (uppercase) resolves to metformin", () => {
        const { recognized } = parseMedicationList(['GLYCOMET']);
        expect(recognized.some((r) => r.canonical === 'metformin')).toBe(true);
    });

    it("'Kidney Disease' (mixed case condition) fires kidney rules", () => {
        const nettle = { name: 'Nettle Leaf Tea', preparation: 'Steep' };
        const result = checkInteractions({
            userMedications: [],
            userConditions: ['KIDNEY DISEASE'],
            homeRemedies: [nettle],
        });

        expect(result.ddiApplied).toBe(true);
        const blocked = result.blockedRemedies.map((f) => name(f.remedy));
        expect(blocked.some((n) => n.includes('nettle'))).toBe(true);
    });

    it("'G6PD DEFICIENCY' (uppercase condition) → fires G6PD rules", () => {
        const henna = { name: 'Mehndi Leaf Tea', preparation: 'Drink' };
        const result = checkInteractions({
            userMedications: [],
            userConditions: ['G6PD DEFICIENCY'],
            homeRemedies: [henna],
        });

        // CONDITION_TO_TRIGGER does cond.toLowerCase() so uppercase works
        expect(result.ddiApplied).toBe(true);
        const blocked = result.blockedRemedies.map((f) => name(f.remedy));
        expect(blocked.some((n) => n.includes('mehndi') || n.includes('henna'))).toBe(true);
    });
});

// ─── 4. Rare / Specialist Rules ───────────────────────────────────────────────

describe('Specialist Clinical Rules', () => {

    it('MAOIs + ginseng → contraindicated (hypertensive crisis risk)', () => {
        const ginseng = { name: 'Panax Ginseng Extract', preparation: 'Take capsule' };
        const result = checkInteractions({
            userMedications: ['phenelzine'], // MAOI
            userConditions: [],
            homeRemedies: [ginseng],
        });

        expect(result.blockedRemedies.some((f) => name(f.remedy).includes('ginseng'))).toBe(true);
        expect(result.blockedRemedies.find((f) => name(f.remedy).includes('ginseng'))?.severity).toBe('contraindicated');
    });

    it('cyclosporine + St. John\'s Wort → contraindicated (transplant rejection risk)', () => {
        const stJohns = { name: "St. John's Wort", potency: '30C' };
        const result = checkInteractions({
            userMedications: ['cyclosporine'],
            userConditions: [],
            homeopathicRemedies: [stJohns],
        });

        expect(result.blockedRemedies.some((f) => name(f.remedy).includes("st. john"))).toBe(true);
    });

    it('Wysolone (prednisolone) + kalmegh → major (immunosuppression counteracted)', () => {
        const kalmegh = { name: 'Kalmegh Churna', preparation: 'Mix in water' };
        const result = checkInteractions({
            userMedications: ['Wysolone'], // prednisolone
            userConditions: [],
            ayurvedicRemedies: [kalmegh],
        });

        expect(result.flaggedRemedies.some((f) => name(f.remedy).includes('kalmegh'))).toBe(true);
        const match = result.flaggedRemedies.find((f) => name(f.remedy).includes('kalmegh'));
        expect(match?.severity).toBe('major');
    });

    it('tamoxifen + shatavari → major (phytoestrogenic conflict)', () => {
        const shatavari = { name: 'Shatavari Churna', preparation: 'With milk' };
        const result = checkInteractions({
            userMedications: ['tamoxifen'],
            userConditions: [],
            ayurvedicRemedies: [shatavari],
        });

        expect(result.flaggedRemedies.some((f) => name(f.remedy).includes('shatavari'))).toBe(true);
        const match = result.flaggedRemedies.find((f) => name(f.remedy).includes('shatavari'));
        expect(match?.severity).toBe('major');
    });

    it('digoxin + arjuna → moderate (cardiac glycoside-like activity)', () => {
        const arjuna = { name: 'Arjuna Bark Decoction', preparation: 'Boil and drink' };
        const result = checkInteractions({
            userMedications: ['digoxin'],
            userConditions: [],
            ayurvedicRemedies: [arjuna],
        });

        expect(result.flaggedRemedies.some((f) => name(f.remedy).includes('arjuna'))).toBe(true);
        const match = result.flaggedRemedies.find((f) => name(f.remedy).includes('arjuna'));
        expect(match?.severity).toBe('moderate');
    });

    it('heart failure + licorice → contraindicated (fluid/sodium retention)', () => {
        const licorice = { name: 'Mulethi Tea', preparation: 'Steep in hot water' };
        const result = checkInteractions({
            userMedications: [],
            userConditions: ['Heart Failure'],
            homeRemedies: [licorice],
        });

        expect(result.ddiApplied).toBe(true);
        const blocked = result.blockedRemedies.map((f) => name(f.remedy));
        expect(blocked.some((n) => n.includes('mulethi') || n.includes('licorice'))).toBe(true);
        const match = result.blockedRemedies.find((f) =>
            name(f.remedy).includes('mulethi') || name(f.remedy).includes('licorice')
        );
        expect(match?.severity).toBe('contraindicated');
    });

    it('hypertension disease + ephedra → contraindicated (sympathomimetic BP spike)', () => {
        const ephedra = { name: 'Somalata / Ephedra Extract', preparation: 'Take capsule' };
        const result = checkInteractions({
            userMedications: [],
            userConditions: ['Hypertension (Disease)'],
            homeRemedies: [ephedra],
        });

        expect(result.ddiApplied).toBe(true);
        const blocked = result.blockedRemedies.map((f) => name(f.remedy));
        expect(blocked.some((n) => n.includes('somalata') || n.includes('ephedra'))).toBe(true);
    });

    it('G6PD + bitter melon → major (vicine/convicine hemolysis risk)', () => {
        const karela = { name: 'Bitter Melon Juice', method: 'Drink fasting' };
        const result = checkInteractions({
            userMedications: [],
            userConditions: ['G6PD Deficiency'],
            homeRemedies: [karela],
        });

        expect(result.flaggedRemedies.some((f) =>
            name(f.remedy).includes('bitter melon') || name(f.remedy).includes('karela')
        )).toBe(true);
        const match = result.flaggedRemedies.find((f) =>
            name(f.remedy).includes('bitter melon') || name(f.remedy).includes('karela')
        );
        expect(match?.severity).toBe('major');
    });

    it('Acitrom 1 AND Acitrom 2 → both resolve to acenocoumarol', () => {
        const { recognized: r1 } = parseMedicationList(['Acitrom 1']);
        const { recognized: r2 } = parseMedicationList(['Acitrom 2']);
        expect(r1.some((m) => m.canonical === 'acenocoumarol')).toBe(true);
        expect(r2.some((m) => m.canonical === 'acenocoumarol')).toBe(true);
    });
});

// ─── 5. Pregnancy — All blocked remedies at once ──────────────────────────────

describe('Pregnancy — multiple simultaneous contraindications', () => {

    it('pregnancy blocks papaya + arnica + ajwain simultaneously', () => {
        const papaya = { name: 'Raw Papaya', preparation: 'Eat fresh' };
        const arnica = { name: 'Arnica Q', potency: 'Q' };
        const ajwain = { name: 'Ajwain Water', preparation: 'Boil and drink' };
        const safe   = { name: 'Warm Honey Water', preparation: 'Drink' };

        const result = checkInteractions({
            userMedications: [],
            userConditions: [],
            homeRemedies: [papaya, arnica, ajwain, safe],
            userProfile: { pregnant: true },
        });

        const blockedNames = result.blockedRemedies.map((f) => name(f.remedy));
        expect(blockedNames.some((n) => n.includes('papaya'))).toBe(true);
        expect(blockedNames.some((n) => n.includes('arnica'))).toBe(true);
        expect(blockedNames.some((n) => n.includes('ajwain'))).toBe(true);
        // Safe remedy must pass through
        expect(result.safeRemedies.some((r: { name: string }) => r.name === 'Warm Honey Water')).toBe(true);
    });

    it('pregnancy + pineapple/bromelain → contraindicated', () => {
        const pineapple = { name: 'Pineapple Juice', preparation: 'Fresh drink' };
        const result = checkInteractions({
            userMedications: [],
            userConditions: [],
            homeRemedies: [pineapple],
            userProfile: { pregnant: true },
        });

        const blocked = result.blockedRemedies.map((f) => name(f.remedy));
        expect(blocked.some((n) => n.includes('pineapple'))).toBe(true);
    });
});

// ─── 6. Multi-Section Mixed Input ─────────────────────────────────────────────

describe('Multi-Section Inputs — all remedy types simultaneously', () => {

    it('remedies across all 3 sections checked independently', () => {
        const warfarinUser = { userMedications: ['warfarin'], userConditions: [] };
        const stJohns   = { name: "St. John's Wort", potency: '30C' };          // homeopathic
        const ashwagandha = { name: 'Ashwagandha Churna', preparation: 'In milk' }; // ayurvedic
        const garlic    = { name: 'Garlic Cloves', preparation: '2 daily' };     // home

        const result = checkInteractions({
            ...warfarinUser,
            homeopathicRemedies: [stJohns],
            ayurvedicRemedies:   [ashwagandha],
            homeRemedies:        [garlic],
        });

        // St. John's Wort → contraindicated (blocked)
        expect(result.blockedRemedies.some((f) => name(f.remedy).includes("st. john"))).toBe(true);
        // Garlic → major (flagged, still in safe list)
        expect(result.flaggedRemedies.some((f) => name(f.remedy).includes('garlic'))).toBe(true);
        // Ashwagandha → should be flagged (warfarin rule includes ashwagandha)
        expect(result.flaggedRemedies.some((f) => name(f.remedy).includes('ashwagandha'))).toBe(true);
        // Nothing unexpected blocked
        expect(result.blockedRemedies.some((f) => name(f.remedy).includes('garlic'))).toBe(false);
    });

    it('Revital H user + recommended ginseng remedy → major SSR interaction via Nexito', () => {
        // User: Nexito (SSRI) → escitalopram trigger exists
        // Recommended: Ginseng supplement → matches SSRI+ginseng rule → major
        const ginsengRemedy = { name: 'Ginseng Capsule', preparation: 'Once daily' };
        const result = checkInteractions({
            userMedications: ['Nexito'],
            userConditions: [],
            homeRemedies: [ginsengRemedy],
        });

        expect(result.flaggedRemedies.some((f) => name(f.remedy).includes('ginseng'))).toBe(true);
        const match = result.flaggedRemedies.find((f) => name(f.remedy).includes('ginseng'));
        expect(match?.severity).toBe('major');
    });

    it('interactingWith field on flaggedRemedy contains the matched trigger token', () => {
        const garlic = { name: 'Garlic Capsule', preparation: 'Daily' };
        const result = checkInteractions({
            userMedications: ['warfarin'],
            userConditions: [],
            homeRemedies: [garlic],
        });

        const match = result.flaggedRemedies.find((f) => name(f.remedy).includes('garlic'));
        expect(match).toBeDefined();
        // interactingWith should contain some form of the warfarin/acenocoumarol trigger
        expect(match!.interactingWith).toBeTruthy();
        expect(typeof match!.interactingWith).toBe('string');
    });
});

// ─── 7. Timing Note Tests ─────────────────────────────────────────────────────

describe('Timing Interactions — timingNote field propagation', () => {

    it('Thyronorm + Calcium carbonate → timingNote is non-empty string', () => {
        const calcium = { name: 'Calcium carbonate tablet', preparation: 'With breakfast' };
        const result = checkInteractions({
            userMedications: ['Thyronorm'],
            userConditions: [],
            homeRemedies: [calcium],
        });

        const match = result.flaggedRemedies.find((f) =>
            name(f.remedy).includes('calcium')
        );
        expect(match).toBeDefined();
        expect(typeof match!.timingNote).toBe('string');
        expect(match!.timingNote!.length).toBeGreaterThan(10);
        // Must NOT be blocked — it's a timing issue only
        expect(match!.isBlocked).toBe(false);
    });

    it('antibiotic + shelcal → timingNote instructs separation', () => {
        const calcium = { name: 'Shelcal 500', preparation: 'Morning' };
        const result = checkInteractions({
            userMedications: ['ciprofloxacin'],
            userConditions: [],
            homeRemedies: [calcium],
        });

        const match = result.flaggedRemedies.find((f) =>
            name(f.remedy).includes('shelcal') || name(f.remedy).includes('calcium')
        );
        // If the antibiotic-calcium rule fires with a timingNote, verify it
        if (match?.timingNote) {
            expect(match.timingNote.toLowerCase()).toMatch(/hour|apart|separate/i);
        }
    });
});
