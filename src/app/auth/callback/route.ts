import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    '';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=auth_code_error`)
    }

    const pendingCookies: Array<{
        name: string;
        value: string;
        options: Record<string, unknown>;
    }> = []

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookieOptions: {
            maxAge: 400 * 24 * 60 * 60,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        },
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    pendingCookies.push({ name, value, options: options as Record<string, unknown> })
                })
            },
        },
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data?.session?.user) {
        return NextResponse.redirect(`${origin}/login?error=auth_code_error`)
    }

    const metadata = data.session.user.user_metadata
    const role = metadata?.role
    const isOnboardingCompleted = metadata?.onboarding_completed === true

    // Prevent open redirect attacks: ensure next is a relative path
    const safeNext = (next && next.startsWith('/') && !next.startsWith('//')) ? next : '/dashboard'

    let redirectTo = `${origin}${safeNext}`
    if (safeNext === '/dashboard') {
        if (role === 'admin') {
            redirectTo = `${origin}/admin`
        } else if (role === 'doctor') {
            redirectTo = isOnboardingCompleted ? `${origin}/doctor` : `${origin}/doctor/onboarding`
        }
    } else if (role === 'doctor' && !isOnboardingCompleted) {
        redirectTo = `${origin}/doctor/onboarding`
    }

    const response = NextResponse.redirect(redirectTo)
    pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
    })

    return response
}
