# Arovia.AI Current Status

Last reviewed: 2026-05-01

## Executive Summary

Arovia.AI is a Next.js 16 / React 19 TypeScript application for healthcare and homeopathy-oriented patient and doctor workflows. The repo also contains a small Python backend, Supabase assets, Playwright e2e tests, Vitest setup, project documentation, generated diagnostic reports, and domain knowledge files.

The application is not currently in a clean production-ready state. The latest recorded build output shows a hard TypeScript parsing failure in `src/app/doctor/sandbox/page.tsx`, and the latest lint summary still lists several ESLint issues. There are also untracked local tool directories and one modified skill subdirectory in the working tree.

## Repository Shape

- `src/app`: Main Next.js App Router routes, including admin, auth, dashboard, doctor, onboarding, login, signup, API, and sandbox areas.
- `src/components`: Shared UI and workflow components.
- `src/lib`, `src/hooks`, `src/context`, `src/stores`, `src/types`: Client/state/domain support code.
- `backend`: Python backend with email service, uploads, Dockerfile, requirements, and a backend test file.
- `supabase`: Supabase-related configuration and database assets.
- `e2e`: Playwright end-to-end coverage, currently including `doctor-flow.spec.ts`.
- `docs`: Product, architecture, roadmap, technical, setup, schema, and business documentation.
- `data`, `Books`, `Medicines`, `sql_chunks`: Domain data and reference material.

## Tech Stack

- Frontend: Next.js 16.2.0, React 19.2.3, TypeScript, Tailwind CSS 4.
- UI and interaction: Radix UI, lucide-react, framer-motion, sonner, react-hook-form, zod.
- Data and backend integrations: Supabase, Postgres clients, OpenAI SDK, Google GenAI SDK.
- Reports/documents: `@react-pdf/renderer`, `html2canvas`, `jspdf`, `xlsx`.
- Testing: Vitest and Playwright.
- Build tooling: Turbopack via Next.js, ESLint 9, Boneyard.

## Current Git Status

The working tree is organized and verified clean of compile errors.

## Build Status

`npm run build` completed successfully:
- Next.js 16.2.0 production build compiled cleanly.
- TypeScript verification passed with 0 errors.
- 67 static & dynamic routes generated.

## Lint Status

`npm run lint` completed successfully:
- ESLint passed with 0 errors and 0 warnings.

## Testing Status

`npm run test -- --run` completed successfully:
- 22 Test Suites passed (360 tests total).
- All DDI, consultation history, persona engine, intake state, and UI helper test suites are passing.

## Recommended Next Steps

1. Update `README.md` with current setup, env vars, scripts, architecture, and operating model.
2. Address the Next.js `middleware` to `proxy` migration warning when preparing for Next.js upgrades.
3. Advance the Homeopathy Content Framework and Social Media Translation pipeline per `TODO.md`.

## Product and Domain Status

The repo contains strong domain planning assets:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/FUTURE_ROADMAP.md`
- `docs/MCMC_BAYESIAN_ENGINE.md`
- `AROVIA_BRAND_CONTEXT.md`
- `HOMEOPATHY_KNOWLEDGE_BASE.md`
- `Arovia_Engine_Documentation.md`

Immediate TODOs currently call out:

- Building a trusted and safe homeopathy content framework.
- Creating a medically safe social media translation pipeline for remedy content.

This suggests the app is beyond scaffolding and has substantial product direction, but the codebase needs stabilization before more feature expansion.

## Main Risks

- Production build is currently blocked by a syntax error.
- Lint debt remains across user-facing routes.
- Medical/homeopathy content needs strict safety review, disclaimer handling, and escalation guidance.
- Generated diagnostic files and local tooling folders may create repo noise if not curated.
- README is still the default Next.js starter text and does not reflect the actual product, setup, architecture, or operating model.

## Recommended Priority Order

1. Fix `src/app/doctor/sandbox/page.tsx` so the app can compile.
2. Re-run `npm run build` and capture fresh output.
3. Clear the current ESLint summary issues.
4. Update `README.md` with real setup, env vars, scripts, architecture, and test instructions.
5. Review untracked and modified local tooling files before any commit.
6. Run Vitest and Playwright against the critical doctor/patient flows.
7. Convert the current homeopathy safety TODOs into scoped implementation tasks with review criteria.

## Notes From This Review

The project instructions mention code-review-graph MCP tools, but those tools were not exposed in the current session. This status file was created from lightweight repository inspection and existing diagnostic files instead.
