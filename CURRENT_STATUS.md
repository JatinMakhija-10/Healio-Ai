# Healio.AI Current Status

Last reviewed: 2026-05-01

## Executive Summary

Healio.AI is a Next.js 16 / React 19 TypeScript application for healthcare and homeopathy-oriented patient and doctor workflows. The repo also contains a small Python backend, Supabase assets, Playwright e2e tests, Vitest setup, project documentation, generated diagnostic reports, and domain knowledge files.

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

The working tree is not clean.

- Modified: `.agents/skills/ui-ux-pro-max-skill`
- Untracked: `.helm-diag/`
- Untracked: `.jetro/`
- Untracked: `AGENT.md`

These appear to be local tooling or agent configuration changes rather than core app changes, but they should be reviewed before committing.

## Build Status

The latest captured build output in `build_output.txt` shows a failed production build.

Primary blocker:

- `src/app/doctor/sandbox/page.tsx:234`
- Error: `Expression expected`
- Cause shown in output: an invalid comment/directive sequence around an ESLint disable comment and `@typescript-eslint/no-unused-vars`.

Additional build warning:

- Next.js reports that the `middleware` file convention is deprecated and should be replaced with `proxy`.

Recommended next action:

1. Fix the syntax error in `src/app/doctor/sandbox/page.tsx`.
2. Re-run `npm run build`.
3. Address the middleware-to-proxy migration warning before upgrading further or preparing deployment.

## Lint Status

The latest summarized lint output in `lint_summary2.txt` shows remaining issues, mostly `react/no-unescaped-entities`.

Known lint locations:

- `src/app/dashboard/learn/page.tsx`
- `src/app/dashboard/pathway/[id]/page.tsx`
- `src/app/dashboard/search/page.tsx`
- `src/app/doctor/patients/[id]/page.tsx`
- `src/app/doctor/patients/page.tsx`
- `src/app/doctor/sandbox/page.tsx`
- `src/app/doctor/videos/page.tsx`
- `src/app/login/page.tsx`
- `src/app/not-found.tsx`
- `src/components/doctor/PostConsultationForm.tsx`

Issue categories:

- Unescaped apostrophes or quotes in JSX text.
- Unused variables in `src/app/doctor/sandbox/page.tsx`.
- Raw `<img>` usage in `src/app/doctor/videos/page.tsx`.

Recommended next action:

1. Fix JSX entity escaping in the listed pages.
2. Remove or properly use unused variables in the doctor sandbox page.
3. Replace raw `<img>` with `next/image` where appropriate, or explicitly justify and suppress the lint rule if needed.

## Testing Status

Configured test commands:

- `npm run test`: Vitest test suite.
- Playwright config is present, with e2e coverage under `e2e/`.

Observed from repo inspection:

- There is at least one Playwright e2e spec: `e2e/doctor-flow.spec.ts`.
- Backend has `backend/test_backend.py`.
- No fresh test run was performed while creating this snapshot.

Recommended next action:

1. Run `npm run test` after the build syntax error is fixed.
2. Run Playwright e2e tests for doctor and patient critical paths.
3. Run or formalize backend tests if the Python service is still active in the product architecture.

## Product and Domain Status

The repo contains strong domain planning assets:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/FUTURE_ROADMAP.md`
- `docs/MCMC_BAYESIAN_ENGINE.md`
- `HEALIO_BRAND_CONTEXT.md`
- `HOMEOPATHY_KNOWLEDGE_BASE.md`
- `Healio_Engine_Documentation.md`

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
