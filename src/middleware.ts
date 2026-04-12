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
];

const PHASE2_TOP_LEVEL_ROUTES = [
    '/analytics',
    '/epidemic',
    '/marketplace',
    '/learn',
    '/wellness',
    '/meet',
    '/doctors',
    '/inbox',
];

export async function middleware(request: NextRequest) {
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

    let supabaseResponse = NextResponse.next({ request })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        return supabaseResponse
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                )
                supabaseResponse = NextResponse.next({ request })
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                )
            },
        },
    })

    // Refresh auth session
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

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/ (API routes)
         * - auth/ (Auth routes - preventing callback deadlocks)
         * - static assets
         */
        '/((?!_next/static|_next/image|favicon.ico|api/|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
