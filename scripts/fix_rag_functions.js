const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/api/chat/route.ts');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

console.log('Total lines before:', lines.length);

// Clean replacement block for lines 77–182 (0-indexed: 76–181)
const replacement = `// ── RAG: Ayurvedic Classical Texts ──────────────────────────────────────────
// Sources: Planet Ayurveda books, CCRAS e-books, classical Sanskrit texts
// IMPORTANT: These are FORMAL Ayurvedic medicines — herbs, formulations, decoctions
// that require purchase from an Ayurvedic pharmacy. NOT kitchen shelf items.
async function fetchAyurvedicContext(embedding: number[]): Promise<string> {
    try {
        const supabase = getServiceClient();
        const { data } = await supabase.rpc('search_ayurvedic_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.60,
            match_count: 12,
        });
        if (!data?.length) return '';

        // Deduplicate: keep one entry per unique source+section combination
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const seen = new Map<string, any>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of data as any[]) {
            const key = \`\${row.book ?? ''}|\${row.section ?? ''}\`.toLowerCase().trim();
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
                \`[\${i + 1}] SOURCE: \${c.book} | SECTION: \${c.section ?? 'General'} | relevance: \${((c.similarity ?? 0) * 100).toFixed(0)}%\\n\${c.text}\`
            ).join('\\n\\n');
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
        const supabase = getServiceClient();
        const { data, error } = await supabase.rpc('match_home_remedy_embeddings', {
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
            const key = \`\${row.ailment ?? ''}|\${row.remedy_name ?? ''}\`.toLowerCase().trim();
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
                const nameHindi = c.remedy_name_hindi ? \` / \${c.remedy_name_hindi}\` : '';
                const ailmentHindi = c.ailment_hindi ? \` (\${c.ailment_hindi})\` : '';
                return [
                    \`[\${i + 1}] AILMENT: \${c.ailment}\${ailmentHindi} | NUSKHA: \${c.remedy_name}\${nameHindi} | relevance: \${((c.similarity ?? 0) * 100).toFixed(0)}%\`,
                    c.chunk_text,
                ].join('\\n');
            }).join('\\n\\n');
    } catch (e) {
        console.error('[RAG] Home remedy fetch error:', e);
        return '';
    }
}


// ── Parallelised multi-source RAG ─────────────────────────────────────────────
async function fetchAllContext(symptomSummary: string, skipHomeRemedies = false): Promise<string> {
    try {
        const [embedding, embedding3072] = await Promise.all([
            generateEmbedding(symptomSummary),
            skipHomeRemedies ? Promise.resolve(null) : generateEmbedding3072(symptomSummary),
        ]);
        if (!embedding) return '';

        const [homeopathicRaw, ayurvedicRaw, homeRemedyRaw] = await Promise.all([
            fetchBoerickeContext(embedding),
            fetchAyurvedicContext(embedding),
            fetchHomeRemedyContext(embedding3072),
        ]);

        const sections = [
            homeopathicRaw && [
                '[SECTION A: HOMEOPATHIC — Boerickes Materia Medica]',
                'Use entries below ONLY for homeopathic_remedies JSON array.',
                homeopathicRaw,
            ].join('\\n'),
            ayurvedicRaw && [
                '[SECTION B: AYURVEDIC CLASSICAL MEDICINE — Planet Ayurveda / CCRAS / Classical Texts]',
                'FORMAL Ayurvedic herbs & formulations (Ashwagandha, Triphala, Sitopaladi, etc.)',
                'Require Ayurvedic pharmacy. Use ONLY for ayurvedic_remedies JSON array.',
                ayurvedicRaw,
            ].join('\\n'),
            homeRemedyRaw && [
                '[SECTION C: DADI-NANI KE NUSKHE — Household Kitchen Remedies]',
                'IMMEDIATE home remedies: haldi, adrak, tulsi, shahad, nimbu, ajwain, jeera, pudina.',
                'NO pharmacy needed. Use ONLY for home_remedies JSON array.',
                homeRemedyRaw,
            ].join('\\n'),
        ].filter(Boolean);

        console.log(\`[RAG] Sections: Homeopathic=\${!!homeopathicRaw}, Ayurvedic=\${!!ayurvedicRaw}, HomeRemedies=\${!!homeRemedyRaw} (skipHomeRemedies=\${skipHomeRemedies})\`);
        return sections.length ? sections.join('\\n\\n') : '';
    } catch (e) {
        console.error('[RAG] Combined fetch error:', e);
        return '';
    }
}
`;

// Replace lines 77–182 (0-indexed 76–181) with clean replacement
const before = lines.slice(0, 76);   // lines 1-76
const after  = lines.slice(182);     // lines 183+

const newContent = [...before, replacement, ...after].join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Total lines after:', newContent.split('\n').length);
console.log('✅ RAG functions rewritten cleanly.');
