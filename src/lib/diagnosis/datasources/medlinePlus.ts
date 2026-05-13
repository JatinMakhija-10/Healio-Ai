/**
 * NLM MedlinePlus Connect API Client
 *
 * Source: MedlinePlus Connect (connect.medlineplus.gov)
 * License: Free, public domain — no API key required
 * Documentation: https://medlineplus.gov/connect/service.html
 *
 * Used for:
 *   1. Patient-facing condition summaries (plain English descriptions)
 *   2. ICD-10 code → health topic mapping
 *   3. Drug information pages (for patient counselling)
 *   4. When-to-see-a-doctor guidance per condition
 *
 * Also integrates:
 *   - NLM Drug Information Portal (druginfo.nlm.nih.gov)
 *     for drug classification and synonym lookup
 */

const MEDLINEPLUS_BASE = 'https://connect.medlineplus.gov/service';
const DRUG_INFO_BASE = 'https://druginfo.nlm.nih.gov/drugportal/rss/drugportal';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MedLinePlusHealthTopic {
    icd10Code: string;
    topicTitle: string;
    topicUrl: string;
    summary: string;
    alsoCalledNames: string[];      // synonyms for the condition
    seeDocIf: string[];             // extracted "when to see a doctor" signals
    relatedConditions: string[];    // links to related health topics
}

export interface NLMDrugInfo {
    drugName: string;
    synonyms: string[];
    drugClass: string;
    nlmUrl: string;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const mlpCache = new Map<string, MedLinePlusHealthTopic>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract "see a doctor if..." signals from MedlinePlus summary text.
 */
function extractSeeDocIf(summaryText: string): string[] {
    if (!summaryText) return [];

    const signals: string[] = [];
    const lower = summaryText.toLowerCase();

    const RED_FLAG_PATTERNS = [
        { pattern: /call\s+(911|emergency)/i, signal: 'emergency — call 911' },
        { pattern: /seek\s+(immediate|emergency)\s+(medical|care|attention)/i, signal: 'seek immediate medical care' },
        { pattern: /go\s+to\s+(the\s+)?emergency/i, signal: 'go to emergency room' },
        { pattern: /call\s+your\s+(doctor|healthcare|physician)/i, signal: 'call your doctor' },
        { pattern: /chest\s+pain/i, signal: 'chest pain present' },
        { pattern: /difficulty\s+breathing/i, signal: 'difficulty breathing' },
        { pattern: /signs\s+of\s+infection/i, signal: 'signs of infection' },
        { pattern: /high\s+fever/i, signal: 'high fever' },
        { pattern: /severe\s+(pain|headache)/i, signal: 'severe pain/headache' },
        { pattern: /sudden\s+(weakness|numbness)/i, signal: 'sudden weakness/numbness — stroke risk' },
        { pattern: /loss\s+of\s+consciousness/i, signal: 'loss of consciousness' },
        { pattern: /blood\s+in\s+(urine|stool|vomit)/i, signal: 'blood in urine/stool/vomit' },
    ];

    for (const { pattern, signal } of RED_FLAG_PATTERNS) {
        if (pattern.test(lower)) signals.push(signal);
    }

    return signals;
}

/**
 * Parse MedlinePlus Connect JSON-LD response.
 */
function parseMedLinePlusResponse(
    data: Record<string, unknown>,
    icd10Code: string,
): MedLinePlusHealthTopic | null {
    try {
        // MedlinePlus Connect returns JSON-LD feed format
        const feed = data?.feed as Record<string, unknown>;
        if (!feed) return null;

        const entries = (feed.entry as Array<Record<string, unknown>>) || [];
        if (entries.length === 0) return null;

        const entry = entries[0];
        const title = (entry.title as Record<string, string>)?.['_value'] || '';
        const id = (entry.id as Record<string, string>)?.['_value'] || '';

        // Summary from content
        const contentArr = (entry.content as Array<Record<string, string>>) || [];
        const summary = contentArr.find(c => c._value)?.['_value'] || '';

        // Related topics from links
        const links = (entry.link as Array<Record<string, string>>) || [];
        const relatedConditions = links
            .filter(l => l.rel === 'related')
            .map(l => l.title || '')
            .filter(Boolean)
            .slice(0, 5);

        return {
            icd10Code,
            topicTitle: title,
            topicUrl: id,
            summary: summary.replace(/<[^>]+>/g, '').slice(0, 500),
            alsoCalledNames: [],
            seeDocIf: extractSeeDocIf(summary),
            relatedConditions,
        };
    } catch {
        return null;
    }
}

// ─── Main Fetchers ─────────────────────────────────────────────────────────────

/**
 * Fetch MedlinePlus health topic for an ICD-10 code.
 * Example: fetchHealthTopicByICD('I21.9') → "Heart Attack" topic
 */
export async function fetchHealthTopicByICD(
    icd10Code: string,
): Promise<MedLinePlusHealthTopic | null> {
    const key = icd10Code.toUpperCase().trim();

    const cached = mlpCache.get(key);
    if (cached && Date.now() < CACHE_TTL_MS) {
        return cached;
    }

    try {
        const params = new URLSearchParams({
            'mainSearchCriteria.v.cs': '2.16.840.1.113883.6.90', // ICD-10-CM OID
            'mainSearchCriteria.v.c': icd10Code,
            'knowledgeResponseType': 'application/json',
        });

        const url = `${MEDLINEPLUS_BASE}?${params.toString()}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return null;

        const data = await res.json();
        const topic = parseMedLinePlusResponse(data, icd10Code);
        if (!topic) return null;

        mlpCache.set(key, topic);
        return topic;
    } catch {
        return null;
    }
}

/**
 * Fetch MedlinePlus health topic by condition name.
 */
export async function fetchHealthTopicByName(
    conditionName: string,
): Promise<MedLinePlusHealthTopic | null> {
    try {
        const params = new URLSearchParams({
            'mainSearchCriteria.v.dn': conditionName,
            'knowledgeResponseType': 'application/json',
        });

        const url = `${MEDLINEPLUS_BASE}?${params.toString()}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return null;

        const data = await res.json();
        return parseMedLinePlusResponse(data, '');
    } catch {
        return null;
    }
}

/**
 * Fetch NLM Drug Information Portal entry for a drug name.
 * Returns drug class and synonyms.
 */
export async function fetchNLMDrugInfo(drugName: string): Promise<NLMDrugInfo | null> {
    try {
        const url = `${DRUG_INFO_BASE}?term=${encodeURIComponent(drugName)}&format=json`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return null;

        const data = await res.json();
        const item = data?.items?.[0];
        if (!item) return null;

        return {
            drugName: item.title || drugName,
            synonyms: item.aliases || [],
            drugClass: item.drugClass || '',
            nlmUrl: item.url || '',
        };
    } catch {
        return null;
    }
}

/**
 * Batch fetch health topics for multiple ICD codes.
 */
export async function batchFetchHealthTopics(
    icd10Codes: string[],
): Promise<Map<string, MedLinePlusHealthTopic>> {
    const results = new Map<string, MedLinePlusHealthTopic>();

    await Promise.allSettled(
        icd10Codes.map(async code => {
            const topic = await fetchHealthTopicByICD(code);
            if (topic) results.set(code.toUpperCase(), topic);
        })
    );

    return results;
}
