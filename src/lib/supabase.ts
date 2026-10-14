import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    || 'placeholder-anon-key';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    isSingleton: true,
    cookieOptions: {
        maxAge: 400 * 24 * 60 * 60, // 400 days (maximum browser lifetime)
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    },
});
