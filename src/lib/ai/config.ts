import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export const AI_PHASE_CONFIG = {
    // Primary provider — Groq (both keys verified working 2026-09-03)
    primary: 'groq' as 'groq' | 'gemini',

    // Fallback provider — Gemini 3.6 Flash (AQ-format key requires 3.x models)
    fallback: 'gemini' as 'groq' | 'gemini',

    // Model Selection — latencies measured live 2026-09-03:
    //   qwen3.8-27b: ~900ms | gpt-oss-120b: ~1.5s | compound-mini: ~3.8s
    //   groq/compound: >60s (agentic, DO NOT USE for chat — causes timeouts)
    models: {
        groq: 'openai/gpt-oss-120b',               // 120B param — best quality for diagnosis (~1.5s)
        groqFast: 'qwen/qwen3.8-27b',              // 27B param — fast Q&A turns (~900ms)
        groqRescue: 'groq/compound-mini',           // rescue fallback (~3.8s, always works)
        gemini: 'gemini-3.8-flash',                 // required for AQ-format API keys
        geminiLite: 'gemini-3.8-flash',             // same model (lite not available for this key type)
        embedding: 'gemini-embedding-2-preview',    // 3072-dim — Boericke & Ayurvedic search model
        homeRemedyEmbedding: 'gemini-embedding-001', // 3072-dim — matches home_remedy_embeddings ingestion
    },

    // API Endpoints
    endpoints: {
        groq: 'https://api.groq.com/openai/v1',
    },

    // ── RAG Configuration ─────────────────────────────────────────────────────
    rag: {
        /** Minimum cosine similarity score to include a Boericke chunk */
        matchThreshold: 0.65,
        /** Number of chunks to retrieve per query (multi-query RAG) */
        matchCountPerQuery: 3,
        /** Maximum total chunks merged across all queries */
        maxTotalChunks: 7,
        /** Single-query fallback threshold (stricter, used in legacy path) */
        singleQueryThreshold: 0.70,
    },

    // ── Bayesian Orchestration Configuration ─────────────────────────────────
    orchestration: {
        /** Number of Bayesian top-K candidates forwarded to the AI prompt */
        topKCandidates: 5,
        /** Minimum Bayesian score (0–100 sigmoid scale) to be considered */
        minBayesianScore: 8,
        /**
         * Confidence blend weights for Bayesian calibration:
         *   calibrated = aiWeight × AI_confidence + bayesWeight × Bayesian_score
         */
        calibration: {
            aiWeight: 0.70,
            bayesWeight: 0.30,
            /** Confidence reduction factor when AI ≠ Bayesian top candidates */
            disagreementPenalty: 0.87,
        },
    },

    // ── LLM Generation Parameters ─────────────────────────────────────────────
    generation: {
        temperature: 0.15,          // Low temp → deterministic, medically appropriate
        maxRetries: 2,             // Retry twice before fallback
        timeoutMs: 15000,          // Timeout per request (compound is fast, 15s is sufficient)
        maxTokens: 1500,           // Max output tokens per response
        retryDelayMs: 500,         // Wait 500ms before retry (fast key rotation)
    },
} as const;

// ── Singleton SDK Client Factories ────────────────────────────────────────────
// Created once per serverless instance (warm re-use) — never per-request.
// This eliminates ~100–200 ms of SDK constructor + TLS overhead on every call.

let _groqClient: OpenAI | null = null;
const _geminiClients = new Map<string, GoogleGenAI>();
const _disabledGeminiKeys = new Set<string>();

function parseApiKeys(...values: Array<string | undefined>): string[] {
    const seen = new Set<string>();
    const keys: string[] = [];

    for (const value of values) {
        if (!value) continue;
        for (const rawKey of value.split(',')) {
            const key = rawKey.trim().replace(/^['"]|['"]$/g, '');
            if (!key || seen.has(key)) continue;
            seen.add(key);
            keys.push(key);
        }
    }

    return keys;
}

export function getGroqApiKeys(): string[] {
    return parseApiKeys(process.env.GROQ_API_KEYS, process.env.GROQ_API_KEY);
}

/** Returns the best available Groq API key (prefers GROQ_API_KEYS pool, falls back to GROQ_API_KEY). */
export function getGroqApiKey(): string {
    const pool = getGroqApiKeys();
    if (pool.length > 0) return pool[Date.now() % pool.length];
    return '';
}

/** Returns a module-level singleton Groq client (OpenAI-compatible). */
export function getGroqClient(): OpenAI {
    if (!_groqClient) {
        _groqClient = new OpenAI({
            baseURL: AI_PHASE_CONFIG.endpoints.groq,
            apiKey: getGroqApiKey(),
        });
    }
    return _groqClient;
}

export function disableGeminiApiKey(apiKey: string): void {
    if (apiKey) _disabledGeminiKeys.add(apiKey);
}

export function getGeminiApiKeys(options: { includeDisabled?: boolean } = {}): string[] {
    const keys = parseApiKeys(process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEYS);
    return options.includeDisabled ? keys : keys.filter(key => !_disabledGeminiKeys.has(key));
}

export function getGeminiApiKey(): string {
    const pool = getGeminiApiKeys();
    if (pool.length > 0) return pool[0];
    return '';
}

/** Returns a module-level singleton Google GenAI client. */
export function getGeminiClient(apiKey = getGeminiApiKey()): GoogleGenAI {
    const cacheKey = apiKey || '__missing_api_key__';
    let client = _geminiClients.get(cacheKey);
    if (!client) {
        client = new GoogleGenAI({ apiKey });
        _geminiClients.set(cacheKey, client);
    }
    return client;
}

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
/**
 * Returns a module-level singleton Supabase service-role client.
 * Safe to share across requests — the service key is never user-scoped.
 */
export function getSupabaseAdmin(): ReturnType<typeof createClient> {
    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
            process.env.SUPABASE_SERVICE_ROLE_KEY ??
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
            ''
        );
    }
    return _supabaseAdmin;
}

// Types for AI responses
export interface AIResponse {
    content: string;
    provider: 'groq' | 'gemini';
    model: string;
    latencyMs: number;
}

export type AIProviderKey = typeof AI_PHASE_CONFIG.primary | typeof AI_PHASE_CONFIG.fallback;
