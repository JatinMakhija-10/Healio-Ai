/**
 * Zod schemas for validating API responses from /api/chat and /api/diagnose.
 *
 * These are used client-side to validate that the server returned
 * the expected shape before rendering medical data to users.
 */

import { z } from "zod";

// ─── /api/chat response schemas ──────────────────────────────

/** Streaming SSE chunk from Groq (parsed per-line) */
export const ChatStreamChunkSchema = z.object({
    content: z.string(),
});

/** Non-streaming fallback response from Gemini */
export const ChatFallbackResponseSchema = z.object({
    content: z.string(),
    provider: z.literal("gemini"),
});

/** Diagnosis JSON that the LLM embeds inside ```json blocks */
export const ChatDiagnosisJsonSchema = z.object({
    name: z.string(),
    description: z.string(),
    severity: z.enum(["mild", "moderate", "severe"]),
    confidence: z.number().min(0).max(100),
    bayesianFactors: z.string().optional(),
    differentialDiagnoses: z.array(
        z.object({
            name: z.string(),
            likelihood: z.enum(["low", "medium", "high"]),
            rationale: z.string(),
        })
    ).optional(),
    remedies: z.array(
        z.object({
            name: z.string(),
            description: z.string().optional(),
            potency: z.string().optional(),
            method: z.string().optional(),
            source: z.enum(["boericke", "classical", "clinical"]).optional(),
        })
    ).optional(),
    indianHomeRemedies: z.array(
        z.object({
            name: z.string(),
            description: z.string().optional(),
            ingredients: z.array(z.string()).optional(),
            method: z.string().optional(),
        })
    ).optional(),
    exercises: z.array(z.any()).optional(),
    warnings: z.array(z.string()).optional(),
    seekHelp: z.string().optional(),
});

// ─── /api/diagnose response schemas ─────────────────────────

export const DiagnoseAIResultSchema = z.object({
    conditionName: z.string(),
    confidence: z.number().min(0).max(100),
    description: z.string(),
    severity: z.enum(["low", "medium", "high"]),
    differentialDiagnoses: z.array(
        z.object({
            name: z.string(),
            likelihood: z.enum(["low", "medium", "high"]),
            rationale: z.string(),
        })
    ).optional(),
    remedies: z.array(
        z.object({
            name: z.string(),
            potency: z.string().optional(),
            dosage: z.string().optional(),
            indication: z.string().optional(),
            source: z.enum(["boericke", "classical", "clinical"]).optional(),
        })
    ).optional(),
    indianHomeRemedies: z.array(
        z.object({
            remedy: z.string(),
            preparation: z.string().optional(),
            rationale: z.string().optional(),
        })
    ).optional(),
    warnings: z.array(z.string()).optional(),
    seekHelp: z.union([z.boolean(), z.string()]).optional(),
    seekHelpReason: z.string().optional(),
    reasoningTrace: z.string().optional(),
    // Info-gain question override (server may inject)
    question: z.any().optional(),
});

export const DiagnoseResponseMetaSchema = z.object({
    provider: z.string(),
    latencyMs: z.number(),
    ragApplied: z.boolean(),
    ragRemediesFound: z.array(z.string()),
    ragChunks: z.number(),
    bayesianPriorsUsed: z.number(),
    clinicalRuleAlertsUsed: z.number(),
    dynamicTemperature: z.number(),
    structuredRemediesInjected: z.boolean(),
    mcmcUncertaintyInjected: z.boolean(),
    questionOverridden: z.boolean(),
});

export const DiagnoseResponseSchema = z.object({
    diagnosis: DiagnoseAIResultSchema,
    meta: DiagnoseResponseMetaSchema,
});

// ─── Type exports ────────────────────────────────────────────

export type ChatStreamChunk = z.infer<typeof ChatStreamChunkSchema>;
export type ChatFallbackResponse = z.infer<typeof ChatFallbackResponseSchema>;
export type ChatDiagnosisJson = z.infer<typeof ChatDiagnosisJsonSchema>;
export type DiagnoseAIResult = z.infer<typeof DiagnoseAIResultSchema>;
export type DiagnoseResponseMeta = z.infer<typeof DiagnoseResponseMetaSchema>;
export type DiagnoseResponse = z.infer<typeof DiagnoseResponseSchema>;

// ─── Validation helpers ──────────────────────────────────────

/**
 * Safely validate a diagnose API response. Returns the parsed result
 * or null if the shape doesn't match (with console warning).
 */
export function validateDiagnoseResponse(raw: unknown): DiagnoseResponse | null {
    const result = DiagnoseResponseSchema.safeParse(raw);
    if (!result.success) {
        console.warn("[Zod] /api/diagnose response validation failed:", result.error.format());
        return null;
    }
    return result.data;
}

/**
 * Safely parse the JSON diagnosis block that the chat LLM embeds
 * inside ```json fences.
 */
export function validateChatDiagnosisJson(raw: unknown): ChatDiagnosisJson | null {
    const result = ChatDiagnosisJsonSchema.safeParse(raw);
    if (!result.success) {
        console.warn("[Zod] Chat diagnosis JSON validation failed:", result.error.format());
        return null;
    }
    return result.data;
}
