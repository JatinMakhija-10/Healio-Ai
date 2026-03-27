import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  const { data, count, error } = await supabase
    .from('home_remedy_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('remedy_name', 'Minor Home Treatment');

  if (error) {
    console.error('Error fetching data:', error);
  } else {
    console.log(`\n✅ Verification: Found ${count} records with remedy_name = 'Minor Home Treatment'`);
  }
}

verify();
