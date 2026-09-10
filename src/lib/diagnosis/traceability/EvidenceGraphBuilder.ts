/**
 * EvidenceGraphBuilder — Constructs the EvidenceTraceabilityGraph
 *
 * Takes the raw RAG chunks (Boericke, Ayurvedic, PDF, HomeRemedy), Bayesian
 * engine output, symptom inputs, and the AI-formatted diagnosis to produce
 * a fully-linked evidence traceability graph.
 *
 * Design: Stateless builder pattern. All data flows in, graph comes out.
 * No side-effects, no external calls — pure transformation.
 */

import type {
    EvidenceTraceabilityGraph,
    SymptomInputNode,
    BayesianEvidenceNode,
    ClassicalSourceCitation,
    RecommendationEvidenceLink,
    RAGRetrievalMetadata,
    FeatureLikelihoodContribution,
} from './types';
import { findClassicalCitations } from './ClassicalSamhitaKnowledgeBase';

// ─── Input Types (mirror the chunk types from diagnose/route.ts) ────────────────

export interface BoerickeChunkInput {
    remedy_name: string;
    chunk_text: string;
    similarity: number;
}

export interface AyurvedicChunkInput {
    book: string;
    category: string;
    section: string;
    text: string;
    similarity: number;
}

export interface PdfChunkInput {
    source_file: string;
    page_number?: number | null;
    chunk_text: string;
    similarity: number;
}

export interface HomeRemedyChunkInput {
    ailment: string;
    ailment_hindi?: string;
    remedy_name: string;
    remedy_name_hindi?: string;
    chunk_text: string;
    symptoms_keywords?: string[];
    similarity: number;
}

export interface BayesianInput {
    conditionId?: string;
    conditionName: string;
    bayesianScore: number;
    matchedKeywords: string[];
    clinicalRuleAlerts: string[];
    posteriorRedFlags: string[];
    featureContributions?: FeatureLikelihoodContribution[];
    mcmcDiagnostics?: {
        rHat: number;
        effectiveSampleSize: number;
        converged: boolean;
        credibleInterval: { lower: number; upper: number; width: number };
        acceptanceRate: number;
        posteriorPredictiveP: number;
    };
}

export interface SymptomInput {
    locations: string[];
    painType?: string | null;
    triggers?: string | null;
    duration?: string | null;
    additionalNotes?: string | null;
    sanitizedSymptomText: string;
}

export interface AIRemedyOutput {
    name?: string;
    remedy?: string;
    potency?: string;
    dosage?: string;
    indication?: string;
    source?: string;
    preparation?: string;
    rationale?: string;
}

export interface BuilderInput {
    symptoms: SymptomInput;
    bayesian: BayesianInput;
    boerickeChunks: BoerickeChunkInput[];
    ayurvedicChunks: AyurvedicChunkInput[];
    pdfChunks: PdfChunkInput[];
    homeRemedyChunks: HomeRemedyChunkInput[];
    aiRemedies: AIRemedyOutput[];
    aiHomeRemedies: AIRemedyOutput[];
    provider: string;
    latencyMs: number;
    cacheHit: boolean;
    activeProviders: ('jina' | 'gemini')[];
    totalQueries: number;
    retrievalLatencyMs?: number;
}

// ─── Corpus Identification ──────────────────────────────────────────────────────

/**
 * Maps a book/source_file string to a normalized corpus name.
 */
function identifyCorpus(bookOrFile: string): string {
    const lower = bookOrFile.toLowerCase();

    if (lower.includes('boericke') || lower.includes('materia medica'))
        return 'boericke_materia_medica';
    if (lower.includes('charaka') || lower.includes('charak'))
        return 'charaka_samhita';
    if (lower.includes('astanga') || lower.includes('ashtanga'))
        return 'astanga_hridaya';
    if (lower.includes('sushruta'))
        return 'sushruta_samhita';
    if (lower.includes('pharmacopoeia') || lower.includes('pharmacopeia'))
        return 'indian_pharmacopoeia';
    if (lower.includes('medicinal plants') || lower.includes('indian-medicinal'))
        return 'indian_medicinal_plants';
    if (lower.includes('yoga ratnavali') || lower.includes('vaidya-yoga'))
        return 'vaidya_yoga_ratnavali';
    if (lower.includes('panchagavya'))
        return 'panchagavya';
    if (lower.includes('pa-diseases') || lower.includes('pa-herbs') || lower.includes('pa-remedies') || lower.includes('pa-formulations'))
        return 'ayurvedic_pharmacopoeia';

    return 'ayurvedic_text';
}

/**
 * Creates a human-readable title from a corpus identifier.
 */
function corpusToTitle(corpus: string): string {
    const titles: Record<string, string> = {
        boericke_materia_medica: 'Boericke\'s Materia Medica',
        charaka_samhita: 'Charaka Samhita',
        astanga_hridaya: 'Ashtanga Hridaya',
        sushruta_samhita: 'Sushruta Samhita',
        indian_pharmacopoeia: 'Indian Pharmacopoeia',
        indian_medicinal_plants: 'Indian Medicinal Plants',
        vaidya_yoga_ratnavali: 'Vaidya Yoga Ratnavali',
        panchagavya: 'Panchagavya Texts',
        ayurvedic_pharmacopoeia: 'Ayurvedic Pharmacopoeia',
        ayurvedic_text: 'Ayurvedic Knowledge Base',
    };
    return titles[corpus] || corpus;
}

// ─── Evidence Strength Calculator ───────────────────────────────────────────────

function computeEvidenceStrength(
    avgSimilarity: number,
    citationCount: number,
): 'strong' | 'moderate' | 'weak' | 'traditional' {
    if (citationCount === 0) return 'traditional';
    if (avgSimilarity >= 0.80 && citationCount >= 1) return 'strong';
    if (avgSimilarity >= 0.65) return 'moderate';
    return 'weak';
}

// ─── Builder ────────────────────────────────────────────────────────────────────

/**
 * Builds a complete EvidenceTraceabilityGraph from raw pipeline outputs.
 *
 * This is a pure function — no side effects, no external calls.
 */
export function buildEvidenceGraph(input: BuilderInput): EvidenceTraceabilityGraph {
    const {
        symptoms,
        bayesian,
        boerickeChunks,
        ayurvedicChunks,
        pdfChunks,
        homeRemedyChunks,
        aiRemedies,
        aiHomeRemedies,
        provider,
        latencyMs,
        cacheHit,
        activeProviders,
        totalQueries,
        retrievalLatencyMs,
    } = input;

    // ── 1. Build Symptom Input Node ──────────────────────────────────────────

    const symptomInputs: SymptomInputNode = {
        locations: symptoms.locations,
        painType: symptoms.painType ?? null,
        triggers: symptoms.triggers ?? null,
        duration: symptoms.duration ?? null,
        additionalNotes: symptoms.additionalNotes ?? null,
        sanitizedSymptomText: symptoms.sanitizedSymptomText,
    };

    // ── 2. Build Bayesian Evidence Node ──────────────────────────────────────

    const bayesianEvidence: BayesianEvidenceNode = {
        conditionId: bayesian.conditionId || 'unknown',
        conditionName: bayesian.conditionName,
        posteriorScore: bayesian.bayesianScore,
        supportingSymptoms: bayesian.matchedKeywords,
        contradictingSymptoms: [], // Could be enriched from absent symptoms in future
        featureContributions: bayesian.featureContributions,
        mcmcDiagnostics: bayesian.mcmcDiagnostics,
        clinicalRuleAlerts: bayesian.clinicalRuleAlerts,
        posteriorRedFlags: bayesian.posteriorRedFlags,
    };

    // ── 3. Build RAG Citations ───────────────────────────────────────────────

    let citationIdx = 0;
    const ragCitations: ClassicalSourceCitation[] = [];

    // 3a. Boericke chunks
    for (const chunk of boerickeChunks) {
        ragCitations.push({
            citationId: `B${++citationIdx}`,
            corpus: 'boericke_materia_medica',
            sourceTitle: 'Boericke\'s Materia Medica',
            section: `Remedy: ${chunk.remedy_name}`,
            pageNumber: null,
            chunkText: chunk.chunk_text,
            similarityScore: chunk.similarity,
            embeddingProvider: 'jina',
            retrievalFunction: 'match_boericke_embeddings',
        });
    }

    // 3b. Ayurvedic knowledge chunks
    for (const chunk of ayurvedicChunks) {
        const corpus = identifyCorpus(chunk.book);
        ragCitations.push({
            citationId: `A${++citationIdx}`,
            corpus,
            sourceTitle: corpusToTitle(corpus),
            section: `${chunk.book} / ${chunk.section}`,
            pageNumber: null,
            chunkText: chunk.text,
            similarityScore: chunk.similarity,
            embeddingProvider: 'gemini',
            retrievalFunction: 'search_ayurvedic_knowledge',
        });
    }

    // 3c. PDF chunks
    for (const chunk of pdfChunks) {
        const corpus = identifyCorpus(chunk.source_file);
        ragCitations.push({
            citationId: `P${++citationIdx}`,
            corpus,
            sourceTitle: corpusToTitle(corpus),
            section: `${chunk.source_file} — Page ${chunk.page_number || 'Unknown'}`,
            pageNumber: chunk.page_number ?? null,
            chunkText: chunk.chunk_text,
            similarityScore: chunk.similarity,
            embeddingProvider: 'jina',
            retrievalFunction: 'match_ayurvedic_pdfs',
        });
    }

    // 3d. Home remedy chunks
    for (const chunk of homeRemedyChunks) {
        ragCitations.push({
            citationId: `H${++citationIdx}`,
            corpus: 'traditional_home_remedies',
            sourceTitle: 'Traditional Indian Home Remedies (Nuskhe)',
            section: `Ailment: ${chunk.ailment}${chunk.ailment_hindi ? ` (${chunk.ailment_hindi})` : ''} — ${chunk.remedy_name}`,
            pageNumber: null,
            chunkText: chunk.chunk_text,
            similarityScore: chunk.similarity,
            embeddingProvider: 'jina',
            retrievalFunction: 'match_home_remedy_embeddings',
        });
    }

    // 3e. Classical Samhita & Boericke Knowledge Base Enricher / Offline Fallback
    // If classical Samhita citations or Boericke chunks are sparse (e.g. offline DB or single query),
    // ground the diagnosis directly against authentic Charaka/Sushruta/Astanga/Boericke texts.
    const allRemedyNames = [
        ...aiRemedies.map(r => r.name || r.remedy || ''),
        ...aiHomeRemedies.map(r => r.name || r.remedy || '')
    ].filter(Boolean);

    const classicalReferences = findClassicalCitations(
        bayesian.conditionName,
        symptoms.sanitizedSymptomText,
        allRemedyNames,
        3
    );

    for (const ref of classicalReferences) {
        // Only add if not already covered by an identical section name
        const exists = ragCitations.some(
            c => c.corpus === ref.corpus && c.section.toLowerCase().includes(ref.section.toLowerCase())
        );
        if (!exists) {
            ragCitations.push({
                citationId: `C${++citationIdx}`,
                corpus: ref.corpus,
                sourceTitle: ref.sourceTitle,
                section: ref.chapter ? `${ref.chapter} — ${ref.section}` : ref.section,
                chapter: ref.chapter,
                verseNumber: ref.verseNumber,
                sanskritShloka: ref.sanskritShloka,
                pageNumber: null,
                chunkText: ref.englishTranslation,
                similarityScore: 0.90, // Authoritative classical canonical match
                embeddingProvider: 'classical_knowledge_base',
                retrievalFunction: 'findClassicalCitations',
            });
        }
    }

    // ── 4. Build Recommendation Evidence Links ───────────────────────────────

    const recommendationLinks: RecommendationEvidenceLink[] = [];

    // 4a. Link AI remedies (homeopathic) to Boericke citations
    for (const remedy of aiRemedies) {
        const remedyName = remedy.name || remedy.remedy || 'Unknown Remedy';

        // Find Boericke citations whose remedy_name matches (fuzzy)
        const matchingCitations = ragCitations.filter(c => {
            if (c.corpus !== 'boericke_materia_medica') return false;
            const sectionLower = c.section.toLowerCase();
            const remedyLower = remedyName.toLowerCase();
            if (sectionLower.includes(remedyLower) || remedyLower.includes(sectionLower.replace('remedy: ', ''))) return true;
            // Also check significant first 2 tokens (e.g. "Rhus Toxicodendron" in "Rhus Toxicodendron (Poison Ivy)")
            const remedyBase = remedyLower.replace(/\s+\d+[a-z]?/i, '').trim();
            const sectionBase = sectionLower.replace(/remedy:\s*/i, '').trim();
            if (sectionBase.includes(remedyBase) || remedyBase.includes(sectionBase.split(' ')[0])) return true;
            return false;
        });

        const allMatchingSimilarities = matchingCitations.map(c => c.similarityScore);
        const avgSimilarity = allMatchingSimilarities.length > 0
            ? allMatchingSimilarities.reduce((a, b) => a + b, 0) / allMatchingSimilarities.length
            : 0;

        recommendationLinks.push({
            recommendationName: remedyName,
            recommendationType: 'homeopathic_remedy',
            supportingCitationIds: matchingCitations.map(c => c.citationId),
            evidenceSummary: matchingCitations.length > 0
                ? `Supported by ${matchingCitations.length} Boericke Materia Medica reference(s) with ${(avgSimilarity * 100).toFixed(0)}% avg relevance`
                : `Recommended based on clinical knowledge and Bayesian engine (score: ${bayesian.bayesianScore})`,
            evidenceStrength: computeEvidenceStrength(avgSimilarity, matchingCitations.length),
        });
    }

    // 4b. Link AI home remedies to home remedy RAG chunks + Ayurvedic citations
    for (const remedy of aiHomeRemedies) {
        const remedyName = remedy.name || remedy.remedy || 'Unknown Home Remedy';

        // Match against home remedy citations (by ailment/remedy name overlap)
        const matchingHomeCitations = ragCitations.filter(c => {
            if (c.corpus !== 'traditional_home_remedies') return false;
            const textLower = (c.chunkText + ' ' + c.section).toLowerCase();
            const remedyLower = remedyName.toLowerCase();
            // Check if any significant word from the remedy name appears in the citation
            const words = remedyLower.split(/\s+/).filter(w => w.length > 3);
            return words.some(w => textLower.includes(w));
        });

        // Also match against Ayurvedic knowledge citations
        const matchingAyurvedicCitations = ragCitations.filter(c => {
            if (c.corpus === 'boericke_materia_medica' || c.corpus === 'traditional_home_remedies') return false;
            const textLower = c.chunkText.toLowerCase();
            const remedyLower = remedyName.toLowerCase();
            const words = remedyLower.split(/\s+/).filter(w => w.length > 3);
            return words.some(w => textLower.includes(w));
        });

        const allMatching = [...matchingHomeCitations, ...matchingAyurvedicCitations];
        const avgSim = allMatching.length > 0
            ? allMatching.map(c => c.similarityScore).reduce((a, b) => a + b, 0) / allMatching.length
            : 0;

        const sources: string[] = [];
        if (matchingHomeCitations.length > 0) sources.push(`${matchingHomeCitations.length} traditional Nuskhe reference(s)`);
        if (matchingAyurvedicCitations.length > 0) sources.push(`${matchingAyurvedicCitations.length} Ayurvedic text reference(s)`);

        recommendationLinks.push({
            recommendationName: remedyName,
            recommendationType: 'home_remedy',
            supportingCitationIds: allMatching.map(c => c.citationId),
            evidenceSummary: sources.length > 0
                ? `Supported by ${sources.join(' and ')} with ${(avgSim * 100).toFixed(0)}% avg relevance`
                : 'Traditional remedy based on Ayurvedic knowledge tradition',
            evidenceStrength: allMatching.length > 0 ? computeEvidenceStrength(avgSim, allMatching.length) : 'traditional',
        });
    }

    // ── 5. Build RAG Retrieval Metadata ──────────────────────────────────────

    const ragMetadata: RAGRetrievalMetadata = {
        totalQueries,
        boerickeChunksRetrieved: boerickeChunks.length,
        ayurvedicChunksRetrieved: ayurvedicChunks.length,
        homeRemedyChunksRetrieved: homeRemedyChunks.length,
        pdfChunksRetrieved: pdfChunks.length,
        cacheHit,
        retrievalLatencyMs,
        activeProviders,
    };

    // ── 6. Assemble the Graph ────────────────────────────────────────────────

    return {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        symptomInputs,
        bayesianEvidence,
        ragCitations,
        recommendationLinks,
        ragMetadata,
        formatterProvider: provider,
        pipelineLatencyMs: latencyMs,
    };
}
