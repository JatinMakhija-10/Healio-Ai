# Arovia — Landing Page Design & Development Plan
### RAG AI Health Chatbot · Indian Wellness Market
**Document Type:** Senior UX/UI Design Blueprint  
**Version:** 1.0  
**Market:** India (Pan-India, Tier 1–3 cities)  
**Target Devices:** Android-first (Redmi, Realme, Samsung M-series), iOS secondary  
**Prepared by:** UX Design Lead  

---

## Table of Contents

1. [Project Brief & Strategic Intent](#1-project-brief--strategic-intent)
2. [Phase 0 — Research & Foundations](#2-phase-0--research--foundations)
3. [Phase 1 — Information Architecture & Content Strategy](#3-phase-1--information-architecture--content-strategy)
4. [Phase 2 — Visual Design System](#4-phase-2--visual-design-system)
5. [Phase 3 — Section-by-Section UI Design (The Landing Page)](#5-phase-3--section-by-section-ui-design-the-landing-page)
6. [Phase 4 — Micro-interactions & Motion Design](#6-phase-4--micro-interactions--motion-design)
7. [Phase 5 — UX Copy & Localisation](#7-phase-5--ux-copy--localisation)
8. [Phase 6 — Mobile-First Technical Constraints](#8-phase-6--mobile-first-technical-constraints)
9. [Phase 7 — Conversion & Onboarding Flow Design](#9-phase-7--conversion--onboarding-flow-design)
10. [Phase 8 — Accessibility & Inclusion Standards](#10-phase-8--accessibility--inclusion-standards)
11. [Phase 9 — QA, Testing & Handoff Checklist](#11-phase-9--qa-testing--handoff-checklist)
12. [Audit of Existing Screen — What to Keep / Change / Add](#12-audit-of-existing-screen--what-to-keep--change--add)
13. [Critical UX Copy Dos and Don'ts](#13-critical-ux-copy-dos-and-donts)
14. [Priority Legend & Delivery Milestones](#14-priority-legend--delivery-milestones)

---

## 1. Project Brief & Strategic Intent

### What Arovia Is (For the User, Not the Engineer)

Arovia is a RAG-powered AI chatbot that takes symptom input from users and returns evidence-based wellness guidance, home care suggestions, and — critically — a clear signal about when to escalate to a real doctor. The underlying technology is sophisticated, but the user must never perceive it as a machine. They must perceive it as a knowledgeable, calm, trustworthy family health companion.

### The Core Disguise Principle

The single most important design decision on this landing page is that **the word "AI" must never lead any sentence, headline, or visual hierarchy**. Indian health consumers in 2024 have high anxiety around AI medical diagnosis. They fear:

- Being misled by a machine into ignoring a serious condition
- Their health data being stored, sold, or leaked
- Being judged for their symptoms or health literacy
- AI being a replacement for their trusted family doctor

Every design decision on this page must work to dissolve one or more of these fears before a user ever taps "Get Started."

### What the Landing Page Must Accomplish

The landing page has exactly one job: **move a first-time visitor from skepticism to a single tap on the CTA**. It is not a feature showcase. It is not a product manual. It is an emotional journey from "what is this?" to "I trust this enough to try it."

To do that, the page must:

1. Immediately communicate cultural familiarity (this was made for people like me)
2. Establish medical credibility without triggering diagnostic fear
3. Show — not tell — what the product does, via a simulated chat demo
4. Prove privacy and safety with India-specific regulatory references
5. Make the first action feel low-stakes (no form, no password, no commitment)

---

## 2. Phase 0 — Research & Foundations

> **Timeline:** Week 1–2  
> **Owner:** UX Research Lead + Product Manager  
> **Deliverable:** Research synthesis deck, persona documents, competitive audit report

### 2.1 User Research Priorities

Before a single wireframe is drawn, the following research must be completed or validated:

**Existing data to gather:**
- App store reviews of Practo, mfine, 1mg, and Lybrate (look for emotional language around trust, fear, data privacy, and language barriers)
- NPS scores or feedback from any existing Arovia beta users, specifically around first impressions
- Drop-off analytics if a previous version of this page exists (which sections did users leave from?)

**Primary research to conduct (if budget allows):**
- 6–8 guerrilla usability sessions with target users in Tier 1 and Tier 2 cities. Show them the current screen and ask: "What does this app do? Would you download it? What concerns you?" Record verbatim language — this becomes UX copy fodder.
- Specifically recruit: a 35–45 year old mother managing family health, a 55–65 year old with a chronic condition, a 22–28 year old urban professional. These are the three primary decision-making archetypes.

### 2.2 Competitive Audit — What the Market Is Doing

The goal here is not to copy competitors, but to identify trust signals that Indian health app users already recognise and respond to.

| App | What they do well on landing | What to avoid copying |
|---|---|---|
| Practo | Doctor photos build instant credibility | Too much text, overwhelms new users |
| 1mg | Medicine + lab test = tangible value prop | Transactional feel, not wellness |
| mfine | Video consult demo builds trust quickly | "Consult a doctor" framing — not our positioning |
| Tata Health | Tata brand does a lot of heavy lifting | Can't rely on brand equity we don't have |
| Niramai / SigTuple | Cutting-edge but very clinical | Alienates non-urban users entirely |

**Key insight from audit:** No Indian health app has successfully positioned AI as a *home companion* rather than a *clinical tool*. Arovia has a first-mover advantage in the warm, family-trusted wellness space. The design must own that positioning explicitly.

### 2.3 Define Primary User Personas

These personas are not marketing archetypes — they are UX decision-making tools. Every design decision in the phases below must be evaluated against at least one of these three personas.

---

**Persona 1 — Priya, 38, Lucknow**  
Mother of two, manages family health decisions, primary caregiver for in-laws. Uses WhatsApp extensively. Comfortable with Hindi. Has used Practo once to book a doctor but found the interface overwhelming. Primary fear: "What if the app tells me something wrong and I ignore a serious problem?" She needs reassurance that Arovia will tell her when to see a real doctor. She will not read long text. She responds to illustrations of families that look like hers.

**Persona 2 — Arjun, 26, Bengaluru**  
Software engineer, health-conscious, uses apps for everything. Comfortable with English. Has used fitness apps (HealthifyMe, Cult.fit). Understands AI conceptually but is wary of health data privacy. Primary fear: "Where is my data going?" He will read the privacy section. He will check if there's a DPDP mention. He needs technical credibility and data transparency before trusting. He is the most likely to actually read the fine print.

**Persona 3 — Suresh, 58, Ahmedabad**  
Retired government employee. Manages diabetes and hypertension. Uses a smartphone but not always confidently. Primary language is Gujarati, uses Hindi comfortably. Primary fear: "This is a machine, it won't understand my situation." He needs human warmth in the copy, very large touch targets, a language he recognises, and a clear statement that Arovia will recommend a real doctor when needed. He is the highest-value user (chronic condition management) but the hardest to onboard.

---

### 2.4 Device & Network Environment Research

This is non-negotiable for an India-first product and must be quantified before any development decision is made.

- **Primary device OS:** Android 11–13 on Mediatek Helio G-series chips (Redmi 9, Redmi 10, Realme C-series, Samsung Galaxy M-series). These devices have 3–4GB RAM and mid-range GPU.
- **Screen sizes to design for:** 360×800px, 390×844px (iPhone SE), 412×892px (Pixel 6a). Design the base layout at 375px width.
- **Network conditions:** Jio 4G is the dominant network. Average speed: 15–25 Mbps in cities, 5–10 Mbps in Tier 2/3. Design for a 3G fallback (3–5 Mbps) for rural users.
- **Data sensitivity:** Many Indian users are on limited data plans. A landing page over 1MB feels slow and wastes their data. This is a trust erosion factor, not just a performance issue.
- **Browser:** Chrome on Android dominates. Safari on iOS is secondary. Test on Chrome 110+ as minimum baseline.

---

## 3. Phase 1 — Information Architecture & Content Strategy

> **Timeline:** Week 2–3  
> **Owner:** UX Lead + Content Strategist  
> **Deliverable:** Sitemap, content hierarchy document, scroll-depth wireframe

### 3.1 The Emotional Arc of the Scroll

The landing page is not a list of features. It is a story told in sections, each one moving the user one step closer to trust. The scroll should follow this emotional journey:

```
ARRIVAL       → "This feels familiar and safe"
RECOGNITION   → "This is made for people like me"
DEMONSTRATION → "Oh, this is actually how it works"
CREDIBILITY   → "Doctors and privacy — I'm reassured"
SOCIAL PROOF  → "Others like me have used it"
COMMITMENT    → "I'm ready to try this"
```

Each section on the page maps to exactly one emotional beat. If a section does not serve one of these beats, it does not belong on the landing page. It belongs on a features page or FAQ.

### 3.2 Section Architecture (Ordered by Scroll Depth)

| # | Section Name | Emotional Beat | Scroll Depth | Priority |
|---|---|---|---|---|
| S1 | Hero / Above the Fold | Arrival + Recognition | 0–100vh | Must |
| S2 | Use-Case Scenario Cards | Recognition | 100–160vh | Must |
| S3 | Animated Chat Demo | Demonstration | 160–260vh | Must |
| S4 | "We Are Not Your Doctor" Trust Block | Credibility | 260–320vh | Must |
| S5 | Social Proof — Testimonials | Social Proof | 320–400vh | Should |
| S6 | Privacy & DPDP Compliance | Credibility (reinforced) | 400–460vh | Should |
| S7 | Seasonal Health Nudge (Dynamic) | Recognition (contextual) | 460–520vh | Nice |
| S8 | Final CTA + Footer | Commitment | 520–600vh | Must |

### 3.3 Content Hierarchy Rules

The following rules govern every content decision on the page:

1. **No section may contain more than one primary message.** If you find yourself writing "and also…" in a section brief, split it into two sections or cut the second idea.
2. **Headlines must be scannable at 2× scroll speed.** A user scrolling quickly through the page should understand the full value proposition from headlines alone, without reading a single body paragraph.
3. **Every section needs exactly one action or micro-action.** Either a button, a scroll cue, a tappable card, or a visual that invites interaction. Passive sections bleed engagement.
4. **The word "AI" may only appear once on the entire page**, in fine print or the footer, in the context of a transparent disclosure. It must never lead a headline, sub-headline, or card title.

---

## 4. Phase 2 — Visual Design System

> **Timeline:** Week 3–4  
> **Owner:** Visual Design Lead  
> **Deliverable:** Figma design tokens file, component library, style guide PDF

### 4.1 Color System

The color system must accomplish three things simultaneously: feel medically credible, feel culturally warm, and pass WCAG 2.1 AA contrast ratios on mid-brightness Android screens (which are often viewed in sunlight).

**Primary palette:**

| Token Name | Hex | Usage |
|---|---|---|
| `--color-brand-primary` | `#1D9E75` | Primary CTA, active states, logo background, icon fills, link color |
| `--color-brand-dark` | `#0F6E56` | Hover states on primary brand, footer accents |
| `--color-brand-light` | `#E1F5EE` | Trust block backgrounds, card tints, section backgrounds |
| `--color-brand-mint` | `#9FE1CB` | Divider lines, secondary icon strokes |
| `--color-cta-dark` | `#1A1A2E` | Primary CTA button background (dark navy pill) |
| `--color-page-bg` | `#F7F6F2` | Page background — warm off-white, not clinical white |
| `--color-card-bg` | `#FFFFFF` | Card surfaces |
| `--color-text-primary` | `#1C1C1E` | Headlines, primary body text |
| `--color-text-secondary` | `#6B6B6B` | Body paragraphs, captions |
| `--color-text-tertiary` | `#9E9E9E` | Micro-copy, legal text, timestamps |
| `--color-border` | `#E5E3DC` | Card borders, dividers |

**What is explicitly forbidden in this color system:**

- **No red anywhere on the landing page.** Red triggers fear associations in health contexts. Error states in forms can use a muted coral (`#D9534F`) but it must never appear in hero or trust sections.
- **No bright orange.** It is associated with promotional discounts (Swiggy, Zomato) and will undermine the medical credibility of the page.
- **No gradient backgrounds on section wrappers.** Gradients feel like 2019 startup marketing. The warmth of this page comes from illustration and copy, not decorative gradients.
- **No pure white (#FFFFFF) as the page background.** Clinical white increases anxiety in health contexts. The warm off-white `#F7F6F2` is deliberate.

### 4.2 Typography System

**Font family decisions:**

The primary font must be a humanist sans-serif — warm, readable, not techy. Options in order of preference:
1. **Plus Jakarta Sans** — optimal. Excellent Latin + Devanagari pairing. Already used by several Indian fintech and health apps. Free via Google Fonts.
2. **DM Sans** — second choice. Similar warmth, excellent at small sizes.
3. **Inter** — acceptable fallback. Well-supported but slightly cold for this brand.

For Devanagari (Hindi) and other Indian scripts, the font stack must explicitly include **Noto Sans Devanagari** (Google Fonts, free), **Noto Sans Tamil**, **Noto Sans Bengali**. These are loaded conditionally based on the user's detected language preference. Never use the system font for Hindi — it renders inconsistently across Android skins (MIUI, ColorOS, OneUI each behave differently).

**Type scale:**

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `--text-hero` | 40px / 2.5rem | 700 | 1.15 | Hero headline (desktop) |
| `--text-hero-mobile` | 28px / 1.75rem | 700 | 1.2 | Hero headline (mobile) |
| `--text-h2` | 28px / 1.75rem | 600 | 1.25 | Section headlines |
| `--text-h2-mobile` | 22px / 1.375rem | 600 | 1.3 | Section headlines (mobile) |
| `--text-h3` | 20px / 1.25rem | 600 | 1.35 | Card titles, sub-section heads |
| `--text-body` | 16px / 1rem | 400 | 1.7 | All body paragraphs |
| `--text-body-sm` | 14px / 0.875rem | 400 | 1.6 | Secondary body, card captions |
| `--text-micro` | 12px / 0.75rem | 400 | 1.5 | Legal text, timestamps, badges |

**Critical rule:** 14px is the absolute minimum for any body copy or UI label on this page. The primary demographic (Priya, 38; Suresh, 58) includes presbyopic users. 12px is reserved exclusively for legal fine print and must never appear in the main content flow.

**Indian script rendering rule:** When a UI label or button is rendered in Hindi or another Indian script, the line-height must increase by 20% to accommodate the vertical extent of Devanagari matras (vowel marks above characters). This is a common Indian app bug — Devanagari text gets clipped at the top in fixed-height containers. Every button, pill, and card title must be tested in Hindi.

### 4.3 Illustration Style Guide

Illustrations are the single most powerful cultural signal on this page. They are more immediate than copy and more emotional than color. The illustration style must adhere to the following:

**Style:** Flat, warm-lined vector illustration. Think Zomato's illustration language adapted for health — friendly, specific, non-abstract. Not the generic "happy people looking at phones" stock illustration style.

**Character design rules:**
- Skin tone: Fitzpatrick Scale 4–5 (medium brown to brown). This is the most common Indian skin tone and the most underrepresented in global health app illustrations.
- Clothing: contextually specific — saree or salwar for women in home contexts, kurta or casual T-shirt for men, school uniform for children. Avoid western-default clothing (jeans and hoodies) for characters representing family/home scenarios.
- Age diversity: include at least one illustration with an elderly character (reading glasses, grey hair, slightly hunched). This signals that Arovia is designed for all ages, not just young urban professionals.
- No white coats on characters in lifestyle illustrations. White coats belong only in the credibility/doctor endorsement section.

**Scene types required:**
1. A mother checking a child's temperature at night — for the hero or use-case section
2. An elderly person consulting their phone with a family member helping — for the onboarding/trust section
3. A simple chat interface on a phone — for the demo section (used as the frame for the animated demo)
4. A family around a dining table with one person quietly using a phone — for the social proof section

**Illustration format:** SVG preferred for scalability and performance. Export as optimised SVG (under 30KB per illustration). PNG fallback for complex scenes. Never use JPEG for illustrations — compression artefacts at low bandwidth destroy the quality.

### 4.4 Iconography System

Use a single, consistent icon library throughout. **Recommendation: Phosphor Icons (MIT license, free)** or **Tabler Icons (MIT license, free)**. Both have excellent Devanagari-adjacent geometric consistency.

Icon style: Outline only. No filled icons except for active/selected states. Icon stroke weight: 1.5px at 24×24px size.

Icon size rules:
- 24×24px for inline icons next to body text
- 32×32px for feature/benefit icons in cards
- 48×48px for section-level illustrative icons

All icons must be accompanied by a visible text label. Never rely on icon-only communication on a health app — health contexts demand explicit labelling for clarity and accessibility.

---

## 5. Phase 3 — Section-by-Section UI Design (The Landing Page)

> **Timeline:** Week 4–6  
> **Owner:** UI Designer + UX Designer  
> **Deliverable:** Figma hi-fi mockups for all 8 sections, desktop + mobile variants

### 5.1 S1 — Hero Section (Above the Fold)

**Purpose:** The hero has a 3-second window to communicate three things: what Arovia is, who it's for, and that it's safe. Nothing else happens in the hero. Feature lists, pricing, and technical details belong below the fold.

**Layout (Mobile — primary design surface):**
```
┌─────────────────────────────────┐
│  हिंदी  |  தமிழ்  |  বাংলা   [top-right language selector — 12px, teal link]
│
│  [Arovia leaf logo — 52×52px rounded square, teal bg]
│
│  Apke ghar ka                    [40px, weight 700, dark navy]
│  health guide.                   [40px, weight 700, teal #1D9E75]
│
│  Simple, honest wellness         [16px, secondary gray, centered]
│  guidance for Indian families —  
│  in your language, at any hour.
│
│  ┌──────────────────────────────┐
│  │  Start my health check  →   │  [teal bg, white text, 52px height, full-width, border-radius 26px]
│  └──────────────────────────────┘
│
│  ── Trusted by 50,000+ families ──  [micro-copy divider, 11px, tertiary]
│
│  ┌──────────────────────────────┐
│  │  Already have an account?    │  [outline button, same full-width style]
│  │  Login                       │
│  └──────────────────────────────┘
│
│  🛡 DPDP-compliant   🏥 AYUSH reviewed   💬 Hindi + 7 languages
│  [12px tertiary, icon + label, centered row]
└─────────────────────────────────┘
```

**Key design decisions and their rationale:**

- **Bilingual headline:** "Apke ghar ka" is Hindi for "your home's" — using a Hindi phrase in the headline immediately signals cultural specificity to the 500M+ Hindi-speaking population. The second line "health guide" in English keeps it accessible to urban bilingual users. This is not tokenistic multilingualism — it is a primary trust signal.
- **Teal CTA instead of dark navy:** The existing design uses a dark navy pill for "Get Started." This is confident but cold. For a health companion, the primary action should be in the warm brand teal — it signals care, not commerce. Dark navy is used for secondary CTAs or footer elements.
- **Language selector in the header (not in settings):** Indian users who are not primary English speakers abandon apps within 8 seconds if they do not see their language offered. The language selector must be visible without any scrolling or navigation. It is not a settings feature — it is a first-impression signal.
- **"AYUSH reviewed" badge:** The Ministry of AYUSH (Ayurveda, Yoga, Unani, Siddha, Homeopathy) is a Government of India body that Indian users implicitly trust for health guidance. Its mention signals that Arovia's content is aligned with both modern medicine and Indian traditional health systems — a powerful combination for the Indian market.
- **Removing "TRUSTED BY 10K+ PATIENTS" from between the two CTAs:** In the existing design, this micro-copy sits awkwardly as a visual divider between two buttons. It reads like a UI pattern, not a trust signal. Social proof belongs in its own dedicated section with context, names, and cities — not squeezed between two taps.

**Desktop adaptation:** On screens above 768px, the hero layout shifts to a two-column structure: text/CTA on the left (max-width 540px), and the hero illustration (mother with child, phone in hand) on the right. The language selector moves to the top navigation bar.

### 5.2 S2 — Use-Case Scenario Cards

**Purpose:** Make the product's value concrete through recognisable Indian family health situations. Users should read a card and think "yes, that has happened to me."

**Layout:** Horizontal scroll of 4 cards on mobile (card width: 280px, padding between: 16px, left/right overflow visible to signal scrollability). Grid of 4 on desktop (2×2 or 4-in-a-row depending on screen width).

**Card anatomy:**
```
┌─────────────────────────────────┐
│  [Scene illustration — 120×100px]
│
│  Situation headline              [16px, weight 600, dark navy]
│  "Child has fever at midnight"
│
│  [Thin teal divider line — 32px wide, left-aligned]
│
│  Short description               [14px, secondary gray]
│  "Ask Arovia what to do, what
│   to watch for, and when to
│   call a doctor."
│
│  → What Arovia does              [12px, teal, tappable — expands to demo]
└─────────────────────────────────┘
```

**The four scenario cards (content):**

1. **"Child has fever at midnight"** — the most universal Indian parenting anxiety. Arovia asks about temperature, duration, other symptoms, and returns: home care steps, what to watch for, and a clear threshold ("if fever exceeds 103°F or lasts over 48 hours, visit a doctor").

2. **"Amma's knee pain after monsoon"** — addresses the elderly family member use case. "Amma" is a widely understood term for mother/grandmother across multiple Indian languages. This card directly signals to persona 3 (Suresh, 58) that Arovia understands his generation.

3. **"Pre-Diwali sugar check reminder"** — the festive season is the highest-risk period for diabetic Indians due to mithai consumption. This card signals seasonal intelligence, chronic condition awareness, and Indian cultural specificity simultaneously.

4. **"Pollution season — respiratory check"** — Delhi, Mumbai, and Bengaluru users experience severe air quality drops in winter. This is a daily anxiety for millions of users and a natural hook for Arovia's symptom-check functionality.

**Why scenarios instead of features:** Indian health app users do not respond to feature lists ("AI-powered", "symptom checker", "real-time guidance"). They respond to situations they recognise. The brain's pattern-matching response to "that happened to me last week" is a faster trust-builder than any product copy. This is not a general UX principle — it is specifically validated by Indian health consumer research from Practo and 1mg's onboarding experiments.

### 5.3 S3 — Animated Chat Demo

**Purpose:** Show exactly what the product experience looks like before asking the user to commit to anything. This is the most critical section for conversion because it removes the unknown. Fear of the unfamiliar is a primary abandonment driver for first-time health app users.

**Layout:** Centred phone frame mockup (iPhone or generic Android bezel, not branded) with a simulated chat conversation animating inside it on scroll-trigger.

**The animation sequence (auto-plays when scrolled into 40% viewport visibility):**

```
Step 1 (0ms):
User types: "मुझे सिरदर्द हो रहा है" 
[Hindi: "I have a headache"]
Typewriter animation — 40ms per character

Step 2 (1200ms pause):
Arovia typing indicator appears (3 dots)

Step 3 (1800ms):
Arovia responds: "कब से है? और क्या आपने आज पर्याप्त पानी पिया?"
[Hindi: "Since when? And did you drink enough water today?"]

Step 4 (3000ms):
User responds: "3 ghante se. Pani kam piya aaj."
[Hinglish: "For 3 hours. Drank less water today."]

Step 5 (4200ms):
Arovia responds with a card:
┌──────────────────────────────┐
│ 🌿 Try this at home          │
│ • Drink 2 glasses of water   │
│ • Rest in a cool, dark room  │
│ • Light massage on temples   │
│                              │
│ ⚠️ See a doctor if:          │
│ • Pain gets worse in 2 hours │
│ • You have a stiff neck      │
│ • Pain comes with vomiting   │
└──────────────────────────────┘
```

**Key design decisions:**

- **Hindi input in the demo:** This is not optional. Showing Hindi text in the chat demo is the single strongest signal that Arovia genuinely supports Indian languages — not as an afterthought, but as a first-class experience. A Hinglish response (mixing Hindi and English in the reply) mirrors how urban Indians actually communicate and reinforces cultural authenticity.
- **Two-part response format (Home care + When to see a doctor):** Every single AI response in the demo must include both a home care suggestion AND an escalation signal. This is the design pattern that directly addresses the primary fear ("what if I miss something serious?"). The escalation section uses a warning icon and is visually distinct — it cannot be missed even on a fast scroll.
- **No voice note feature in the demo:** The existing design has a voice note icon, which is technically interesting but visually complex and risks suggesting the app records audio. In the trust-building context of a landing page, this adds anxiety rather than delight. Voice input can be introduced as an in-app feature after trust is established.
- **Loop behaviour:** The animation loops automatically after a 3-second pause on the final state. This ensures users who enter the section mid-scroll can still see the full demonstration. Loop speed can be reduced with a "Replay" button overlay.

**Below the phone mockup:** A single line of copy: "Arovia asks the right questions. Because what you describe is as important as what you feel." This bridges the demo into the trust section that follows.

### 5.4 S4 — "We Are Not Your Doctor" Trust Block

**Purpose:** Proactively address the most common Indian health AI objection before the user has to voice it. This section should feel like the product taking a humble, honest position — which is itself a powerful trust signal.

**Background:** Mint teal (`--color-brand-light` / `#E1F5EE`) to visually separate it from the surrounding white sections and signal "this is important information, not a sales message."

**Layout:**
```
┌─────────────────────────────────────────────────┐  [mint bg section]
│
│  "Arovia is a guide, not a diagnosis."           [H2, dark navy, centred]
│
│  We tell you what to try at home, what           [16px body, centred, max-width 560px]
│  symptoms to watch for, and when to see          
│  a real doctor. We never replace the human       
│  judgement of a qualified physician.             
│
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  │  🏥           │ │  📋           │ │  📍           │
│  │  MBBS + AYUSH │ │  Evidence-    │ │  Always tells │
│  │  reviewed     │ │  labelled     │ │  you when to  │
│  │  responses    │ │  guidance     │ │  see a doctor │
│  └──────────────┘ └──────────────┘ └──────────────┘
│
│  [Doctor avatars row — 3 illustrated physician portraits, diverse]
│  "Our medical review panel"
│  Dr. Anjali Mehta, MBBS · Dr. Rajan Iyer, MD · Dr. Fatima Sheikh, BAMS
│
└─────────────────────────────────────────────────┘
```

**Why this section is the most important trust section on the page:**

Indian health consumers have a uniquely high doctor-authority culture. The family doctor (or the doctor who is a family friend) holds enormous social trust. Any product that positions itself as superior to or independent of doctors immediately loses this audience. The only successful positioning is: "We help you have better conversations with your doctor and know when to call one."

The explicit naming of MBBS and BAMS (Bachelor of Ayurvedic Medicine) credentials covers both allopathic and Ayurvedic practitioner audiences. BAMS is particularly important in Tier 2/3 cities where AYUSH practitioners are often the first point of contact.

### 5.5 S5 — Social Proof (City + Family Testimonials)

**Purpose:** Use peer voices — specifically voices from recognisably Indian contexts — to validate the emotional claims made in earlier sections.

**What makes Indian social proof different from global defaults:**

Generic testimonials ("This app is great!" — John, New York) have zero credibility in India. Indian users respond to:
1. **Geographical specificity** — a user from Indore is more believable to a user from Indore than one from Delhi
2. **Relationship context** — "I used it when my mother was ill" is more compelling than "I use it for myself"
3. **Problem-resolution story** — even a short arc: "my child had a fever, I asked Arovia, it told me to watch for these signs, and we ended up going to the doctor — and Arovia was right"
4. **Vernacular language in the quote** — a Hindi or Tamil quote with English translation reads as authentic; an English-only quote from an Indian user reads as marketing copy

**Testimonial card design:**

```
┌─────────────────────────────────────────────────┐
│  ★★★★★                                          [5 stars, teal]
│
│  "Raat ko bachche ko bukhaar tha, darr gaye the."  [14px italic, dark]
│  "Our child had fever at night, we were scared."   [12px, gray, translation]
│
│  [Illustrated avatar — Indian woman, ~35, warm]
│  Pooja Verma · Indore, MP                          [13px, weight 500]
│  Mother of two                                     [12px, tertiary]
└─────────────────────────────────────────────────┘
```

**The three testimonial archetypes to cover:**

1. **The worried parent** (Tier 2 city, mother, child health scenario) — maps to Persona 1 (Priya)
2. **The urban professional** (Metro city, 28–32, personal health management) — maps to Persona 2 (Arjun)
3. **The elderly family member or their caregiver** (Tier 1/2 city, 55+, chronic condition) — maps to Persona 3 (Suresh)

**Important note on avatar illustration style:** Do not use real user photographs unless explicit written consent and legal clearance is obtained. Use illustrated avatars with Indian facial features, skin tones, and contextually appropriate clothing. The illustration style must match the page's overall illustration system (flat, warm, Fitzpatrick 4–5 skin tones).

### 5.6 S6 — Privacy & DPDP Compliance Block

**Purpose:** Address Persona 2 (Arjun, 26, tech-literate, privacy-conscious) directly. This section is not about marketing — it is about legal transparency and data ethics, presented in plain language.

**Content structure:**
- **Headline:** "Your symptoms stay with you."
- **Sub-copy:** "Arovia stores your data in India, under the Digital Personal Data Protection Act 2023. You can delete everything, anytime."
- **Three-icon grid:**
  1. "Never sold or shared" — with a crossed-out sharing icon
  2. "Stored in India (AWS Mumbai)" — with an India map icon
  3. "Delete anytime" — with a trash icon and "full erasure in 48 hours"
- **Legal links:** "Privacy Policy · Data Request Form · Grievance Officer: [name and contact]"

**Why AWS Mumbai specifically:** Mentioning "AWS Mumbai region" rather than just "India" shows technical sophistication to Persona 2 and data sovereignty signalling to all users. It also pre-empts the "is my data going to America?" concern that is extremely common in post-Cambridge Analytica India.

**DPDP Act 2023 mention:** The Digital Personal Data Protection Act 2023 is India's primary data protection legislation. Mentioning it by name (not just "we comply with Indian data laws") signals legal seriousness. Most Indian health apps do not mention it by name on their landing pages — this is a competitive differentiation opportunity.

### 5.7 S7 — Seasonal Health Nudge (Dynamic, Nice-to-Have)

**Purpose:** Demonstrate intelligent, contextual awareness of Indian health patterns without revealing AI. This section changes based on the user's detected city (via IP geolocation, requires user permission prompt) and the current date relative to the Indian seasonal and festival calendar.

**Example dynamic content:**
- October–November (Delhi/NCR): "Smog season is here in Delhi. Ask Arovia about protecting your family's lungs."
- June–September (Pan-India): "Monsoon brings dengue and malaria risk. Arovia can help you know the warning signs."
- October–November (Pan-India): "Diwali is here — managing sugar intake during mithai season? Arovia can help."
- January–February (North India): "Cold and flu season. Arovia knows the difference between a cold and something that needs a doctor."

**Implementation note:** This is a Phase 2 feature. It requires a geolocation microservice, a city-to-season-to-condition mapping database, and legal compliance around IP-based location use under DPDP Act. In Phase 1, a static fallback message ("It's health season, always.") is acceptable.

### 5.8 S8 — Final CTA + Footer

**Purpose:** Convert users who have scrolled the full length of the page but have not yet tapped the hero CTA. These users have higher intent — they read more, which means they were evaluating more carefully. They need a final, confident, low-pressure invitation.

**Final CTA block:**
- Headline: "Ready to ask Arovia your first question?"
- Sub-copy: "No sign-up required to start. Just tell us what's bothering you."
- Primary CTA: "Start my health check" (teal, full-width on mobile)
- App store badges: Google Play + App Store, side by side, 44px height, with Indian App Store ranking if available

**Footer structure (critical legal elements for India):**
- Company name, CIN (Corporate Identification Number), registered address
- AYUSH registration number (if applicable)
- **Grievance Officer:** Name, email, and phone number — this is legally mandatory under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 for platforms with more than 50 lakh users. Include it proactively even at launch.
- WhatsApp support link (`https://wa.me/91XXXXXXXXXX`) — Indian users overwhelmingly prefer WhatsApp over email or ticketing systems for support. This is not a nice-to-have.
- Privacy Policy, Terms of Service, Cookie Policy links
- "Arovia is for wellness guidance only and does not constitute medical diagnosis or treatment." — This legal disclaimer must be in the footer of every page.

---

## 6. Phase 4 — Micro-interactions & Motion Design

> **Timeline:** Week 5–6 (parallel with Section UI Design)  
> **Owner:** Interaction Designer  
> **Deliverable:** Interaction spec document, prototype in Figma with Smart Animate, motion tokens file

### 6.1 Motion Principles

Motion on this page serves one purpose: to make the interface feel alive and responsive without adding cognitive load. Every animation must pass the "delete test" — if removing the animation makes the experience feel broken or confusing, it earns its place. If removing it makes no difference, it is cut.

**Motion tokens:**

| Token | Value | Usage |
|---|---|---|
| `--duration-fast` | 150ms | Button press feedback, icon state change |
| `--duration-standard` | 250ms | Card hover, element entrance |
| `--duration-slow` | 400ms | Section entrance, panel expansion |
| `--duration-demo` | 40ms/char | Typewriter in chat demo |
| `--easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Most transitions |
| `--easing-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering from off-screen |
| `--easing-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | CTA button hover (very subtle) |

### 6.2 Specific Interaction Specifications

**CTA Button (Primary — Teal "Start my health check"):**
- Resting state: teal background, white text, border-radius 26px
- Hover (desktop): background darkens to `--color-brand-dark` over 150ms, subtle scale(1.01) over 150ms
- Press/active (mobile + desktop): scale(0.97) over 80ms, restores over 200ms
- Ripple effect: radial teal ripple from tap point, opacity 0.3 → 0, duration 400ms (Android Material-style — familiar to Indian Android users)

**Scenario Cards (S2) — Horizontal Scroll on Mobile:**
- Cards enter with `translateY(16px) opacity(0)` → `translateY(0) opacity(1)` on scroll-trigger, staggered 80ms between cards
- On tap: card scales to 0.98, border color transitions to `--color-brand-primary` over 150ms
- Scroll indicator dots below the scroll container: active dot is teal filled, inactive is border-only

**Chat Demo (S3):**
- Scroll trigger at 40% viewport visibility — not 0% (prevents animation firing on fast scroll without the user actually seeing it)
- Typewriter: 40ms per character for user messages, 30ms per character for Arovia responses (slightly faster to feel smart)
- Typing indicator (3-dot bounce): dots animate at 400ms intervals with a `translateY(-4px)` bounce, eased
- Message bubbles slide in from left (Arovia) or right (user) with `translateX(±12px) opacity(0)` → rest position
- The remedy card (final response) expands from 0 height with `scaleY(0)` → `scaleY(1)`, origin at top

**Section Entrance Animations:**
- All sections use `Intersection Observer` at 20% threshold
- Standard entrance: `translateY(24px) opacity(0)` → `translateY(0) opacity(1)` over 400ms with `--easing-decelerate`
- Staggered children: each child element delays by 60ms from the previous

**Accessibility override:** All animations must be wrapped in `@media (prefers-reduced-motion: no-preference)`. When the user has enabled reduced motion on their device, all animations are disabled and states switch instantly. This is particularly important for Persona 3 (Suresh, 58) who may use Android's accessibility settings.

**Performance constraint:** No animations may trigger layout recalculation (no `width`, `height`, `top`, `left` transitions). Only `transform` and `opacity` are permitted in animations. This is enforced by the development team via a CSS lint rule.

---

## 7. Phase 5 — UX Copy & Localisation

> **Timeline:** Week 4–5 (parallel with UI Design)  
> **Owner:** Content Strategist + Localisation Lead  
> **Deliverable:** Copy deck for all sections in English + Hindi, localisation guide for 6 additional languages

### 7.1 Copy Voice & Tone

**The Arovia voice is:** Calm, warm, knowledgeable, unpretentious. Think of the doctor in your family who doesn't use jargon. Who asks "how are you sleeping?" before prescribing anything. Who calls back to check if you're better.

**The Arovia voice is not:** Clinical, authoritative, data-driven, startup-jargony, overly cheerful, dismissive of traditional medicine.

**Tone modifiers by section:**

- **Hero:** Warm + confident. Like a familiar greeting.
- **Scenario cards:** Empathetic + specific. Like a friend saying "I know that feeling."
- **Chat demo:** Conversational + gentle. No medical terminology.
- **Trust block:** Honest + humble. Transparency, not defensiveness.
- **Social proof:** Authentic + specific. Names, places, real situations.
- **Privacy block:** Clear + direct. Legal clarity in plain language.
- **Footer:** Formal + complete. All required legal language.

### 7.2 Hindi Copy Specifications

The Hindi copy is not a translation of the English copy. It is written natively for a Hindi-speaking audience with different cultural registers. Key principles:

- Use **colloquial Hindi**, not formal Shuddh Hindi. "Apke ghar ka" not "Aapke griha ka."
- Use **Hinglish where natural** in chat demo context. Real Hindi-speaking users code-switch constantly.
- Avoid **medical transliterations** — "diabetes" remains "diabetes" in Hindi (not "मधुमेह" which is formal and less commonly used in speech).
- **Test with native speakers**, not translation tools. Google Translate Hindi is grammatically correct but culturally flat.

### 7.3 Language Support Priority

| Language | Priority | Region Coverage | Script |
|---|---|---|---|
| English | P0 | All India | Latin |
| Hindi | P0 | North + Central India, ~530M speakers | Devanagari |
| Tamil | P1 | Tamil Nadu, Sri Lankan diaspora | Tamil |
| Bengali | P1 | West Bengal, Bangladesh diaspora | Bengali |
| Marathi | P1 | Maharashtra | Devanagari |
| Telugu | P2 | Andhra Pradesh, Telangana | Telugu |
| Gujarati | P2 | Gujarat, diaspora | Gujarati |
| Kannada | P2 | Karnataka | Kannada |

The landing page must be fully functional in P0 languages at launch. P1 languages must be complete within 60 days of launch. P2 languages are roadmap items.

### 7.4 RTL and Script-Specific Layout Considerations

- **Devanagari (Hindi, Marathi):** Characters are wider than Latin equivalents at the same font size. Allow 15% more horizontal space in buttons and labels when in Devanagari mode.
- **Tamil:** Has very high vertical ink density. Increase line-height by 20% for Tamil body text.
- **Bengali:** Similar vertical density to Devanagari. Same line-height adjustment applies.
- **No RTL languages in Phase 1** (Urdu support, if added, would require full RTL layout mirroring — this is a Phase 3 consideration).

---

## 8. Phase 6 — Mobile-First Technical Constraints

> **Timeline:** Week 6–7 (development phase starts)  
> **Owner:** Frontend Lead + UX Designer (for handoff)  
> **Deliverable:** Technical spec document, performance budget, component library in code

### 8.1 Performance Budget

Every item below is a hard limit. If any build artifact exceeds these limits, it is rejected in PR review.

| Metric | Limit | Measurement Tool |
|---|---|---|
| Total page weight (initial load) | < 800 KB | Chrome DevTools, Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s on 4G | Lighthouse, WebPageTest |
| First Input Delay (FID) | < 100ms | Chrome UX Report |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| Time to Interactive (TTI) | < 3.5s on 4G | Lighthouse |
| Image total weight | < 400 KB | Build pipeline |
| JavaScript bundle (initial) | < 120 KB | Webpack Bundle Analyzer |
| Font files | < 80 KB (woff2) | Build pipeline |

### 8.2 Asset Optimisation Rules

**Images:**
- All hero and section illustrations: SVG format, optimised with SVGO (removes unnecessary metadata, typically reduces file size by 30–50%)
- Photographs (doctor panel, if used): WebP format with AVIF fallback, max 800px wide, quality 80
- All images below the fold: `loading="lazy"` attribute mandatory
- All images must have explicit `width` and `height` attributes to prevent layout shift (CLS)

**Fonts:**
- Subset fonts to include only characters used on the page. For Latin: Basic Latin + Latin Extended A. For Devanagari: load only on language switch or if browser language is hi-IN.
- Use `font-display: swap` to prevent invisible text during font load
- Self-host font files — do not load from Google Fonts CDN at runtime (adds DNS lookup latency of 50–150ms on Indian networks)

**JavaScript:**
- Chat demo animation: vanilla JS only, no animation library. The demo is a sequence of DOM mutations with `setTimeout` — this requires no framework.
- Scroll animation (Intersection Observer): vanilla JS, no GSAP or equivalent. These libraries add 50–100KB and are not justified for the simple entrance animations on this page.
- Lazy-load all third-party scripts (analytics, chat widget, any CRM pixel) after `load` event, not `DOMContentLoaded`

### 8.3 Touch & Interaction Targets

Every interactive element on mobile must comply with these minimums. This is both a usability requirement and an accessibility requirement (WCAG 2.5.5):

- Minimum tap target size: 48×48px
- Minimum spacing between adjacent targets: 8px
- Tappable area must extend beyond visible element boundaries where necessary (use padding or pseudo-elements to extend tap area without affecting layout)

**Sticky CTA bar (mobile only):**
On mobile screens, the primary CTA "Start my health check" must be available as a sticky bottom bar from the moment the hero CTA scrolls out of view. This sticky bar appears with a subtle slide-up animation (250ms) and disappears only when the footer CTA comes into view (to avoid double CTAs). Height: 80px including safe area inset. Background: white with 0.5px top border and 8px box-shadow upward.

### 8.4 Android-Specific Rendering Considerations

- **MIUI (Xiaomi/Redmi) system WebView:** MIUI's custom WebView sometimes clips fixed/sticky elements. Test the sticky CTA bar specifically on MIUI 12 and MIUI 13.
- **ColorOS (Oppo/Realme) font scaling:** ColorOS applies aggressive system font scaling. All layout containers must use `min-height` not `height` to accommodate scaled text without overflow.
- **System dark mode:** Many Indian Android users activate system dark mode to save battery. The page must render correctly in `prefers-color-scheme: dark`. Primary changes: page background to `#1C1C1E`, card background to `#2C2C2E`, text inverts via CSS variable overrides. The teal brand color remains the same in both modes.

---

## 9. Phase 7 — Conversion & Onboarding Flow Design

> **Timeline:** Week 5–6 (parallel with UI design)  
> **Owner:** Product Designer + Growth Designer  
> **Deliverable:** Onboarding flow prototype, drop-off analysis framework

### 9.1 The Anti-Registration-First Principle

The existing design leads with "Get Started" which, in most Indian health apps, leads to a registration wall (email + password + OTP). This is the single biggest conversion drop-off point in Indian health apps. Practo reports 68% of users abandon at the email input step.

Arovia must adopt a **value-first, registration-second** model:

```
TAP CTA → LANGUAGE SELECT → FIRST MESSAGE (no gate) → RECEIVE VALUE → OPTIONAL SAVE
```

The user must receive at least one complete, useful Arovia response before any account creation is suggested. The save/register prompt appears only after value has been demonstrated.

### 9.2 Post-CTA Flow — Step by Step

**Step 1 — Language Selection (3 seconds):**
A full-screen overlay (not a modal — full screen feels less intrusive on mobile) with large, tappable language buttons. Each button shows the language name in its own script: "हिंदी", "தமிழ்", "বাংলা", "English". Buttons are 72px tall, full-width, with 8px gap between. A "Continue in English" link at the bottom for users who skip.

Design note: This step is non-skippable. The language selection has an outsized impact on all downstream communication. A user who selects Hindi and then receives English responses will abandon immediately. Getting this right at the start saves 40% of potential churn.

**Step 2 — First Symptom (Direct Chat):**
The user lands directly in a chat interface. No "enter your name," no "create account," no form. The input field is pre-focused, the keyboard is open (mobile). Above the input field, a single soft prompt: "What's bothering you or someone in your family today?" — in the user's selected language.

The chat interface shows Arovia's avatar (the leaf logo) and a single opening message: "Tell me what you're experiencing. I'll ask a few simple questions." — in the selected language.

**Step 3 — Conversation and Value Delivery:**
The RAG AI runs its symptom-checking flow. From a landing page design perspective, the only requirement is that the first response always includes both a home care suggestion and an escalation signal. The response must never be longer than 3 short paragraphs or 2 bullet lists. Brevity signals respect for the user's time and literacy level.

**Step 4 — Save History Prompt (Soft Gate):**
After the first complete response, a bottom sheet slides up: "Want to save this conversation?" with two options:
1. "Continue with WhatsApp" — links to WhatsApp OTP flow (preferred by 70%+ of Indian users)
2. "Use my phone number" — traditional OTP

No email. No password. No "Sign up with Google" (though this can be added as a third option for urban users). No Facebook login (privacy concerns are high).

The "No thanks, continue without saving" option is clearly visible and not styled as a secondary/disabled button — it is a full-opacity text link. Users who feel pressured abandon; users who feel free to say no often say yes.

### 9.3 Onboarding Personalisation Signals (Post-Registration)

Once a user has authenticated (even softly via WhatsApp), the following personalisation signals are collected over the first 3 conversations — not in a separate onboarding survey:

- **Who are you checking for?** (Inferred from chat: "my child," "my mother," "myself")
- **City/region** (Asked once, stored: "Which city are you in? This helps me give you more relevant guidance.")
- **Chronic conditions in family** (Inferred: if the user mentions "my husband's diabetes" in any message, this is tagged)

This data is used to personalise the dynamic S7 section (seasonal nudges) and the home screen of the app. It is also disclosed in the privacy policy as "contextual personalisation data."

---

## 10. Phase 8 — Accessibility & Inclusion Standards

> **Timeline:** Week 6 (parallel with development)  
> **Owner:** UX Designer + Frontend Developer  
> **Deliverable:** Accessibility audit report, WCAG 2.1 AA compliance checklist

### 10.1 WCAG 2.1 AA Compliance — Minimum Standard

| Criterion | Requirement | Arovia-Specific Note |
|---|---|---|
| 1.1.1 Non-text content | All images have alt text | Illustrations need descriptive alt (not just "illustration") |
| 1.4.3 Contrast (Minimum) | 4.5:1 for normal text, 3:1 for large | Verify teal on white (#1D9E75 on #F7F6F2 = 3.8:1 — must use darker teal for small text) |
| 1.4.4 Resize text | Text reusable up to 200% zoom without horizontal scroll | Test in Chrome with 200% browser zoom |
| 2.4.3 Focus Order | Focus sequence is logical | Tab order follows visual reading order (top-left to bottom-right) |
| 2.5.5 Target size | Minimum 44×44px | All CTAs, navigation, and card taps |
| 3.1.1 Language of page | HTML lang attribute set | Set to `lang="hi"` for Hindi version, `lang="en"` for English |
| 4.1.2 Name, Role, Value | All UI components have accessible names | All buttons have aria-label when icon-only |

### 10.2 Indian Accessibility Considerations Beyond WCAG

WCAG was designed primarily for Western contexts. The following additional considerations apply specifically to the Indian market:

- **Low literacy mode:** For users who cannot read fluently, the chat demo must have a "speak instead" option visible from the first screen. Voice input is not just a convenience feature — for a significant portion of India's 250M+ functional illiterates, it is the only viable input method.
- **Low vision support:** System font scaling must be respected. Do not override system font size with fixed `px` values on body text. Use `rem` units throughout.
- **Motor accessibility:** The sticky CTA bar at the bottom of the mobile screen is inherently accessible for users with limited hand mobility — they don't need to scroll back to the hero. This is an accessibility win, not just a conversion optimization.

---

## 11. Phase 9 — QA, Testing & Handoff Checklist

> **Timeline:** Week 7–8  
> **Owner:** QA Lead + UX Designer  
> **Deliverable:** Bug report, regression test suite, Zeplin/Figma handoff with all specs

### 11.1 Device Testing Matrix

The following devices must be physically tested (not just emulated in Chrome DevTools):

| Device | OS | Priority | Why |
|---|---|---|---|
| Redmi 9 (4GB RAM) | MIUI 13 / Android 11 | P0 | Best-selling Indian Android in 2022–23 |
| Samsung Galaxy M32 | One UI 4 / Android 12 | P0 | High market share in South India |
| Realme C35 | ColorOS 11 / Android 11 | P0 | Dominant in Tier 2/3 cities |
| iPhone SE (2022) | iOS 16 | P1 | Entry-level iPhone, common in urban markets |
| iPhone 13 | iOS 16 | P1 | Common urban Indian iPhone |
| Pixel 6a | Android 13 | P2 | Tech-savvy urban users |
| Old Samsung J-series (2GB RAM) | Android 8 | P2 | Still significant in rural Tier 3 markets |

### 11.2 Pre-Launch QA Checklist

**Visual QA:**
- [ ] All sections render correctly at 360px, 390px, 412px, 768px, 1024px, 1440px
- [ ] Hindi text does not clip in any button, card, or label
- [ ] Tamil and Bengali text renders correctly with correct line heights
- [ ] Illustrations load at correct dimensions with no distortion
- [ ] Dark mode renders all sections correctly (no white-on-white or black-on-black)
- [ ] Sticky CTA appears and disappears at correct scroll positions

**Performance QA:**
- [ ] Lighthouse score ≥ 90 (Performance) on mobile profile
- [ ] LCP < 2.5s on throttled 4G in Chrome DevTools
- [ ] No images load without explicit dimensions (CLS check)
- [ ] All below-fold images have `loading="lazy"`
- [ ] No render-blocking scripts in `<head>` (all third-party scripts deferred)

**Interaction QA:**
- [ ] Chat demo animation triggers correctly at 40% scroll threshold
- [ ] Chat demo loops after 3-second pause
- [ ] All CTA buttons provide tap feedback (scale animation) on both iOS and Android
- [ ] Horizontal scroll on Scenario Cards section is smooth on Redmi 9
- [ ] No double-tap zoom on any interactive element (caused by missing `touch-action: manipulation`)

**Accessibility QA:**
- [ ] All images have non-empty alt text
- [ ] Tab order is logical on desktop
- [ ] CTA buttons are reachable and activatable via keyboard (Enter key)
- [ ] Color contrast passes 4.5:1 for all body text (verified with Colour Contrast Analyser tool)
- [ ] Page is usable with system font size at 150% (accessibility setting test)

**Legal QA (India-specific):**
- [ ] Grievance Officer name, email, and phone number present in footer
- [ ] DPDP Act 2023 compliance statement present in Privacy Policy (linked from footer)
- [ ] "This is not a medical diagnosis" disclaimer present in footer
- [ ] Cookie consent banner present and functional (required under IT Act)
- [ ] Company CIN and registered address present in footer

---

## 12. Audit of Existing Screen — What to Keep / Change / Add

This section documents specific decisions on the uploaded design screenshot.

### Keep As-Is

| Element | Rationale |
|---|---|
| Arovia leaf logo on teal rounded-square | Teal leaf is the right visual language. Ayurvedic/nature association is strong in India. Well-executed. |
| Off-white page background (`#F2F2F0` approx.) | Warm, non-clinical. Correct psychological choice for health context. |
| Centered single-column layout | Appropriate for a wellness app. Medical authority reads better in centred, focused layouts than asymmetric editorial ones. |
| Three trust icons at bottom (Evidence labels, DPDP, Wellness not diagnosis) | Correct content. Need visual upgrade but the three chosen trust signals are exactly right. |

### Modify

| Element | Current Issue | Recommended Change |
|---|---|---|
| Headline "Everyday wellness, understood simply." | Generic. Could be any wellness app globally. No Indian specificity. | Add bilingual Hindi/English headline. "Apke ghar ka health guide." |
| Sub-copy paragraph | Good mention of "Indian families" and "traditional knowledge." Lacks language support signal and lacks the emotional hook of a specific situation. | Rewrite to mention Hindi + regional languages explicitly. Add an emotional trigger ("at 2am when your child has fever"). |
| Dark navy CTA "Get Started →" | Confident but cold. "Get Started" is app-generic — not health-specific. | Change to teal background. Change label to "Start my health check." |
| "TRUSTED BY 10K+ PATIENTS" divider | Appears between two CTAs as a visual separator. Reads as UI chrome, not a trust signal. Number is also modest. | Remove from this position. Replace with a full social proof section (S5) lower on the page with names, cities, and quotes. Update the number if > 10K. |
| "Already have an account? Login" button | Design and positioning are fine. The label is slightly clinical. | Minor copy change to "Welcome back — Login" to add warmth. |

### Add (Not Present in Existing Design)

| Element | Priority | Rationale |
|---|---|---|
| Language selector (हिंदी / தமிழ் / বাংলা) visible in header | Must | Non-negotiable for Indian market. Users who don't see their language leave in 8 seconds. |
| AYUSH reviewed credential badge | Must | Adds medical legitimacy that spans both allopathic and Ayurvedic trust systems. |
| Animated chat demo section | Must | The product is a chat interface. Users must see it before deciding to use it. |
| "We are not your doctor" trust block | Must | Directly addresses primary Indian AI health fear. |
| City-specific social proof testimonials | Should | Indian users trust peer voices from their own geography. |
| DPDP Act 2023 explicit mention | Should | Signals legal seriousness. Currently "DPDP-compliant" without context. |
| WhatsApp support link in footer | Should | India's dominant support channel preference. |
| Grievance Officer in footer | Must (Legal) | Legally required under Indian IT Rules 2021. |

---

## 13. Critical UX Copy Dos and Don'ts

### Write This

| Phrase | Why It Works |
|---|---|
| "Your family's health guide" | Positions Arovia as an ongoing companion, not a one-time diagnostic tool. "Family" is the most important unit in Indian health decision-making. |
| "Home care that actually works" | "Actually works" signals that this is not vague advice — it is specific, practical guidance. The word "actually" does a lot of work here (it implies others don't work). |
| "Ask anything, no judgment" | Addresses shame and embarrassment — a major barrier to health-seeking behaviour in India, particularly for sexual health, mental health, and addiction-adjacent questions. |
| "Know when to see a doctor" | The most reassuring statement on the page. It says: "We will not let you miss something serious." |
| "Trusted by families in 200+ cities" | Geographic breadth signals national legitimacy. "Cities" is more concrete than "users" or "people." |
| "Your symptoms stay with you" | Privacy in 5 words. Memorably specific. |

### Never Write This

| Phrase | Why It Fails |
|---|---|
| "AI-powered diagnosis" | "AI diagnosis" is the exact phrase that triggers maximum Indian user fear. Avoid entirely. |
| "Symptom checker" | Clinical, cold, transactional. Reminds users of hospital intake forms. |
| "Replace your doctor" | Even ironically or in "we don't replace your doctor" framing, the phrase puts the idea in the user's head. Use "complement" or "support" instead. |
| "Clinically proven algorithm" | Jargon that signals tech company, not health companion. "Algorithm" is particularly alienating for non-tech users. |
| "Your health data, analyzed" | "Data analyzed" is exactly what privacy-anxious users fear. Never use this construction. |
| "Medical-grade AI engine" | Medicalises and technologises simultaneously — the worst of both worlds for trust-building. |
| "Start your free trial" | "Trial" implies the product might not continue. Health trust is built on permanence, not trials. |
| "Smart health assistant" | "Smart" is overused SaaS language. "Assistant" is fine but generic. Be more specific. |

---

## 14. Priority Legend & Delivery Milestones

### Priority Definitions

| Label | Meaning | Consequence if missing at launch |
|---|---|---|
| **Must** | Launch blocker. Product is incomplete without this. | Launch delayed or product is legally/ethically non-compliant. |
| **Should** | Target for V1. Strong conversion impact. | Launch proceeds but conversion rate will be suboptimal. |
| **Nice** | V2 enhancement. Delightful but not critical. | No impact on launch. Roadmapped for 60 days post-launch. |

### Delivery Milestones

| Week | Phase | Deliverable | Owner |
|---|---|---|---|
| Week 1–2 | Phase 0 | Research synthesis, persona documents, competitive audit | UX Research |
| Week 2–3 | Phase 1 | Information architecture, content hierarchy doc, wireframes | UX Lead |
| Week 3–4 | Phase 2 | Design system (tokens, components, illustration style guide) | Visual Design |
| Week 4–6 | Phase 3 | All 8 section hi-fi mockups (mobile + desktop) | UI Designer |
| Week 4–5 | Phase 5 | Copy deck — English + Hindi for all sections | Content |
| Week 5–6 | Phase 4 | Interaction spec, motion tokens, Figma prototype | Interaction |
| Week 5–6 | Phase 7 | Onboarding flow design, post-CTA prototype | Product Designer |
| Week 6 | Phase 8 | Accessibility audit, WCAG compliance check | UX + Accessibility |
| Week 6–7 | Phase 6 | Technical spec, performance budget, component handoff | Frontend + UX |
| Week 7–8 | Phase 9 | QA across device matrix, legal checklist sign-off | QA + Legal |
| Week 8 | — | Stakeholder review + final sign-off | All leads |
| Week 9 | — | Development sprint begins | Engineering |

---

*Document version 1.0 · Arovia Design Team · Confidential*  
*Review cycle: Every sprint (2 weeks) until launch, then quarterly post-launch*  
*Owner: UX Design Lead*
