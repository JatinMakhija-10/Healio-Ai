export const AI_PHASE_CONFIG = {
    // Primary provider (Groq - Llama 3.3 70B)
    primary: 'groq',

    // Fallback provider (Gemini 2.5 Flash)
    fallback: 'gemini',

    // Model Selection
    models: {
        groq: 'llama-3.3-70b-versatile',          // used ONLY for final diagnosis JSON
        groqFast: 'llama-3.1-8b-instant',           // used for conversational Q&A turns
        gemini: 'gemini-2.5-flash',
        embedding: 'gemini-embedding-2-preview',    // Bypasses recent 404 & quota traps
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
        maxRetries: 1,             // Retry once before fallback
        timeoutMs: 30_000,         // 30 s total timeout
        maxTokens: 1500,           // Max output tokens per response
        retryDelayMs: 1_000,       // Wait 1s before retry
    },
} as const;

// Types for AI responses
export interface AIResponse {
    content: string;
    provider: 'groq' | 'gemini';
    model: string;
    latencyMs: number;
}

export type AIProviderKey = typeof AI_PHASE_CONFIG.primary | typeof AI_PHASE_CONFIG.fallback;
