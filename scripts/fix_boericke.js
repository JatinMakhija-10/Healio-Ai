const fs = require('fs');
const f = 'src/app/api/chat/route.ts';
let c = fs.readFileSync(f, 'utf8');

const startM = '// ── RAG: Homeopathic (Boericke)';
const endM = '// ── RAG: Ayurvedic Classical Texts';
const si = c.indexOf(startM);
const ei = c.indexOf(endM);

if (si < 0 || ei < 0) { console.log('markers not found'); process.exit(1); }

const newBoericke = `// ── RAG: Homeopathic (Boericke's Materia Medica) ───────────────────────────
// Deduplicates by remedy_name — keeps only the highest-similarity chunk per remedy
async function fetchBoerickeContext(embedding: number[]): Promise<string> {
    try {
        const supabase = getServiceClient();
        const { data } = await supabase.rpc('match_boericke_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.72,
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
            .filter(c => (c.similarity ?? 0) >= 0.72)
            .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
            .slice(0, 5)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any, i: number) =>
                \`[\${i + 1}] REMEDY: \${c.remedy_name} | relevance: \${((c.similarity ?? 0) * 100).toFixed(0)}%\\n\${c.chunk_text}\`
            ).join('\\n\\n');
    } catch {
        return '';
    }
}

`;

c = c.substring(0, si) + newBoericke + c.substring(ei);
fs.writeFileSync(f, c, 'utf8');
console.log('Boericke function rewritten. File length:', c.length);
