/**
 * Memory Service — Transactional Vector Memory & Fact Store
 *
 * Audit Ref: Forensic Audit §8, F5, Inconsistency #2
 *
 * Fixes:
 *   1. Conflict Resolution (F5): Supersedes older/contradictory facts using a
 *      `superseded_by` pointer rather than relying on score-sorted dedup.
 *   2. Prompt Injection Defense (F6): Sanitizes all facts before storage and
 *      retrieval before interpolation into system prompts.
 *   3. Explicit Provenance: Distinguishes 'user_stated' vs 'llm_inferred'.
 */

import { getSupabaseAdmin } from '@/lib/ai/config';
import { sanitizeForPromptInjection } from './consultationHistory';

export type MedicalFactCategory = 'allergy' | 'chronic_condition' | 'medication' | 'symptom_history' | 'other';
export type MedicalFactProvenance = 'user_stated' | 'llm_inferred' | 'system_inferred' | 'clinician_confirmed';

export interface MedicalFact {
    id: string;
    user_id: string;
    fact_text: string;
    category: MedicalFactCategory;
    provenance: MedicalFactProvenance;
    confidence: number;
    immutable: boolean;
    superseded_by?: string | null;
    created_at: string;
    deleted_at?: string | null;
}

export interface StoreFactParams {
    userId: string;
    factText: string;
    category: MedicalFactCategory;
    provenance: MedicalFactProvenance;
    embedding?: number[];
    immutable?: boolean;
    confidence?: number;
}

/**
 * Stores a new medical fact in Supabase `user_medical_facts`.
 */
export async function storeMedicalFact(params: StoreFactParams): Promise<MedicalFact | null> {
    const supabase = getSupabaseAdmin();
    const cleanText = sanitizeForPromptInjection(params.factText, 300);

    if (!cleanText) return null;

    const { data, error } = await supabase
        .from('user_medical_facts')
        .insert({
            user_id: params.userId,
            fact_text: cleanText,
            category: params.category,
            provenance: params.provenance,
            embedding: params.embedding || null,
            immutable: params.immutable ?? false,
            confidence: params.confidence ?? 1.0,
        })
        .select()
        .single();

    if (error) {
        console.error('[MemoryService] Error storing medical fact:', error);
        return null;
    }

    return data as MedicalFact;
}

/**
 * Conflict Resolution (Fixes Audit F5):
 * Supersedes an existing fact with a new correction.
 * Marks `oldFact.superseded_by = newFact.id`.
 */
export async function supersedeMedicalFact(
    oldFactId: string,
    newParams: StoreFactParams
): Promise<MedicalFact | null> {
    const supabase = getSupabaseAdmin();

    // 1. Insert the new correcting fact
    const newFact = await storeMedicalFact(newParams);
    if (!newFact) return null;

    // 2. Link old fact to the new fact's ID
    const { error } = await supabase
        .from('user_medical_facts')
        .update({
            superseded_by: newFact.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', oldFactId)
        .eq('user_id', newParams.userId);

    if (error) {
        console.error('[MemoryService] Error marking fact as superseded:', error);
    }

    return newFact;
}

/**
 * Fetches all active (non-superseded, non-deleted) facts for a user.
 */
export async function getActiveUserMedicalFacts(userId: string): Promise<MedicalFact[]> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('user_medical_facts')
        .select('*')
        .eq('user_id', userId)
        .is('superseded_by', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[MemoryService] Error fetching active medical facts:', error);
        return [];
    }

    return (data || []) as MedicalFact[];
}

/**
 * Performs vector similarity search over active medical facts via RPC.
 */
export async function searchActiveMedicalFacts(
    userId: string,
    queryEmbedding: number[],
    threshold = 0.60,
    count = 5
): Promise<Array<MedicalFact & { similarity: number }>> {
    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('match_user_medical_facts', {
        p_user_id: userId,
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: count,
    });

    if (error) {
        console.error('[MemoryService] RPC match_user_medical_facts failed:', error);
        return [];
    }

    return data || [];
}
