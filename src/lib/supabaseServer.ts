import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    '';
const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

/**
 * Cookie-aware client for Server Components and API routes that need
 * to act on behalf of the currently logged-in user.
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // Called from a Server Component — safe to ignore (middleware refreshes sessions).
                }
            },
        },
    });
}

/**
 * Service-role client — bypasses RLS and cookie parsing entirely.
 * Use ONLY in server-side API routes where auth is already verified.
 * NEVER expose to the client.
 *
 * Benefit: no cookie round-trip overhead, ideal for admin dashboards
 * and background jobs that have pre-validated the user's JWT.
 */
export function createServiceClient() {
    return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession:   false,
        },
    });
}
