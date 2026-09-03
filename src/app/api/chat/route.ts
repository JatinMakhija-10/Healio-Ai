import { NextRequest } from 'next/server';
import { rateLimitCheck } from '@/lib/api/rateLimit';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin, AI_PHASE_CONFIG, getGeminiApiKeys, getGroqApiKeys, disableGeminiApiKey } from '@/lib/ai/config';
import { reserveCredits, captureCredits, releaseCredits, type AroviaCreditAction } from '@/lib/credits/server';
import { getParallelEmbeddings } from '@/lib/ai/jina';
import { buildMedicalHistoryContext } from '@/lib/chat/consultationHistory';
import { logLatency, alertIfSlow, SpanCollector } from '@/lib/chat/latencyMonitor';
import {
    buildConversationIntakeState,
    formatConversationIntakeStateForPrompt,
    formatNextQuestionDecisionForPrompt,
    selectNextQuestionDecision,
    computeRefinementDecision,
    formatRefinementDecisionForPrompt,
    resolveChipOptionsForSchema,
    type ConversationIntakeState,
} from '@/lib/diagnosis/dialogue';
// ── Phase 1: RAG & Medical Accuracy imports ────────────────────────────────────
import { computeBMI, getBMIClass } from '@/lib/diagnosis/advanced/PersonaEngine';
import { buildEnrichedQuery, extractProfileContext } from '@/lib/rag/queryRewriter';
import { applyAllergyFilter, serialiseFilteredChunks, hasAnyFlaggedChunk, type RetrievedChunk } from '@/lib/rag/safetyFilter';
import { detectCompoundRedFlags, buildEmergencyResponseText } from '@/lib/safety/redFlagDetector';
import { validateProfileConsistency, formatValidationWarningsForPrompt } from '@/lib/profile/clinicalValidator';
import {
    buildDrugInteractionPrompt,
    buildDosageGroundingPrompt,
    buildCoTDiagnosisProtocol,
    buildConfidenceTiersPrompt,
    buildContextualDisclaimer,
    inferDisclaimerType,
    getAgeStratifiedDosingRules,
    buildPolypharmacyWarningPrompt,
} from '@/lib/prompts/drugInteractionBlock';

// ── Vercel: allow up to 60 s for this Serverless Function ─────────────────────
export const maxDuration = 60;

const EMERGENCY_RESPONSE =
    'WARNING: Based on your symptoms, please seek emergency medical care immediately. Call 112 (India) or 911 (US) or go to the nearest emergency room NOW. Arovia cannot assist with potential emergencies.';

const EMERGENCY_PATTERNS: RegExp[] = [
    /\bchest\s*(?:pain|pressure|tightness)\b/i,
    /\bshort(?:ness)?\s+of\s+breath\b/i,
    /\bdifficulty\s+breathing\b/i,
    // "sudden headache" alone is too common (exercise, sneezing, etc.).
    // Require thunderclap/worst-ever qualifier for a true subarachnoid emergency.
    /\b(?:worst|thunderclap|sudden\s+severe|sudden\s+extreme)\s+headache\b/i,
    /\bloss\s+of\s+consciousness\b/i,
    // Fainting alone is common (dehydration, heat, anxiety). Require a cardiac/
    // respiratory co-occurring term in the same message for hard escalation.
    /\b(?:faint(?:ed|ing)?|passed\s+out)\b.{0,80}\b(?:chest|heart|breath|pulse|palpitat|arm|jaw)\b/i,
    /\b(?:chest|heart|breath|pulse|palpitat|arm|jaw)\b.{0,80}\b(?:faint(?:ed|ing)?|passed\s+out)\b/i,
    /\bcough(?:ing)?\s+blood\b/i,
    /\bslurred?\s+speech\b/i,
    /\bfacial?\s+droop(?:ing)?\b/i,
    // "severe abdominal pain" requires a true compound qualifier
    /\b(?:unbearable|excruciating|worst)\s+(?:abdominal|stomach|belly)\s+pain\b/i,
    /\b(?:baby|infant|newborn).{0,40}\b(?:high\s+)?fever\b/i,
    /\b(?:suicidal|suicide|kill myself|end my life)\b/i,
    /\bseizure\b/i,
    /\bstroke\b/i,
    /\b(?:112|911)\b/i,
    /\b(?:this|it)\s+(?:is|'s)\s+(?:an?\s+)?emergency\b/i,
    /\bmedical\s+emergency\b/i,
];

const NEGATED_RED_FLAG_WINDOW = /\b(?:no|not|without|denies|denied|negative\s+for|do\s+not\s+have|don't\s+have|does\s+not\s+have|doesn't\s+have|nahi|nahin)\b/i;

function hasEmergencyRedFlag(text: string): boolean {
    for (const pattern of EMERGENCY_PATTERNS) {
        const match = pattern.exec(text);
        if (!match) continue;

        const beforeMatch = text.slice(Math.max(0, match.index - 32), match.index);
        const afterMatch = text.slice(match.index + match[0].length, match.index + match[0].length + 16);
        if (!NEGATED_RED_FLAG_WINDOW.test(beforeMatch) && !/^\s*(?:nahi|nahin|not)\b/i.test(afterMatch)) {
            return true;
        }
    }
    return false;
}

interface AuthCacheEntry {
    userId: string;
    exp: number;
    lastAccessed: number;
}

const AUTH_CACHE_TTL_MS = 30_000;

// ── JWT→UserId short-lived auth cache (30 s) ─────────────────────────────────
// Eliminates the per-turn Supabase Auth round-trip (~100 ms) while keeping
// the security window tiny (30 s). Expired entries are lazy-evicted.
const AUTH_CACHE = new Map<string, AuthCacheEntry>();

async function verifyToken(token: string): Promise<string | null> {
    const now = Date.now();
    const hit = AUTH_CACHE.get(token);
    if (hit && now < hit.exp) {
        hit.lastAccessed = now;
        return hit.userId;
    }

    const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '',
        { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) return null;

    AUTH_CACHE.set(token, { userId: user.id, exp: now + AUTH_CACHE_TTL_MS, lastAccessed: now });
    if (AUTH_CACHE.size > 500) {
        const evictionTime = Date.now();
        for (const [k, v] of AUTH_CACHE.entries()) {
            if (evictionTime >= v.exp) AUTH_CACHE.delete(k);
        }
        if (AUTH_CACHE.size > 500) {
            const toDelete = Math.ceil(AUTH_CACHE.size * 0.1);
            [...AUTH_CACHE.entries()]
                .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
                .slice(0, toDelete)
                .forEach(([k]) => AUTH_CACHE.delete(k));
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

function isInvalidGeminiKeyError(error: unknown): boolean {
    const text = providerErrorText(error).toLowerCase();
    return text.includes('api key not valid') || 
           text.includes('api_key_invalid') || 
           text.includes('invalid api key') ||
           text.includes('key is invalid');
}

function cleanLlmText(text: string): string {
    if (!text) return '';
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
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
let groqKeyIndex = 0;

function chatRagKey(symptomSummary: string, skipHome: boolean, includeIndianCare: boolean, personaId?: string): string {
    return `${symptomSummary.slice(0, 150).toLowerCase().trim()}::${skipHome}::${includeIndianCare}::${personaId ?? 'self'}`;
}

function getFromRagCache(key: string): ChatRagCacheEntry | undefined {
    const entry = CHAT_RAG_CACHE.get(key);
    if (!entry) return undefined;

    CHAT_RAG_CACHE.delete(key);
    CHAT_RAG_CACHE.set(key, entry);
    return entry;
}

function setToRagCache(key: string, value: ChatRagCacheEntry): void {
    if (CHAT_RAG_CACHE.has(key)) CHAT_RAG_CACHE.delete(key);
    while (CHAT_RAG_CACHE.size >= CHAT_RAG_MAX) {
        const oldestKey = CHAT_RAG_CACHE.keys().next().value;
        if (!oldestKey) break;
        CHAT_RAG_CACHE.delete(oldestKey);
    }
    CHAT_RAG_CACHE.set(key, value);
}

// ── Parallelised multi-source RAG ─────────────────────────────────────────────
async function fetchAllContext(
    symptomSummary: string,
    skipHomeRemedies = false,
    spans?: SpanCollector,
    includeIndianCare = true,
    personaId?: string
): Promise<{ context: string; homeRemediesAvailable: boolean }> {
    // ── Cache check ──────────────────────────────────────────────────────────
    const cacheKey = chatRagKey(symptomSummary, skipHomeRemedies, includeIndianCare, personaId);
    const cached = getFromRagCache(cacheKey);
    if (cached && Date.now() - cached.ts < CHAT_RAG_TTL) {
        console.log('[RAG] Cache HIT — skipping embed + RPC cycle');
        spans?.record('ragCacheHit', 0);
        spans?.setMeta({ ragCacheHit: true });
        return { context: cached.context, homeRemediesAvailable: cached.homeRemediesAvailable };
    }
    if (cached) CHAT_RAG_CACHE.delete(cacheKey);

    try {
        const t0Embed = Date.now();

        // ── Fire BOTH providers in PARALLEL ──────────────────────────────────
        // Jina  → boericke_embeddings + home_remedy_embeddings (768-dim)
        // Gemini → ayurvedic_knowledge_embeddings (768-dim, Gemini-ingested)
        // Both start simultaneously; neither waits for the other.
        const { jina: jinaEmb, gemini768: geminiEmb } = await getParallelEmbeddings(symptomSummary);

        // Use shared Jina embedding for both Boericke and Home Remedies
        const embedding     = jinaEmb;                    // Jina  → Boericke
        const embedding768  = geminiEmb;                  // Gemini → Ayurvedic
        const embedding3072 = jinaEmb; // Jina -> Home Remedies

        const embedDone = Date.now();
        spans?.record('embedJina', embedDone - t0Embed);
        spans?.record('embedGemini768', embedDone - t0Embed);
        if (!embedding) return { context: '', homeRemediesAvailable: false };

        const t0Rpc = Date.now();
        const [homeopathicRaw, ayurvedicRaw, homeRemedyRaw, ayurvedicPdfRaw] = await Promise.all([
            fetchBoerickeContext(embedding),
            includeIndianCare && embedding768 ? fetchAyurvedicContext(embedding768) : Promise.resolve(''),
            includeIndianCare && !skipHomeRemedies ? fetchHomeRemedyContext(embedding3072) : Promise.resolve(''),
            includeIndianCare && embedding ? fetchAyurvedicPdfContext(embedding) : Promise.resolve(''),
        ]);
        const rpcDone = Date.now();
        spans?.record('ragBoericke', rpcDone - t0Rpc);
        spans?.record('ragAyurvedic', rpcDone - t0Rpc);
        if (includeIndianCare && !skipHomeRemedies) spans?.record('ragHomeRemedy', rpcDone - t0Rpc);

        // Track whether home remedies RAG data was actually retrieved
        const homeRemediesAvailable = includeIndianCare && !skipHomeRemedies && !!homeRemedyRaw;

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
        console.log(`[RAG] Sections: Homeopathic=${!!homeopathicRaw}, Ayurvedic=${!!ayurvedicRaw}, HomeRemedies=${homeRemediesAvailable} (skipHomeRemedies=${skipHomeRemedies}, includeIndianCare=${includeIndianCare})`);

        // ── Store in cache ───────────────────────────────────────────────────
        if (context) {
            setToRagCache(cacheKey, { context, homeRemediesAvailable, ts: Date.now() });
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

    // 1. BMI calculation & class label using PersonaEngine helpers
    const bmi = computeBMI(weight, height);
    const bmiClass = getBMIClass(bmi);

    // 2. Age-stratified dosing tier
    const ageNum = age != null ? parseInt(String(age), 10) : null;
    let dosingTier = 'adult';
    if (ageNum !== null && !isNaN(ageNum)) {
        if (ageNum <= 2) dosingTier = 'neonate/infant';
        else if (ageNum <= 11) dosingTier = 'child';
        else if (ageNum <= 17) dosingTier = 'adolescent';
        else if (ageNum >= 75) dosingTier = 'older elderly (75+)';
        else if (ageNum >= 65) dosingTier = 'young elderly (65–74)';
    }

    // 3. Clinical Inference Rules based on pre-existing conditions
    const clinicalInferences: string[] = [];
    const conditionsLower = conditions.map(c => c.toLowerCase()).join(' ');
    if (conditionsLower.includes('kidney') || conditionsLower.includes('ckd') || conditionsLower.includes('renal') || kidneyLiver) {
        clinicalInferences.push('Renal/Hepatic impairment noted: Avoid nephrotoxic/hepatotoxic agents (NSAIDs, high-dose acetaminophen). Recommend dose adjustment.');
    }
    if (conditionsLower.includes('liver') || conditionsLower.includes('hepat') || conditionsLower.includes('cirrhosis')) {
        clinicalInferences.push('Hepatic impairment detected: Avoid hepatotoxic agents (e.g. high-dose acetaminophen/paracetamol).');
    }
    if (conditionsLower.includes('diabet') || conditionsLower.includes('t2dm') || conditionsLower.includes('t1dm')) {
        clinicalInferences.push('Diabetes detected: Monitor blood glucose impact. Avoid systemic corticosteroids without physician supervision.');
    }
    if (conditionsLower.includes('hypertension') || conditionsLower.includes('blood pressure') || conditionsLower.includes('high bp')) {
        clinicalInferences.push('Hypertension detected: Avoid substances that raise BP (e.g. licorice/mulethi, pseudoephedrine decongestants).');
    }
    if (conditionsLower.includes('asthma') || conditionsLower.includes('copd')) {
        clinicalInferences.push('Chronic respiratory disease detected: Avoid beta-blockers. Check for bronchospasm risk.');
    }
    if (isPregnant) {
        clinicalInferences.push('Pregnancy: Verify fetal safety for all treatments. Avoid standard NSAIDs in 3rd trimester. Avoid tetracyclines.');
    }
    if (recentSurgery) {
        clinicalInferences.push(`Recent Surgery noted: ${recentSurgery}. Factor post-operative recovery and wound healing into recommendations.`);
    }

    // 4. Profile staleness warning
    let stalenessNotice = '';
    const lastUpdateVal = mp.updatedAt || mp.updated_at || mp.lastProfileUpdate || mp.last_profile_update || mp.lastUpdated || mp.last_updated || userMeta.updated_at;
    if (lastUpdateVal) {
        const lastUpdateDate = new Date(lastUpdateVal);
        if (!isNaN(lastUpdateDate.getTime())) {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            if (lastUpdateDate < sixMonthsAgo) {
                stalenessNotice = `[PROFILE STALENESS NOTICE]\n- Last updated: ${lastUpdateDate.toLocaleDateString()} (more than 6 months ago). This profile may be stale. Check if the patient has any new conditions, medications, or allergies.`;
            }
        }
    }

    // Structured Block Formatting
    const block: string[] = [
        '\n[STRUCTURED PATIENT PROFILE]',
        `- Name: ${fullName || 'Unknown'}`,
        `- Age: ${age || 'Unknown'} years (${dosingTier} dosing tier)`,
        `- Gender: ${gender || 'Unknown'}`,
        `- Height: ${height ? `${height} cm` : 'Unknown'}`,
        `- Weight: ${weight ? `${weight} kg` : 'Unknown'}`,
        `- BMI: ${bmi !== null ? `${bmi} (${bmiClass})` : 'Unknown'}`,
    ];

    if (uniqueAllergies.length) {
        block.push('\n[ALLERGIES — NEVER RECOMMEND]');
        uniqueAllergies.forEach(allergy => block.push(`- ${allergy}`));
    }

    if (conditions.length) {
        block.push('\n[PRE-EXISTING CONDITIONS]');
        conditions.forEach(cond => block.push(`- ${cond}`));
    }

    if (medications.length) {
        block.push('\n[CURRENT MEDICATIONS]');
        medications.forEach(med => block.push(`- ${med}`));
        if (medications.length >= 5) {
            block.push(`- NOTE: High-risk polypharmacy warning active (${medications.length} active medications).`);
        }
    }

    if (familyHistory.length) {
        block.push('\n[FAMILY HISTORY]');
        familyHistory.forEach(history => block.push(`- ${history}`));
    }

    const lifestyleParts: string[] = [];
    if (smoking && smoking !== 'never' && smoking !== 'no') lifestyleParts.push(`Smoking: ${smoking}`);
    if (alcohol && alcohol !== 'none' && alcohol !== 'no') lifestyleParts.push(`Alcohol: ${alcohol}`);
    if (diet) lifestyleParts.push(`Diet: ${diet}`);
    if (exercise) lifestyleParts.push(`Activity: ${exercise}`);
    if (sleep) lifestyleParts.push(`Sleep: ${sleep}`);
    if (occupation) lifestyleParts.push(`Occupation: ${occupation}`);
    if (lifestyleParts.length) {
        block.push('\n[LIFESTYLE]');
        lifestyleParts.forEach(part => block.push(`- ${part}`));
    }

    if (clinicalInferences.length) {
        block.push('\n[CLINICAL INFERENCE RULES]');
        clinicalInferences.forEach(inf => block.push(`- ${inf}`));
    }

    if (stalenessNotice) {
        block.push('\n' + stalenessNotice);
    }

    block.push('[END STRUCTURED PATIENT PROFILE]');

    return block.join('\n');
}

// buildMedicalHistoryContext imported from @/lib/chat/consultationHistory

// ── Extract symptom summary from conversation for RAG ─────────────────────────
function extractSymptomSummary(messages: { role: string; content: string }[]): string {
    return messages.filter(m => m.role === 'user').map(m => m.content).join(' ').slice(0, 500);
}

// ── Count how many turns have happened ─────────────────────────────────────────
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
            if (msg.role === 'assistant') {
                console.warn('[enforceRoleAlternation] Dropped leading assistant anchor; persona drift possible');
                continue;
            }
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

function languageDirectiveForPrompt(detectedLang: 'english' | 'hinglish' | 'hindi'): string {
    if (detectedLang === 'english') {
        return '[LANGUAGE DIRECTIVE - MANDATORY] The user is writing in ENGLISH. You MUST respond in 100% pure English. Every single word must be English. Do NOT use Hindi, Hinglish, or Hindi remedy words like aap, haldi, or adrak. Use "you" not "aap", "turmeric" not "haldi", and "ginger" not "adrak".';
    }
    if (detectedLang === 'hindi') {
        return '[LANGUAGE DIRECTIVE - MANDATORY] The user is writing in Devanagari Hindi. You MUST respond in pure Devanagari Hindi script.';
    }
    return '';
}

type AroviaIntent =
    | 'symptom_query'
    | 'medication_query'
    | 'lab_result_query'
    | 'appointment_action'
    | 'general_health_question'
    | 'out_of_scope';

interface AroviaIntentResult {
    intent: AroviaIntent;
    confidence: number;
    evidence: string[];
}

interface DiagnosticPreferences {
    ayurvedicMode: boolean;
    showUncertainty: boolean;
    detailedExplanations: boolean;
}

const DEFAULT_DIAGNOSTIC_PREFERENCES: DiagnosticPreferences = {
    ayurvedicMode: true,
    showUncertainty: true,
    detailedExplanations: true,
};

function normalizeDiagnosticPreferences(value: unknown): DiagnosticPreferences {
    if (!value || typeof value !== 'object') return DEFAULT_DIAGNOSTIC_PREFERENCES;
    const record = value as Partial<Record<keyof DiagnosticPreferences, unknown>>;
    return {
        ayurvedicMode: typeof record.ayurvedicMode === 'boolean' ? record.ayurvedicMode : true,
        showUncertainty: typeof record.showUncertainty === 'boolean' ? record.showUncertainty : true,
        detailedExplanations: typeof record.detailedExplanations === 'boolean' ? record.detailedExplanations : true,
    };
}

function formatDiagnosticPreferencesForPrompt(preferences: DiagnosticPreferences): string {
    return [
        '\n\n=== USER DIAGNOSTIC DISPLAY PREFERENCES ===',
        `Ayurvedic Mode: ${preferences.ayurvedicMode ? 'ON' : 'OFF'}`,
        `Clinical Uncertainty: ${preferences.showUncertainty ? 'ON' : 'OFF'}`,
        `Detailed Explanations: ${preferences.detailedExplanations ? 'ON' : 'OFF'}`,
        'Rules:',
        preferences.ayurvedicMode
            ? '- User wants Indian household remedies, Ayurvedic context, and dosha-aware guidance when safe and relevant.'
            : '- User does NOT want Ayurvedic/dosha/Indian household remedy sections. Set ayurvedic_remedies and home_remedies to empty arrays. Do not mention dosha analysis or kitchen-remedy suggestions.',
        preferences.showUncertainty
            ? '- User wants confidence/evidence quality surfaced clearly in the final response.'
            : '- User does NOT want confidence intervals or evidence-quality commentary shown in prose. Keep required internal confidence fields, but do not emphasize uncertainty details.',
        preferences.detailedExplanations
            ? '- User wants the reasoning behind the final assessment when a final JSON result is produced.'
            : '- User prefers a concise result. Keep bayesianFactors short and set differentialDiagnoses to [] unless a safety-critical alternate must be mentioned.',
        'These user preferences override generic final-output remedy population rules unless emergency escalation requires otherwise.',
        '=== END USER DIAGNOSTIC DISPLAY PREFERENCES ===',
    ].join('\n');
}

function classifyAroviaIntent(text: string): AroviaIntentResult {
    const input = text.toLowerCase().trim();
    const matches = (patterns: RegExp[]) => patterns.filter((pattern) => pattern.test(input)).length;

    const scores: Record<AroviaIntent, number> = {
        symptom_query: matches([
            /\b(fever|cough|cold|headache|pain|ache|rash|vomit|nausea|diarrhea|loose motion|dizziness|fatigue|weakness|swelling|itching|burning|acidity|gas|bukhar|khansi|dard|ulti|dast|chakkar|thakan|jalan|khujli)\b/i,
            /\b(i have|i am feeling|feeling|suffering|symptom|since|for \d+|my child|my mother|my father)\b/i,
        ]),
        medication_query: matches([
            /\b(medicine|medication|tablet|capsule|dose|dosage|side effect|interaction|antibiotic|paracetamol|ibuprofen|metformin|insulin|bp medicine|drug)\b/i,
            /\b(can i take|should i take|safe to take|kitni dose|dawai|goli)\b/i,
        ]),
        lab_result_query: matches([
            /\b(report|lab|blood test|cbc|lft|kft|hba1c|thyroid|tsh|creatinine|cholesterol|platelet|hemoglobin|urine test|xray|mri|ct scan)\b/i,
        ]),
        appointment_action: matches([
            /\b(book|schedule|appointment|doctor near|consult doctor|reschedule|cancel appointment|slot|availability)\b/i,
        ]),
        general_health_question: matches([
            /\b(what is|why does|how to prevent|healthy|diet|exercise|sleep|hydration|wellness|immunity|explain)\b/i,
        ]),
        out_of_scope: matches([
            /\b(stock|crypto|code|homework|essay|movie|travel|loan|politics|weather|game|joke)\b/i,
        ]),
    };

    const ranked = Object.entries(scores)
        .sort((a, b) => b[1] - a[1]) as Array<[AroviaIntent, number]>;
    const [intent, score] = ranked[0];

    if (!input) return { intent: 'out_of_scope', confidence: 0.2, evidence: ['empty message'] };
    if (score === 0) return { intent: 'general_health_question', confidence: input.length > 20 ? 0.62 : 0.35, evidence: ['no strong clinical keyword'] };

    const secondScore = ranked[1]?.[1] ?? 0;
    const confidence = Math.min(0.95, 0.62 + score * 0.16 + Math.max(0, score - secondScore) * 0.08);
    return {
        intent,
        confidence,
        evidence: Object.entries(scores)
            .filter(([, value]) => value > 0)
            .map(([key, value]) => `${key}:${value}`),
    };
}

function formatIntentForPrompt(intent: AroviaIntentResult): string {
    return [
        '\n\n=== INTENT ROUTING ===',
        `intent: ${intent.intent}`,
        `confidence: ${intent.confidence.toFixed(2)}`,
        `evidence: ${intent.evidence.join(', ') || 'none'}`,
        'Rules:',
        '- If intent is symptom_query, run the symptom intake naturally and ask at most one clinically useful next question.',
        '- If intent is medication_query, focus on medication safety, dose uncertainty, and interactions; ask for the exact drug + dose only if missing.',
        '- If intent is lab_result_query, ask for the exact value/unit/range if not provided; do not guess lab interpretation.',
        '- If intent is appointment_action, help with next-step guidance and route to booking language; do not run symptom intake unless symptoms are also present.',
        '- If intent is general_health_question, answer directly with safe educational guidance and doctor signals.',
        '- If intent is out_of_scope, briefly say Arovia can help with health and wellness questions only.',
        '=== END INTENT ROUTING ===',
    ].join('\n');
}

function creditActionForTurn(intent: AroviaIntentResult, userTurns: number, isFinalTurn: boolean, ragWillBeFetched: boolean): string {
    if (intent.intent === 'lab_result_query') return 'lab_report_analysis';
    if (isFinalTurn || (ragWillBeFetched && userTurns >= 2) || (ragWillBeFetched && intent.intent === 'medication_query')) return 'rag_query';
    return 'standard_chat';
}

async function reserveCreditsBeforeAi(
    userId: string,
    action: AroviaCreditAction
): Promise<{ reservationId?: string; response?: Response }> {
    const result = await reserveCredits(userId, action);

    if (!result.success && result.error === 'insufficient_credits') {
        return {
            response: new Response(JSON.stringify({
                error: 'insufficient_credits',
                balance: result.balance ?? 0,
                required: result.required ?? 1,
                plan: result.plan ?? 'free',
            }), {
                status: 402,
                headers: { 'Content-Type': 'application/json' },
            })
        };
    }

    return { reservationId: result.reservation_id };
}

async function logLlmRequest(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serviceClient: any,
    payload: {
        userId: string;
        provider: string;
        model: string;
        intent: string;
        creditAction: string;
        latencyMs: number;
        success?: boolean;
        error?: string;
    }
) {
    try {
        await serviceClient.from('llm_requests').insert({
            user_id: payload.userId,
            provider: payload.provider,
            model: payload.model,
            intent: payload.intent,
            credit_action: payload.creditAction,
            latency_ms: payload.latencyMs,
            success: payload.success ?? true,
            error: payload.error ?? null,
        });
    } catch (error) {
        console.warn('[llm_requests] audit insert skipped:', providerErrorText(error).slice(0, 120));
    }
}

// ── System prompt (injected AFTER RAG context for maximum weight) ─────────────
const SYSTEM_PROMPT = `
[ROLE IDENTITY]
You are Arovia - a trusted wellness guide for Indian families. Your purpose is to help people understand everyday health concerns, manage what they safely can at home, and reach the right practitioner for what they cannot. You have deep knowledge of integrative wellness - homeopathy, Ayurveda, evidence-based self-care, and conventional medicine - but you are NOT a diagnosing physician and you never present yourself as one.

Your mental model: "Help you understand it, manage what is safe at home, reach the right person for what is not."
Your brand promise: Give people something genuinely useful - without panic, and without replacing professional care.

ESCALATION LADDER - determine this level for every final response:
  L1 Routine self-care      - Mild, common, no danger signs. Self-care and monitoring.
  L2 Watchful waiting       - Not urgent but warrants monitoring. Home care + return-if trigger within 48 h.
  L3 Non-urgent consult     - Warrants professional review within days. Include what to tell them.
  L4 Urgent consult         - Same-day professional attention. Override and suppress all home-care blocks.
  L5 Emergency              - Danger signs present. Escalate immediately. Output ONLY the emergency string.

EVIDENCE LABEL VOCABULARY - attach exactly one label to every remedy or practice you mention:
  Clinically established    - Strong evidence from clinical research
  Common self-care          - Widely used; generally safe and well-tolerated
  Traditional practice      - Classical or cultural use; limited modern clinical evidence
  Emerging limited evidence - Early research; not yet conclusive
  Avoid or consult first    - Safety concern or contraindication; always qualify before recommending

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

[SAFETY & ESCALATION BOUNDARIES]
Server-side algorithms handle immediate emergency keyword scans (chest pain, stroke, severe respiratory distress, trauma).
Your role during the intake Q&A phase is to be a calm, reassuring wellness guide:
- For common symptoms (fever, stomach ache, pale stool, weakness, cough, acidity, headache): conduct normal intake Q&A, ask appropriate follow-up questions, and provide calm guidance.
- Do NOT output emergency warning text for routine or common symptoms during intake.
- If symptoms suggest a doctor consult is needed, continue intake calmly and set escalation_level to L3 or L4 in the final summary card.

[DIAGNOSTIC STATE MACHINE]
You are running a structured diagnostic interview. Track internally which of the 9 data points below have been answered. Ask the NEXT unanswered question in priority order. Never ask a question whose answer was already given.

QUESTION PRIORITY (ask ONE at a time, skip if already answered):
  Q1: chief_complaint   — What is the main problem?
  Q2: duration          — How long has this been happening?
  Q3: severity          — How bad is it on a scale of 1-10?
  Q4: location          — Where exactly in the body? (PAIN ONLY - skip for nausea, vomiting, fever, fatigue, dizziness, cold, rash)
  Q5: sensation         — What does the discomfort or symptom feel like? Use symptom-relevant words and NEVER assume it is pain.
  Q6: associated        — Any fever, nausea, dizziness, or other symptoms alongside?
  Q7: aggravation       — What makes it worse?
  Q8: amelioration      — What gives relief?
  Q9: history           — How did it start? Any stress, poor sleep, dietary change?

SYMPTOM-SPECIFIC APPLICABILITY RULES (CRITICAL):
- NEVER ask Q4 location ("Where in your body") or Q5 pain descriptors ("sharp/stabbing/throbbing") for non-pain, GI, or systemic symptoms (nausea, vomiting, fever, fatigue, dizziness, diarrhea, cold, rash).
- For nausea, vomiting, or stomach upset, focus strictly on duration, frequency, food triggers, ability to keep ORS/water down, and dehydration red flags.
- Q4 location is ONLY for localized physical pain (back pain, joint pain, chest pain, headache).
- Q5 sensation pain-quality options are ONLY for pain conditions. For non-pain symptoms, use symptom-relevant options (e.g., dry vs wet for cough, queasy vs vomiting for nausea) or skip Q5.

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
Arovia: "I'm sorry you're dealing with this — headaches can be very disruptive. How long have you been experiencing it?
{\"ui_hint\": {\"type\": \"chips\", \"options\": [\"Today\", \"1-3 days\", \"4-7 days\", \"1-2 weeks\", \"Recurring\", \"Other - I'll type it\"], \"question_type\": \"duration\"}}"

User: "Since yesterday."
Arovia: "Understood — starting yesterday. How would you rate the intensity of the headache right now, on a scale of 1 to 10?
{\"ui_hint\": {\"type\": \"slider\", \"min\": 1, \"max\": 10, \"question_type\": \"severity\"}}"

User: "Around a 6."
Arovia: "A 6 means it is clearly bothering you. What does the discomfort feel like? Choose the closest option, or describe it in your own words.
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

[WHAT AROVIA NEVER DOES]
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
- Never write escalation-level codes like [L1], [L2], [L3], [L4], or [L5] in conversational text. These codes belong ONLY inside the structured JSON block. If they appear in plain text the user will see them literally as "[L4]" — this is forbidden.

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

ASSESSMENT SPECIFICITY RULES:
  - The "name" field MUST be a specific primary assessment label such as "Gastritis / indigestion pattern" or "Acid reflux pattern"; do not use generic labels like "gastrointestinal issue pattern" unless the symptom data is truly too sparse.
  - Include at least 2 differentialDiagnoses when enough data exists. Each alternate must be specific, medically plausible, and explain why it was considered.
  - If confidence is below 80, explicitly state what extra detail would improve confidence in bayesianFactors or practitioner_prep.

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
  "disclaimer": "Arovia provides wellness guidance, not a medical diagnosis. Always consult a qualified practitioner for persistent, worsening, or serious symptoms."
}
\`\`\`
`;


function repairDanglingUiHintPrompt(text: string): string {
    const hintMatch = text.match(/\{"ui_hint"\s*:/);
    if (!hintMatch || hintMatch.index === undefined) return text;

    const prefix = text.slice(0, hintMatch.index).replace(/\s+$/, '');
    const suffix = text.slice(hintMatch.index);
    const hasSeverityContext = /\b(severe|severity|intensity|pain|bad|rate|rating|scale)\b/i.test(prefix);
    if (!hasSeverityContext) return text;

    let repairedPrefix = prefix;
    const repairs: Array<[RegExp, string]> = [
        [/\b(on\s+a\s+scale\s+of)\s*$/i, '$1 1 to 10'],
        [/\b(scale\s+of)\s*$/i, '$1 1 to 10'],
        [/\b(on\s+a\s+scale\s+from)\s*$/i, '$1 1 to 10'],
        [/\b(scale\s+from)\s*$/i, '$1 1 to 10'],
    ];

    for (const [pattern, replacement] of repairs) {
        if (pattern.test(repairedPrefix)) {
            repairedPrefix = repairedPrefix.replace(pattern, replacement);
            break;
        }
    }

    if (/\b(?:1\s*(?:to|-)\s*10|out\s+of\s+10)\s*$/i.test(repairedPrefix) && !/[?.!]$/.test(repairedPrefix)) {
        repairedPrefix += '?';
    }

    return repairedPrefix === prefix ? text : `${repairedPrefix}\n${suffix}`;
}

function parseFirstFencedJson(text: string): unknown | null {
    const fencedBlocks = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)];
    let bestResult: unknown = null;
    let bestSize = 0;

    for (const block of fencedBlocks) {
        const raw = block[1];
        if (!raw) continue;
        const firstBrace = raw.indexOf('{');
        const lastBrace = raw.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace < firstBrace) continue;

        try {
            const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
            const size = lastBrace - firstBrace;
            if (size > bestSize) {
                bestResult = parsed;
                bestSize = size;
            }
        } catch {
            // Try the next fenced block before falling back.
        }
    }

    return bestResult;
}

function getCollectedValue(state: ConversationIntakeState, aliases: string[]): string | undefined {
    for (const [key, value] of state.collectedData.entries()) {
        if (aliases.some((alias) => key === alias || key.endsWith(`.${alias}`))) {
            return value;
        }
    }
    return undefined;
}

function inferFallbackSeverity(state: ConversationIntakeState): 'mild' | 'moderate' | 'severe' {
    const value = (getCollectedValue(state, ['severity']) || '').toLowerCase();
    const numeric = value.match(/\b([1-9]|10)\b/)?.[1];
    if (numeric) {
        const score = Number(numeric);
        if (score >= 8) return 'severe';
        if (score >= 4) return 'moderate';
        return 'mild';
    }
    if (/severe|unbearable|extreme|very bad/.test(value)) return 'severe';
    if (/moderate|medium|bad/.test(value)) return 'moderate';
    return 'mild';
}

type FallbackHomeopathicRemedy = {
    name: string;
    description: string;
    potency: string;
    method: string;
    source: string;
    evidence_label: 'Traditional practice' | 'Avoid or consult first';
};

const COLLECTED_FIELD_LABELS: Record<string, string> = {
    chief_complaint: 'Main concern',
    duration: 'Duration',
    severity: 'Severity',
    location: 'Location',
    sensation: 'Sensation',
    associated: 'Associated symptoms',
    aggravation: 'Worse with',
    amelioration: 'Relief with',
    history: 'Started after',
    'fever.temp_value': 'Temperature',
    'fever.duration': 'Fever duration',
    'fever.rigors': 'Chills or shaking',
    'fever.danger_signs': 'Fever danger signs',
    'fever.associated': 'Associated symptoms',
    'cough_cold.duration': 'Throat/cough duration',
    'cough_cold.breathing_red_flags': 'Breathing or swallowing danger signs',
    'cough_cold.fever': 'Fever or chills',
    'cough_cold.sputum': 'Cough or throat sensation',
    'cough_cold.associated': 'Associated symptoms',
    'abdominal_pain.location': 'Abdominal pain location',
    'abdominal_pain.duration': 'Duration',
    'abdominal_pain.severity': 'Severity',
    'vomiting_diarrhea.duration': 'Duration',
    'vomiting_diarrhea.frequency': 'Frequency',
    'body_pain.duration': 'Pain duration',
    'body_pain.severity': 'Pain severity',
    'body_pain.location': 'Pain location',
    'body_pain.sensation': 'Pain type',
    'body_pain.onset': 'How it started',
};

function labelCollectedField(key: string): string {
    const cleaned = key.replace(/_red_flag_trigger$/, '');
    const mapped = COLLECTED_FIELD_LABELS[cleaned];
    if (mapped) return mapped;
    const tail = cleaned.split('.').pop() || cleaned;
    return tail
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCollectedSummary(state: ConversationIntakeState): string {
    const entries = [...state.collectedData.entries()]
        .filter(([key, value]) => !key.endsWith('_red_flag_trigger') && value.trim().length > 0)
        .slice(0, 8)
        .map(([key, value]) => `${labelCollectedField(key)}: ${value}`);

    return entries.join('; ');
}

function practitionerCheckForSchema(schemaId: ConversationIntakeState['activeSchemaId']): string {
    switch (schemaId) {
        case 'fever':
            return 'They may check temperature, pulse, hydration, throat/chest findings, and infection warning signs.';
        case 'cough_cold':
            return 'They may check throat, tonsils, breathing, oxygen level, fever pattern, and chest findings.';
        case 'abdominal_pain':
        case 'vomiting_diarrhea':
            return 'They may check hydration, abdominal tenderness, fever, urine/stool clues, and need for tests.';
        case 'headache':
            return 'They may check blood pressure, vision, neck stiffness, neurological signs, and sinus or migraine clues.';
        case 'body_pain':
            return 'They may examine the painful area, range of motion, swelling, nerve signs, and injury history.';
        case 'skin_rash':
            return 'They may check rash pattern, spread, allergy exposure, infection signs, and fever.';
        default:
            return 'They may check vital signs, examine the affected area, and decide if tests or medicines are needed.';
    }
}

function getFallbackHomeopathicRemedies(schemaId: ConversationIntakeState['activeSchemaId']): FallbackHomeopathicRemedy[] {
    const source = 'Boericke Materia Medica; traditional homeopathic practice';
    const commonMethod = 'Use only with guidance from a qualified homeopathic or medical practitioner; do not repeat doses if symptoms worsen or danger signs appear.';

    switch (schemaId) {
        case 'fever':
            return [
                {
                    name: 'Aconitum napellus',
                    description: 'Traditionally matched with sudden early fever after chill, restlessness, and dry heat.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
                {
                    name: 'Belladonna',
                    description: 'Traditionally considered when fever is sudden, hot, flushed, throbbing, and sensitive to light or noise.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
                {
                    name: 'Gelsemium',
                    description: 'Traditionally matched with feverish weakness, heaviness, chills, and drowsy tiredness.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
            ];
        case 'cough_cold':
            return [
                {
                    name: 'Aconitum napellus',
                    description: 'Traditionally matched with sudden throat pain or cold symptoms after cold wind or exposure.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
                {
                    name: 'Belladonna',
                    description: 'Traditionally considered for sudden red, hot, painful throat with throbbing or feverish heat.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
                {
                    name: 'Hepar sulphuris',
                    description: 'Traditionally matched with splinter-like throat pain, marked cold sensitivity, or painful swallowing.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
            ];
        case 'abdominal_pain':
        case 'vomiting_diarrhea':
            return [
                {
                    name: 'Nux vomica',
                    description: 'Traditionally considered for indigestion, acidity, nausea, or cramps after heavy food, stress, or irregular routine.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
                {
                    name: 'Arsenicum album',
                    description: 'Traditionally matched with stomach upset with restlessness, burning sensation, frequent small sips, or food-related concern.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
                {
                    name: 'Pulsatilla',
                    description: 'Traditionally considered when symptoms follow rich or oily food and feel better with open air or gentle support.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
            ];
        case 'headache':
            return [
                {
                    name: 'Belladonna',
                    description: 'Traditionally matched with sudden throbbing headache, heat, flushing, or sensitivity to light and noise.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
                {
                    name: 'Nux vomica',
                    description: 'Traditionally considered for headache linked with stress, sleep loss, screen strain, stimulants, or digestive upset.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
                {
                    name: 'Gelsemium',
                    description: 'Traditionally matched with heavy, dull headache with tiredness, weakness, or flu-like feeling.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
            ];
        case 'body_pain':
            return [
                {
                    name: 'Arnica montana',
                    description: 'Traditionally matched with bruised soreness, injury-like pain, or tenderness after strain or impact.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
                {
                    name: 'Ruta graveolens',
                    description: 'Traditionally considered for tendon, ligament, wrist, finger, or overuse strain patterns.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
                {
                    name: 'Rhus toxicodendron',
                    description: 'Traditionally matched with stiffness and aching that feels worse at first movement and eases after gentle motion.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
            ];
        case 'skin_rash':
            return [
                {
                    name: 'Apis mellifica',
                    description: 'Traditionally considered for puffy, stinging, itchy swelling that may feel better with cool applications.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
                {
                    name: 'Rhus toxicodendron',
                    description: 'Traditionally matched with itchy blister-like rash or irritation that feels worse with scratching or dampness.',
                    potency: 'Practitioner-guided 30C',
                    method: commonMethod,
                    source,
                    evidence_label: 'Traditional practice',
                },
            ];
        default:
            return [
                {
                    name: 'Constitutional homeopathic review',
                    description: 'A practitioner can match the remedy to exact sensation, triggers, thirst, temperature preference, timing, and mental state.',
                    potency: 'Practitioner-selected potency',
                    method: commonMethod,
                    source,
                    evidence_label: 'Avoid or consult first',
                },
            ];
    }
}

function buildFallbackDiagnosisCard(state: ConversationIntakeState) {
    const symptomText = [
        state.chiefComplaint,
        getCollectedValue(state, ['associated']),
        getCollectedValue(state, ['sensation']),
    ].filter(Boolean).join(', ');
    const concern = symptomText || state.activeSchemaLabel || 'the symptoms you described';
    const collectedSummary = formatCollectedSummary(state);
    const summaryForUser = collectedSummary || `Main concern: ${concern}`;
    const hasRedFlags = state.redFlagsFound.length > 0;
    const severity = inferFallbackSeverity(state);
    // L4 requires BOTH confirmed red flags AND severity at severe/high level.
    // A mild-severity presentation with a caution flag gets L3 (doctor within days),
    // not L4 (same-day urgent care). This prevents conjunctivitis and similar
    // common conditions from being escalated to the emergency tier.
    const escalationLevel = (hasRedFlags && severity === 'severe') ? 'L4'
        : hasRedFlags ? 'L3'
        : severity === 'severe' ? 'L3'
        : 'L2';
    const isUrgent = escalationLevel === 'L4';
    const needsConsult = escalationLevel === 'L3' || isUrgent;
    const confidence = Math.max(55, Math.min(78, 45 + state.answeredFields.size * 5));
    const schemaLabel = state.activeSchemaLabel || 'symptom';
    const safeSelfCare = !isUrgent && severity !== 'severe';

    return {
        id: `fallback-${state.activeSchemaId}`,
        concern_summary: `Based on what you shared, this fits a ${schemaLabel.toLowerCase()} pattern that should be monitored carefully. This is cautious guidance, not a confirmed diagnosis.`,
        escalation_level: escalationLevel,
        escalation_action: isUrgent
            ? 'Please seek same-day medical care, especially if symptoms worsen or any danger sign appears.'
            : needsConsult
                ? 'Please see a doctor within the next 1-2 days to confirm the diagnosis and rule out other causes.'
                : '',
        name: `Likely ${schemaLabel.toLowerCase()} pattern`,
        description: `Key details considered: ${summaryForUser}. This assessment uses only the information collected in this chat and should be confirmed by a qualified practitioner if symptoms persist or worsen.`,
        severity,
        confidence,
        emergency: false,
        bayesianFactors: `Arovia matched the ${schemaLabel.toLowerCase()} intake pathway using: ${summaryForUser}. Confidence stays conservative because a physical exam, vitals, and any missing symptom details could change the assessment.`,
        differentialDiagnoses: [
            {
                name: `Alternate ${schemaLabel.toLowerCase()} cause`,
                likelihood: 'low',
                rationale: 'More detail, physical examination, and vital signs may change the assessment.',
            },
        ],
        matchCriteria: { locations: [] },
        homeopathic_remedies: safeSelfCare ? getFallbackHomeopathicRemedies(state.activeSchemaId) : [],
        ayurvedic_remedies: safeSelfCare ? [
            {
                name: 'Gentle diet and rest support',
                indication: 'Supports recovery while symptoms are monitored.',
                preparation: 'Prefer warm, light, freshly prepared food and adequate rest; avoid heavy, oily, or very spicy meals until settled.',
                source: 'Traditional Ayurvedic self-care principles',
                evidence_label: 'Traditional practice',
            },
        ] : [],
        home_remedies: safeSelfCare ? [
            {
                name: 'Small frequent sips of fluid',
                indication: 'Helps reduce dehydration risk when fever, vomiting, or stomach upset is present.',
                preparation: 'Take small sips of water or oral rehydration solution frequently. Seek care if vomiting persists or urine becomes very low.',
                evidence_label: 'Common self-care',
            },
        ] : [],
        care_plan: isUrgent
            ? 'Do not rely on home care alone. Arrange same-day medical review and monitor breathing, alertness, hydration, and fever pattern.'
            : needsConsult
                ? 'Rest and monitor your symptoms carefully. Please book an appointment to see a doctor within the next 1-2 days, or sooner if symptoms worsen.'
                : 'Rest, hydrate, monitor temperature and symptoms, and avoid heavy meals. If symptoms worsen, persist, or new danger signs appear, seek medical care.',
        lifestyle_advice: ['Keep notes on temperature, vomiting frequency, hydration, and any worsening symptoms.'],
        when_to_consult: isUrgent
            ? 'Seek medical care today.'
            : needsConsult
                ? 'See a doctor within 1-2 days. Go sooner or to an urgent care centre if symptoms worsen significantly.'
                : 'Consult a doctor if symptoms do not improve within 24-48 hours, vomiting continues, fever rises, dehydration appears, or you feel worse.',
        practitioner_prep: `Share this clearly: ${summaryForUser}. ${practitionerCheckForSchema(state.activeSchemaId)}`,
        red_flags: [
            ...state.redFlagsFound,
            'confusion',
            'difficulty breathing',
            'stiff neck',
            'persistent high fever',
            'blood in vomit or stool',
            'signs of dehydration',
        ],
        warnings: [
            'This is a conservative safety card based on the details available in this chat.',
            'Seek professional medical care for persistent, worsening, or concerning symptoms.',
        ],
        seekHelp: hasRedFlags || severity === 'severe'
            ? 'Seek same-day medical care.'
            : 'Seek care if symptoms worsen or do not improve within 24-48 hours.',
        disclaimer: 'Arovia provides wellness guidance, not a medical diagnosis. Always consult a qualified practitioner for persistent, worsening, or serious symptoms.',
    };
}

function ensureFinalDiagnosisPayload(text: string, isFinalTurn: boolean, state: ConversationIntakeState): string {
    const safeText = repairDanglingUiHintPrompt(text).trim();
    if (!isFinalTurn) return safeText;

    if (parseFirstFencedJson(safeText)) return safeText;

    const prefix = (safeText.split(/```(?:json)?/)[0] || '').trim() ||
        "Based on everything you've shared, here's what I've found.";
    const fallbackCard = buildFallbackDiagnosisCard(state);
    return `${prefix}\n\n\`\`\`json\n${JSON.stringify(fallbackCard, null, 2)}\n\`\`\``;
}

function streamTextResponse(text: string, customHeaders?: Record<string, string>): Response {
    const safeText = repairDanglingUiHintPrompt(text);
    const sse = [
        `data: ${JSON.stringify({ content: safeText })}\n\n`,
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
    // Keep comfortably inside the 60s function limit while allowing full model answers.
    const timeoutPromise = new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 55_000)
    );

    const processRequest = async (): Promise<Response> => {
        let reservationId: string | undefined;
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
        const { messages, personaId, resumeContext, diagnosticPreferences: rawDiagnosticPreferences } = await req.json() || {};
        const diagnosticPreferences = normalizeDiagnosticPreferences(rawDiagnosticPreferences);
        const totalUserTurns = Array.isArray(messages)
            ? messages.filter((m: { role?: string }) => m.role === 'user').length
            : 0;
        const rawLastUserMsg = Array.isArray(messages)
            ? messages
                .filter((m: { role?: string; content?: string }) => m.role === 'user')
                .pop()?.content ?? ''
            : '';

        if (hasEmergencyRedFlag(rawLastUserMsg)) {
            return streamTextResponse(EMERGENCY_RESPONSE, { 'X-Intake-Decision': 'emergency-keyword' });
        }

        // ── Compound red-flag check (multi-symptom patterns) ─────────────────
        // Catches patterns that single-keyword scan misses (e.g. chest pain + arm + sweating)
        const compoundFlag = detectCompoundRedFlags(rawLastUserMsg);
        if (compoundFlag.detected) {
            const compoundEmergencyText = buildEmergencyResponseText(compoundFlag);
            return streamTextResponse(compoundEmergencyText, { 'X-Intake-Decision': 'emergency-compound', 'X-Red-Flag': compoundFlag.flag ?? '' });
        }

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
            // 4. Full user profile (medical_profile from verified Auth user record)
            serviceClient.auth.admin.getUserById(userId),
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
            const profileResponse = userProfileResult.value as { data: { user?: { user_metadata?: Record<string, any> } }; error?: { message?: string } | null };
            if (profileResponse.error) {
                console.warn('[chat/route] User profile fetch failed:', profileResponse.error.message);
            }
            const userMeta = profileResponse.data?.user?.user_metadata;
            if (userMeta) {
                patientProfileContext = buildPatientProfileContext(userMeta);
                if (patientProfileContext) {
                    console.log('[PROFILE] Patient profile injected into prompt');
                }
                // ── Clinical profile consistency validation ──────────────────
                const profileCtx = extractProfileContext(userMeta);
                const profileWarnings = validateProfileConsistency({
                    age: profileCtx.age,
                    conditions: profileCtx.conditions,
                    medications: profileCtx.medications,
                    allergies: profileCtx.allergies,
                });
                if (profileWarnings.length) {
                    const warningBlock = formatValidationWarningsForPrompt(profileWarnings);
                    if (warningBlock) patientProfileContext += warningBlock;
                    console.log(`[PROFILE] ${profileWarnings.length} clinical consistency warning(s) injected`);
                }
            }
        } else if (userProfileResult.status === 'rejected') {
            console.warn('[chat/route] User profile fetch failed:', userProfileResult.reason);
        }

        // Token overflow protection with a minimum rolling context window of 8 turns.
        let dynamicMaxMessages = 16;
        const userTurnsEarly = totalUserTurns;
        if (userTurnsEarly > 8) dynamicMaxMessages = 18;
        if (userTurnsEarly > 12) dynamicMaxMessages = 24;

        // Build role-safe sliding window — preserves language anchors AND enforces
        // strict User↔Assistant alternation to prevent API 400 rejections (Bug 2 fix)
        const processedMessages = buildSafeWindow(messages, dynamicMaxMessages);

        // ── Groq key pool (supports GROQ_API_KEYS comma-separated OR single GROQ_API_KEY)
        const groqKeyPool = getGroqApiKeys();
        if (groqKeyPool.length === 0 && AI_PHASE_CONFIG.primary !== 'gemini') {
            return streamTextResponse('AI service is not configured. Please contact support.');
        }
        // Key selected per-attempt inside the retry loop (see below)

        // ── Turn phase detection ─────────────────────────────────────────────
        // PHASE A (turns 1-2): Pure Q&A — no RAG, 8B model, 200 token cap  → ~100-300ms
        // PHASE B (turns 3-5): Q&A + Boericke/Ayurvedic RAG, 8B model, 350 tokens → ~500-800ms
        // PHASE C (turn 6+ or explicit diagnosis request): Full RAG + home
        //         remedies + 70B model + 2000 tokens → rich, detailed final answer
        const userTurns = totalUserTurns;
        const isFollowUpMode = Boolean(resumeContext && typeof resumeContext === 'object');
        const lastUserMsg = (processedMessages as { role: string; content: string }[])
            .filter(m => m.role === 'user')
            .pop()?.content ?? '';
        const intentResult = classifyAroviaIntent(lastUserMsg);

        if (userTurns === 1 && !isFollowUpMode && intentResult.confidence < 0.75) {
            return streamTextResponse(
                "I want to understand correctly. Is this about a symptom you are feeling, a medicine, a lab report, or booking a doctor?",
                {
                    'X-Intent': intentResult.intent,
                    'X-Intent-Confidence': intentResult.confidence.toFixed(2),
                }
            );
        }

        const conversationIntakeState = buildConversationIntakeState(processedMessages);
        const nextQuestionDecision = selectNextQuestionDecision(conversationIntakeState);

        if (nextQuestionDecision.type === 'escalate') {
            return streamTextResponse(
                EMERGENCY_RESPONSE,
                { 'X-Intake-Decision': 'escalate' }
            );
        }

        // Detect user language programmatically — prompt-level rules are too weak for 8B models
        const detectedLang = detectUserLanguage(lastUserMsg);
        const refinementLanguage = detectedLang === 'hindi' ? 'hi' : detectedLang === 'english' ? 'en' : 'hinglish';
        console.log(`[LANG] Detected: ${detectedLang} for input: "${lastUserMsg.slice(0, 60)}"`);

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
            refinementLanguage
        );

        // Phase 5 override: finalize or finalize_best_guess ONLY allowed if P1 coverage is 100%
        const phase5Finalize = (refinementDecision.action === 'finalize' ||
            refinementDecision.action === 'finalize_best_guess') && 
            conversationIntakeState.coverageScore === 100;

        const asksForDiagnosis =
            /re-?diagnos|fresh diagnosis|new diagnosis|diagnos.*again|what.*wrong|what.*condition|what.*problem|give.*result|tell.*diagnosis|my diagnosis|show.*card|result.*card|diagnosis.*card/i
                .test(lastUserMsg);
        const asksForEarlyAssessment =
            /early assessment|best guess|based on this|with this info|whatever you know|tell me now|abhi bata|abhi bta/i
                .test(lastUserMsg);
        const answeredDiagnosticFields = conversationIntakeState.answeredFields.size;
        const hasMinimumFinalIntake =
            conversationIntakeState.coverageScore === 100 ||
            answeredDiagnosticFields >= 5;

        const turnLimitReached = totalUserTurns >= 7;
        const naturalCompletion =
            nextQuestionDecision.type === 'summarize' ||
            conversationIntakeState.phaseStatus === 'summary' ||
            phase5Finalize;
        const userRequestedEarly = asksForDiagnosis && totalUserTurns >= 4;
        const explicitEarlyWithData =
            asksForDiagnosis &&
            asksForEarlyAssessment &&
            totalUserTurns >= 3 &&
            answeredDiagnosticFields >= 3;

        const isFinalTurn =
            (hasMinimumFinalIntake && (turnLimitReached || naturalCompletion || userRequestedEarly)) ||
            explicitEarlyWithData;

        // Ensure state aligns if we force final turn
        if (isFinalTurn) {
            nextQuestionDecision.type = 'summarize';
            nextQuestionDecision.field = null;
            nextQuestionDecision.reason = 'Final diagnosis turn selected after sufficient intake or explicit early-assessment criteria.';
            nextQuestionDecision.stopQuestioning = true;
            if (refinementDecision.action !== 'finalize' && refinementDecision.action !== 'finalize_best_guess') {
                refinementDecision.action = 'finalize_best_guess';
                refinementDecision.reason = `Forced finalization. Max turns or sufficient data reached.`;
                refinementDecision.infoGainQuestion = null;
            }
        }

        console.log(`[Phase5] action=${refinementDecision.action} conf=${refinementDecision.topConfidence.toFixed(1)}% plateau=${refinementDecision.plateauDetected} isFinal=${isFinalTurn}`);

        // Model + token budget per phase
        const needsBalancedModel =
            isFinalTurn ||
            intentResult.intent === 'medication_query' ||
            intentResult.intent === 'lab_result_query' ||
            (intentResult.intent === 'symptom_query' && userTurns >= 3);

        const groqModel = needsBalancedModel
            ? AI_PHASE_CONFIG.models.groq        // groq/compound — rich diagnosis
            : AI_PHASE_CONFIG.models.groqFast;   // groq/compound-mini — fast & precise Q&A

        const maxTokensForTurn = isFinalTurn ? 4096 : 1500;

        const ragGateOpen =
            userTurns >= 2 ||
            intentResult.intent === 'medication_query' ||
            intentResult.intent === 'lab_result_query';
        const ragWillBeFetched = ragGateOpen && (
            isFinalTurn ||
            intentResult.intent === 'medication_query' ||
            intentResult.intent === 'lab_result_query' ||
            (isFollowUpMode && asksForAdviceOnly) ||
            userTurns === 2 ||
            lastUserMsg.length >= 60 ||
            /diagnos|remedy|treatment|suggest|recommend|medicine|herb|what (is|should|do)|cure|relief|prescri/i
                .test(lastUserMsg)
        );
        const creditAction = creditActionForTurn(intentResult, userTurns, isFinalTurn, ragWillBeFetched) as AroviaCreditAction;
        const creditReserve = await reserveCreditsBeforeAi(userId, creditAction);
        if (creditReserve.response) return creditReserve.response;
        reservationId = creditReserve.reservationId;

        // ── RAG gating ──────────────────────────────────────────────────────
        let ragContext = '';
        let homeRemediesAvailable = false;

        if (ragGateOpen) {
            if (ragWillBeFetched) {
                const symptomSummary = extractSymptomSummary(processedMessages);
                const personaCacheKey = typeof personaId === 'string' && personaId.trim() ? personaId.trim() : undefined;

                // ── Profile-aware RAG query enrichment (§2.1) ────────────────
                // Extract profile from user metadata for query enrichment
                let enrichedSymptomQuery = symptomSummary;
                if (userProfileResult.status === 'fulfilled' && userProfileResult.value) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const _meta = (userProfileResult.value as { data: { user?: { user_metadata?: Record<string, any> } } })?.data?.user?.user_metadata;
                    if (_meta) {
                        const _profileCtx = extractProfileContext(_meta);
                        enrichedSymptomQuery = buildEnrichedQuery(symptomSummary, _profileCtx);
                        if (enrichedSymptomQuery !== symptomSummary) {
                            console.log(`[RAG] Query enriched: +${enrichedSymptomQuery.length - symptomSummary.length} chars`);
                        }
                    }
                }

                // Skip slow 3072-dim home remedy embedding on non-final turns
                const t0Rag = Date.now();
                const ragResult = await fetchAllContext(enrichedSymptomQuery, !isFinalTurn, spans, diagnosticPreferences.ayurvedicMode, personaCacheKey);
                const ragMs = Date.now() - t0Rag;
                logLatency('rag', ragMs);
                spans.record('rag', ragMs);
                ragContext = ragResult.context;
                homeRemediesAvailable = ragResult.homeRemediesAvailable;

                // ── Post-retrieval allergy/contraindication safety filter (§2.2) ──
                if (ragContext && userProfileResult.status === 'fulfilled' && userProfileResult.value) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const _filterMeta = (userProfileResult.value as { data: { user?: { user_metadata?: Record<string, any> } } })?.data?.user?.user_metadata;
                    if (_filterMeta) {
                        const _fc = extractProfileContext(_filterMeta);
                        if (_fc.allergies.length || _fc.conditions.length) {
                            // Wrap the raw string context as a single annotated chunk for filtering
                            const rawChunks: RetrievedChunk[] = [{ content: ragContext, source: 'rag', score: 1 }];
                            const filteredChunks = applyAllergyFilter(rawChunks, _fc.allergies, _fc.conditions);
                            ragContext = serialiseFilteredChunks(filteredChunks);
                            if (hasAnyFlaggedChunk(filteredChunks)) {
                                console.log('[SAFETY] Allergy/contraindication flag(s) applied to RAG context');
                            }
                        }
                    }
                }

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
            ? `=== AROVIA MEDICAL KNOWLEDGE BASE (Sourced from Supabase) ===
The following data was retrieved from our verified databases. You MUST use this data to populate
${diagnosticPreferences.ayurvedicMode
    ? 'the homeopathic_remedies, ayurvedic_remedies, and home_remedies sections in your final JSON output.'
    : 'the homeopathic_remedies section in your final JSON output only. Leave ayurvedic_remedies and home_remedies empty because Ayurvedic Mode is OFF.'}
Do NOT ignore this data. Do NOT hallucinate remedies that contradict this data.

${ragContext}

=== END OF KNOWLEDGE BASE ===

${SYSTEM_PROMPT}`
            : SYSTEM_PROMPT;
        
        if (isFinalTurn && typeof FINAL_DIAGNOSIS_OUTPUT_RULES !== 'undefined') {
            finalSystemPrompt += '\n\n' + FINAL_DIAGNOSIS_OUTPUT_RULES;
            finalSystemPrompt += '\nHOMEOPATHY COMPLETENESS: Unless escalation_level is L4 or L5, include at least 2 symptom-matched homeopathic_remedies. Do not make "Individualized homeopathic support" the only homeopathic entry. Match remedy choice to the active symptom pattern and include practitioner-consult cautions.';
        }

        finalSystemPrompt += formatDiagnosticPreferencesForPrompt(diagnosticPreferences);
        const languageDirective = languageDirectiveForPrompt(detectedLang);
        if (languageDirective) {
            finalSystemPrompt += `\n\n${languageDirective}`;
        }

        // Failure Mode 4 fix: If home remedy embedding timed out, inject fallback instruction
        // so the model uses authoritative knowledge instead of hallucinating or leaving empty
        if (diagnosticPreferences.ayurvedicMode && !homeRemediesAvailable && isFinalTurn) {
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

        // ── Phase 1 prompt block injections ───────────────────────────────────
        // Resolve patient age and medications for downstream prompt builders
        let _p1Medications: string[] = [];
        let _p1Age: number | null = null;
        if (userProfileResult.status === 'fulfilled' && userProfileResult.value) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const _p1Meta = (userProfileResult.value as { data: { user?: { user_metadata?: Record<string, any> } } })?.data?.user?.user_metadata;
            if (_p1Meta) {
                const _p1Ctx = extractProfileContext(_p1Meta);
                _p1Medications = _p1Ctx.medications;
                _p1Age = _p1Ctx.age != null ? parseInt(String(_p1Ctx.age), 10) : null;
                if (_p1Age !== null && isNaN(_p1Age)) _p1Age = null;
            }
        }

        // §4.2 Polypharmacy warning (≥5 medications)
        const _polypharmacyBlock = buildPolypharmacyWarningPrompt(_p1Medications.length);
        if (_polypharmacyBlock) finalSystemPrompt += _polypharmacyBlock;

        // §3.4 Drug interaction mandatory check (medication queries with 2+ meds)
        if (intentResult.intent === 'medication_query' && _p1Medications.length >= 2) {
            finalSystemPrompt += buildDrugInteractionPrompt(_p1Medications);
        }

        // §6.2 Dosage grounding rule (dosage-related user messages)
        if (/dosage|dose|how much|how many|mg|ml|tablet|capsule|frequency|twice|once|daily|weekly/i.test(lastUserMsg)) {
            finalSystemPrompt += buildDosageGroundingPrompt();
        }

        // §3.5 Age-stratified dosing rules (injected when patient age is known)
        if (_p1Age !== null && !isNaN(_p1Age) && _p1Age > 0) {
            const _ageDosingBlock = getAgeStratifiedDosingRules(_p1Age);
            if (_ageDosingBlock) finalSystemPrompt += '\n' + _ageDosingBlock;
        }

        // §3.2 Chain-of-thought diagnosis protocol (final turns only)
        if (isFinalTurn) {
            finalSystemPrompt += buildCoTDiagnosisProtocol();
        }

        // §3.3 Differential confidence tiers (final turns only)
        if (isFinalTurn) {
            finalSystemPrompt += buildConfidenceTiersPrompt();
        }

        // §6.3 Context-specific disclaimer (appended every turn)
        {
            const _disclaimerType = inferDisclaimerType(intentResult.intent, lastUserMsg, _p1Age);
            finalSystemPrompt += buildContextualDisclaimer(_disclaimerType);
        }

        // §5.2 Incremental profile update detection
        {
            const PROFILE_UPDATE_TRIGGERS = [
                /\bi\s+(?:started|began|am\s+now|was\s+prescribed)\s+(?:taking|on)\s+([a-zA-Z0-9-]{3,25})/i,
                /\bi\s+(?:was\s+diagnosed\s+with|have\s+developed|now\s+have)\s+([a-zA-Z0-9-\s]{3,30})/i,
                /\bi\s+am\s+allergic\s+to\s+([a-zA-Z0-9-]{3,25})/i,
            ];
            const isProfileUpdateMentioned = PROFILE_UPDATE_TRIGGERS.some(trigger => trigger.test(lastUserMsg));
            if (isProfileUpdateMentioned) {
                finalSystemPrompt += `
[INCREMENTAL PROFILE UPDATE DETECTION — ACTIVE]
The patient mentioned a potential update to their medical profile (new medication, condition, or allergy).
RULE: You must surface a friendly confirmation question at the very end of your response asking if they would like to update their health profile.
Example: "Shall I update your health profile to include [X]?"
Keep it helpful and do not perform any automated database write yourself.
`;
            }
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

        finalSystemPrompt += formatIntentForPrompt(intentResult);
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
        const nextQuestionStr = nextQuestionDecision.field?.question ?? (isFinalTurn ? 'none' : (conversationIntakeState.pendingQueue[0]?.question ?? 'none'));
        const collectedDataObj = Object.fromEntries(conversationIntakeState.collectedData);
        const collectedDataStr = JSON.stringify(collectedDataObj);
        const phaseStatusStr = isFinalTurn ? 'summary' : conversationIntakeState.phaseStatus;
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

        const uiHintOutputSafetyRules = `

UI HINT OUTPUT SAFETY:
- If you include a {"ui_hint": ...} object, first write the complete user-facing question, then place the JSON on its own new line.
- For severity, intensity, or pain-level questions, the visible question MUST include "1 to 10" before the JSON. Use: "How severe is it on a scale of 1 to 10?"
- Never end the visible question at "scale of", "scale from", "between", or another dangling phrase before the ui_hint JSON.`;

        finalSystemPrompt += dynamicStateInjection + uiHintOutputSafetyRules;

        spans.record('promptBuild', Date.now() - t0Prompt);
        spans.setMeta({ turn: userTurns, model: groqModel, isFinal: isFinalTurn, ragCacheHit: false, intent: intentResult.intent, creditAction });

        // Call Groq API with streaming — with timeout and retry
        let groqResponse: Response | null = null;
        const retryDelay = AI_PHASE_CONFIG.generation.retryDelayMs;
        // Dynamic timeout: 35s for final diagnosis (full JSON card), 25s for balanced-model
        // turns (70B + RAG context), 15s for fast 8B Q&A turns.
        const timeoutMs = isFinalTurn ? 35_000 : needsBalancedModel ? 25_000 : AI_PHASE_CONFIG.generation.timeoutMs;
        // ── Primary Provider Execution ──────────────────────────────────────
        if (AI_PHASE_CONFIG.primary === 'gemini') {
            const geminiKeys = getGeminiApiKeys();
            if (geminiKeys.length === 0) {
                console.error('[Gemini] Primary provider set to gemini but no GEMINI_API_KEY set');
                return streamTextResponse("AI service is not configured with a valid Gemini API key. Please add your key in settings.");
            }

            console.log(`[Gemini] Executing ${AI_PHASE_CONFIG.models.gemini} as Primary LLM...`);

            const geminiMessages = processedMessages.map((m: { role: string; content: string }) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

            const geminiModel = AI_PHASE_CONFIG.models.gemini;
            let geminiText = '';
            let geminiSucceeded = false;
            let lastGeminiError = '';
            const maxGeminiAttempts = 5;  // More retries for free-tier rate limits

            for (let attempt = 0; attempt < maxGeminiAttempts; attempt++) {
                for (const geminiKey of geminiKeys) {
                    const geminiController = new AbortController();
                    const geminiTimeoutId = setTimeout(() => geminiController.abort(), timeoutMs);

                    try {
                        console.log(`[Gemini] attempt=${attempt + 1}/${maxGeminiAttempts} model=${geminiModel} key=...${geminiKey.slice(-6)}`);
                        const geminiResponse = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    systemInstruction: { parts: [{ text: finalSystemPrompt }] },
                                    contents: geminiMessages,
                                    generationConfig: {
                                        temperature: AI_PHASE_CONFIG.generation.temperature,
                                        maxOutputTokens: maxTokensForTurn,
                                    },
                                }),
                                signal: geminiController.signal,
                            }
                        );

                        if (geminiResponse.ok) {
                            const geminiData = await geminiResponse.json();
                            geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            if (geminiText) {
                                geminiSucceeded = true;
                                console.log(`[Gemini] ✅ Success on attempt ${attempt + 1}, response length=${geminiText.length}`);
                                break;
                            }
                            console.warn(`[Gemini] HTTP 200 but empty text, retrying...`);
                        }

                        const errorText = await geminiResponse.text();
                        lastGeminiError = `${geminiResponse.status} ${errorText.slice(0, 300)}`;
                        console.error(`[Gemini] ${geminiModel} failed status=${geminiResponse.status} body=${errorText.slice(0, 200)}`);

                        // On 429 rate limit, wait with exponential backoff and retry
                        if (geminiResponse.status === 429) {
                            const retryAfter = Math.min(3000 * (attempt + 1), 10000);
                            console.log(`[Gemini] 429 rate limited, waiting ${retryAfter}ms before retry (attempt ${attempt + 1}/${maxGeminiAttempts})...`);
                            await new Promise(r => setTimeout(r, retryAfter));
                            break; // break inner key loop to go to next attempt
                        }

                        if (geminiResponse.status === 400 && /api key not valid|api_key_invalid|invalid api key/i.test(errorText)) {
                            disableGeminiApiKey(geminiKey);
                        }
                    } catch (error) {
                        lastGeminiError = providerErrorText(error).slice(0, 300);
                        console.error(`[Gemini] ${geminiModel} request failed: ${lastGeminiError}`);
                        if (isInvalidGeminiKeyError(error)) {
                            disableGeminiApiKey(geminiKey);
                        }
                    } finally {
                        clearTimeout(geminiTimeoutId);
                    }
                }

                if (geminiSucceeded) break;
            }

            if (geminiSucceeded && geminiText) {
                const totalMs = Date.now() - requestStart;
                logLatency('total', totalMs);
                alertIfSlow(totalMs);
                spans.record('total', totalMs);
                spans.flush();
                await logLlmRequest(serviceClient, {
                    userId,
                    provider: 'gemini',
                    model: geminiModel,
                    intent: intentResult.intent,
                    creditAction,
                    latencyMs: totalMs,
                });

                if (reservationId) {
                    await captureCredits(reservationId);
                }

                const safeGeminiText = ensureFinalDiagnosisPayload(
                    cleanLlmText(geminiText),
                    isFinalTurn,
                    conversationIntakeState
                );

                return streamTextResponse(safeGeminiText, {
                    'Connection': 'keep-alive',
                    'X-Provider': 'gemini',
                    'X-Model': geminiModel,
                    'X-Response-Time': String(totalMs),
                });
            } else {
                console.error('[Gemini Primary] All attempts failed:', lastGeminiError);
                if (reservationId) {
                    await releaseCredits(reservationId, 'gemini_primary_failed').catch(() => null);
                }
                return streamTextResponse("I'm experiencing high demand right now. Please try sending your message again in a few seconds. 🙏");
            }
        }

        // ── Groq path: only execute when Groq keys are available ────────────
        if (groqKeyPool.length > 0) {
        const maxGroqAttempts = Math.max(AI_PHASE_CONFIG.generation.maxRetries + 1, groqKeyPool.length);
        const groqStartIndex = groqKeyIndex % groqKeyPool.length;
        groqKeyIndex = (groqKeyIndex + 1) % groqKeyPool.length;
        const maxGroqRetryBudgetMs = isFinalTurn ? 20_000 : needsBalancedModel ? 15_000 : 12_000;
        const maxGroqRetryDelayMs = 3_000;
        const groqRetryStartedAt = Date.now();

        let t0Groq = 0;
        for (let attempt = 0; attempt < maxGroqAttempts; attempt++) {
            if (Date.now() - groqRetryStartedAt > maxGroqRetryBudgetMs) {
                console.warn('[Groq] Retry budget exhausted; falling back to Gemini');
                break;
            }
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
                        max_tokens: maxTokensForTurn,
                        stream: false,
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
                    const elapsed = Date.now() - groqRetryStartedAt;
                    const remainingBudget = Math.max(0, maxGroqRetryBudgetMs - elapsed);
                    const uncappedDelay = groqResponse.status === 429 ? retryDelay * Math.pow(2, attempt) : retryDelay;
                    const delay = Math.min(uncappedDelay, maxGroqRetryDelayMs, remainingBudget);
                    groqResponse = null;
                    if (delay <= 0) break;
                    await new Promise(r => setTimeout(r, delay));
                }
            } catch (groqError) {
                console.error(`Groq attempt ${attempt + 1} error:`, groqError);
                groqResponse = null;
                if (attempt < maxGroqAttempts - 1) {
                    const elapsed = Date.now() - groqRetryStartedAt;
                    const remainingBudget = Math.max(0, maxGroqRetryBudgetMs - elapsed);
                    const delay = Math.min(retryDelay, remainingBudget);
                    if (delay <= 0) break;
                    await new Promise(r => setTimeout(r, delay));
                }
                // Will fall through to Gemini fallback after all retries
            }
        }
        } else {
            console.log('[Groq] No Groq API keys configured — skipping Groq, using Gemini fallback directly.');
        }

        if (!groqResponse || !groqResponse.ok) {
            // Fallback to Gemini — use GEMINI_API_KEYS pool if available, else single key
            const geminiKeys = getGeminiApiKeys();
            if (geminiKeys.length === 0) {
                console.error('[Groq+Gemini] Both failed — no GEMINI_API_KEY set');
                return streamTextResponse("I'm having trouble reaching the AI service. Please try again in a moment. 🙏");
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
                                        maxOutputTokens: maxTokensForTurn,
                                    },
                                }),
                                signal: geminiController.signal,
                            }
                        );

                        if (geminiResponse.ok) {
                            const geminiData = await geminiResponse.json();
                            const rawGeminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            geminiText = cleanLlmText(rawGeminiText);
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
                                    { role: 'system', content: languageDirective ? `${SYSTEM_PROMPT}\n\n${languageDirective}` : SYSTEM_PROMPT },
                                    ...processedMessages.slice(-6),
                                ],
                                temperature: AI_PHASE_CONFIG.generation.temperature,
                                max_tokens: Math.min(maxTokensForTurn, 1500),
                                stream: false,
                            }),
                            signal: rescueController.signal,
                        });

                        if (rescueResponse.ok) {
                            const rescueData = await rescueResponse.json();
                            const rawRescueText = rescueData.choices?.[0]?.message?.content || '';
                            const rescueText = cleanLlmText(rawRescueText);
                            if (rescueText) {
                                const safeRescueText = ensureFinalDiagnosisPayload(
                                    rescueText,
                                    isFinalTurn,
                                    conversationIntakeState
                                );
                                return streamTextResponse(safeRescueText, {
                                    'X-Provider': 'groq-rescue',
                                    'X-Model': AI_PHASE_CONFIG.models.groqFast,
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
                return streamTextResponse("I'm experiencing high demand right now. Please try sending your message again in a few seconds. 🙏");
            }

            // Normalize Gemini response into SSE format to match Groq stream shape
            // so the frontend useChat hook can parse it identically (Failure Mode 3 fix)
            const safeGeminiText = ensureFinalDiagnosisPayload(
                geminiText,
                isFinalTurn,
                conversationIntakeState
            );

            await logLlmRequest(serviceClient, {
                userId,
                provider: 'gemini',
                model: geminiModelUsed,
                intent: intentResult.intent,
                creditAction,
                latencyMs: Date.now() - requestStart,
            });

            if (reservationId) {
                await captureCredits(reservationId);
            }

            return streamTextResponse(safeGeminiText, {
                'X-Provider': 'gemini',
                'X-Model': geminiModelUsed,
            });
        }

        const groqData = await groqResponse.json();
        const rawGroqText = groqData.choices?.[0]?.message?.content?.trim() || '';
        const groqText = cleanLlmText(rawGroqText);
        const groqFinishReason = groqData.choices?.[0]?.finish_reason || '';

        if (!groqText) {
            console.error('[Groq] Empty completion payload:', JSON.stringify(groqData).slice(0, 500));
            if (reservationId) {
                await releaseCredits(reservationId, 'empty_payload');
            }
            return streamTextResponse("I'm having trouble forming a complete reply right now. Please send that once more and I will continue carefully.", {
                'X-Provider': 'groq',
                'X-Model': groqModel,
                'X-Finish-Reason': String(groqFinishReason || 'empty'),
            });
        }

        if (groqFinishReason === 'length') {
            console.warn('[Groq] Completion hit token limit; returning retry-safe message.');
            if (reservationId) {
                await captureCredits(reservationId);
            }
            if (isFinalTurn) {
                return streamTextResponse(
                    ensureFinalDiagnosisPayload('', true, conversationIntakeState),
                    {
                        'X-Provider': 'groq',
                        'X-Model': groqModel,
                        'X-Finish-Reason': 'length-fallback-card',
                    }
                );
            }
            return streamTextResponse("I started a reply but it became too long to complete safely. Please send one short message like 'continue' and I will finish the guidance from here.", {
                'X-Provider': 'groq',
                'X-Model': groqModel,
                'X-Finish-Reason': 'length',
            });
        }

        const totalMs = Date.now() - requestStart;
        logLatency('total', totalMs);
        alertIfSlow(totalMs);
        spans.record('total', totalMs);
        spans.flush();
        await logLlmRequest(serviceClient, {
            userId,
            provider: 'groq',
            model: groqModel,
            intent: intentResult.intent,
            creditAction,
            latencyMs: totalMs,
        });

        if (reservationId) {
            await captureCredits(reservationId);
        }

        const safeGroqText = ensureFinalDiagnosisPayload(
            groqText,
            isFinalTurn,
            conversationIntakeState
        );

        return streamTextResponse(safeGroqText, {
            'Connection': 'keep-alive',
            'X-Provider': 'groq',
            'X-Model': groqModel,
            'X-Finish-Reason': String(groqFinishReason || 'unknown'),
            'X-Response-Time': String(totalMs),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (innerError: any) {
            console.error('[chat/route] Inner error:', innerError);
            if (reservationId) {
                await releaseCredits(reservationId, 'inner_error').catch(() => null);
            }
            return streamTextResponse("Something went wrong on my end. Please try again in a moment. 🙏");
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
        return streamTextResponse(msg);
    }
}
