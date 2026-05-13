/**
 * Sentry — Node.js server runtime initialization.
 * Loaded by `instrumentation.ts` when `NEXT_RUNTIME === 'nodejs'`.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
    Sentry.init({
        dsn,
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
        release: process.env.SENTRY_RELEASE,

        // Performance monitoring — keep modest in prod for cost control.
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // PHI/PII safety: do NOT send headers/cookies/IP by default.
        sendDefaultPii: false,

        // Filter out expected operational errors that aren't bugs.
        ignoreErrors: [
            'AbortError',
            'NEXT_REDIRECT',
            'NEXT_NOT_FOUND',
        ],

        beforeSend(event) {
            // Strip cookies & auth headers as a final safety net.
            if (event.request?.cookies) delete event.request.cookies;
            if (event.request?.headers) {
                const headers = event.request.headers as Record<string, string>;
                delete headers['authorization'];
                delete headers['cookie'];
                delete headers['x-api-key'];
            }
            return event;
        },
    });
}
