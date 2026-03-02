export const AI_PHASE_CONFIG = {
    // Primary provider (Groq - Llama 3.3 70B)
    primary: 'groq',

    // Fallback provider (Gemini 2.5 Flash)
    fallback: 'gemini',

    // Model Selection
    models: {
        groq: 'llama-3.3-70b-versatile',
        gemini: 'gemini-2.5-flash',
        embedding: 'text-embedding-004' // Using Gemini for embeddings (free tier)
    },

    // API Endpoints
    endpoints: {
        groq: 'https://api.groq.com/openai/v1'
    }
};

// Types for AI responses
export interface AIResponse {
    content: string;
    provider: 'groq' | 'gemini';
    model: string;
    latencyMs: number;
}
