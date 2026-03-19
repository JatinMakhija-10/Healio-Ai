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

// PHASE 1 — Route Protection
// Redirects all Phase 2 routes to /dashboard.
// When Phase 2 launches, remove routes from these arrays.
const PHASE2_DASHBOARD_ROUTES = [
    '/dashboard/learn',
    '/dashboard/wellness',
    '/dashboard/meet',
    '/dashboard/search',
    '/dashboard/family',
    '/dashboard/pathway',
    '/dashboard/inbox',
    '/dashboard/videos',
    '/dashboard/assessment',
];

const PHASE2_TOP_LEVEL_ROUTES = [
    '/doctor',
    '/admin',
    '/analytics',
    '/epidemic',
    '/marketplace',
    '/learn',
    '/wellness',
    '/meet',
    '/doctors',
    '/inbox',
];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Phase 2 route blocking — redirect to /dashboard
    const isPhase2DashboardRoute = PHASE2_DASHBOARD_ROUTES.some(route =>
        pathname.startsWith(route)
    );
    const isPhase2TopLevelRoute = PHASE2_TOP_LEVEL_ROUTES.some(route =>
        pathname.startsWith(route)
    );
    if (isPhase2DashboardRoute || isPhase2TopLevelRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

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
         * - api/ (API routes)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
