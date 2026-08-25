# Arovia.AI — Frontend Architecture Report

> Revised after gap-analysis fixes (March 2026)

---

## 1. Overall Assessment

**Previous Score: 6.5/10 → Current Score: 8.5/10**

The original review identified systemic weaknesses across state management, chat architecture, testing, design tokens, API safety, and dark mode. All have now been addressed. The codebase has a clean 4-layer state architecture with per-query stale times, Zustand stores stripped to UI-only, Zod response schemas, authenticated API routes, a blocking dark-mode script, ESLint-enforced legacy chat isolation, class-based design tokens, and 39 passing tests. The remaining gap to 10/10 involves Feature-Sliced Design at the directory level, E2E Playwright coverage, observability (Sentry / Web Vitals), and wiring Zod validation into actual fetch call sites.

---

## 2. What Changed (Gap-Analysis Fixes)

| Before | After |
|--------|-------|
| React Query global 60s staleTime for everything | Per-query stale times: 15s appointments, 10s notifications, 5min doctor list, etc. |
| Zustand stores held server data (notifications, admin metrics) | All 4 stores stripped to UI-only; server data in React Query hooks |
| `useRealtimeMetrics` stored metrics in Zustand | Uses React Query for data + Supabase Realtime to invalidate cache |
| `SystemHealthBadge` read from Zustand store | Migrated to `useSystemHealth()` React Query hook |
| `severity.ts` returned `var()` inline styles | Returns `className` strings (`textClass`, `bgClass`, `className`) |
| `tokens.css` had no utility classes | Now has `.text-severity-*`, `.bg-severity-*`, `.text-status-*`, `.text-confidence-*` classes |
| Legacy chat only marked `@deprecated` (no enforcement) | ESLint `no-restricted-imports` rule blocks imports outside `src/components/chat/` |
| No API response validation schemas | `src/lib/validation/apiSchemas.ts` with 6 Zod schemas + 2 validation helpers |
| `/api/chat` and `/api/diagnose` had no auth guards | Both require Bearer token + `supabase.auth.getUser()` validation |
| Dark mode flash on SSR hydration (FOIT) | Blocking inline `<script>` in `<head>` reads localStorage/prefers-color-scheme |
| 26 tests across 2 files | 39 tests across 3 files (added `diagnosisChatHelpers.test.ts`) |

---

## 3. Architecture Map

```
src/
├── app/
│   ├── layout.tsx                      # Root: <script> FOIT fix → QueryProvider → AuthProvider
│   ├── globals.css                     # @import tokens.css → tailwindcss → tw-animate
│   ├── tokens.css                      # 30+ semantic --arovia-* tokens + utility classes
│   ├── api/
│   │   ├── chat/route.ts               # Auth guard → Groq streaming + Gemini fallback
│   │   ├── diagnose/route.ts           # Auth guard → 5-stage Bayesian + RAG + LLM pipeline
│   │   └── rag/                        # RAG support routes
│   └── dashboard/consult/              # PRIMARY chat system (conversational)
│       ├── components/
│       │   ├── ChatWindow.tsx           # Uses detectWidget() from shared utility
│       │   ├── MessageBubble.tsx
│       │   ├── InputBar.tsx
│       │   ├── PainSliderWidget.tsx
│       │   ├── PainLocationDropdown.tsx
│       │   ├── QuickReplyChips.tsx
│       │   └── TypingIndicator.tsx
│       └── hooks/
│           └── useChat.ts              # Streaming chat hook (/api/chat)
│
├── components/chat/                    # LEGACY chat system (ESLint-blocked)
│   ├── ChatInterface.tsx               # 39 lines — thin composition shell
│   ├── useDiagnosisChat.ts             # Extracted hook (all business logic)
│   ├── diagnosisChatHelpers.ts         # detectEmotionalState, applyOptionToSymptoms
│   ├── MessageList.tsx                 # Extracted presentation component
│   ├── DiagnosisResultCard.tsx         # Exempted from ESLint block (reusable)
│   ├── IntakeCard.tsx
│   └── __tests__/
│       └── diagnosisChatHelpers.test.ts # 13 tests
│
├── lib/
│   ├── providers/
│   │   └── QueryProvider.tsx           # QueryClientProvider + devtools
│   ├── hooks/
│   │   └── useApiQueries.ts           # 14 query hooks + 3 mutations
│   ├── validation/
│   │   ├── apiSchemas.ts              # Zod schemas for /api/chat + /api/diagnose
│   │   ├── schemas.ts                 # Form validation schemas
│   │   └── sanitize.ts                # Input sanitization
│   ├── chat/
│   │   ├── widgetDetection.ts          # Shared detectWidget() utility
│   │   └── __tests__/
│   │       └── widgetDetection.test.ts # 10 tests
│   ├── tokens/
│   │   └── severity.ts                # Typed severity/confidence → className strings
│   ├── diagnosis/
│   │   ├── engine.ts                   # Bayesian scoring, red-flag scanner
│   │   ├── orchestrator.ts             # 5-stage pipeline
│   │   ├── types.ts                    # All diagnosis types
│   │   ├── __tests__/
│   │   │   └── engine.test.ts          # 16 tests
│   │   ├── advanced/                   # MCMC, clinical rules, info-gain, uncertainty
│   │   │   ├── MCMCEngine.ts
│   │   │   └── InformationGainSelector.ts
│   │   └── dialogue/                   # NER, intent, empathy, language detection
│   │       └── LanguageDetector.ts
│   └── api.ts                          # Supabase data access (wrapped by useApiQueries)
│
├── stores/                             # Zustand (ALL stripped to UI-only)
│   ├── appointmentStore.ts             # Filter/sort state only
│   ├── notificationStore.ts            # Panel toggle + ephemeral realtime notifications
│   ├── adminMetricsStore.ts            # Live-view toggle + connection status
│   └── videoStore.ts                   # Video call lifecycle UI
│
├── context/
│   └── AuthContext.tsx                  # Auth + RBAC
│
└── vitest.config.ts                    # Test configuration
```

---

## 4. State Management Architecture

A clean 4-layer architecture with no overlap between server state and client state:

| Layer | Technology | Responsibility | Example |
|-------|-----------|----------------|---------|
| **Server State** | TanStack React Query v5 | All Supabase data + admin endpoints: appointments, profiles, consultations, videos, notifications, metrics, health | `useDoctorAppointments(doctorId)`, `useNotifications(userId)`, `useAdminMetrics()`, `useSystemHealth()` |
| **Auth State** | React Context (`AuthContext`) | Session, user object, role, profile | `useAuth()`, `useRequireRole()` |
| **Global UI State** | Zustand (4 scoped stores) | UI-only toggles and ephemeral state | `useNotificationStore()` (panel open/close), `useAdminMetricsStore()` (liveView toggle) |
| **Local UI State** | `useState` / `useReducer` | Form inputs, typing indicators, message arrays | `useDiagnosisChat()`, `useChat()` |

### Key State Boundary Rules

| Data Type | Where It Lives | NOT In |
|-----------|---------------|--------|
| Notification list from DB | `useNotifications()` React Query hook | ~~notificationStore~~ |
| Notification panel open/close | `notificationStore.isOpen` | React Query |
| Ephemeral realtime push events | `notificationStore.ephemeralNotifications` | React Query (until persisted) |
| Admin metrics from `/api/admin/metrics` | `useAdminMetrics()` React Query hook | ~~adminMetricsStore~~ |
| Live-view toggle + connection status | `adminMetricsStore.liveViewEnabled` | React Query |
| System health from `/api/admin/health` | `useSystemHealth()` React Query hook | ~~adminMetricsStore~~ |

### React Query Configuration

```
QueryProvider (root layout)
  └── QueryClient
       ├── defaultOptions.queries.staleTime: 60s (fallback)
       ├── defaultOptions.queries.retry: 1
       └── defaultOptions.queries.refetchOnWindowFocus: false (fallback)
```

### Per-Query Stale Times

Individual hooks override the global 60s default based on data volatility:

| Hook | staleTime | refetchOnWindowFocus | refetchInterval | Rationale |
|------|-----------|---------------------|-----------------|-----------|
| `useDoctorAppointments` | 15s | `true` | -- | Time-critical; doctor returning to tab needs fresh data |
| `usePatientAppointments` | 15s | `true` | -- | Same as doctor appointments |
| `useAppointmentById` | 15s | -- | -- | Single appointment detail during consultation |
| `useNotifications` | 10s | `true` | 30s polling | Near-realtime; users expect immediate badge updates |
| `useAllDoctors` | 5min | -- | -- | Doctor list changes rarely |
| `useAdminMetrics` | 10s | -- | 30s polling | Admin dashboard needs frequent updates |
| `useSystemHealth` | 15s | -- | 60s polling | Health status is important but not second-by-second |
| All other hooks | 60s (default) | `false` (default) | -- | Standard data that doesn't change frequently |

### Query Keys (centralized in `useApiQueries.ts`)

```
["doctorProfile", userId]
["doctorAppointments", doctorId]
["patientAppointments", patientId]
["doctorPatients", doctorId]
["allDoctors"]
["appointment", id]
["latestConsultation", patientId]
["patientConsultations", patientId]
["notifications", userId, { unreadOnly }]
["doctorVideos", doctorId]
["publishedVideos", { category, search }]
["allVideosAdmin"]
["adminMetrics"]
["systemHealth"]
```

### Mutation Auto-Invalidation

| Mutation | Invalidates |
|----------|------------|
| `useCreateAppointment` | `patientAppointments` + `doctorAppointments` |
| `useMarkNotificationRead` | `notifications` |
| `useMarkAllNotificationsRead` | `notifications` |

### Realtime Invalidation Pattern

`useRealtimeMetrics` subscribes to Supabase Realtime channels. When a realtime event arrives, it calls `queryClient.invalidateQueries()` to refetch via React Query -- it does NOT store metrics data in Zustand. This keeps Zustand as a pure UI-state layer and React Query as the single source of truth for server data.

---

## 5. Chat Architecture

### System Overview

The project has two chat systems. The **primary** system is the conversational LLM-streaming flow under `src/app/dashboard/consult/`. The **legacy** system under `src/components/chat/` is deprecated and **ESLint-blocked** from being imported by any file outside its own directory.

### Primary System (`src/app/dashboard/consult/`)

```
User types message
    │
    ▼
InputBar.tsx → useChat.ts
    │
    ├── POST /api/chat (streaming SSE)
    │   ├── Auth guard: Bearer token → supabase.auth.getUser()
    │   ├── Groq (primary, streaming)
    │   └── Gemini (fallback, non-streaming)
    │
    ▼
ChatWindow.tsx
    ├── MessageBubble.tsx (per message)
    ├── detectWidget() → WidgetHint discriminated union
    │   ├── { type: "pain_slider" }         → PainSliderWidget.tsx
    │   ├── { type: "quick_reply", options } → QuickReplyChips.tsx
    │   └── { type: "none" }                → no widget
    └── TypingIndicator.tsx (during streaming)
```

### Widget Detection (`src/lib/chat/widgetDetection.ts`)

Shared utility that analyzes assistant message text and returns a typed `WidgetHint`. Covers 12 detection categories:

| Category | English Patterns | Hindi/Hinglish Patterns |
|----------|-----------------|------------------------|
| Pain scale | "1-10", "severity", "how bad" | "1 se 10", "kitna dard" |
| Location | "where exactly", "which area" | "kahaan", "kidhar", "jagah" |
| Sensation | "feel like", "type of pain" | "kaisa dard", "jalan" |
| Duration | "how long", "since when" | "kab se", "kitne dino" |
| Triggers | "makes it worse", "trigger" | "badh jata hai", "badhta" |
| Relief | "makes it better", "relief" | "aram", "kam hota" |
| Frequency | "how often", "recurring" | "kitni baar", "hamesha" |
| Onset | "how did it start", "suddenly" | "kaise shuru", "achanak" |
| Associated | "other symptom", "along with" | "aur koi taklif", "saath mein" |
| Stress | "stress", "anxiety", "sleep" | "pareshani", "neend" |
| Radiation | "spread", "radiate" | "faila", "dusri jagah" |
| Yes/No | "do you", "have you", "is there" | "kya aapko", "pehle kabhi" |

### Legacy Chat Enforcement

The legacy chat system is not just `@deprecated` -- it is actively blocked by ESLint:

```javascript
// eslint.config.mjs
{
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["src/components/chat/**"],     // self-imports are fine
    rules: {
        "no-restricted-imports": ["error", {
            paths: [
                { name: "@/components/chat/ChatInterface",
                  message: "ChatInterface is deprecated. Use src/app/dashboard/consult/." },
                { name: "@/components/chat/useDiagnosisChat",
                  message: "useDiagnosisChat is deprecated. Use useChat from consult/hooks/." },
            ],
            patterns: [{
                group: ["@/components/chat/*", "!@/components/chat/DiagnosisResultCard"],
                message: "Imports from src/components/chat/ are deprecated.",
            }],
        }],
    },
}
```

**Key details:**
- Any file outside `src/components/chat/` that imports from the legacy system gets an ESLint error
- `DiagnosisResultCard` is exempted (still reusable across both systems)
- Error messages guide developers to the correct primary system

### God Component Decomposition

| Metric | Before | After |
|--------|--------|-------|
| `ChatInterface.tsx` lines | 475 | 39 |
| Responsibilities in single file | 9 | 1 (composition) |
| Testable units extracted | 0 | 3 (hook, widget detection, message list) |
| `useCallback` memoization | 0 | 6 handlers memoized |

---

## 6. Design Token System

### Token Hierarchy

```
tokens.css (CSS custom properties — single source of truth)
    │
    ├── --arovia-* custom properties (30+ tokens)
    ├── Utility classes: .text-severity-*, .bg-severity-*, .text-status-*, .text-confidence-*
    │
    ├── Consumed by severity.ts → className strings (not inline styles)
    ├── Consumed by Tailwind via var() in component classes
    └── Imported by globals.css via @import
```

### Token Categories

| Category | Prefix | Count | Purpose |
|----------|--------|-------|---------|
| Brand | `--arovia-brand-*` | 4 | Primary teal, light/dark variants, secondary blue |
| Severity | `--arovia-severity-*` | 10 | Info / mild / moderate / severe / critical + background fills |
| Status | `--arovia-status-*` | 4 | Success, warning, error, info |
| Surface | `--arovia-surface-*` | 3 | Elevated, sunken, overlay |
| Text | `--arovia-text-*` | 4 | Primary, secondary, muted, on-brand |
| Confidence | `--arovia-confidence-*` | 3 | High (>80%), medium (50-80%), low (<50%) |

### Utility Classes (New)

`tokens.css` now defines utility classes that map to the CSS custom properties. This replaces the old approach of using `var()` inline styles, which broke dark mode variants.

```css
/* Severity text */
.text-severity-info      { color: var(--arovia-severity-info); }
.text-severity-mild      { color: var(--arovia-severity-mild); }
.text-severity-moderate  { color: var(--arovia-severity-moderate); }
.text-severity-severe    { color: var(--arovia-severity-severe); }
.text-severity-critical  { color: var(--arovia-severity-critical); }

/* Severity backgrounds */
.bg-severity-info        { background-color: var(--arovia-severity-info-bg); }
.bg-severity-mild        { background-color: var(--arovia-severity-mild-bg); }
.bg-severity-moderate    { background-color: var(--arovia-severity-moderate-bg); }
.bg-severity-severe      { background-color: var(--arovia-severity-severe-bg); }
.bg-severity-critical    { background-color: var(--arovia-severity-critical-bg); }

/* Status + Confidence */
.text-status-success     { color: var(--arovia-status-success); }
.text-confidence-high    { color: var(--arovia-confidence-high); }
/* ... etc */
```

### Typed Access in Components (Updated)

`severity.ts` now returns className strings, not `var()` inline styles:

```typescript
import { severityTokens, getConfidenceClass } from "@/lib/tokens/severity";

// Severity badge — uses className, dark mode works automatically
<Badge className={severityTokens[condition.severity].className}>
    {severityTokens[condition.severity].label}
</Badge>

// Individual text/bg classes
<span className={severityTokens["severe"].textClass}>High concern</span>

// Confidence indicator
<span className={getConfidenceClass(85)}>85% confidence</span>
// Returns "text-confidence-high" → resolves to oklch green
```

### Severity Scale (Clinical)

```
Info       ──── oklch(0.65 0.15 230)  Blue    ── Informational
Mild       ──── oklch(0.65 0.15 145)  Green   ── Safe
Moderate   ──── oklch(0.75 0.16 85)   Amber   ── Moderate concern
Severe     ──── oklch(0.60 0.20 35)   Orange  ── High concern
Critical   ──── oklch(0.55 0.22 25)   Red     ── Emergency
```

### Dark Mode

Every token has a `.dark` override in `tokens.css`. The oklch values are adjusted for dark backgrounds (lower lightness, slightly reduced chroma) to maintain perceptual consistency. Because the utility classes reference `var()` and the `.dark` selector overrides the custom properties, dark mode works automatically with the class-based approach -- no conditional logic needed in components.

---

## 7. API Route Auth Guards

Both API routes now require authenticated Supabase sessions. The pattern is identical:

```
Request arrives
    │
    ▼
Extract Bearer token from Authorization header
    │
    ├── Missing/malformed → 401 "Unauthorized — missing token"
    │
    ▼
supabase.auth.getUser(token)
    │
    ├── Invalid/expired → 401 "Unauthorized — invalid token"
    │
    ▼
Proceed with authenticated request
```

### Implementation

| Route | Auth Pattern |
|-------|-------------|
| `/api/chat` | `req.headers.get('authorization')` → `startsWith('Bearer ')` → `supabase.auth.getUser(token)` |
| `/api/diagnose` | Same pattern |

Both routes return structured JSON error responses with `{ error: string }` on 401.

---

## 8. Zod Response Validation

`src/lib/validation/apiSchemas.ts` defines Zod schemas for validating API response shapes before rendering medical data to users.

### Schemas

| Schema | Validates | Fields |
|--------|-----------|--------|
| `ChatStreamChunkSchema` | SSE chunk from Groq streaming | `content: string` |
| `ChatFallbackResponseSchema` | Non-streaming Gemini response | `content: string`, `provider: "gemini"` |
| `ChatDiagnosisJsonSchema` | JSON diagnosis block in chat | `name`, `description`, `severity`, `confidence`, `differentialDiagnoses?`, `remedies?`, `indianHomeRemedies?`, `exercises?`, `warnings?`, `seekHelp?` |
| `DiagnoseAIResultSchema` | `/api/diagnose` AI result | `conditionName`, `confidence`, `description`, `severity`, `differentialDiagnoses?`, `remedies?`, `indianHomeRemedies?`, `warnings?`, `seekHelp?`, `reasoningTrace?` |
| `DiagnoseResponseMetaSchema` | `/api/diagnose` metadata | `provider`, `latencyMs`, `ragApplied`, `ragRemediesFound`, `ragChunks`, `bayesianPriorsUsed`, `clinicalRuleAlertsUsed`, `dynamicTemperature`, `structuredRemediesInjected`, `mcmcUncertaintyInjected`, `questionOverridden` |
| `DiagnoseResponseSchema` | Full `/api/diagnose` response | `{ diagnosis: DiagnoseAIResult, meta: DiagnoseResponseMeta }` |

### Helper Functions

```typescript
validateDiagnoseResponse(raw: unknown): DiagnoseResponse | null
// Safely parse /api/diagnose response. Returns null + console.warn on mismatch.

validateChatDiagnosisJson(raw: unknown): ChatDiagnosisJson | null
// Safely parse the JSON diagnosis block from chat LLM ```json fences.
```

### Type Exports

All types are derived from Zod schemas via `z.infer<>`, ensuring the TypeScript types and runtime validation are always in sync:

```typescript
export type ChatStreamChunk      = z.infer<typeof ChatStreamChunkSchema>;
export type ChatFallbackResponse = z.infer<typeof ChatFallbackResponseSchema>;
export type ChatDiagnosisJson    = z.infer<typeof ChatDiagnosisJsonSchema>;
export type DiagnoseAIResult     = z.infer<typeof DiagnoseAIResultSchema>;
export type DiagnoseResponseMeta = z.infer<typeof DiagnoseResponseMetaSchema>;
export type DiagnoseResponse     = z.infer<typeof DiagnoseResponseSchema>;
```

---

## 9. Dark Mode FOIT Fix

### Problem

Without intervention, React hydration on page load would apply the wrong theme class, causing a visible Flash of Incorrect Theme (FOIT) -- the page would briefly render in light mode before JavaScript applied the dark class.

### Solution

A blocking inline `<script>` in the `<head>` of the root layout (`src/app/layout.tsx`) runs before any rendering occurs:

```javascript
(function(){
    try {
        var d = document.documentElement;
        var t = localStorage.getItem('arovia-theme');
        if (t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme:dark)').matches)) {
            d.classList.add('dark');
        } else {
            d.classList.remove('dark');
        }
    } catch(e) {}
})();
```

### Priority Order

1. `localStorage('arovia-theme')` -- explicit user preference (highest priority)
2. `prefers-color-scheme: dark` media query -- OS/browser setting (fallback)
3. Light mode -- default if neither is set

The `<html>` element has `suppressHydrationWarning` to prevent React from warning about the server/client class mismatch.

---

## 10. Testing Architecture

### Configuration

```
vitest.config.ts
  ├── environment: "node"
  ├── globals: true
  ├── @ alias → src/
  └── include: src/**/*.test.{ts,tsx}
```

### Test Coverage — 39 Tests Across 3 Files

| Test File | Tests | Coverage Area |
|-----------|-------|---------------|
| `src/lib/diagnosis/__tests__/engine.test.ts` | 16 | `extractSymptomList` (5), `scanRedFlags` (9), `buildEvidenceMetrics` (2) |
| `src/lib/chat/__tests__/widgetDetection.test.ts` | 10 | All 12 widget categories + edge cases |
| `src/components/chat/__tests__/diagnosisChatHelpers.test.ts` | 13 | `detectEmotionalState` priority/patterns (6), `applyOptionToSymptoms` multi-choice/yes-no/radiation (7) |

### diagnosisChatHelpers.test.ts Coverage Detail

| Function | Tests | What's Covered |
|----------|-------|----------------|
| `detectEmotionalState` | 6 | Urgent detection (emergency keywords), frustrated detection (annoyance), anxious detection (worry), calm fallback for neutral, urgent > anxious priority, urgent > frustrated priority |
| `applyOptionToSymptoms` | 7 | Multi-choice "None of the above" excludes all, specific option appends to notes, "No" excludes context symptom, "Yes" adds context symptom, radiation/numbness keyword detection, no-match passthrough, existing exclusions preserved |

### Red Flag Scanner Coverage

| Emergency Type | Test Case |
|----------------|-----------|
| Cardiac | Chest + crushing + sweating + arm pain |
| Stroke (FAST) | Face drooping + arm weakness + slurred speech |
| Respiratory | Can't breathe + gasping |
| Mental Health | Suicidal ideation detection |
| Anaphylaxis | Allergic + throat swelling |
| Meningitis | Headache + stiff neck |
| Overdose | Pills + too many |
| Severe Bleeding | Bleeding + won't stop |
| Benign (negative) | Knee ache -- returns zero alerts |

### Scripts

```bash
npm test            # vitest run (CI mode)
npm run test:watch  # vitest (dev, watch mode)
```

---

## 11. Diagnosis Pipeline Architecture

```
USER INPUT
    │
    ▼
[0] RED FLAG SCAN ─── 18 emergency patterns (cardiac, neuro, respiratory,
    │                  anaphylaxis, trauma, abdominal, mental health, other)
    │
    ▼
[1] BAYESIAN ENGINE ── MCMC Metropolis-Hastings sampling
    │                   Per-symptom likelihood ratios (sensitivity/specificity)
    │                   Beta priors from condition prevalence
    │
    ▼
[2] CLINICAL RULES ── DVT Wells Score, Ottawa Ankle/Knee Rules
    │
    ▼
[3] MULTI-QUERY RAG ── Boericke materia medica vector search
    │
    ▼
[4] LLM INFERENCE ─── Groq (primary) / Gemini (fallback)
    │                  Dynamic temperature based on MCMC confidence
    │                  Enriched prompt: Bayesian priors + RAG context + clinical rules
    │
    ▼
[5] BAYESIAN CALIBRATION ── 70% AI confidence + 30% Bayesian posterior
    │                        Fuzzy name matching for agreement detection
    │
    ▼
[6] UNCERTAINTY QUANTIFICATION ── Point estimate → confidence interval
    │
    ▼
FUSED RESULT
```

---

## 12. Technology Stack

### Runtime Dependencies

| Category | Packages |
|----------|----------|
| Framework | Next.js 16.1.1, React 19.2.3 |
| AI/LLM | `@google/genai`, `openai` (Groq-compatible) |
| Backend | `@supabase/ssr`, `@supabase/supabase-js`, `pg`, `postgres` |
| Server State | `@tanstack/react-query` v5 (14 query hooks + 3 mutations) |
| Client State | `zustand` v5 (4 UI-only stores) |
| Forms | `react-hook-form`, `@hookform/resolvers`, `zod` |
| Validation | `zod` (form schemas + API response schemas) |
| UI | Radix UI (11 primitives), `lucide-react`, `shadcn/ui` |
| Animation | `framer-motion` |
| Styling | Tailwind CSS v4, `tw-animate-css` |

### Dev Dependencies

| Category | Packages |
|----------|----------|
| Testing | `vitest`, `@playwright/test` |
| Build | `@tailwindcss/postcss`, `typescript` v5 |
| Tooling | `eslint`, `eslint-config-next`, `tsx`, `dotenv` |

---

## 13. Remaining Technical Debt

| Item | Priority | Status | Recommendation |
|------|----------|--------|---------------|
| Feature-Sliced directory restructure | Medium | Not started | Adopt `entities/features/widgets/shared` layers |
| Observability (Sentry + Web Vitals) | **High** | Not started | Add `@sentry/nextjs` + `reportWebVitals` |
| E2E Playwright test coverage | **High** | Not started | Expand Playwright specs for diagnosis + booking flows |
| Auth migration to `middleware.ts` server sessions | **High** | Not started | Move from Context to cookie-based sessions to eliminate Context re-renders |
| XState for diagnosis flow | Medium | Not started | Replace manual `transitionPhase()` with guarded state machine to prevent unguarded phase transitions |
| Wire Zod validation into fetch calls | Medium | Schemas exist | `apiSchemas.ts` has schemas + helpers, but they are not yet called at the actual fetch sites in `useApiQueries.ts` and `useChat.ts` |
| Bundle size audit (Framer Motion) | Medium | Not started | Tree-shake or replace with CSS animations |
| Remove dead `tailwindcss-animate` dep | Low | Not started | Only `tw-animate-css` is used |
