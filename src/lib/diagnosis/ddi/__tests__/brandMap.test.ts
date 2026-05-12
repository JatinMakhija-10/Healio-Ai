/**
 * Brand Mapper Unit Tests — India Edition
 *
 * Verifies parseMedication() and parseMedicationList() for:
 *  - Exact Indian brand → generic lookups
 *  - FDC expansion (one brand → multiple ParsedMedication entries)
 *  - Confidence scoring
 *  - Unrecognized brand graceful handling
 *
 * Run with: npx vitest run src/lib/diagnosis/ddi/__tests__/brandMap.test.ts
 */

import { describe, it, expect } from 'vitest';
import { parseMedication, parseMedicationList, FDC_MAP } from '../medParser';

describe('Brand Mapper — Exact Lookups', () => {

    it("'Dolo 650' → paracetamol, confidence 1.0", () => {
        const result = parseMedication('Dolo 650');
        expect(result.canonical).toBe('paracetamol');
        expect(result.confidence).toBe(1.0);
        expect(result.category).toBe('allopathic');
    });

    it("'dolo' (lowercase, partial) → paracetamol, confidence ≥ 0.85", () => {
        const result = parseMedication('dolo');
        expect(result.canonical).toBe('paracetamol');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it("'Acitrom' → acenocoumarol (India's dominant OAC)", () => {
        const result = parseMedication('Acitrom');
        expect(result.canonical).toBe('acenocoumarol');
        expect(result.confidence).toBe(1.0);
    });

    it("'Acitrom 2' → acenocoumarol (strength variant)", () => {
        const result = parseMedication('Acitrom 2');
        expect(result.canonical).toBe('acenocoumarol');
        expect(result.confidence).toBe(1.0);
    });

    it("'Thyronorm' → levothyroxine", () => {
        const result = parseMedication('Thyronorm');
        expect(result.canonical).toBe('levothyroxine');
        expect(result.confidence).toBe(1.0);
    });

    it("'Glycomet' → metformin", () => {
        const result = parseMedication('Glycomet');
        expect(result.canonical).toBe('metformin');
        expect(result.confidence).toBe(1.0);
    });

    it("'Nexito' → escitalopram", () => {
        const result = parseMedication('Nexito');
        expect(result.canonical).toBe('escitalopram');
        expect(result.confidence).toBe(1.0);
    });

    it("'Amaryl' → glimepiride", () => {
        const result = parseMedication('Amaryl');
        expect(result.canonical).toBe('glimepiride');
        expect(result.confidence).toBe(1.0);
    });

    it("'Tonact' → atorvastatin", () => {
        const result = parseMedication('Tonact');
        expect(result.canonical).toBe('atorvastatin');
        expect(result.confidence).toBe(1.0);
    });

    it("'Wysolone' → prednisolone", () => {
        const result = parseMedication('Wysolone');
        expect(result.canonical).toBe('prednisolone');
        expect(result.confidence).toBe(1.0);
    });
});

describe('Brand Mapper — FDC Detection', () => {

    it("'Ecosprin AV' detected as FDC with aspirin + atorvastatin", () => {
        const result = parseMedication('Ecosprin AV');
        expect(result.isFDC).toBe(true);
        expect(result.fdcGenerics).toContain('aspirin');
        expect(result.fdcGenerics).toContain('atorvastatin');
        expect(result.confidence).toBe(1.0);
    });

    it("'Revital' detected as FDC with ginseng component (hidden DDI risk)", () => {
        const result = parseMedication('Revital');
        expect(result.isFDC).toBe(true);
        expect(result.fdcGenerics).toContain('ginseng');
        expect(result.fdcGenerics).toContain('multivitamin');
    });

    it("'Revital H' also contains ginseng", () => {
        const result = parseMedication('Revital H');
        expect(result.isFDC).toBe(true);
        expect(result.fdcGenerics).toContain('ginseng');
    });

    it("'Pan D' → pantoprazole + domperidone", () => {
        const result = parseMedication('Pan D');
        expect(result.isFDC).toBe(true);
        expect(result.fdcGenerics).toContain('pantoprazole');
        expect(result.fdcGenerics).toContain('domperidone');
    });

    it("'Combiflam' → ibuprofen + paracetamol", () => {
        const result = parseMedication('Combiflam');
        expect(result.isFDC).toBe(true);
        expect(result.fdcGenerics).toContain('ibuprofen');
        expect(result.fdcGenerics).toContain('paracetamol');
    });

    it("'Shelcal' → calcium carbonate + vitamin d3", () => {
        const result = parseMedication('Shelcal');
        expect(result.isFDC).toBe(true);
        expect(result.fdcGenerics).toContain('calcium carbonate');
        expect(result.fdcGenerics).toContain('vitamin d3');
    });

    it("'Glycomet GP' → metformin + glimepiride (both generics)", () => {
        const result = parseMedication('Glycomet GP');
        expect(result.isFDC).toBe(true);
        expect(result.fdcGenerics).toContain('metformin');
        expect(result.fdcGenerics).toContain('glimepiride');
    });
});

describe('Brand Mapper — parseMedicationList FDC Expansion', () => {

    it("'Ecosprin AV' expands to 2 ParsedMedication entries (aspirin + atorvastatin)", () => {
        const { recognized, unrecognized } = parseMedicationList(['Ecosprin AV']);
        expect(unrecognized).toHaveLength(0);
        expect(recognized).toHaveLength(2);
        const canonicals = recognized.map((r) => r.canonical);
        expect(canonicals).toContain('aspirin');
        expect(canonicals).toContain('atorvastatin');
    });

    it("'Revital H' expands to include ginseng in recognized list", () => {
        const { recognized } = parseMedicationList(['Revital H']);
        const canonicals = recognized.map((r) => r.canonical);
        expect(canonicals).toContain('ginseng');
    });

    it("Single molecule brand expands to exactly 1 entry", () => {
        const { recognized } = parseMedicationList(['Thyronorm']);
        expect(recognized).toHaveLength(1);
        expect(recognized[0].canonical).toBe('levothyroxine');
    });

    it("Mixed list: one FDC + one single → correct expansion", () => {
        const { recognized, unrecognized } = parseMedicationList(['Ecosprin AV', 'Thyronorm']);
        // Ecosprin AV → 2, Thyronorm → 1
        expect(recognized.length).toBe(3);
        expect(unrecognized).toHaveLength(0);
        const canonicals = recognized.map((r) => r.canonical);
        expect(canonicals).toContain('aspirin');
        expect(canonicals).toContain('atorvastatin');
        expect(canonicals).toContain('levothyroxine');
    });

    it("Unrecognized brand 'Xyzbrand' → in unrecognized list, confidence < 0.6", () => {
        const { recognized, unrecognized } = parseMedicationList(['Xyzbrand 10mg']);
        expect(unrecognized).toContain('Xyzbrand 10mg');
        // Still added to recognized as passthrough at 0.5, but original in unrecognized
        const match = recognized.find((r) => r.original === 'Xyzbrand 10mg');
        expect(match).toBeDefined();
        expect(match!.confidence).toBeLessThan(0.6);
    });

    it("Empty list → empty result, no crash", () => {
        const { recognized, unrecognized } = parseMedicationList([]);
        expect(recognized).toHaveLength(0);
        expect(unrecognized).toHaveLength(0);
    });
});

describe('Brand Mapper — FDC_MAP Integrity', () => {

    it('Every FDC entry has at least 2 generic components', () => {
        for (const [brand, generics] of Object.entries(FDC_MAP)) {
            expect(generics.length).toBeGreaterThanOrEqual(2);
            // Ensure no empty strings in generics
            generics.forEach((g) => expect(g.trim().length).toBeGreaterThan(0));
            // Ensure lowercase key
            expect(brand).toBe(brand.toLowerCase());
        }
    });
});
