/**
 * Sentry — client-side initialization (browser).
 *
 * This file runs on every page in the browser. Next.js automatically loads it
 * when present at the project root (Next 15+ / 16 convention).
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
    Sentry.init({
        dsn,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
        release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

        // Performance monitoring — sample 10% in prod, 100% in dev.
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Session replay — capture 10% of normal sessions, 100% of error sessions.
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        integrations: [
            Sentry.replayIntegration({
                // Healio.AI handles PHI — mask all text and media by default.
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],

        // PHI/PII safety: scrub user input before sending.
        sendDefaultPii: false,

        // Drop noisy / expected errors.
        ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications.',
            'Non-Error promise rejection captured',
            // Network noise from ad-blockers / extensions
            'Failed to fetch',
            'NetworkError when attempting to fetch resource',
        ],

        beforeSend(event) {
            // Final guard against accidental PHI in error messages.
            if (event.request?.cookies) {
                delete event.request.cookies;
            }
            return event;
        },
    });
}

// Required export for Next.js client navigation instrumentation.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
