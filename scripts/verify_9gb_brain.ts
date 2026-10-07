import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jinaKey = process.env.JINA_API_KEY!;

if (!supabaseUrl || !supabaseKey || !jinaKey) {
    console.error('❌ Missing environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateEmbedding(text: string): Promise<number[]> {
    const resp = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jinaKey}`,
        },
        body: JSON.stringify({
            model: 'jina-embeddings-v3',
            input: [text],
            dimensions: 768,
        }),
    });
    if (!resp.ok) throw new Error(`Jina error: ${resp.statusText}`);
    const data = await resp.json();
    return data.data[0].embedding;
}

async function verifyBrain() {
    console.log('=======================================================');
    printHeader('🧠 AROVIA.AI BRAIN 9GB KNOWLEDGE BASE VERIFICATION');
    console.log('=======================================================\n');

    // 1. Total Chunks Count for NEWFiles
    const { count, error: countErr } = await supabase
        .from('ayurvedic_knowledge_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'NEWFiles');

    if (countErr) {
        console.error('❌ Error fetching chunk count:', countErr.message);
    } else {
        console.log(`📊 Total Ingested NEWFiles Chunks: ${count ?? 0}`);
    }

    // 2. Total Overall Brain Chunks
    const { count: totalBrainCount } = await supabase
        .from('ayurvedic_knowledge_embeddings')
        .select('*', { count: 'exact', head: true });

    console.log(`🌐 Total Overall Brain Knowledge Chunks: ${totalBrainCount ?? 0}\n`);

    // 3. Test Clinical Vector Retrieval Query
    const testQueries = [
        'Agadtantra Vishachikitsa treatment for snake venom and poisons',
        'Bhavprakash Madhyakhand Dravyaguna herb properties and Rasayana',
        'Panchakarma Basti and Vamana clinical indications'
    ];

    console.log('🔍 Executing Sample Vector Retrieval Test Queries:\n');

    for (const q of testQueries) {
        console.log(`🔎 Query: "${q}"`);
        try {
            const vector = await generateEmbedding(q);
            const { data, error } = await supabase.rpc('match_ayurvedic_knowledge', {
                query_embedding: vector,
                match_threshold: 0.3,
                match_count: 3
            });

            if (error) {
                console.log(`   ⚠️ Retrieval RPC Notice: ${error.message}`);
            } else if (data && data.length > 0) {
                console.log(`   ✅ Matched ${data.length} relevant chunks:`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.forEach((match: any, idx: number) => {
                    console.log(`      [${idx + 1}] Book: ${match.book || 'N/A'} (Similarity: ${(match.similarity * 100).toFixed(1)}%)`);
                    console.log(`          Snippet: ${match.text.slice(0, 120)}...\n`);
                });
            } else {
                console.log('   ℹ️ No direct matches above threshold.\n');
            }
        } catch (e: any) {
            console.error(`   ❌ Search Error: ${e.message}`);
        }
    }
}

function printHeader(msg: string) {
    console.log(`=== ${msg} ===`);
}

verifyBrain().catch(console.error);
