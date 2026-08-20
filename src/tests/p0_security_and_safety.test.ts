import { describe, it, expect } from 'vitest';
import { diagnose } from '../lib/diagnosis/orchestrator';
import { validateOutputAgainstProfile } from '../lib/safety/outputValidator';
import { getExactSafetyFacts } from '../lib/chat/memoryService';
import { UserSymptomData } from '../lib/diagnosis/types';

describe('Phase 0 Safety & Security Verification Tests', () => {

    // ─── P0-5 Emergency Red-Flag Bypass ───────────────────────────────────────
    describe('P0-5 Emergency Red-Flag Bypass', () => {
        it('should short-circuit and immediately return emergency guidance for cardiac symptoms', async () => {
            const emergencySymptoms: UserSymptomData = {
                location: ['Chest'],
                painType: 'Crushing pressure',
                additionalNotes: 'Profuse sweating and shortness of breath',
            };

            const response = await diagnose(emergencySymptoms);

            expect(response.results).toHaveLength(0);
            expect(response.alerts).toBeDefined();
            expect(response.alerts?.some((a) => a.includes('CARDIAC EMERGENCY') || a.includes('911'))).toBe(true);
            expect(response.orchestrationMeta?.pipelineStages).toContain('emergency_bypass_triggered');
        });

        it('should short-circuit immediately for stroke symptoms', async () => {
            const strokeSymptoms: UserSymptomData = {
                location: ['Face'],
                painType: 'Sudden weakness',
                additionalNotes: 'Face drooping and slurred speech',
            };

            const response = await diagnose(strokeSymptoms);

            expect(response.results).toHaveLength(0);
            expect(response.alerts?.some((a) => a.includes('STROKE WARNING'))).toBe(true);
            expect(response.orchestrationMeta?.pipelineStages).toContain('emergency_bypass_triggered');
        });
    });

    // ─── P0-3 Blocked Remedy Enforcement in OutputValidator ──────────────────
    describe('P0-3 DDI Blocked Remedy Enforcement', () => {
        it('should flag and sanitize an output containing a DDI-blocked remedy', () => {
            const profileWithBlocked = {
                gender: 'male',
                age: 45,
                blockedRemedies: ['Warfarin', 'Aspirin'],
            };

            const aiResponseWithBlocked = {
                description: 'Patient assessment for mild swelling.',
                remedies: [
                    { name: 'Warfarin', dosage: '5mg', indication: 'Anticoagulant' },
                    { name: 'Arnica Montana', dosage: '30C', indication: 'Swelling relief' },
                ],
                warnings: ['Consult doctor if taking Warfarin.'],
            };

            const result = validateOutputAgainstProfile(aiResponseWithBlocked, profileWithBlocked);

            expect(result.isValid).toBe(false);
            expect(result.fieldViolations.some((v) => v.term.includes('Warfarin'))).toBe(true);
            expect(result.sanitizedJson).toBeDefined();

            // Blocked remedy 'Warfarin' should be filtered out of remedies array in sanitizedJson
            const sanitizedRemedies = (result.sanitizedJson as { remedies?: Array<{ name: string }> })?.remedies || [];
            expect(sanitizedRemedies.some((r) => r.name.toLowerCase().includes('warfarin'))).toBe(false);
            expect(sanitizedRemedies.some((r) => r.name.includes('Arn'))).toBe(true);
        });

        it('should pass cleanly when no blocked remedies are present in output', () => {
            const profileWithBlocked = {
                gender: 'male',
                age: 45,
                blockedRemedies: ['Warfarin'],
            };

            const cleanAiResponse = {
                description: 'Gastritis assessment.',
                remedies: [
                    { name: 'Nux Vomica', dosage: '30C' },
                ],
                warnings: ['Avoid heavy meals.'],
            };

            const result = validateOutputAgainstProfile(cleanAiResponse, profileWithBlocked);

            expect(result.isValid).toBe(true);
            expect(result.fieldViolations).toHaveLength(0);
        });
    });

    // ─── P0-6 Exact Safety Facts Export ──────────────────────────────────────
    describe('P0-6 Exact Structured Safety Fact Retrieval', () => {
        it('should export getExactSafetyFacts function', () => {
            expect(typeof getExactSafetyFacts).toBe('function');
        });
    });

    // ─── P0-8 PHI Redaction Pattern Verification ─────────────────────────────
    describe('P0-8 PHI Redaction Pattern', () => {
        it('should redact emails, phone numbers, and explicit names from free text', () => {
            const redactPHI = (text: string): string => {
                if (!text) return '';
                return text
                    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED EMAIL]')
                    .replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED PHONE]')
                    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED ID]')
                    .replace(/(my name is|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, '$1 [REDACTED NAME]');
            };

            const inputWithPHI = 'My name is John Doe, contact me at john@example.com or 555-123-4567';
            const redacted = redactPHI(inputWithPHI);

            expect(redacted).not.toContain('john@example.com');
            expect(redacted).not.toContain('555-123-4567');
            expect(redacted).not.toContain('John Doe');
            expect(redacted).toContain('[REDACTED EMAIL]');
            expect(redacted).toContain('[REDACTED PHONE]');
            expect(redacted).toContain('[REDACTED NAME]');
        });
    });
});
