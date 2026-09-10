/**
 * Evidence Traceability Graph — Domain Types
 *
 * Structured types for the evidence traceability layer that links:
 *   Symptom Inputs → Bayesian Posteriors → RAG-Retrieved Chunks → Classical Citations → Recommendations
 *
 * Every recommendation returned by /api/diagnose can now be traced back to its
 * supporting evidence via this graph.
 */

// ─── Source Citation Types ──────────────────────────────────────────────────────

/** Identifies a classical Ayurvedic/Homeopathic textual source */
export interface ClassicalSourceCitation {
    /** Unique id for deduplication within a single graph */
    citationId: string;
    /** Source corpus: 'boericke' | 'charaka_samhita' | 'astanga_hridaya' | 'pharmacopoeia' etc. */
    corpus: string;
    /** Human-readable source title */
    sourceTitle: string;
    /** Book/chapter/section/verse within the source */
    section: string;
    /** Chapter name/number */
    chapter?: string;
    /** Verse or Shloka number */
    verseNumber?: string;
    /** Authentic Sanskrit shloka in Devanagari script (when available) */
    sanskritShloka?: string;
    /** Page number (for PDF-derived chunks) */
    pageNumber?: number | null;
    /** The verbatim retrieved text chunk */
    chunkText: string;
    /** Cosine similarity score from vector search (0-1) */
    similarityScore: number;
    /** Embedding provider used for retrieval */
    embeddingProvider: 'jina' | 'gemini' | 'classical_knowledge_base';
    /** Supabase RPC function that was used to retrieve this chunk */
    retrievalFunction: string;
}

// ─── Bayesian Evidence Node ─────────────────────────────────────────────────────

/** Individual symptom's mathematical likelihood ratio contribution */
export interface FeatureLikelihoodContribution {
    feature: string;
    status: 'present' | 'absent' | 'unknown';
    likelihoodRatio: number;
    logOddsImpact: number;
}

/** Represents the Bayesian MCMC statistical evidence for a condition */
export interface BayesianEvidenceNode {
    /** Condition ID from the diagnosis engine */
    conditionId: string;
    /** Condition name */
    conditionName: string;
    /** Raw Bayesian posterior score (0-100) */
    posteriorScore: number;
    /** Symptoms that contributed positively to the posterior */
    supportingSymptoms: string[];
    /** Symptoms that were absent or contradicting */
    contradictingSymptoms: string[];
    /** Feature-level likelihood contributions explaining mathematical score */
    featureContributions?: FeatureLikelihoodContribution[];
    /** MCMC convergence diagnostics (if available) */
    mcmcDiagnostics?: {
        rHat: number;
        effectiveSampleSize: number;
        converged: boolean;
        credibleInterval: { lower: number; upper: number; width: number };
        acceptanceRate: number;
        posteriorPredictiveP: number;
    };
    /** Clinical decision rule alerts that fired for this condition */
    clinicalRuleAlerts: string[];
    /** Posterior-based red flag escalation alerts */
    posteriorRedFlags: string[];
}

// ─── Symptom Input Node ─────────────────────────────────────────────────────────

/** Captures the raw symptom inputs that initiated the diagnostic chain */
export interface SymptomInputNode {
    /** Raw symptom locations (body parts) */
    locations: string[];
    /** Pain type descriptor */
    painType: string | null;
    /** Reported triggers */
    triggers: string | null;
    /** Duration of symptoms */
    duration: string | null;
    /** Free text additional notes (PHI-redacted) */
    additionalNotes: string | null;
    /** Computed symptom text sent to RAG (after redaction) */
    sanitizedSymptomText: string;
}

// ─── Recommendation Evidence Link ───────────────────────────────────────────────

/**
 * Links a single recommendation (remedy, home remedy) back to its supporting
 * evidence — the RAG chunks that informed it and the Bayesian score backing it.
 */
export interface RecommendationEvidenceLink {
    /** The recommendation name (remedy name) */
    recommendationName: string;
    /** Type of recommendation */
    recommendationType: 'homeopathic_remedy' | 'ayurvedic_remedy' | 'home_remedy' | 'exercise' | 'lifestyle';
    /** IDs of ClassicalSourceCitations that support this recommendation */
    supportingCitationIds: string[];
    /** Brief explanation of how the citations support this recommendation */
    evidenceSummary: string;
    /** Confidence in this specific recommendation (derived from citation similarity) */
    evidenceStrength: 'strong' | 'moderate' | 'weak' | 'traditional';
}

// ─── RAG Retrieval Metadata ─────────────────────────────────────────────────────

/** Metadata about the RAG retrieval process itself */
export interface RAGRetrievalMetadata {
    /** Total queries issued to vector DB */
    totalQueries: number;
    /** Number of unique Boericke chunks retrieved */
    boerickeChunksRetrieved: number;
    /** Number of unique Ayurvedic knowledge chunks retrieved */
    ayurvedicChunksRetrieved: number;
    /** Number of home remedy chunks retrieved */
    homeRemedyChunksRetrieved: number;
    /** Number of PDF document chunks retrieved */
    pdfChunksRetrieved: number;
    /** Whether cache was used */
    cacheHit: boolean;
    /** Retrieval latency in ms */
    retrievalLatencyMs?: number;
    /** Embedding providers that successfully returned results */
    activeProviders: ('jina' | 'gemini')[];
}

// ─── The Evidence Traceability Graph ────────────────────────────────────────────

/**
 * The top-level evidence traceability graph returned alongside each diagnosis.
 *
 * This DAG connects:
 *   symptomInputs → bayesianEvidence → ragCitations → recommendationLinks
 *
 * Every node is independently verifiable:
 * - symptomInputs: what the patient reported
 * - bayesianEvidence: what the MCMC engine computed
 * - ragCitations: what classical texts were retrieved
 * - recommendationLinks: how each recommendation maps to its supporting evidence
 */
export interface EvidenceTraceabilityGraph {
    /** Schema version for forward compatibility */
    version: '1.0';
    /** Timestamp when this graph was constructed */
    generatedAt: string;

    /** The patient's symptom inputs that started the chain */
    symptomInputs: SymptomInputNode;

    /** Bayesian MCMC evidence for the primary diagnosed condition */
    bayesianEvidence: BayesianEvidenceNode;

    /** All classical source citations retrieved via RAG (Boericke, Charaka Samhita, PDFs, etc.) */
    ragCitations: ClassicalSourceCitation[];

    /** Links from each recommendation back to its supporting citations */
    recommendationLinks: RecommendationEvidenceLink[];

    /** Metadata about the RAG retrieval process */
    ragMetadata: RAGRetrievalMetadata;

    /** The LLM provider that formatted the final output */
    formatterProvider: string;

    /** Total pipeline latency in ms */
    pipelineLatencyMs: number;
}
