import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ['jspdf', 'fflate'],
  // Proxy API requests to backend during local development
  rewrites: async () => {
    return [
      {
        source: '/api/py/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000/api/py/:path*'
            : '/api/py/:path*',
      },
    ]
  },
};

// Wrap with Sentry only when DSN is present so local dev without Sentry still works.
const sentryEnabled = Boolean(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      // Sentry org/project — required for source-map upload at build time.
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,

      // Suppresses source map upload logs during build.
      silent: !process.env.CI,

      // Upload a larger set of source maps for prettier stack traces.
      widenClientFileUpload: true,

      // Route browser requests to Sentry through this Next.js project to
      // circumvent ad-blockers. Adds latency, so keep at default route.
      tunnelRoute: "/monitoring",

      // Hide generated source maps from client bundles after they are uploaded.
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },

      webpack: {
        // Tree-shake Sentry debug/logger statements in production bundles.
        treeshake: { removeDebugLogging: true },
        // Enables automatic instrumentation of Vercel Cron Monitors.
        automaticVercelMonitors: true,
      },
    })
  : nextConfig;
