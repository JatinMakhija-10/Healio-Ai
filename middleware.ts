import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// PHASE 1 — Route Protection Middleware
// ======================================
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

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check Phase 2 dashboard sub-routes
    const isPhase2DashboardRoute = PHASE2_DASHBOARD_ROUTES.some(route =>
        pathname.startsWith(route)
    );

    // Check Phase 2 top-level routes
    const isPhase2TopLevelRoute = PHASE2_TOP_LEVEL_ROUTES.some(route =>
        pathname.startsWith(route)
    );

    if (isPhase2DashboardRoute || isPhase2TopLevelRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// Only run middleware on app routes, not on static files or API
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    ],
};
