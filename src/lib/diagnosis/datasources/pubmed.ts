/**
 * NCBI PubMed Client — Rare Disease & Clinical Case Report Enrichment
 *
 * Source: NCBI E-utilities API (eutils.ncbi.nlm.nih.gov)
 * License: Free, no API key required (higher limits with NCBI API key)
 * Rate limit: 3 req/sec without key, 10 req/sec with key
 *
 * Used for:
 *   1. Enriching rare disease patterns with real published case reports
 *   2. Fetching diagnostic criteria abstracts for uncommon conditions
 *   3. Pulling symptom patterns from clinical case report titles/abstracts
 *
 * NCBI E-utilities endpoints used:
 *   esearch  — search PubMed by query, returns PMIDs
 *   esummary — fetch article titles, journal, year
 *   efetch   — fetch full abstracts (structured)
 */

const NCBI_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const NCBI_API_KEY = process.env.NCBI_API_KEY || '';   // optional — speeds up to 10/s
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;              // 12 hours

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PubMedArticle {
    pmid: string;
    title: string;
    abstract: string;
    journal: string;
    year: number;
    meshTerms: string[];            // MeSH controlled vocabulary terms
    keywords: string[];             // author keywords
    publicationType: string[];      // "Case Reports", "Review", "Clinical Trial"
}

export interface RareDiseaseEnrichment {
    conditionName: string;
    caseReportCount: number;
    extractedSymptoms: string[];    // symptom keywords extracted from abstracts
    diagnosticKeywords: string[];   // diagnostic criteria keywords
    relatedConditions: string[];    // co-mentioned conditions
    pmids: string[];
    lastFetched: number;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const enrichmentCache = new Map<string, RareDiseaseEnrichment>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildApiUrl(endpoint: string, params: Record<string, string>): string {
    const p = new URLSearchParams({
        ...params,
        ...(NCBI_API_KEY ? { api_key: NCBI_API_KEY } : {}),
        tool: 'arovia_ai',
        email: 'arovia@arovia.ai',
    });
    return `${NCBI_BASE}/${endpoint}.fcgi?${p.toString()}`;
}

/**
 * Extract symptom keywords from an abstract using a clinical vocabulary.
 * This is a lightweight NLP approach — no LLM needed.
 */
function extractSymptomsFromText(text: string): string[] {
    if (!text) return [];
    const lower = text.toLowerCase();

    const SYMPTOM_TERMS = [
        'fever', 'fatigue', 'weakness', 'headache', 'nausea', 'vomiting',
        'diarrhea', 'constipation', 'chest pain', 'shortness of breath',
        'dyspnea', 'tachycardia', 'bradycardia', 'hypotension', 'hypertension',
        'edema', 'swelling', 'rash', 'pruritus', 'jaundice', 'pallor',
        'cyanosis', 'confusion', 'altered mental status', 'seizure',
        'syncope', 'palpitations', 'cough', 'hemoptysis', 'hematemesis',
        'hematuria', 'dysuria', 'oliguria', 'polyuria', 'polydipsia',
        'weight loss', 'weight gain', 'anorexia', 'dysphagia', 'odynophagia',
        'abdominal pain', 'back pain', 'joint pain', 'arthralgia', 'myalgia',
        'muscle weakness', 'tremor', 'ataxia', 'diplopia', 'blurred vision',
        'photophobia', 'tinnitus', 'hearing loss', 'lymphadenopathy',
        'splenomegaly', 'hepatomegaly', 'ascites', 'pleural effusion',
        'bradypnea', 'tachypnea', 'stridor', 'wheezing',
    ];

    return SYMPTOM_TERMS.filter(term => lower.includes(term))
        .map(t => t.replace(/ /g, '_'));
}

/**
 * Extract co-mentioned condition names from abstract text.
 */
function extractRelatedConditions(text: string): string[] {
    if (!text) return [];
    const lower = text.toLowerCase();

    const CONDITIONS = [
        'lupus', 'sarcoidosis', 'amyloidosis', 'vasculitis', 'myositis',
        'scleroderma', 'sjögren', 'behçet', 'kawasaki', 'marfan',
        'ehlers-danlos', 'wilson disease', 'hemochromatosis', 'porphyria',
        'fabry disease', 'gaucher', 'niemann-pick', 'tay-sachs',
        'glycogen storage', 'mitochondrial', 'carcinoid', 'pheochromocytoma',
        'addison', 'cushing', 'acromegaly', 'hypoparathyroidism',
        'primary aldosteronism', 'mastocytosis', 'langerhans cell',
    ];

    return CONDITIONS.filter(c => lower.includes(c));
}

// ─── PubMed Search ────────────────────────────────────────────────────────────

/**
 * Search PubMed for articles about a rare condition.
 * Returns top PMID list.
 */
async function searchPubMed(
    conditionName: string,
    maxResults = 10,
): Promise<string[]> {
    try {
        // Build a targeted query for case reports and clinical presentations
        const query = `"${conditionName}"[Title/Abstract] AND ("case report"[Publication Type] OR "clinical features"[Title/Abstract] OR "diagnosis"[Title/Abstract]) AND English[lang]`;

        const url = buildApiUrl('esearch', {
            db: 'pubmed',
            term: query,
            retmax: String(maxResults),
            retmode: 'json',
            sort: 'relevance',
        });

        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return [];

        const data = await res.json();
        return data?.esearchresult?.idlist || [];
    } catch {
        return [];
    }
}

/**
 * Fetch summaries (title, year, journal) for a list of PMIDs.
 */
async function fetchSummaries(pmids: string[]): Promise<Array<{
    pmid: string;
    title: string;
    year: number;
    journal: string;
}>> {
    if (pmids.length === 0) return [];

    try {
        const url = buildApiUrl('esummary', {
            db: 'pubmed',
            id: pmids.join(','),
            retmode: 'json',
        });

        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return [];

        const data = await res.json();
        const result = data?.result || {};

        return pmids
            .filter(id => result[id] && !result[id].error)
            .map(id => ({
                pmid: id,
                title: result[id].title || '',
                year: parseInt(result[id].pubdate?.split(' ')[0]) || 0,
                journal: result[id].fulljournalname || '',
            }));
    } catch {
        return [];
    }
}

/**
 * Fetch full abstracts for a list of PMIDs using efetch.
 * Parses the plain text format for abstract content.
 */
async function fetchAbstracts(pmids: string[]): Promise<Map<string, string>> {
    if (pmids.length === 0) return new Map();

    try {
        const url = buildApiUrl('efetch', {
            db: 'pubmed',
            id: pmids.join(','),
            retmode: 'text',
            rettype: 'abstract',
        });

        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) return new Map();

        const text = await res.text();

        // Split by PMID markers and extract abstract sections
        const abstractMap = new Map<string, string>();
        const sections = text.split(/\n\d+\. /);

        for (let i = 0; i < sections.length && i < pmids.length; i++) {
            const section = sections[i + 1] || '';
            // Extract the ABSTRACT section
            const abstractMatch = section.match(/ABSTRACT\n([\s\S]*?)(?:\n\n[A-Z]|\n\nPMID|$)/);
            if (abstractMatch) {
                abstractMap.set(pmids[i], abstractMatch[1].replace(/\n/g, ' ').trim());
            }
        }

        return abstractMap;
    } catch {
        return new Map();
    }
}

// ─── Main Enrichment Function ─────────────────────────────────────────────────

/**
 * Enrich a rare disease pattern with real PubMed data.
 *
 * Fetches case reports → extracts symptom keywords → returns enrichment.
 * Results cached for 12 hours to avoid hitting rate limits.
 */
export async function enrichRareDiseaseFromPubMed(
    conditionName: string,
): Promise<RareDiseaseEnrichment | null> {
    const key = conditionName.toLowerCase().trim();

    const cached = enrichmentCache.get(key);
    if (cached && Date.now() - cached.lastFetched < CACHE_TTL_MS) {
        return cached;
    }

    try {
        // Step 1: Search for PMIDs
        const pmids = await searchPubMed(conditionName, 8);
        if (pmids.length === 0) return null;

        // Step 2: Fetch summaries + abstracts in parallel
        const [summaries, abstracts] = await Promise.all([
            fetchSummaries(pmids),
            fetchAbstracts(pmids),
        ]);

        // Step 3: Extract clinical features from all text
        const allText = [
            ...summaries.map(s => s.title),
            ...Array.from(abstracts.values()),
        ].join(' ');

        const extractedSymptoms = extractSymptomsFromText(allText);
        const relatedConditions = extractRelatedConditions(allText);

        // Diagnostic keywords: terms appearing in titles
        const diagnosticKeywords = summaries
            .flatMap(s => s.title.toLowerCase().match(/\b\w{5,}\b/g) || [])
            .filter(w => !['report', 'patient', 'clinical', 'study', 'case', 'using',
                           'after', 'with', 'from', 'this', 'that', 'their'].includes(w))
            .reduce((acc: Record<string, number>, w) => {
                acc[w] = (acc[w] || 0) + 1;
                return acc;
            }, {});

        const topKeywords = Object.entries(diagnosticKeywords)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([w]) => w);

        const enrichment: RareDiseaseEnrichment = {
            conditionName,
            caseReportCount: pmids.length,
            extractedSymptoms,
            diagnosticKeywords: topKeywords,
            relatedConditions,
            pmids,
            lastFetched: Date.now(),
        };

        enrichmentCache.set(key, enrichment);
        return enrichment;

    } catch {
        return null;
    }
}

/**
 * Batch enrich multiple rare diseases in parallel (rate-limited).
 * Inserts a 350ms delay between requests to respect NCBI limits.
 */
export async function batchEnrichRareDiseases(
    conditionNames: string[],
): Promise<Map<string, RareDiseaseEnrichment>> {
    const results = new Map<string, RareDiseaseEnrichment>();

    for (const name of conditionNames) {
        const enrichment = await enrichRareDiseaseFromPubMed(name);
        if (enrichment) {
            results.set(name.toLowerCase(), enrichment);
        }
        // Respect NCBI rate limit: 3 req/sec without API key
        await new Promise(r => setTimeout(r, NCBI_API_KEY ? 120 : 400));
    }

    return results;
}
