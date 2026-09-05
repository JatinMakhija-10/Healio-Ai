import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jinaKey = process.env.JINA_API_KEY!;

if (!supabaseUrl || !supabaseKey || !jinaKey) {
    console.error('❌ Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateJinaEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jinaKey}`,
        },
        body: JSON.stringify({
            model: 'jina-embeddings-v5-text-nano',
            input: [text],
            dimensions: 768,
        }),
    });

    if (!response.ok) throw new Error(`Jina API Error: ${response.statusText}`);
    const data = await response.json();
    return data.data[0].embedding;
}

async function testSearch(query: string) {
    console.log(`\n🔍 Test Query: "${query}"`);
    const embedding = await generateJinaEmbedding(query);

    const { data, error } = await (supabase as any).rpc('search_ayurvedic_qna', {
        query_embedding: embedding,
        match_threshold: 0.40,
        match_count: 3,
    });

    if (error) {
        console.error('❌ RPC Error:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('⚠️ No matches found.');
        return;
    }

    console.log(`✅ Found ${data.length} relevant Ayurvedic Q&A entries:`);
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        console.log(`\n[Match ${i + 1}] Similarity: ${(item.similarity * 100).toFixed(1)}%`);
        console.log(`  Domain:     ${item.domain}`);
        console.log(`  Language:   ${item.language}`);
        console.log(`  Question:   ${item.question}`);
        console.log(`  Answer:     ${item.answer}`);
        if (item.explanation) {
            console.log(`  Explanation: ${item.explanation.slice(0, 150)}...`);
        }
    }
}

async function main() {
    await testSearch('digestive fire agni panchakarma detox');
    await testSearch('skin disease rash dravyaguna neem');
    await testSearch('cough cold mukha amla sitopaladi');
}

main().catch(console.error);
