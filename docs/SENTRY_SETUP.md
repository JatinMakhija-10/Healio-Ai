# Sentry Error Monitoring Setup

Arovia.AI uses [Sentry](https://sentry.io) for error monitoring and performance
tracing across both the **Next.js app** and the **FastAPI backend**.

The integration is **opt-in via env vars** — without `SENTRY_DSN` set, the SDK
is a no-op and adds no runtime overhead. This keeps local dev frictionless.

---

## 1. Create a Sentry project

1. Sign up at <https://sentry.io> (free tier covers ~5k errors/month).
2. Create **two projects**:
   - `arovia-web` → platform **Next.js**
   - `arovia-api` → platform **Python / FastAPI**
3. Copy the **DSN** for each project (Settings → Projects → Client Keys).
4. Create an **auth token** with `project:releases` and `project:write` scope
   (Settings → Auth Tokens). Needed for source-map upload during `next build`.

---

## 2. Configure environment variables

Copy values into `.env.local` (frontend) and `backend/.env` (backend):

```env
# Frontend (Next.js)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/arovia-web
SENTRY_DSN=https://...@sentry.io/arovia-web
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=arovia-web
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ENVIRONMENT=production    # optional — defaults to NODE_ENV
SENTRY_RELEASE=v1.2.3            # optional — set by CI on deploy

# Backend (FastAPI)
SENTRY_DSN=https://...@sentry.io/arovia-api
SENTRY_TRACES_SAMPLE_RATE=0.1
```

On Vercel, add the same vars under Project → Settings → Environment Variables.

---

## 3. Install dependencies

```bash
# Frontend (already in package.json)
npm install

# Backend
pip install -r backend/requirements.txt
```

---

## 4. What's instrumented

### Next.js (`@sentry/nextjs`)

| File | Purpose |
|------|---------|
| `instrumentation-client.ts` | Browser SDK init + Replay + router transitions |
| `instrumentation.ts` | Loads server/edge configs + `onRequestError` hook |
| `sentry.server.config.ts` | Node.js runtime (App Router server, route handlers) |
| `sentry.edge.config.ts` | Edge runtime (middleware, edge route handlers) |
| `src/app/global-error.tsx` | Top-level React error boundary fallback |
| `src/components/ErrorBoundary.tsx` | Captures React render errors with component stack |
| `next.config.ts` | `withSentryConfig()` for source-map upload + tunnel route |

**Tunnel route**: client telemetry is proxied through `/monitoring` to bypass
ad-blockers.

### FastAPI (`sentry-sdk[fastapi]`)

Initialized at the top of `backend/main.py` before app creation. Uses
`StarletteIntegration` + `FastApiIntegration` for automatic request tracing.

---

## 5. PHI / PII safety (clinical-grade)

Arovia.AI handles symptom data and partial PHI. Defaults are conservative:

- `sendDefaultPii: false` on **all** runtimes — no IPs, cookies, or auth headers.
- Replay integration uses `maskAllText: true` and `blockAllMedia: true`.
- `beforeSend` hooks strip `Authorization`, `Cookie`, `X-API-Key`.
- Diagnosis content is **never** attached to Sentry events.

If you need to attach a non-PHI user identifier (e.g. anonymous user UUID),
do it explicitly with `Sentry.setUser({ id })` after auth — never raw email
or names.

---

## 6. Sample rates

| Environment | Browser traces | Server traces | Replay (normal) | Replay (errors) |
|-------------|----------------|---------------|-----------------|-----------------|
| development | 100%           | 100%          | 10%             | 100%            |
| production  | 10%            | 10%           | 10%             | 100%            |

Tune in the respective `sentry.*.config.ts` files or via
`SENTRY_TRACES_SAMPLE_RATE` for the backend.

---

## 7. Verify the integration

After setting envs and running `npm run dev`:

```ts
// In any client component:
throw new Error("Sentry test — client");
```

```python
# In any backend route:
1 / 0
```

Both should appear in your Sentry project within ~30 seconds.

You can also hit `/sentry-example-page` (if you generate one via the Sentry
wizard) or use:

```bash
npx @sentry/wizard@latest -i nextjs
```

…to re-run the official wizard if you ever need to refresh the configuration.

---

## 8. Disabling temporarily

Unset `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`. The app falls back to a
no-op — no errors, no traces sent.
