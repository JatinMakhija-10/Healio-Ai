import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    || '';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data?.session?.user) {
            // Keep doctor onboarding gate; patients can finish persona setup from dashboard.
            const metadata = data.session.user.user_metadata;
            const isOnboardingCompleted = metadata?.onboarding_completed === true;
            const role = metadata?.role;

            // If not completed, redirect to onboarding
            // But allow doctors or explicit 'next' params to override if needed, 
            // though typically we want to force onboarding for new signups.
            // If the user explicitly requested a page (e.g. invite link), we might want to respect it,
            // but for a generic signup, we force onboarding.

            if (role === 'doctor' && !isOnboardingCompleted) {
                return NextResponse.redirect(`${origin}/doctor/onboarding`)
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`)
}
