'use client';

/**
 * Next.js App Router top-level error boundary.
 *
 * Catches errors that escape every other boundary, including those in the
 * root layout. Must define its own <html>/<body>. Reports to Sentry then
 * renders a fallback UI.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html lang="en">
            <body
                style={{
                    display: 'flex',
                    minHeight: '100vh',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    fontFamily:
                        'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                }}
            >
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Something went wrong
                </h1>
                <p style={{ marginBottom: '1.5rem', maxWidth: 480, textAlign: 'center', color: '#475569' }}>
                    An unexpected error occurred. Our team has been notified.
                </p>
                {error.digest && (
                    <code
                        style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            marginBottom: '1.5rem',
                        }}
                    >
                        Reference: {error.digest}
                    </code>
                )}
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '0.5rem 1.25rem',
                        backgroundColor: '#0F6E56',
                        color: '#fff',
                        borderRadius: '0.375rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    Try again
                </button>
            </body>
        </html>
    );
}
