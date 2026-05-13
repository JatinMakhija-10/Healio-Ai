/**
 * Next.js instrumentation entrypoint.
 *
 * `register()` runs once when the server starts (per runtime).
 * `onRequestError` is called by Next.js for every uncaught request error
 * (App Router server components, route handlers, etc.) and forwards it to Sentry.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 *       https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from '@sentry/nextjs';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config');
    }
    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config');
    }
}

export const onRequestError = Sentry.captureRequestError;
