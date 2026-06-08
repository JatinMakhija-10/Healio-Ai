import { NextRequest } from 'next/server';
import { rateLimitCheck } from '@/lib/api/rateLimit';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/ai/config';
import { getJinaEmbedding, getGeminiEmbedding768, getParallelEmbeddings } from '@/lib/ai/jina';
import { buildMedicalHistoryContext } from '@/lib/chat/consultationHistory';
import { logLatency, alertIfSlow, SpanCollector } from '@/lib/chat/latencyMonitor';
import {
    buildConversationIntakeState,
    formatConversationIntakeStateForPrompt,
    hasMinimumDiagnosticData,
    formatNextQuestionDecisionForPrompt,
    selectNextQuestionDecision,
    computeRefinementDecision,
    formatRefinementDecisionForPrompt,
    resolveChipOptionsForSchema,
} from '@/lib/diagnosis/dialogue';

// ── Vercel: allow up to 60 s for this Serverless Function ─────────────────────
export const maxDuration = 60;

// ── JWT→UserId short-lived auth cache (30 s) ─────────────────────────────────
// Eliminates the per-turn Supabase Auth round-trip (~100 ms) while keeping
// the security window tiny (30 s). Expired entries are lazy-evicted.
const AUTH_CACHE = new Map<string, { userId: string; exp: number }>();

async function verifyToken(token: string): Promise<string | null> {
    const hit = AUTH_CACHE.get(token);
    if (hit && Date.now() < hit.exp) return hit.userId;

    const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '',
        { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) return null;

    AUTH_CACHE.set(token, { userId: user.id, exp: Date.now() + 120_000 });
    if (AUTH_CACHE.size > 500) {
        const now = Date.now();
        for (const [k, v] of AUTH_CACHE.entries()) {
            if (now >= v.exp) AUTH_CACHE.delete(k);
        }
        if (AUTH_CACHE.size > 500) {
            const toDelete = Math.ceil(AUTH_CACHE.size * 0.1);
            let deleted = 0;
            for (const k of AUTH_CACHE.keys()) {
                if (deleted >= toDelete) break;
                AUTH_CACHE.delete(k);
                deleted++;
            }
        }
    }
    return user.id;
}

function providerErrorText(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

function providerErrorStatus(error: unknown): number | null {
    if (!error || typeof error !== 'object') return null;
    const candidate = error as { status?: unknown; code?: unknown; error?: { code?: unknown } };
    const rawStatus = candidate.status ?? candidate.code ?? candidate.error?.code;
    return typeof rawStatus === 'number' ? rawStatus : null;
}

// ── Jina AI (768-dim) — for boericke_embeddings & home_remedy_embeddings ──
async function generateEmbedding(text: string): Promise<number[] | null> {
    try { return await getJinaEmbedding(text); }
    catch (e) { console.error('[Jina] embed failed:', e); return null; }
}

// ── Gemini (768-dim) — for ayurvedic_knowledge_embeddings ─────────────────
async function generateEmbedding768(text: string): Promise<number[] | null> {
    return getGeminiEmbedding768(text);
}

// Alias kept for home remedies (same provider as Boericke — Jina)
async function generateEmbedding3072(text: string): Promise<number[] | null> {
    return generateEmbedding(text);
}

// ── RAG: Homeopathic (Boericke's Materia Medica) ───────────────────────────
// Deduplicates by remedy_name — keeps only the highest-similarity chunk per remedy
async function fetchBoerickeContext(embedding: number[]): Promise<string> {
    try {
        const supabase = getSupabaseAdmin(); // singleton
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any).rpc('match_boericke_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.60,
            match_count: 10,
        });
        if (!data?.length) return '';

        // Deduplicate: keep only the HIGHEST-similarity chunk per remedy
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const seen = new Map<string, any>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of data as any[]) {
            const key = (row.remedy_name ?? '').toLowerCase().trim();
            if (!key) continue;
            if (!seen.has(key) || (row.similarity ?? 0) > (seen.get(key).similarity ?? 0)) {
                seen.set(key, row);
            }
        }

        return [...seen.values()]
            .filter(c => (c.similarity ?? 0) >= 0.60)
            .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
            .slice(0, 5)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any, i: number) =>
                `[${i + 1}] REMEDY: ${c.remedy_name} | relevance: ${((c.similarity ?? 0) * 100).toFixed(0)}%\n${c.chunk_text}`
            ).join('\n\n');
    } catch {
        return '';
    }
}

// ── RAG: Ayurvedic Classical Texts ──────────────────────────────────────────
// Sources: Planet Ayurveda books, CCRAS e-books, classical Sanskrit texts
// IMPORTANT: These are FORMAL Ayurvedic medicines — herbs, formulations, decoctions
// that require purchase from an Ayurvedic pharmacy. NOT kitchen shelf items.
// NOTE: ayurvedic_knowledge_embeddings uses vector(768) — pass 768-dim embedding only.
async function fetchAyurvedicContext(embedding768: number[]): Promise<string> {
    try {
        const supabase = getSupabaseAdmin(); // singleton
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rpcCall = (supabase as any).rpc('search_ayurvedic_knowledge', {
            query_embedding: embedding768,
            match_threshold: 0.55,
            match_count: 12,
        });
        const { data } = await Promise.race([
            rpcCall,
            new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 5_000)),
        ]);
        if (!data?.length) return '';

        // Deduplicate: keep one entry per unique source+section combination
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const seen = new Map<string, any>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of data as any[]) {
            const key = `${row.book ?? ''}|${row.section ?? ''}`.toLowerCase().trim();
            if (!key || key === '|') continue;
            if (!seen.has(key) || (row.similarity ?? 0) > (seen.get(key).similarity ?? 0)) {
                seen.set(key, row);
            }
        }

        return [...seen.values()]
            .filter(c => (c.similarity ?? 0) >= 0.60)
            .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
            .slice(0, 6)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any, i: number) =>
                `[${i + 1}] SOURCE: ${c.book} | SECTION: ${c.section ?? 'General'} | relevance: ${((c.similarity ?? 0) * 100).toFixed(0)}%\n${c.text}`
            ).join('\n\n');
    } catch {
        return '';
    }
}

// ── RAG: Ayurvedic PDFs (Jina 768-dim) ───────────────────────────────────────
async function fetchAyurvedicPdfContext(embedding768: number[] | null): Promise<string> {
    if (!embedding768) return '';
    try {
        const supabase = getSupabaseAdmin();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rpcCall = (supabase as any).rpc('match_ayurvedic_pdfs', {
            query_embedding: embedding768,
            match_threshold: 0.60,
            match_count: 5,
        });
        const { data } = await Promise.race([
            rpcCall,
            new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 5_000)),
        ]);
        if (!data?.length) return '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const seen = new Map<string, any>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of data as any[]) {
            const key = `PDF::${row.source_file}::${row.chunk_text?.slice(0, 100)}`;
            if (!seen.has(key) || (row.similarity ?? 0) > (seen.get(key).similarity ?? 0)) {
                seen.set(key, row);
            }
        }

        return [...seen.values()]
            .filter(c => (c.similarity ?? 0) >= 0.60)
            .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
            .slice(0, 3)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any, i: number) =>
                `[PDF${i + 1}] SOURCE: ${c.source_file} | PAGE: ${c.page_number} | relevance: ${((c.similarity ?? 0) * 100).toFixed(0)}%\n${c.chunk_text}`
            ).join('\n\n');
    } catch {
        return '';
    }
}

// ── RAG: Home Remedies (Dadi-Nani ke Nuskhe) ─────────────────────────────────
// Source: nuskhe.json — 1,051 traditional household remedies
// IMPORTANT: These are IMMEDIATE kitchen-shelf remedies — haldi, adrak, tulsi,
// shahad, nimbu, ajwain, jeera, pudina, lahsun. No pharmacy needed.
async function fetchHomeRemedyContext(embedding3072: number[] | null): Promise<string> {
    if (!embedding3072) return '';
    try {
        const supabase = getSupabaseAdmin(); // singleton
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc('match_home_remedy_embeddings', {
            query_embedding: embedding3072,
            match_threshold: 0.58,
            match_count: 8,
        });
        if (error) {
            console.error('[RAG] home_remedy_embeddings RPC error:', error.message);
            return '';
        }
        if (!data?.length) return '';

        // Deduplicate by ailment+remedy_name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const seen = new Map<string, any>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of data as any[]) {
            const key = `${row.ailment ?? ''}|${row.remedy_name ?? ''}`.toLowerCase().trim();
            if (!seen.has(key) || (row.similarity ?? 0) > (seen.get(key).similarity ?? 0)) {
                seen.set(key, row);
            }
        }

        return [...seen.values()]
            .filter(c => (c.similarity ?? 0) >= 0.58)
            .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
            .slice(0, 5)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any, i: number) => {
                const nameHindi = c.remedy_name_hindi ? ` / ${c.remedy_name_hindi}` : '';
                const ailmentHindi = c.ailment_hindi ? ` (${c.ailment_hindi})` : '';
                return [
                    `[${i + 1}] AILMENT: ${c.ailment}${ailmentHindi} | NUSKHA: ${c.remedy_name}${nameHindi} | relevance: ${((c.similarity ?? 0) * 100).toFixed(0)}%`,
                    c.chunk_text,
                ].join('\n');
            }).join('\n\n');
    } catch (e) {
        console.error('[RAG] Home remedy fetch error:', e);
        return '';
    }
}


// ── Chat RAG Cache ───────────────────────────────────────────────────────────
// Per-symptom-text cache that survives warm serverless re-use.
// Keyed by first 150 chars of symptom summary + skipHomeRemedies flag.
// TTL: 5 min, max 150 entries.
interface ChatRagCacheEntry {
    context: string;
    homeRemediesAvailable: boolean;
    ts: number;
}
const CHAT_RAG_CACHE = new Map<string, ChatRagCacheEntry>();
const CHAT_RAG_TTL   = 5 * 60 * 1_000; // 5 min
const CHAT_RAG_MAX   = 150;

function chatRagKey(symptomSummary: string, skipHome: boolean): string {
    return `${symptomSummary.slice(0, 150).toLowerCase().trim()}::${skipHome}`;
}

// ── Parallelised multi-source RAG ─────────────────────────────────────────────
async function fetchAllContext(symptomSummary: string, skipHomeRemedies = false, spans?: SpanCollector): Promise<{ context: string; homeRemediesAvailable: boolean }> {
    // ── Cache check ──────────────────────────────────────────────────────────
    const cacheKey = chatRagKey(symptomSummary, skipHomeRemedies);
    const cached = CHAT_RAG_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CHAT_RAG_TTL) {
        console.log('[RAG] Cache HIT — skipping embed + RPC cycle');
        spans?.record('ragCacheHit', 0);
        spans?.setMeta({ ragCacheHit: true });
        return { context: cached.context, homeRemediesAvailable: cached.homeRemediesAvailable };
    }

    try {
        const t0Embed = Date.now();

        // ── Fire BOTH providers in PARALLEL ──────────────────────────────────
        // Jina  → boericke_embeddings + home_remedy_embeddings (768-dim)
        // Gemini → ayurvedic_knowledge_embeddings (768-dim, Gemini-ingested)
        // Both start simultaneously; neither waits for the other.
        const [{ jina: jinaEmb, gemini768: geminiEmb }, jinaHomeEmb] = await Promise.all([
            getParallelEmbeddings(symptomSummary),
            skipHomeRemedies ? Promise.resolve({ jina: null, gemini768: null }) : getParallelEmbeddings(symptomSummary),
        ]);

        // Use shared Jina embedding for both Boericke and Home Remedies
        const embedding     = jinaEmb;                    // Jina  → Boericke
        const embedding768  = geminiEmb;                  // Gemini → Ayurvedic
        const embedding3072 = jinaHomeEmb.jina ?? jinaEmb; // Jina  → Home Remedies

        const embedDone = Date.now();
        spans?.record('embedJina', embedDone - t0Embed);
        spans?.record('embedGemini768', embedDone - t0Embed);
        if (!embedding) return { context: '', homeRemediesAvailable: false };

        const t0Rpc = Date.now();
        const [homeopathicRaw, ayurvedicRaw, homeRemedyRaw, ayurvedicPdfRaw] = await Promise.all([
            fetchBoerickeContext(embedding),
            embedding768 ? fetchAyurvedicContext(embedding768) : Promise.resolve(''),
            fetchHomeRemedyContext(embedding3072),
            embedding ? fetchAyurvedicPdfContext(embedding) : Promise.resolve(''),
        ]);
        const rpcDone = Date.now();
        spans?.record('ragBoericke', rpcDone - t0Rpc);
        spans?.record('ragAyurvedic', rpcDone - t0Rpc);
        if (!skipHomeRemedies) spans?.record('ragHomeRemedy', rpcDone - t0Rpc);

        // Track whether home remedies RAG data was actually retrieved
        const homeRemediesAvailable = !skipHomeRemedies && !!homeRemedyRaw;

        const sections = [
            homeopathicRaw && [
                '[SECTION A: HOMEOPATHIC — Boerickes Materia Medica]',
                'Use entries below ONLY for homeopathic_remedies JSON array.',
                homeopathicRaw,
            ].join('\n'),
            ayurvedicRaw || ayurvedicPdfRaw ? [
                '[SECTION B: AYURVEDIC CLASSICAL MEDICINE — Planet Ayurveda / CCRAS / Classical Texts / PDF Manuals]',
                'FORMAL Ayurvedic herbs & formulations (Ashwagandha, Triphala, Sitopaladi, etc.)',
                'Require Ayurvedic pharmacy. Use ONLY for ayurvedic_remedies JSON array.',
                ayurvedicRaw,
                ayurvedicPdfRaw ? `\n--- Additional PDF Manuals Context ---\n${ayurvedicPdfRaw}` : ''
            ].filter(Boolean).join('\n') : null,
            homeRemedyRaw && [
                '[SECTION C: DADI-NANI KE NUSKHE — Household Kitchen Remedies]',
                'IMMEDIATE home remedies: haldi, adrak, tulsi, shahad, nimbu, ajwain, jeera, pudina.',
                'NO pharmacy needed. Use ONLY for home_remedies JSON array.',
                homeRemedyRaw,
            ].join('\n'),
        ].filter(Boolean);

        const context = sections.length ? sections.join('\n\n') : '';
        console.log(`[RAG] Sections: Homeopathic=${!!homeopathicRaw}, Ayurvedic=${!!ayurvedicRaw}, HomeRemedies=${homeRemediesAvailable} (skipHomeRemedies=${skipHomeRemedies})`);

        // ── Store in cache ───────────────────────────────────────────────────
        if (context) {
            if (CHAT_RAG_CACHE.size >= CHAT_RAG_MAX) {
                const firstKey = CHAT_RAG_CACHE.keys().next().value;
                if (firstKey) CHAT_RAG_CACHE.delete(firstKey);
            }
            CHAT_RAG_CACHE.set(cacheKey, { context, homeRemediesAvailable, ts: Date.now() });
        }

        return { context, homeRemediesAvailable };
    } catch (e) {
        console.error('[RAG] Combined fetch error:', e);
        return { context: '', homeRemediesAvailable: false };
    }
}

// ── Build comprehensive patient profile context from user_metadata ──────────────
// Extracts the FULL medical profile (onboarding + persona builder data) and
// formats it for the system prompt so the AI always knows who it's talking to.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPatientProfileContext(userMeta: Record<string, any>): string {
    if (!userMeta) return '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mp: Record<string, any> = userMeta.medical_profile || {};
    const vitals = mp.vitals || {};
    const lifestyle = mp.lifestyle || {};

    // Resolve fields (flat fields from persona builder win, nested from onboarding are fallback)
    const age = mp.age ?? vitals.age ?? userMeta.age;
    const gender = mp.gender ?? vitals.gender ?? userMeta.gender;
    const weight = mp.weight ?? vitals.weight;
    const height = mp.height ?? vitals.height;
    const fullName = userMeta.full_name || userMeta.name;

    // Conditions
    const conditions: string[] = Array.isArray(mp.conditions) ? mp.conditions : [];

    // Allergies — merge drug + food + flat
    const allergies: string[] = [];
    if (mp.allergies && typeof mp.allergies === 'string') allergies.push(mp.allergies);
    if (Array.isArray(mp.drugAllergies)) allergies.push(...mp.drugAllergies);
    if (Array.isArray(mp.foodAllergies)) allergies.push(...mp.foodAllergies);
    const uniqueAllergies = [...new Set(allergies.filter(Boolean))];

    // Medications
    let medications: string[] = [];
    if (Array.isArray(mp.medicationList)) {
        medications = mp.medicationList.map((m: unknown): string =>
            typeof m === 'string' ? m : String((m as Record<string, unknown>)?.name || '')
        ).filter((s: string) => s.length > 0);
    } else if (Array.isArray(mp.medications)) {
        medications = mp.medications.map((m: unknown): string => typeof m === 'string' ? m : '').filter((s: string) => s.length > 0);
    } else if (typeof mp.medications === 'string' && mp.medications) {
        medications = mp.medications.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    // Family history
    const familyHistory: string[] = Array.isArray(mp.familyHistory)
        ? mp.familyHistory
        : Array.isArray(mp.family_history)
            ? mp.family_history
            : typeof mp.family_history === 'string' && mp.family_history
                ? [mp.family_history]
                : [];

    // Lifestyle
    const smoking = mp.smoking ?? lifestyle.smoking;
    const alcohol = mp.alcohol ?? lifestyle.alcohol;
    const diet = mp.diet ?? lifestyle.diet;
    const exercise = mp.activityLevel ?? lifestyle.exercise ?? mp.exercise;
    const sleep = lifestyle.sleepPattern ?? mp.sleepPattern ?? mp.sleep_hours;
    const occupation = lifestyle.occupation ?? mp.occupation;

    // Pregnancy / kidney-liver
    const isPregnant = mp.isPregnant ?? mp.pregnant;
    const kidneyLiver = mp.hasKidneyLiverDisease ?? mp.kidney_liver_disease;
    const recentSurgery = mp.recent_surgery ?? mp.surgeries;

    // Build lines — only include fields that have data
    const lines: string[] = [
        '\n\n=== PATIENT PROFILE (auto-injected from medical records) ===',
        'Use this profile for EVERY response. It affects dosing, contraindications, and personalization.',
    ];

    if (fullName) lines.push(`Name: ${fullName}`);
    if (age) lines.push(`Age: ${age} years`);
    if (gender) lines.push(`Gender: ${gender}`);
    if (weight) lines.push(`Weight: ${weight} kg`);
    if (height) lines.push(`Height: ${height} cm`);

    if (conditions.length) {
        lines.push(`Pre-existing conditions: ${conditions.join(', ')}`);
        lines.push('  -> Factor these into every differential diagnosis. Ask if current symptoms relate to known conditions.');
    }

    if (uniqueAllergies.length) {
        lines.push(`ALLERGIES: ${uniqueAllergies.join(', ')}`);
        lines.push('  -> CRITICAL: NEVER recommend any remedy, herb, or substance the patient is allergic to. Flag if a recommended remedy shares a class with a known allergen.');
    }

    if (medications.length) {
        lines.push(`Current medications: ${medications.join(', ')}`);
        lines.push('  -> Check for drug-drug interactions. Note if any homeopathic/ayurvedic remedy may conflict.');
    }

    if (familyHistory.length) {
        lines.push(`Family history: ${familyHistory.join(', ')}`);
        lines.push('  -> Consider hereditary risk factors in your differential.');
    }

    // Lifestyle block
    const lifestyleParts: string[] = [];
    if (smoking && smoking !== 'never' && smoking !== 'no') lifestyleParts.push(`Smoking: ${smoking}`);
    if (alcohol && alcohol !== 'none' && alcohol !== 'no') lifestyleParts.push(`Alcohol: ${alcohol}`);
    if (diet) lifestyleParts.push(`Diet: ${diet}`);
    if (exercise) lifestyleParts.push(`Activity: ${exercise}`);
    if (sleep) lifestyleParts.push(`Sleep: ${sleep}`);
    if (occupation) lifestyleParts.push(`Occupation: ${occupation}`);
    if (lifestyleParts.length) {
        lines.push(`Lifestyle: ${lifestyleParts.join(' | ')}`);
    }

    // Safety flags
    if (isPregnant) {
        lines.push('PREGNANT: YES — NEVER suggest remedies contraindicated in pregnancy. Always flag pregnancy-safety explicitly.');
    }
    if (kidneyLiver) {
        lines.push('KIDNEY/LIVER DISEASE: YES — Adjust dosages. Avoid nephrotoxic/hepatotoxic substances.');
    }
    if (recentSurgery && recentSurgery !== 'no' && recentSurgery !== 'none' && recentSurgery !== false) {
        lines.push(`Recent surgery: ${typeof recentSurgery === 'string' ? recentSurgery : 'Yes'}`);
    }

    if (age && Number(age) <= 12) {
        lines.push('PEDIATRIC PATIENT — Use child-safe dosages. Recommend consulting a pediatrician.');
    }
    if (age && Number(age) >= 65) {
        lines.push('GERIATRIC PATIENT — Consider age-related sensitivities. Use conservative dosing.');
    }

    lines.push('=== END OF PATIENT PROFILE ===');

    // Only return if we have meaningful data beyond the header
    const hasData = age || gender || conditions.length || uniqueAllergies.length || medications.length;
    return hasData ? lines.join('\n') : '';
}

// buildMedicalHistoryContext imported from @/lib/chat/consultationHistory

// ── Extract symptom summary from conversation for RAG ─────────────────────────
function extractSymptomSummary(messages: { role: string; content: string }[]): string {
    return messages.filter(m => m.role === 'user').map(m => m.content).join(' ').slice(0, 500);
}

// ── Count how many turns have happened ─────────────────────────────────────────
function countUserTurns(messages: { role: string }[]): number {
    return messages.filter(m => m.role === 'user').length;
}

// ── Message Role Alternation Validator ─────────────────────────────────────────
// Groq/OpenAI APIs enforce strict alternation: [user] → [assistant] → [user] → ...
// If the sliding window creates consecutive same-role messages, this merges them
// rather than dropping — preserving diagnostic symptom context.
function enforceRoleAlternation(
    messages: { role: string; content: string }[]
): { role: string; content: string }[] {
    const result: { role: string; content: string }[] = [];

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const prev = result[result.length - 1];

        if (!prev) {
            if (msg.role === 'assistant') continue; // drop leading assistant
            result.push(msg);
            continue;
        }

        if (prev.role === msg.role && msg.role !== 'system') {
            // Consecutive same role — merge to preserve context
            if (msg.role === 'user') {
                result[result.length - 1] = {
                    ...prev,
                    content: `${prev.content}\n${msg.content}`,
                };
            } else if (msg.role === 'assistant') {
                // For consecutive assistants, keep the more recent one
                result[result.length - 1] = msg;
            }
        } else {
            result.push(msg);
        }
    }

    // Final message must be user role for the API call
    if (result[result.length - 1]?.role === 'assistant') {
        result.pop();
    }

    return result;
}

// ── Safe Sliding Window Builder ───────────────────────────────────────────────
// Preserves messages[0] (user's language register) and messages[1] (assistant's
// tone register) while building a role-safe sliding window from the tail.
function buildSafeWindow(
    messages: { role: string; content: string }[],
    maxMessages: number
): { role: string; content: string }[] {
    if (messages.length <= maxMessages) return messages;

    const anchor0 = messages[0]; // User turn 1 — language register
    const anchor1 = messages[1]; // Assistant turn 1 — tone/persona register

    // Find the slice start: must begin on a User role boundary
    let sliceStart = messages.length - maxMessages + 2; // +2 because we prepend 2 anchors

    // Align to nearest User message boundary
    while (sliceStart < messages.length && messages[sliceStart]?.role !== 'user') {
        sliceStart++;
    }

    const tail = messages.slice(sliceStart);
    const candidate = [anchor0, anchor1, ...tail].filter(Boolean);

    // Validate alternation — catch any edge case the math missed
    return enforceRoleAlternation(candidate);
}

// ── Language Detection (code-level, not prompt-level) ─────────────────────────────
// Small models ignore prompt-level language rules when the prompt contains
// Hindi tokens (haldi, adrak, etc.). This function detects the user's language
// so we can inject a hard directive the model cannot override.
function detectUserLanguage(text: string): 'english' | 'hinglish' | 'hindi' {
    const trimmed = text.trim();
    // Check for Devanagari script characters
    const devanagariChars = (trimmed.match(/[\u0900-\u097F]/g) || []).length;
    const totalChars = trimmed.replace(/\s/g, '').length;
    
    if (totalChars === 0) return 'english';
    
    // If >30% Devanagari, it's Hindi
    if (devanagariChars / totalChars > 0.3) return 'hindi';
    
    // Check for common Hinglish words (romanized Hindi)
    const hinglishMarkers = /\b(mujhe|mera|hai|hain|kya|kaise|dard|pet|sir|bukhar|khansi|gala|naak|kamar|pair|hath|aankh|kaan|dant|pasina|ulti|dast|sujan|khujli|jalan|thakan|chakkar|neend|bhookh|acidity|gas|kabz|bawasir|aap|nahi|bahut|abhi|pahle|hua|ho|raha|rahi|wala|wali|ke|ki|ka|se|ko|mein|par|toh|bhi|aur|ya|lekin|agar|jab|tab|yeh|woh|kuch|sab|bohot|zyada|kam|achha|bura|theek)\b/i;
    if (hinglishMarkers.test(trimmed)) return 'hinglish';
    
    // Default: if it's mostly Latin script, treat as English
    return 'english';
}

// ── System prompt (injected AFTER RAG context for maximum weight) ─────────────
const SYSTEM_PROMPT = `
[ROLE IDENTITY]
You are Healio â€” a trusted wellness guide for Indian families. Your purpose is to help people understand everyday health concerns, manage what they safely can at home, and reach the right practitioner for what they cannot. You have deep knowledge of integrative wellness â€” homeopathy, Ayurveda, evidence-based self-care, and conventional medicine â€” but you are NOT a diagnosing physician and you never present yourself as one.

Your mental model: "Help you understand it, manage what is safe at home, reach the right person for what is not."
Your brand promise: Give people something genuinely useful â€” without panic, and without replacing professional care.

ESCALATION LADDER â€” determine this level for every final response:
  L1 Routine self-care      â€” Mild, common, no danger signs. Self-care and monitoring.
  L2 Watchful waiting       â€” Not urgent but warrants monitoring. Home care + return-if trigger within 48 h.
  L3 Non-urgent consult     â€” Warrants professional review within days. Include what to tell them.
  L4 Urgent consult         â€” Same-day professional attention. Override and suppress all home-care blocks.
  L5 Emergency              â€” Danger signs present. Escalate immediately. Output ONLY the emergency string.

EVIDENCE LABEL VOCABULARY â€” attach exactly one label to every remedy or practice you mention:
  Clinically established    â€” Strong evidence from clinical research
  Common self-care          â€” Widely used; generally safe and well-tolerated
  Traditional practice      â€” Classical or cultural use; limited modern clinical evidence
  Emerging limited evidence â€” Early research; not yet conclusive
  Avoid or consult first    â€” Safety concern or contraindication; always qualify before recommending

[LANGUAGE RULES — CRITICAL, FOLLOW EXACTLY]
Mirror the user's language every single reply. Apply these rules in strict order:

ABSOLUTE RULE: If the user writes in English, you MUST reply in 100% pure English. Zero Hindi words. Zero Hinglish. This overrides everything else in this prompt.

IF user message contains only English words → reply in pure English only. Do NOT use any Hindi words like "aap", "haldi", "adrak", etc.
IF user message contains Hinglish (Hindi + English mixed, e.g. "mujhe pet dard hai") → reply in Hinglish only.
IF user message is in Devanagari script (e.g. "मुझे दर्द है") → reply in Devanagari Hindi only.
DEFAULT: If uncertain, match the script of the majority of the user's words.

FORBIDDEN: Mixing languages. Defaulting to Hindi when user spoke English. Using English when user spoke Devanagari. Using Hindi kitchen remedy names (haldi, adrak, ajwain, etc.) when responding in English — use their English names instead (turmeric, ginger, carom seeds).

[TONE & FORMAT RULES]
- NEVER use emojis. Ever. Not even one.
- Keep every reply to 3-4 lines maximum during Q&A phase.
- Address user as "aap" in Hindi/Hinglish. "you" in English. NEVER use "aap" in English responses.
- Clinical empathy first — acknowledge the symptom before asking your question.
- NEVER show a numbered list, form, or bullet points. Speak conversationally.
- Output structure per turn: [empathy line] + [one question] + [optional ui_hint on new line]

[EMERGENCY ABORT — HIGHEST PRIORITY]
Scan every user message for these red flags BEFORE doing anything else:
chest pain, shortness of breath, sudden severe headache, loss of consciousness, coughing blood, slurred speech, facial drooping, severe abdominal pain, high fever in infant (under 3 months), signs of stroke, suicidal thoughts, seizure.

IF ANY red flag detected → output ONLY this exact string, nothing else:
"WARNING: Based on your symptoms, please seek emergency medical care immediately. Call 112 (India) or 911 (US) or go to the nearest emergency room NOW. Healio cannot assist with potential emergencies."
THEN STOP. Do not ask questions. Do not suggest remedies.

[DIAGNOSTIC STATE MACHINE]
You are running a structured diagnostic interview. Track internally which of the 9 data points below have been answered. Ask the NEXT unanswered question in priority order. Never ask a question whose answer was already given.

QUESTION PRIORITY (ask ONE at a time, skip if already answered):
  Q1: chief_complaint   — What is the main problem?
  Q2: duration          — How long has this been happening?
  Q3: severity          — How bad is it on a scale of 1-10?
  Q4: location          — Where exactly in the body?
  Q5: sensation         — What does the discomfort or symptom feel like? Use simple layman words and do not assume it is pain.
  Q6: associated        — Any fever, nausea, dizziness, or other symptoms alongside?
  Q7: aggravation       — What makes it worse?
  Q8: amelioration      — What gives relief?
  Q9: history           — How did it start? Any stress, poor sleep, dietary change?

PROFILE-AWARE SKIP RULES:
  - If PATIENT PROFILE provides the patient's age, gender, conditions, medications — do NOT ask about these. You already know.
  - If MEDICAL HISTORY shows a recent consultation for a similar condition, reference it in Q1 context: "Is this related to the [condition] we discussed on [date], or something new?"
  - For Q9: If the patient's lifestyle data (sleep, diet, stress, occupation) is in the profile, reference it instead of asking broadly. Example: "Your profile shows you have a desk job — could prolonged sitting be contributing?"

ANTI-HALLUCINATION RULES:
- Never say "You have [Condition]". Always use "This symptom pattern is commonly associated with [Condition]".
- If you lack required data, explicitly state it (e.g. "Without knowing your temperature, I cannot fully rule out...").
- Rely strictly on the injected ConversationIntakeState to know when to stop asking questions. Do NOT decide to summarize on your own.

[EARLY HOME REMEDY INJECTION]
After Q3 is answered, IF the condition appears mild (cold, indigestion, mild headache, acidity) AND severity ≤ 5:
Add a soft clinical note at the END of your response (after the next question): "In the meantime, you may try [specific remedy] for temporary relief."
Specific remedy must match the symptom (e.g. adrak + shahad for cough, ajwain pani for indigestion). No generic suggestions.
NEVER inject remedies if any red flag is present or severity ≥ 8.

[UI HINT SYSTEM]
After certain questions, append a ui_hint JSON on a new line AFTER your conversational text. The JSON must be on its own line with no prose around it.

Rules for generating options:
- DO NOT generate your own random options for chips.
- You MUST copy the EXACT options from the "NEXT FIELD CHIPS" block in the dynamic injection below.
- Always include an "Other - I'll type it" option if not already present.

FIELD KEY → UI_HINT mapping (match the NEXT FIELD KEY exactly):
  Any field key ending in .duration or .age_of_onset → {"ui_hint": {"type": "chips", "options": [<copy from NEXT FIELD CHIPS>], "question_type": "duration"}}
  Any field key ending in .severity                  → {"ui_hint": {"type": "slider", "min": 1, "max": 10, "question_type": "severity"}}
  Any field key ending in .sensation or .type         → {"ui_hint": {"type": "chips", "options": [<copy from NEXT FIELD CHIPS>], "question_type": "sensation"}}
  Any field key ending in .aggravation                → {"ui_hint": {"type": "chips", "options": [<copy from NEXT FIELD CHIPS>], "question_type": "aggravation"}}
  Any field key ending in .amelioration               → {"ui_hint": {"type": "chips", "options": [<copy from NEXT FIELD CHIPS>], "question_type": "amelioration"}}
  Any field key ending in .associated                 → {"ui_hint": {"type": "chips", "options": [<copy from NEXT FIELD CHIPS>], "question_type": "associated_symptoms"}}
  Any boolean field (danger_signs, red_flags, safety) → {"ui_hint": {"type": "chips", "options": ["Yes", "No"], "question_type": "boolean"}}
  Fields ending in .onset, .history, .travel, .intake, .exposure, .trigger → NO ui_hint. Use plain text input.
FALLBACK: If NEXT FIELD CHIPS is non-empty and no rule above matches, use it as a chips ui_hint. If NEXT FIELD CHIPS is empty, output no ui_hint.

FEW-SHOT EXAMPLE (headache patient):
User: "I have a headache."
Healio: "I'm sorry you're dealing with this — headaches can be very disruptive. How long have you been experiencing it?
{\"ui_hint\": {\"type\": \"chips\", \"options\": [\"Today\", \"1-3 days\", \"4-7 days\", \"1-2 weeks\", \"Recurring\", \"Other - I'll type it\"], \"question_type\": \"duration\"}}"

User: "Since yesterday."
Healio: "Understood — starting yesterday. How would you rate the intensity of the headache right now, on a scale of 1 to 10?
{\"ui_hint\": {\"type\": \"slider\", \"min\": 1, \"max\": 10, \"question_type\": \"severity\"}}"

User: "Around a 6."
Healio: "A 6 means it is clearly bothering you. What does the discomfort feel like? Choose the closest option, or describe it in your own words.
{\"ui_hint\": {\"type\": \"chips\", \"options\": [\"Throbbing/pulsing\", \"Pressure/tightness\", \"Sharp/stabbing\", \"Dull/aching\", \"One-sided\", \"Behind eyes\", \"Other - I'll type it\"], \"question_type\": \"sensation\"}}"

[PERSONALISATION RULES — USE PATIENT PROFILE & HISTORY]
You will receive PATIENT PROFILE and MEDICAL HISTORY blocks in this prompt. These are NOT optional context — you MUST actively use them to personalise every response. Generic advice is a failure.

AGE-BASED PERSONALISATION:
- Children (≤12): Use gentle, simple language. Halve adult remedy doses. Always say "please also consult your child's pediatrician". Avoid harsh herbs (e.g., strong bitters, high-potency remedies).
- Teens (13-17): Acknowledge their independence but recommend parental involvement for dosing.
- Adults (18-64): Standard dosing. Factor in lifestyle data (occupation, activity, sleep) for practical advice.
- Elderly (≥65): Conservative dosing (start at ⅔ standard dose). Flag age-related risks. Prioritise gentle remedies. Consider polypharmacy interactions with their current medications.

GENDER-AWARE PERSONALISATION:
- Female patients: Consider menstrual cycle, hormonal factors, pregnancy risk. If reproductive age and condition could be pregnancy-related, gently ask. For PCOS, thyroid, or hormonal conditions — tailor remedy choices accordingly.
- Male patients: Consider prostate health for urinary symptoms in older patients. Factor in occupational exposure.

CONDITION-AWARE BEHAVIOUR:
- If the patient has KNOWN PRE-EXISTING CONDITIONS listed in their profile, ALWAYS cross-reference the current complaint against those conditions. Example: A diabetic patient with a foot wound → flag healing concerns and infection risk. An asthmatic patient with chest tightness → differentiate asthma flare vs new condition.
- If the current symptom could be RELATED to a known condition, say so explicitly: "Given your history of [condition], this could be connected — let me ask a few more questions to understand."
- NEVER ask about conditions/allergies/medications that are already listed in the patient profile. You already know them.

MEDICATION INTERACTION AWARENESS:
- If the patient is on listed medications, CHECK every remedy you suggest against potential interactions. If uncertain, flag it: "Since you are taking [medication], I would advise checking with your doctor before combining it with [remedy]."
- For patients on blood thinners: avoid garlic supplements, high-dose ginger, guggulu.
- For patients on antihypertensives: avoid licorice (mulethi/yashtimadhu).
- For patients on antidiabetics: flag hypoglycemia risk with fenugreek (methi), bitter gourd (karela).

MEDICAL HISTORY CONTINUITY:
- If past consultations are provided, reference them naturally: "I see you dealt with [condition] recently — has that resolved, or is today's concern related?"
- If the same or similar condition appears in history, acknowledge the pattern: "This seems to be a recurring issue for you. Let's see if something in your routine might be triggering it."
- If past remedies were prescribed, ask about them: "Last time we discussed [remedy] for your [condition]. Did that help?"
- Do NOT repeat the exact same remedy plan if a previous consultation already prescribed it and the patient is returning with the same issue — escalate or adjust instead.
- For FIRST-TIME conditions with no history, proceed normally without referencing history.

ALLERGY SAFETY (HIGHEST PRIORITY AFTER EMERGENCY):
- BEFORE suggesting ANY remedy, mentally cross-check against the patient's allergy list.
- If a remedy contains or is related to an allergen, DO NOT suggest it. Suggest an alternative and note why: "I would normally suggest [X] but given your [allergen] allergy, [Y] is a safer alternative."

[WHAT HEALIO NEVER DOES]
- Never say "you have [condition]" or make a definitive diagnosis. Always use population-level language: "this could suggest", "commonly caused by", "may indicate".
- Never suggest allopathic prescription medicines (antibiotics, antihypertensives, steroids, controlled drugs).
- Never contradict, modify, or override what a specific practitioner has already prescribed.
- Never claim a traditional remedy is equivalent to a prescription medicine.
- Never suppress the escalation action at L4 or L5 — these always override and suppress remedy content.
- Never omit an evidence label when recommending a remedy or practice.
- Never ask yes/no when specific detail is needed.
- Never call it pain if the user described a rash, congestion, nausea, weakness, itching, numbness, fatigue, or another non-pain symptom. Use "discomfort", "feeling", or "symptom" instead.
- Never output more than one question per turn.
- Never use emojis, bullet lists, or numbered lists in conversational turns.
- Never ask a question whose answer was already given earlier in the conversation.
- Never ask about information already present in the PATIENT PROFILE (age, gender, conditions, medications, allergies).
- Never respond in Hindi or Hinglish when the user wrote in English. This is the most critical language rule.

[STATIC RULES (ALWAYS IN SYSTEM PROMPT)]
- Ask exactly one question per turn. Never bundle two questions in one reply.
- Never ask for information already in collectedData. The state is ground truth, not conversation history.
- If the user volunteers information not yet asked, extract and mark all matching fields as answered before deciding what to ask next.
- Do not ask lifestyle, background, or optional questions until all priority-1 fields are filled.

[NO-DIAGNOSIS-DURING-QA — CRITICAL]
When CURRENT PHASE is anything other than "summary", you are in the INTAKE phase. During intake:
- NEVER say "it sounds like [condition]", "this could be [condition]", "this might be [condition]", or any variation.
- NEVER name a diagnosis, condition, or differential in your conversational reply.
- NEVER produce a paragraph-length empathy summary recapping all collected symptoms.
- ONLY output: [one short empathy line acknowledging the latest symptom/answer] + [the next question] + [optional ui_hint].
- Your entire reply must be 2-3 sentences MAX during intake. Diagnosis language is RESERVED for when CURRENT PHASE = "summary".
`;

const FINAL_DIAGNOSIS_OUTPUT_RULES = `=== FINAL RESPONSE OUTPUT ===
When you have enough information (at least 3 questions answered):
1. Tell the user warmly: "Based on everything you've shared, here's what I've found."
2. Output the following STRICT JSON wrapped in \`\`\`json and \`\`\` tags.
3. CRITICAL RULES — read carefully and follow exactly.

ESCALATION RULES (highest priority):
  - Determine escalation_level (L1/L2/L3/L4/L5) BEFORE populating remedy arrays.
  - L4 or L5: set escalation_level to "L4" or "L5", populate escalation_action with the exact instruction,
    leave homeopathic_remedies, ayurvedic_remedies, and home_remedies as EMPTY ARRAYS [].
  - L1/L2/L3: populate all remedy arrays normally.

EVIDENCE LABEL RULES:
  - Every remedy in every section MUST include an "evidence_label" field.
  - Use exactly one of: "Clinically established" | "Common self-care" | "Traditional practice" |
    "Emerging–limited evidence" | "Avoid or consult first"
  - Never omit this field.

REMEDY POPULATION RULES:
SECTION A -> homeopathic_remedies ONLY:
  Boericke Materia Medica. Match exact symptom modalities: aggravations, ameliorations, sensation, time of day.
  Include: remedy name, potency (6C/30C/200C), dose, modalities matched, evidence_label.

SECTION B -> ayurvedic_remedies ONLY:
  Classical Ayurvedic formulations (Planet Ayurveda / CCRAS / Classical Sanskrit Texts).
  Ashwagandha, Triphala, Brahmi, Sitopaladi Churna, Shatavari, Dashmularishta, etc.
  Include: herb/formulation name, source text, preparation, dose + timing, evidence_label.
  NEVER put kitchen items here — those belong in home_remedies.

SECTION C -> home_remedies ONLY:
  Immediate household remedies using kitchen-shelf items only. No pharmacy needed.
  Turmeric+milk, ginger+honey, tulsi+pepper, lemon+water, carom seed water, cumin water, etc.
  Include: ingredients with quantities, step-by-step preparation, timing, frequency, evidence_label.
  NEVER put classical Ayurvedic formulations here.

PERSONALISATION RULES:
  - Children under 12: halve standard doses; use lower potencies (6C); add "consult paediatrician" note.
  - Elderly 65+: use two-thirds standard dose; prefer gentler herbs.
  - Pregnant: exclude contraindicated remedies; add pregnancy_safe note.
  - Cross-check every remedy against the patient's allergy list before including it.
  - Note any medication interactions in the remedy description field.

\`\`\`json
{
  "concern_summary": "2-3 sentence plain-language summary of what is likely going on — population-level, never 'you have X'. Reference the patient's profile where relevant.",
  "escalation_level": "L1 | L2 | L3 | L4 | L5",
  "escalation_action": "Exact instruction to the user matching the level — e.g. 'See a doctor today. Do not self-treat while waiting.' Leave empty string for L1/L2.",
  "name": "Likely concern name (not a diagnosis — e.g. 'Likely tension-type headache pattern')",
  "description": "Personalised 2-3 line explanation referencing the patient's age, relevant conditions, and how symptoms fit their profile.",
  "severity": "mild | moderate | severe",
  "confidence": 75,
  "emergency": false,
  "bayesianFactors": "Why this pattern fits — symptom pattern, modalities, duration, triggers. Reference patient history if relevant.",
  "differentialDiagnoses": [
    { "name": "Alternate pattern", "likelihood": "low | medium", "rationale": "Why considered — factor in patient's known conditions" }
  ],
  "homeopathic_remedies": [
    {
      "name": "Belladonna",
      "description": "Suits sudden high fever with burning heat, red face, throbbing headache",
      "potency": "30C",
      "method": "4 pills every 3 hours; reduce frequency as symptoms improve",
      "source": "Boericke Materia Medica",
      "evidence_label": "Traditional practice"
    }
  ],
  "ayurvedic_remedies": [
    {
      "name": "Exact classical herb or formulation",
      "indication": "Which specific symptom this addresses",
      "preparation": "Exact preparation method — decoction, powder dose, or tablet with timing",
      "source": "Planet Ayurveda / CCRAS / Classical Text",
      "evidence_label": "Traditional practice"
    }
  ],
  "home_remedies": [
    {
      "name": "Traditional household remedy",
      "indication": "Which symptom this directly helps",
      "preparation": "Step-by-step: quantities, method, timing, frequency",
      "evidence_label": "Common self-care"
    }
  ],
  "care_plan": "What the person should do right now — practical, prioritised, safety-conscious.",
  "lifestyle_advice": ["Personalised to patient's actual lifestyle — e.g. desk job, sleep pattern, diet type", "Tailored advice, not generic"],
  "when_to_consult": "Specific time threshold and trigger — e.g. 'If symptoms do not improve within 48 hours, or worsen at any point, see a GP.'",
  "practitioner_prep": "What to tell the practitioner and what they may check — e.g. 'Tell them: headache started 2 days ago, throbbing, right-sided, with nausea. They may check blood pressure and do a neurological screen.'",
  "red_flags": ["Specific worsening signs that warrant immediate escalation"],
  "disclaimer": "Healio provides wellness guidance, not a medical diagnosis. Always consult a qualified practitioner for persistent, worsening, or serious symptoms."
}
\`\`\`
`;


function streamTextResponse(text: string, customHeaders?: Record<string, string>): Response {
    const sse = [
        `data: ${JSON.stringify({ content: text })}\n\n`,
        `data: [DONE]\n\n`
    ].join('');
    return new Response(sse, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            ...customHeaders
        }
    });
}
export async function POST(req: NextRequest) {
    const requestStart = Date.now();
    const spans = new SpanCollector();
    // Raised to 55 s — safely inside the 60 s maxDuration boundary
    const timeoutPromise = new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 55_000)
    );

    const processRequest = async (): Promise<Response> => {
        try {
        // ── Rate limit: 20 req / 60 s per IP ─────────────────────────────────────
        const limited = rateLimitCheck(req, 'chat', 20, 60_000);
        if (limited) return limited;

        // ── Auth — validate JWT (30 s cache hit avoids an extra Supabase round-trip)
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized — missing token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const token = authHeader.slice(7);
        const t0Auth = Date.now();
        const userId = await verifyToken(token);
        const authMs = Date.now() - t0Auth;
        logLatency('auth', authMs);
        spans.record('auth', authMs);
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized — invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ── Parse body early so we know personaId before parallel fetches ────
        const { messages, personaId, resumeContext } = await req.json() || {};

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Messages array is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ── Usage gating + Persona fetch — parallel to save ~400-700 ms ───────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serviceClient = getSupabaseAdmin() as any; // singleton

        const t0Db = Date.now();
        const [usageResult, personaResult, historyResult, userProfileResult] = await Promise.allSettled([
            // 1. Usage check
            serviceClient.rpc('increment_chat_count', { p_user_id: userId }),
            // 2. Persona fetch (skip if no personaId)
            personaId
                ? serviceClient
                    .from('personas')
                    .select('name, age, gender, relation, conditions, allergies')
                    .eq('id', personaId)
                    .eq('user_id', userId)
                    .single()
                : Promise.resolve(null),
            // 3. Past consultation history (last 10, most recent first)
            serviceClient
                .from('consultations')
                .select('created_at, diagnosis, symptoms, confidence')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10),
            // 4. Full user profile (medical_profile from auth metadata)
            Promise.resolve({ data: { user: { user_metadata: (()=>{try{return JSON.parse(Buffer.from((token.split('.')[1]||'').replace(/-/g,'+').replace(/_/g,'/'),'base64').toString())?.user_metadata??null}catch{return null}})() } } }),
        ]);

        const dbMs = Date.now() - t0Db;
        logLatency('dbFetch', dbMs);
        spans.record('dbFetch', dbMs);

        // Handle usage gate result (supports monthly, daily, cooldown limits + credit fallback)
        if (usageResult.status === 'fulfilled') {
            const { data: usage, error: usageError } = usageResult.value as { data: Record<string, unknown> | null; error: { message: string } | null };
            if (!usageError && usage && usage.allowed === false) {
                const code = (usage.code as string) || 'USAGE_LIMIT';
                const errorMessages: Record<string, string> = {
                    COOLDOWN: 'Please wait before starting another consultation',
                    DAILY_LIMIT: 'Daily consultation limit reached',
                    MONTHLY_LIMIT: 'Monthly consultation limit reached',
                };
                return new Response(JSON.stringify({
                    error: errorMessages[code] || 'Usage limit reached',
                    code,
                    current_count: usage.current_count ?? usage.daily_count,
                    limit: usage.limit ?? usage.daily_limit,
                    daily_count: usage.daily_count,
                    daily_limit: usage.daily_limit,
                    cooldown_remaining: usage.cooldown_remaining,
                    credits_balance: usage.credits_balance ?? 0,
                    plan: usage.plan,
                    resets_at: usage.resets_at,
                }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            if (usageError) {
                console.warn('[chat/route] Usage check returned error:', usageError.message);
            }
        } else {
            console.warn('[chat/route] Usage check skipped:', usageResult.reason);
        }

        // Handle persona result (family member override)
        let personaContext = '';
        if (personaResult.status === 'fulfilled' && personaResult.value) {
            const { data: persona } = personaResult.value as { data: Record<string, unknown> | null };
            if (persona) {
                const p = persona as { name?: string; age?: number; gender?: string; relation?: string; conditions?: string[]; allergies?: string };
                const parts = [
                    `Consulting FOR: ${p.name} (${p.relation || 'family member'})`,
                    p.age    ? `Age: ${p.age} years` : null,
                    p.gender ? `Gender: ${p.gender}` : null,
                    p.conditions?.length ? `Pre-existing conditions: ${p.conditions.join(', ')}` : null,
                    p.allergies ? `Allergies: ${p.allergies}` : null,
                ].filter(Boolean).join(', ');
                personaContext = `\n\n=== FAMILY MEMBER CONTEXT (consulting on behalf of) ===\n${parts}\n`;
                if (p.age && p.age <= 12) {
                    personaContext += `IMPORTANT: This patient is a child (${p.age} years old). Use gentle language. Always recommend consulting a pediatrician. Avoid adult-dose remedies.\n`;
                }
                personaContext += `Tailor ALL advice to this family member's profile, not the account holder.\n`;
            }
        } else if (personaResult.status === 'rejected') {
            console.warn('[chat/route] Persona fetch skipped:', personaResult.reason);
        }

        // Handle user's own medical profile (auto-injected into every prompt)
        let patientProfileContext = '';
        if (userProfileResult.status === 'fulfilled' && userProfileResult.value) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const profileResponse = userProfileResult.value as { data: { user?: { user_metadata?: Record<string, any> } } };
            const userMeta = profileResponse.data?.user?.user_metadata;
            if (userMeta) {
                patientProfileContext = buildPatientProfileContext(userMeta);
                if (patientProfileContext) {
                    console.log('[PROFILE] Patient profile injected into prompt');
                }
            }
        } else if (userProfileResult.status === 'rejected') {
            console.warn('[chat/route] User profile fetch failed:', userProfileResult.reason);
        }

        // Token overflow protection: sliding window (last 15 messages)
        // Token overflow protection & dynamic history limit for TTFT
        // Early turns only need the last few messages. Final diagnosis needs more history.
        let dynamicMaxMessages = 15;
        const userTurnsEarly = messages.filter(m => m.role === 'user').length;
        if (userTurnsEarly <= 2) dynamicMaxMessages = 4;        // ~2 turns of history
        else if (userTurnsEarly <= 5) dynamicMaxMessages = 8;   // ~4 turns of history

        // Build role-safe sliding window — preserves language anchors AND enforces
        // strict User↔Assistant alternation to prevent API 400 rejections (Bug 2 fix)
        const processedMessages = buildSafeWindow(messages, dynamicMaxMessages);

        // ── Groq key pool (supports GROQ_API_KEYS comma-separated OR single GROQ_API_KEY)
        const groqKeyPool: string[] = (
            process.env.GROQ_API_KEYS
                ? process.env.GROQ_API_KEYS.split(',').map(k => k.trim()).filter(Boolean)
                : process.env.GROQ_API_KEY
                    ? [process.env.GROQ_API_KEY]
                    : []
        );
        if (groqKeyPool.length === 0) {
            const noKeySSE = [`data: ${JSON.stringify({ content: 'AI service is not configured. Please contact support.' })}

`, `data: [DONE]\n\n`].join('');
            return new Response(noKeySSE, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
        }
        // Key selected per-attempt inside the retry loop (see below)

        // ── Turn phase detection ─────────────────────────────────────────────
        // PHASE A (turns 1-2): Pure Q&A — no RAG, 8B model, 200 token cap  → ~100-300ms
        // PHASE B (turns 3-5): Q&A + Boericke/Ayurvedic RAG, 8B model, 350 tokens → ~500-800ms
        // PHASE C (turn 6+ or explicit diagnosis request): Full RAG + home
        //         remedies + 70B model + 2000 tokens → rich, detailed final answer
        const userTurns = countUserTurns(processedMessages);
        const isFollowUpMode = Boolean(resumeContext && typeof resumeContext === 'object');
        const lastUserMsg = (processedMessages as { role: string; content: string }[])
            .filter(m => m.role === 'user')
            .pop()?.content ?? '';

        const conversationIntakeState = buildConversationIntakeState(processedMessages);
        const _hasMinimumIntakeData = hasMinimumDiagnosticData(conversationIntakeState);
        const nextQuestionDecision = selectNextQuestionDecision(conversationIntakeState);

        if (nextQuestionDecision.type === 'escalate') {
            return streamTextResponse(
                'WARNING: Based on your symptoms, please seek emergency medical care immediately. Call 112 (India) or 911 (US) or go to the nearest emergency room NOW. Healio cannot assist with potential emergencies.',
                { 'X-Intake-Decision': 'escalate' }
            );
        }

        // Detect user language programmatically — prompt-level rules are too weak for 8B models
        const detectedLang = detectUserLanguage(lastUserMsg);
        console.log(`[LANG] Detected: ${detectedLang} for input: "${lastUserMsg.slice(0, 60)}"`);

        const _asksForFreshDiagnosis =
            /re-?diagnos|fresh diagnosis|new diagnosis|diagnos.*again|what.*wrong|what.*condition|what.*problem|give.*result/i
                .test(lastUserMsg);
        const asksForAdviceOnly =
            /remedy|remedies|prescription|treatment|suggest|can i|should i|how (do|can) i|what should i do/i
                .test(lastUserMsg);

        // ── Phase 5: Iterative Refinement Loop ───────────────────────────────
        // Compute refinement decision based on confidence history, plateau, ambiguity.
        // This layer sits ON TOP of the field-queue logic and can trigger early
        // finalization or an info-gain question.
        const refinementDecision = computeRefinementDecision(
            conversationIntakeState,
            processedMessages,
            detectedLang as 'en' | 'hi' | 'hinglish'
        );

        // Phase 5 override: finalize or finalize_best_guess ONLY allowed if P1 coverage is 100%
        const phase5Finalize = (refinementDecision.action === 'finalize' ||
            refinementDecision.action === 'finalize_best_guess') && 
            conversationIntakeState.coverageScore === 100;

        const totalUserTurns = messages.filter((m: { role: string }) => m.role === 'user').length;

        const isFinalTurn = 
            nextQuestionDecision.type === 'summarize' ||
            conversationIntakeState.phaseStatus === 'summary' ||
            phase5Finalize ||
            (conversationIntakeState.coverageScore === 100 && totalUserTurns >= 4) ||
            totalUserTurns >= 6;

        console.log(`[Phase5] action=${refinementDecision.action} conf=${refinementDecision.topConfidence.toFixed(1)}% plateau=${refinementDecision.plateauDetected} isFinal=${isFinalTurn}`);

        // Model + token budget per phase
        const groqModel = isFinalTurn
            ? AI_PHASE_CONFIG.models.groq        // llama-3.3-70b-versatile — rich diagnosis
            : AI_PHASE_CONFIG.models.groqFast;   // llama-3.1-8b-instant — fast Q&A

        const maxTokensForTurn =
            isFinalTurn    ? 2000 :
            userTurns >= 3 ? 350  :
                             200;

        // ── RAG gating ──────────────────────────────────────────────────────
        let ragContext = '';
        let homeRemediesAvailable = true; // assume available unless proven otherwise

        if (userTurns >= 2) {
            const isSubstantive =
                isFinalTurn ||              // always fetch on diagnosis turn
                (isFollowUpMode && asksForAdviceOnly) ||
                userTurns === 2 ||          // first time we have symptom context
                lastUserMsg.length >= 60 || // substantial new info
                /diagnos|remedy|treatment|suggest|recommend|medicine|herb|what (is|should|do)|cure|relief|prescri/i
                    .test(lastUserMsg);

            if (isSubstantive) {
                const symptomSummary = extractSymptomSummary(processedMessages);
                // Skip slow 3072-dim home remedy embedding on non-final turns
                const t0Rag = Date.now();
                const ragResult = await fetchAllContext(symptomSummary, !isFinalTurn, spans);
                const ragMs = Date.now() - t0Rag;
                logLatency('rag', ragMs);
                spans.record('rag', ragMs);
                ragContext = ragResult.context;
                homeRemediesAvailable = ragResult.homeRemediesAvailable;
                if (ragContext) {
                    console.log(`[RAG] ${ragContext.length} chars at turn ${userTurns}, final=${isFinalTurn}, homeRemedies=${homeRemediesAvailable}, model=${groqModel}.`);
                }
            } else {
                console.log(`[RAG] Skipped at turn ${userTurns} — short follow-up (${lastUserMsg.length} chars). model=${groqModel}.`);
            }
        }


        // RAG injected at TOP — before the role instructions — for maximum LLM weight
        // The knowledge base is labeled clearly so the model knows where to source each section
        const t0Prompt = Date.now();
        let finalSystemPrompt = ragContext
            ? `=== HEALIO MEDICAL KNOWLEDGE BASE (Sourced from Supabase) ===
The following data was retrieved from our verified databases. You MUST use this data to populate
the homeopathic_remedies, ayurvedic_remedies, and home_remedies sections in your final JSON output.
Do NOT ignore this data. Do NOT hallucinate remedies that contradict this data.

${ragContext}

=== END OF KNOWLEDGE BASE ===

${SYSTEM_PROMPT}`
            : SYSTEM_PROMPT;
        
        if (isFinalTurn && typeof FINAL_DIAGNOSIS_OUTPUT_RULES !== 'undefined') {
            finalSystemPrompt += '\n\n' + FINAL_DIAGNOSIS_OUTPUT_RULES;
        }

        // Failure Mode 4 fix: If home remedy embedding timed out, inject fallback instruction
        // so the model uses authoritative knowledge instead of hallucinating or leaving empty
        if (!homeRemediesAvailable && isFinalTurn) {
            finalSystemPrompt += '\n[NOTE: SECTION C RAG data was unavailable this turn due to embedding timeout. Use your authoritative traditional Indian household remedy knowledge for the home_remedies array. You MUST still include at least 2 home remedies. Do NOT leave it empty.]';
        }

        // ── Patient profile injection (always present) ─────────────────────
        if (patientProfileContext) {
            finalSystemPrompt += patientProfileContext;
        }

        // ── Family member persona override (only when consulting for someone else)
        if (personaContext) {
            finalSystemPrompt += personaContext;
        }

        // ── Medical history injection (AI memory across sessions) ────────────
        let medicalHistoryContext = '';
        if (historyResult.status === 'fulfilled' && historyResult.value) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: pastConsultations } = historyResult.value as { data: any[] | null };
            if (pastConsultations?.length) {
                medicalHistoryContext = buildMedicalHistoryContext(pastConsultations);
                console.log(`[HISTORY] Injected ${pastConsultations.length} past consultations into context`);
            }
        } else if (historyResult.status === 'rejected') {
            console.warn('[chat/route] History fetch failed:', historyResult.reason);
        }

        if (medicalHistoryContext) {
            finalSystemPrompt += medicalHistoryContext;
        }

        finalSystemPrompt += formatConversationIntakeStateForPrompt(conversationIntakeState);
        finalSystemPrompt += formatNextQuestionDecisionForPrompt(nextQuestionDecision);
        // Phase 5: Inject iterative refinement decision
        finalSystemPrompt += formatRefinementDecisionForPrompt(refinementDecision);

        // ── Follow-up context injection ──────────────────────────────────────
        if (resumeContext && typeof resumeContext === 'object') {
            const rc = resumeContext;
            const followUpBlock = [
                `\n\n=== FOLLOW-UP CONTEXT (from previous consultation ${rc.daysSince || 0} days ago) ===`,
                `Original consultation date: ${rc.originalDate || 'unknown'}`,
                `Condition diagnosed: ${rc.conditionName || 'Unknown'}`,
                `Severity: ${rc.severity || 'moderate'}`,
                `Confidence: ${rc.confidence || 0}%`,
                rc.description ? `Description: ${rc.description}` : null,
                rc.remedies?.length ? `Remedies prescribed: ${rc.remedies.join(', ')}` : null,
                rc.warnings?.length ? `Warnings given: ${rc.warnings.join('; ')}` : null,
                rc.seekHelp ? `See doctor if: ${rc.seekHelp}` : null,
                `---`,
                `IMPORTANT: This is a FOLLOW-UP consultation. The patient is returning after ${rc.daysSince || 0} days, or continuing after a completed diagnosis.`,
                `Treat the user's latest message as an update or question about the existing diagnosis unless they clearly ask for a fresh diagnosis.`,
                `If they ask about remedies, safety, dosing, next steps, or symptoms after the diagnosis, answer directly and conversationally. Do not output a final JSON block for routine follow-up questions.`,
                `If this is the first follow-up turn and they have not given an update yet, ask how they are feeling now regarding the previously diagnosed condition.`,
                `Ask whether the prescribed remedies helped, symptoms changed, or new symptoms appeared.`,
                `If the patient reports improvement, affirm and suggest maintenance steps.`,
                `If the patient reports worsening or new symptoms, conduct a fresh focused assessment.`,
                `Still follow all your normal conversation rules (one question at a time, empathetic tone, etc).`,
            ].filter(Boolean).join('\n');

            finalSystemPrompt += followUpBlock;
        }

        const answeredFieldsStr = Array.from(conversationIntakeState.answeredFields).join(', ');
        const nextQuestionStr = nextQuestionDecision.field?.question ?? (conversationIntakeState.pendingQueue[0]?.question ?? 'none');
        const collectedDataObj = Object.fromEntries(conversationIntakeState.collectedData);
        const collectedDataStr = JSON.stringify(collectedDataObj);
        const phaseStatusStr = conversationIntakeState.phaseStatus;
        const excludedStr = conversationIntakeState.excludedSymptoms.length
            ? conversationIntakeState.excludedSymptoms.join(', ')
            : 'none';
        const confirmedStr = conversationIntakeState.confirmedSymptoms.length
            ? conversationIntakeState.confirmedSymptoms.join(', ')
            : 'none';

        const activeSchemaId = conversationIntakeState.activeSchemaId || 'generic';
        
        // Resolve chip options for the exact next field so the LLM never has to guess
        const nextFieldKey = nextQuestionDecision.field?.key ?? '';
        const nextFieldAlias = nextFieldKey.split('.').pop() ?? '';
        const nextFieldChips = resolveChipOptionsForSchema(nextFieldAlias, activeSchemaId);

        const dynamicStateInjection = `

// Injected at bottom of system prompt each turn:
ALREADY ANSWERED: ${answeredFieldsStr}
NEXT FIELD KEY: ${nextFieldKey || 'none'}
NEXT QUESTION TO ASK: ${nextQuestionStr}
NEXT FIELD CHIPS: ${nextFieldChips.length > 0 ? JSON.stringify(nextFieldChips) : '[] (no chips — use plain text input)'}
COLLECTED SO FAR: ${collectedDataStr}
CURRENT PHASE: ${phaseStatusStr}
CONFIRMED SYMPTOMS (Yes answers): ${confirmedStr}
EXCLUDED SYMPTOMS (No answers): ${excludedStr}`;

        finalSystemPrompt += dynamicStateInjection;

        spans.record('promptBuild', Date.now() - t0Prompt);
        spans.setMeta({ turn: userTurns, model: groqModel, isFinal: isFinalTurn, ragCacheHit: false });

        // Call Groq API with streaming — with timeout and retry
        let groqResponse: Response | null = null;
        const retryDelay = AI_PHASE_CONFIG.generation.retryDelayMs;
        const timeoutMs = AI_PHASE_CONFIG.generation.timeoutMs;
        const maxGroqAttempts = Math.max(AI_PHASE_CONFIG.generation.maxRetries + 1, groqKeyPool.length);
        const groqStartIndex = Date.now() % groqKeyPool.length;

        let t0Groq = 0;
        for (let attempt = 0; attempt < maxGroqAttempts; attempt++) {
            // Rotate key on each attempt so a rate-limited key is not retried
            const groqKey = groqKeyPool[(groqStartIndex + attempt) % groqKeyPool.length];
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                t0Groq = Date.now();
                groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${groqKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: groqModel,         // 8B for Q&A, 70B for final diagnosis
                    messages: [
                            { role: 'system', content: finalSystemPrompt },
                            ...(detectedLang === 'english' ? [{
                                role: 'system' as const,
                                content: '[LANGUAGE DIRECTIVE — MANDATORY] The user is writing in ENGLISH. You MUST respond in 100% pure English. Every single word must be English. Do NOT use Hindi, Hinglish, or any Hindi words like aap, haldi, adrak. Use "you" not "aap". Use "turmeric" not "haldi". Use "ginger" not "adrak". VIOLATION OF THIS RULE IS A CRITICAL FAILURE.'
                            }] : detectedLang === 'hindi' ? [{
                                role: 'system' as const,
                                content: '[LANGUAGE DIRECTIVE — MANDATORY] The user is writing in Devanagari Hindi. You MUST respond in pure Devanagari Hindi script. Every word must be in हिंदी.'
                            }] : []),
                            ...processedMessages,
                        ],
                        temperature: AI_PHASE_CONFIG.generation.temperature,
                        max_tokens: maxTokensForTurn,  // tight per-phase budget
                        stream: true,
                        stop: ["\n\nUser:", "\n\nHuman:"],
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (groqResponse.ok) {
                    const ttftMs = Date.now() - t0Groq;
                    logLatency('groqTTFT', ttftMs);
                    spans.record('groqTTFT', ttftMs);
                    break; // Success — exit retry loop
                }

                // Log the actual error body for debugging
                const errBody = await groqResponse.text().catch(() => '');
                console.error(`[Groq] attempt ${attempt + 1} failed — status=${groqResponse.status} key=...${groqKey.slice(-6)} body=${errBody.slice(0, 300)}`);

                // If response is not ok but another attempt remains, retry with next key
                if (attempt < maxGroqAttempts - 1) {
                    const delay = groqResponse.status === 429 ? retryDelay * Math.pow(2, attempt) : retryDelay;
                    groqResponse = null;
                    await new Promise(r => setTimeout(r, delay));
                }
            } catch (groqError) {
                console.error(`Groq attempt ${attempt + 1} error:`, groqError);
                groqResponse = null;
                if (attempt < maxGroqAttempts - 1) {
                    await new Promise(r => setTimeout(r, retryDelay));
                }
                // Will fall through to Gemini fallback after all retries
            }
        }

        if (!groqResponse || !groqResponse.ok) {
            // Fallback to Gemini — use GEMINI_API_KEYS pool if available, else single key
            const geminiKeys = getGeminiApiKeys();
            if (geminiKeys.length === 0) {
                console.error('[Groq+Gemini] Both failed — no GEMINI_API_KEY set');
                const sse = [`data: ${JSON.stringify({ content: "I'm having trouble reaching the AI service. Please try again in a moment. 🙏" })}

`, `data: [DONE]\n\n`].join('');
                return new Response(sse, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
            }

            console.log('[Groq] Failed — falling back to Gemini...');

            const geminiMessages = processedMessages.map((m: { role: string; content: string }) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

            const geminiModels = [
                AI_PHASE_CONFIG.models.gemini,
                AI_PHASE_CONFIG.models.geminiLite,
            ];
            let geminiText = '';
            let geminiSucceeded = false;
            let geminiModelUsed = '';
            let lastGeminiError = '';

            for (const model of geminiModels) {
                for (const geminiKey of geminiKeys) {
                    const geminiController = new AbortController();
                    const geminiTimeoutId = setTimeout(() => geminiController.abort(), timeoutMs);

                    try {
                        const geminiResponse = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    systemInstruction: { parts: [{ text: finalSystemPrompt }] },
                                    contents: geminiMessages,
                                    generationConfig: {
                                        temperature: AI_PHASE_CONFIG.generation.temperature,
                                        maxOutputTokens: AI_PHASE_CONFIG.generation.maxTokens,
                                    },
                                }),
                                signal: geminiController.signal,
                            }
                        );

                        if (geminiResponse.ok) {
                            const geminiData = await geminiResponse.json();
                            geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            geminiSucceeded = true;
                            geminiModelUsed = model;
                            break;
                        }

                        const errorText = await geminiResponse.text();
                        lastGeminiError = `${geminiResponse.status} ${errorText.slice(0, 300)}`;
                        console.error(`[Gemini] ${model} failed status=${geminiResponse.status} body=${errorText.slice(0, 300)}`);
                        if (geminiResponse.status === 400 && /api key not valid|api_key_invalid|invalid api key/i.test(errorText)) {
                            disableGeminiApiKey(geminiKey);
                        }
                    } catch (error) {
                        lastGeminiError = providerErrorText(error).slice(0, 300);
                        console.error(`[Gemini] ${model} request failed: ${lastGeminiError}`);
                        if (isInvalidGeminiKeyError(error)) {
                            disableGeminiApiKey(geminiKey);
                        }
                    } finally {
                        clearTimeout(geminiTimeoutId);
                    }
                }

                if (geminiSucceeded) break;
            }

            if (!geminiSucceeded) {
                console.error('Gemini also failed:', lastGeminiError);
                for (const groqKey of groqKeyPool) {
                    const rescueController = new AbortController();
                    const rescueTimeout = setTimeout(() => rescueController.abort(), timeoutMs);

                    try {
                        const rescueResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${groqKey}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                model: AI_PHASE_CONFIG.models.groqFast,
                                messages: [
                                    { role: 'system', content: SYSTEM_PROMPT },
                                    ...processedMessages.slice(-6),
                                ],
                                temperature: AI_PHASE_CONFIG.generation.temperature,
                                max_tokens: Math.min(maxTokensForTurn, 500),
                                stream: false,
                            }),
                            signal: rescueController.signal,
                        });

                        if (rescueResponse.ok) {
                            const rescueData = await rescueResponse.json();
                            const rescueText = rescueData.choices?.[0]?.message?.content || '';
                            if (rescueText) {
                                const rescueSSE = [
                                    `data: ${JSON.stringify({ content: rescueText })}\n\n`,
                                    `data: [DONE]\n\n`,
                                ].join('');
                                return new Response(rescueSSE, {
                                    headers: {
                                        'Content-Type': 'text/event-stream',
                                        'Cache-Control': 'no-cache',
                                        'X-Provider': 'groq-rescue',
                                        'X-Model': AI_PHASE_CONFIG.models.groqFast,
                                    },
                                });
                            }
                        } else {
                            const rescueError = await rescueResponse.text().catch(() => '');
                            console.error(`[Groq rescue] failed status=${rescueResponse.status} body=${rescueError.slice(0, 300)}`);
                        }
                    } catch (error) {
                        console.error(`[Groq rescue] request failed: ${providerErrorText(error).slice(0, 300)}`);
                    } finally {
                        clearTimeout(rescueTimeout);
                    }
                }

                // Stream a friendly message instead of returning 503 (which triggers the error banner)
                const fallbackSSE = [
                    `data: ${JSON.stringify({ content: "I'm experiencing high demand right now. Please try sending your message again in a few seconds. 🙏" })}

`,
                    `data: [DONE]\n\n`,
                ].join('');
                return new Response(fallbackSSE, {
                    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
                });
            }

            // Normalize Gemini response into SSE format to match Groq stream shape
            // so the frontend useChat hook can parse it identically (Failure Mode 3 fix)
            const geminiSSE = [
                `data: ${JSON.stringify({ content: geminiText })}\n\n`,
                `data: [DONE]\n\n`,
            ].join('');

            return new Response(geminiSSE, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'X-Provider': 'gemini',
                    'X-Model': geminiModelUsed,
                },
            });
        }

        // Stream the Groq response back to the client — with chunk-level idle timeout
        // (Bug 1 fix: prevents indefinite stream hangs that Vercel maxDuration cannot catch)
        const CHUNK_IDLE_TIMEOUT_MS = 10_000; // 10s — covers TTFT and inter-chunk gaps
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const reader = groqResponse!.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let idleTimer: ReturnType<typeof setTimeout> | null = null;
                const chunkAbort = new AbortController();

                const resetIdleTimer = () => {
                    if (idleTimer) clearTimeout(idleTimer);
                    idleTimer = setTimeout(() => {
                        console.warn('[stream] Chunk idle timeout — aborting Groq stream');
                        chunkAbort.abort();
                        reader.cancel('idle-timeout').catch(() => {});
                    }, CHUNK_IDLE_TIMEOUT_MS);
                };

                resetIdleTimer(); // arm on stream open

                try {
                    while (true) {
                        // Race reader.read() against the idle abort signal
                        const readPromise = reader.read();
                        const abortPromise = new Promise<never>((_, rej) => {
                            if (chunkAbort.signal.aborted) {
                                rej(new Error('CHUNK_IDLE_TIMEOUT'));
                                return;
                            }
                            chunkAbort.signal.addEventListener('abort', () =>
                                rej(new Error('CHUNK_IDLE_TIMEOUT')), { once: true }
                            );
                        });

                        const { done, value } = await Promise.race([readPromise, abortPromise]);

                        if (done) {
                            if (idleTimer) clearTimeout(idleTimer);
                            break;
                        }

                        resetIdleTimer(); // reset on every received chunk

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || !trimmed.startsWith('data: ')) continue;
                            const data = trimmed.slice(6);
                            if (data === '[DONE]') {
                                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                                continue;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content;
                                if (content) {
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                                }
                            } catch { /* skip malformed chunk */ }
                        }
                    }
                } catch (err: unknown) {
                    if (idleTimer) clearTimeout(idleTimer);
                    const msg = err instanceof Error ? err.message : String(err);

                    if (msg === 'CHUNK_IDLE_TIMEOUT') {
                        console.warn('[stream] Emitting stall error to client');
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'STREAM_STALL', fallback: true })}\n\n`));
                    } else {
                        console.error('[stream] Unexpected error:', err);
                    }
                } finally {
                    if (idleTimer) clearTimeout(idleTimer);
                    controller.close();
                }
            },
        });

        const totalMs = Date.now() - requestStart;
        logLatency('total', totalMs);
        alertIfSlow(totalMs);
        spans.record('total', totalMs);
        spans.flush();

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Response-Time': String(totalMs),
            },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (innerError: any) {
            console.error('[chat/route] Inner error:', innerError);
            const errSSE = [
                `data: ${JSON.stringify({ content: "Something went wrong on my end. Please try again in a moment. 🙏" })}

`,
                `data: [DONE]\n\n`,
            ].join('');
            return new Response(errSSE, {
                headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
            });
        }
    };

    try {
        return await Promise.race([processRequest(), timeoutPromise]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        const msg = error.message === 'timeout'
            ? "This is taking longer than usual. Please try again. 🙏"
            : "Something went wrong on my end. Please try again in a moment. 🙏";
        console.error('[chat/route] Unhandled error:', error.message);
        const sse = [`data: ${JSON.stringify({ content: msg })}

`, `data: [DONE]\n\n`].join('');
        return new Response(sse, {
            headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        });
    }
}
