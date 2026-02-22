import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Inline RBAC check — cannot import from lib in Edge runtime
type UserRole = 'patient' | 'doctor' | 'admin';

function isRouteAllowed(pathname: string, role: UserRole): boolean {
    if (pathname.startsWith('/admin')) return role === 'admin';
    if (pathname.startsWith('/doctor')) return role === 'doctor' || role === 'admin';
    if (pathname.startsWith('/dashboard')) return role === 'patient' || role === 'admin';
    return true; // Public routes
}

function getDashboardRoute(role: UserRole): string {
    switch (role) {
        case 'admin': return '/admin';
        case 'doctor': return '/doctor';
        default: return '/dashboard';
    }
}

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
        || '',
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set({ name, value, ...options })
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set({ name, value, ...options })
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // --- RBAC Enforcement ---
    const pathname = request.nextUrl.pathname;
    const protectedPrefixes = ['/admin', '/doctor', '/dashboard'];
    const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix));

    if (isProtectedRoute) {
        if (!user) {
            // Not authenticated — redirect to login
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/login';
            loginUrl.searchParams.set('redirectTo', pathname);
            return NextResponse.redirect(loginUrl);
        }

        const role = (user.user_metadata?.role as UserRole) || 'patient';
        if (!isRouteAllowed(pathname, role)) {
            // Authenticated but wrong role — redirect to their dashboard
            const dashboardUrl = request.nextUrl.clone();
            dashboardUrl.pathname = getDashboardRoute(role);
            return NextResponse.redirect(dashboardUrl);
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
