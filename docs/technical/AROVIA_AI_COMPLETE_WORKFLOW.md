# Arovia.AI - Complete Workflow Documentation

## Comprehensive Technical & Business Specification

**Version**: 3.0.0  
**Last Updated**: February 2026  
**Classification**: Internal Technical Documentation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Overview](#2-platform-overview)
3. [Technical Architecture](#3-technical-architecture)
4. [Core AI Engines](#4-core-ai-engines)
5. [Traditional Medicine Systems (AYUSH)](#5-traditional-medicine-systems-ayush)
6. [User Workflows - Patient Journey](#6-user-workflows---patient-journey)
7. [Doctor Dashboard & Provider Portal](#7-doctor-dashboard--provider-portal)
8. [Admin Dashboard & God Mode](#8-admin-dashboard--god-mode)
9. [Database Schema & Data Flow](#9-database-schema--data-flow)
10. [Security & Compliance](#10-security--compliance)
11. [Revenue Model & Monetization](#11-revenue-model--monetization)
12. [Current Implementation Status](#12-current-implementation-status)
13. [Future Roadmap & Planned Features](#13-future-roadmap--planned-features)
14. [Appendices](#14-appendices)

---

# 1. Executive Summary

## 1.1 Vision Statement

Arovia.AI is a **next-generation AI-powered healthcare platform** that uniquely bridges the gap between **modern clinical precision** and **ancient Ayurvedic wisdom**. Unlike standard symptom checkers that rely on static decision trees or keyword matching, Arovia.AI employs a sophisticated **Bayesian Probabilistic Engine** to calculate condition probabilities with clinical-grade accuracy.

**Mission**: To democratize access to high-quality, personalized healthcare that treats the individual, not just the symptom.

## 1.2 Key Differentiators

| Feature | Traditional Apps | Arovia.AI |
|---------|------------------|-----------|
| Diagnosis Logic | IF/THEN Rules | Bayesian Inference |
| Question Strategy | Static Tree | Information Gain (Akinator-style) |
| Emergency Detection | Basic Keywords | <100ms Red Flag Scanning |
| Personalization | None | Prakriti/Vikriti Constitution |
| Provider Integration | Separate Systems | End-to-End Ecosystem |

## 1.3 Platform at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        AROVIA.AI ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐             │
│  │   PATIENT  │    │   DOCTOR   │    │   ADMIN    │             │
│  │  Dashboard │────│  Dashboard │────│ Dashboard  │             │
│  └─────┬──────┘    └─────┬──────┘    └─────┬──────┘             │
│        │                 │                 │                     │
│        └────────────┬────┴────────────────┘                     │
│                     │                                            │
│              ┌──────▼──────┐                                     │
│              │  AI ENGINE  │                                     │
│              │  CORE LAYER │                                     │
│              └──────┬──────┘                                     │
│                     │                                            │
│    ┌────────────────┼────────────────┐                          │
│    │                │                │                          │
│ ┌──▼───┐      ┌─────▼─────┐   ┌─────▼─────┐                     │
│ │Diag- │      │ Prakriti  │   │ Vikriti   │                     │
│ │nosis │      │  Engine   │   │  Engine   │                     │
│ │Engine│      │(Birth Con-│   │(Current   │                     │
│ │      │      │stitution) │   │Imbalance) │                     │
│ └──────┘      └───────────┘   └───────────┘                     │
│                                                                  │
│              ┌──────────────────┐                                │
│              │    SUPABASE      │                                │
│              │   PostgreSQL     │                                │
│              │   + Row Level    │                                │
│              │    Security      │                                │
│              └──────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# 2. Platform Overview

## 2.1 Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript (Strict Mode) for type safety
- **Styling**: Tailwind CSS for responsive design
- **Animations**: Framer Motion for smooth UI transitions
- **Components**: Radix UI primitives for accessible components
- **Icons**: Lucide React icon library

### Backend & Database
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT claims
- **API Pattern**: Repository Pattern via `src/lib/api.ts`
- **Edge Functions**: Deno-based serverless functions
- **Search**: pgvector with IVFFlat indexing for semantic matching

### State Management
- React Context (`AuthContext`) for global state
- LocalStorage for offline-first symptom persistence
- Zustand stores for complex state management

## 2.2 Core Modules

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard (13 features)
│   ├── dashboard/          # Patient dashboard (14 features)
│   ├── doctor/             # Doctor portal (14 features)
│   ├── auth/               # Authentication pages
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   └── onboarding/         # User onboarding flow
├── components/             # Reusable UI components (53+)
│   ├── ui/                 # Base UI components
│   ├── layout/             # Layout components
│   └── diagnosis/          # Diagnosis-specific components
├── lib/                    # Core logic and services
│   ├── diagnosis/          # Diagnosis engine (44 modules)
│   ├── ayurveda/           # Ayurvedic engines (8 modules)
│   ├── appointments/       # Scheduling logic
│   ├── payments/           # Payment processing
│   └── validation/         # Input validation
├── hooks/                  # Custom React hooks (5+)
├── stores/                 # State management (4 stores)
└── types/                  # TypeScript type definitions
```

---

# 3. Technical Architecture

## 3.1 High-Level System Architecture

```
                    ┌─────────────────────────────────────┐
                    │           USER INTERFACE            │
                    │    (Next.js 15 + React 19 + TW)     │
                    └───────────────┬─────────────────────┘
                                    │
                    ┌───────────────▼─────────────────────┐
                    │           MIDDLEWARE LAYER          │
                    │     Authentication & Authorization   │
                    │         Rate Limiting & CORS        │
                    └───────────────┬─────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────▼───────┐         ┌─────────▼─────────┐        ┌───────▼───────┐
│   DIAGNOSIS   │         │    AYURVEDA       │        │   CLINICAL    │
│    ENGINE     │         │     ENGINES       │        │    RULES      │
│  (Bayesian)   │         │ Prakriti/Vikriti  │        │  (Wells/PERC) │
└───────┬───────┘         └─────────┬─────────┘        └───────┬───────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    │
                    ┌───────────────▼─────────────────────┐
                    │         PERSISTENCE LAYER           │
                    │    Supabase PostgreSQL + RLS        │
                    │     + Edge Functions (Deno)         │
                    └─────────────────────────────────────┘
```

## 3.2 Infrastructure Patterns

### A. API Infrastructure
- **Pattern**: Repository Pattern using `api` object in `src/lib/api.ts`
- **Latency Target**: P95 < 150ms for engine inference
- **Role-Based Access Control (RBAC)**: Implemented via Supabase JWT claims
- **Custom Hooks**: `useAuth` manages session persistence and role-specific redirection

### B. Database Relational Integrity
- **Core Relationships**:
  - `profiles` 1:N `diagnoses` (Primary health history)
  - `doctors` 1:N `appointments` (Clinical scheduling)
  - `users` 1:1 `ayurvedic_profiles` (Constitution baseline)
- **Row-Level Security (RLS)**: Enforced for HIPAA-like compliance

### C. Data Flow Pipeline

```
1. INGESTION     → Raw symptoms captured via /dashboard/consult
         │
2. STANDARDIZATION → Symptoms mapped to standardized IDs
         │
3. INFERENCE     → Parallel execution of Ayurvedic + Clinical logic
         │
4. INTEGRATION   → Ayurvedic profiles act as weights in Clinical engine
         │
5. PERSISTENCE   → Structured results stored in PostgreSQL
```

---

# 4. Core AI Engines

## 4.1 Diagnosis Engine - The Bayesian Brain

**Location**: `src/lib/diagnosis/engine.ts`

The diagnosis engine is the "brain" of Arovia.AI. It uses a **multi-stage Bayesian inference system** that mimics how an experienced clinician thinks.

### Phase 1: Intelligent Intake

The system collects structured symptom data:

| Data Point | Collection Method | Purpose |
|------------|-------------------|---------|
| Location | Clickable Body Map | Narrow condition pool |
| Intensity | 1-10 Pain Scale | Severity assessment |
| Nature | Selection (sharp, dull, burning) | Quality differentiation |
| Duration | Time picker | Acute vs chronic |
| Additional Notes | Free text | Context extraction |

### Phase 2: Emergency Detection (Red Flag Scanning)

**Speed Requirement**: <200ms  
**Actual Performance**: 0.50ms ✅

Before any diagnosis logic, the engine scans for **20+ life-threatening patterns**:

```typescript
// Emergency patterns include:
- Cardiac: heart attack, aortic dissection
- Neurological: stroke (FAST symptoms), hemorrhage
- Respiratory: severe distress, choking
- Anaphylaxis: throat swelling, allergic reaction
- Mental Health: crisis detection (988 hotline)

if (text.includes("chest") && (text.includes("sweat") || text.includes("arm"))) {
  → 🚨 CARDIAC EMERGENCY
  → STOP and display immediate action
}
```

### Phase 3: Bayesian Inference

For each of the **265 conditions** in the database, the engine calculates:

```
P(Condition | Symptoms) ∝ P(Condition) × P(Symptoms | Condition)
         ↑                       ↑                ↑
     Posterior               Prior          Likelihood
```

#### Step 1: Prior Probability (Prevalence)
```typescript
const PREVALENCE_PRIORS = {
  'very_common': 0.1,    // Common Cold
  'common': 0.05,        // Flu
  'uncommon': 0.01,      // Dengue
  'rare': 0.001,         // Meningitis
  'very_rare': 0.0001    // Rare conditions
};
```

#### Step 2: Likelihood Updates
For each symptom, probability is adjusted using:
- **Sensitivity**: If 90% of patients with condition X have Fever, and you DON'T have fever, condition X is penalized
- **Specificity**: If "Burning sensation" is unique to Acid Reflux, having it gives a massive probability boost

```typescript
// High specificity symptom present
boost = 3.0 + (specificity - 0.5) × 4.0
logProb += boost

// High sensitivity symptom absent
penalty = (sensitivity - 0.5) × 6.0
logProb -= penalty
```

#### Step 3: Location Filtering (Performance Optimization)
Instead of scoring all 265 conditions, pre-filter by body location:
```
User location: "chest"
→ Only score ~30-40 chest-related conditions
→ O(1) lookup instead of O(n)
```

### Phase 4: Information Gain Questioning (Akinator Strategy)

Like the game "Akinator," the engine calculates which question will most effectively differentiate conditions.

```
Example Scenario:
Current state:
- Migraine: 75%
- Tension Headache: 70%

Migraine has: nausea (90% sensitive)
Tension Headache does NOT have: nausea

Question: "Do you have nausea?"

If YES → Migraine: 95%, Tension: 30% ✓ Big split!
If NO  → Tension: 85%, Migraine: 40% ✓ Big split!

Information Gain: HIGH → Ask this question
```

### Phase 5: Iterative Refinement Loop

```
1. User answers question
   ↓
2. Update symptom data:
   - If "Yes" → Add to symptoms
   - If "No" → Add to excludedSymptoms
   ↓
3. Re-run Bayesian scoring with new info
   ↓
4. If top confidence ≥ 90% → Present diagnosis
5. If ambiguous (top 2 within 15%) → Ask another question
6. If plateau detected → Stop and present best guess
```

### Phase 6: Final Diagnosis Presentation

**Confidence Interpretation**:
- ≥ 80%: "Your symptoms are most consistent with..."
- 60-79%: "This could be..., though other possibilities exist"
- < 60%: "This could potentially be... but consult a doctor"

**Reasoning Trace (Explainability)**:
```typescript
Reasoning Trace:
- Prior (common): +1.2
- Location: chest: +2.0
- Symptom (Weighted): burning: +5.0 (high specificity)
- Absent High-Sensitivity: no fever: -2.4
- Type Match: burning: +2.0
→ Final Score: 87%
```

### Engine Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Emergency detection | <200ms | 0.50ms ✅ |
| Total response time | <2500ms | ~1200ms ✅ |
| Conditions in database | - | 265 |
| Synonym mappings | - | 200+ |
| Emergency patterns | - | 20+ |
| Test accuracy | >90% | 87.5% (7/8) |

---

## 4.2 Prakriti Engine - Birth Constitution Assessment

**Location**: `src/lib/ayurveda/prakriti/prakritiEngine.ts`

Prakriti is the "original nature" or genetic constitution, determined at conception. It is considered **unchangeable** throughout life.

### The Dosha System

| Dosha | Element | Characteristics | Physical Traits |
|-------|---------|-----------------|-----------------|
| **Vata** | Air + Space | Movement, creativity | Thin frame, dry skin |
| **Pitta** | Fire + Water | Transformation, intellect | Medium build, warm |
| **Kapha** | Water + Earth | Stability, endurance | Larger frame, oily skin |

### Algorithm: Weighted Confidence Scoring

#### Step 1: Raw Contribution
For every factor (body frame, skin type, metabolism, etc.):
```
C_i(Dosha) = Weight_i × Confidence_i
```

#### Step 2: Normalization
```
Score(Dosha) = (Σ C_i(Dosha) / Σ Total Raw Scores) × 100
```

#### Step 3: Classification Logic
```typescript
function determinePrakritiType(scores) {
  // Single Dosha: Dominant score ≥ 50%
  if (scores.max >= 50) return "Pure " + dominant;
  
  // Dual Dosha: Top 2 within 15%
  if ((scores.first - scores.second) <= 15) return "Dual";
  
  // Tridoshic: All within 10%
  if ((scores.first - scores.third) <= 10) return "Tridoshic";
}
```

### Assessment Quality Thresholds
- **Completeness**: Requires >90% response rate for "High Quality" status
- **Consistency Threshold**: If top 2 scores within 10%, flagged as "Ambiguous"
- **Factor Correlation**: Validates psychological vs physical profile alignment

---

## 4.3 Vikriti Engine - Dynamic Imbalance Assessment

**Location**: `src/lib/ayurveda/vikriti/vikritiEngine.ts`

Vikriti represents the "current state" of an individual's doshas. Unlike Prakriti, it is **dynamic** and reactive to external stimuli.

### Algorithm: High-Entropy Imbalance Tracking

#### Step 1: Symptom Accumulation
```
Sleep Duration < 6hrs → Vata +10
Sleep Duration > 8hrs → Kapha +10
Chronic Stress → Vata +15, Pitta +10
Acid Reflux → Pitta +20
Congestion → Kapha +15
```

#### Step 2: Seasonal Multiplier (Ritucharya)
```
Score(Dosha_provoked) = Score(Dosha_provoked) + 15
```

Seasonal Dosha Provocations:
| Season | Provoked Dosha |
|--------|----------------|
| Late Fall/Winter | Vata |
| Summer | Pitta |
| Spring | Kapha |

#### Step 3: Severity Formula
```
Deviation = |Score_max - 33.33|
Severity = min(100, Deviation × 2)
```

**Severity Scale**:
- **0-20%**: Balanced (Sama)
- **21-60%**: Moderate Imbalance
- **60-80%**: Significant Imbalance
- **>80%**: Critical Deviation (requires intervention)

---

## 4.4 Integration: How Prakriti Influences Diagnosis

The unique power of Arovia.AI is the **Ayurvedic Booster** system:

```typescript
// If user's Prakriti is Vata-dominant:
if (userPrakriti.primary === 'vata') {
  // Boost probability for Vata-related conditions
  conditions.jointPain.prior *= 1.4;
  conditions.anxiety.prior *= 1.3;
  conditions.insomnia.prior *= 1.25;
}
```

This allows for personalized diagnosis that considers:
1. Standard clinical probability
2. Individual constitution (Prakriti)
3. Current imbalance state (Vikriti)

---

# 5. Traditional Medicine Systems (AYUSH)

## 5.1 AYUSH Ecosystem Overview

**AYUSH** = Ministry of Ayurveda, Yoga & Naturopathy, Unani, Siddha, and Homeopathy

Arovia.AI integrates multiple traditional Indian medicine systems to provide truly holistic healthcare.

| System | Origin | Philosophy | Key Concept |
|--------|--------|------------|-------------|
| **Ayurveda** | Vedic India (5000 BC) | Balance of doshas | Prakriti/Vikriti |
| **Yoga** | Vedic India | Mind-body union | Asanas, Pranayama |
| **Unani** | Greco-Arabic | Four humors | Mizaj (temperament) |
| **Siddha** | Tamil Nadu | 96 Tattvas | Mukkutram (3 humors) |
| **Homeopathy** | Germany (1796) | Like cures like | Potentization |
| **Naturopathy** | Europe | Nature heals | Panchamahabhutas |

### Market Opportunity

```
AYUSH Market in India (2026):
─────────────────────────────
Ayurveda:     ₹45,000 Cr (45%)
Yoga:         ₹20,000 Cr (20%)
Homeopathy:   ₹15,000 Cr (15%)
Naturopathy:  ₹10,000 Cr (10%)
Siddha:       ₹5,000 Cr (5%)
Unani:        ₹5,000 Cr (5%)
─────────────────────────────
TOTAL:        ~₹1,00,000 Cr ($12B+)

Registered Practitioners:
• Ayurveda: 450,000+
• Homeopathy: 250,000+
• Unani: 50,000+
• Siddha: 10,000+
• Naturopathy: 5,000+
```

---

## 5.2 Ayurveda Deep Integration

### A. Enhanced Prakriti Assessment (50+ Questions)

**Current**: 15-20 questions  
**Enhanced**: 50+ questions covering all Ayurvedic factors:

```typescript
interface EnhancedPrakritiAssessment {
  // Physical Examination (Sharirik Pariksha)
  bodyFrame: 'light' | 'medium' | 'heavy';
  skinType: 'dry' | 'oily' | 'combination';
  hairType: 'dry' | 'fine' | 'thick';
  eyeCharacter: 'small' | 'medium' | 'large';
  nailCharacter: 'brittle' | 'soft' | 'thick';
  
  // Physiological (Kriyatmak Pariksha)
  digestion: 'irregular' | 'strong' | 'slow';
  appetite: 'variable' | 'sharp' | 'steady';
  thirst: 'variable' | 'excessive' | 'scarce';
  sweatPattern: 'minimal' | 'profuse' | 'moderate';
  sleepPattern: 'light' | 'moderate' | 'deep';
  bowelMovements: 'irregular' | 'loose' | 'slow';
  
  // Psychological (Mansik Pariksha)
  mentalActivity: 'quick' | 'sharp' | 'calm';
  memory: 'quick-forget' | 'sharp' | 'slow-steady';
  emotionalTendency: 'anxious' | 'irritable' | 'attached';
  decisionMaking: 'quick-change' | 'decisive' | 'slow-steady';
  stressResponse: 'worry' | 'anger' | 'withdrawal';
  
  // Preferences (Ruchi Pariksha)
  foodPreference: 'warm' | 'cold' | 'heavy';
  weatherPreference: 'warm' | 'cool' | 'moderate';
  activityLevel: 'hyperactive' | 'competitive' | 'sedentary';
}
```

### B. Ayurvedic Disease Classification

Map modern conditions to traditional Ayurvedic nosology:

| Modern Condition | Ayurvedic Name | Primary Dosha | Treatment Focus |
|-----------------|----------------|---------------|-----------------|
| Acid Reflux | Amlapitta | Pitta | Cooling herbs, diet |
| Arthritis | Sandhivata | Vata | Warm oil therapy |
| Diabetes | Prameha | Kapha | Bitter herbs, exercise |
| Migraine | Ardhavabhedaka | Vata-Pitta | Nasya, relaxation |
| Constipation | Vibandha | Vata | Triphala, oils |
| Skin Rash | Visarpa | Pitta | Blood purifiers |
| Common Cold | Pratishyaya | Kapha | Steam, ginger |
| Insomnia | Anidra | Vata | Oil massage, herbs |
| Anxiety | Chittodvega | Vata | Meditation, Brahmi |
| Depression | Vishada | Kapha-Vata | Sunlight, exercise |

### C. Comprehensive Herb Database (500+ Herbs)

```typescript
interface AyurvedicHerb {
  // Identity
  name: {
    sanskrit: string;      // e.g., "Ashwagandha"
    latin: string;         // e.g., "Withania somnifera"
    hindi: string;         // e.g., "Asgandh"
    english: string;       // e.g., "Indian Ginseng"
  };
  
  // Classification (Dravyaguna)
  rasa: ('madhura' | 'amla' | 'lavana' | 'katu' | 'tikta' | 'kashaya')[];
  guna: ('guru' | 'laghu' | 'snigdha' | 'ruksha' | 'ushna' | 'sheeta')[];
  virya: 'ushna' | 'sheeta';
  vipaka: 'madhura' | 'amla' | 'katu';
  
  // Effects
  doshaEffect: {
    vata: 'increases' | 'decreases' | 'neutral';
    pitta: 'increases' | 'decreases' | 'neutral';
    kapha: 'increases' | 'decreases' | 'neutral';
  };
  
  // Usage
  indications: string[];
  contraindications: string[];
  dosage: {
    powder: string;        // e.g., "3-6g twice daily"
    decoction: string;     // e.g., "10-20ml"
    tablet: string;        // e.g., "500mg 2x daily"
  };
  
  // Safety
  pregnancySafe: boolean;
  lactationSafe: boolean;
  childSafe: boolean;
  drugInteractions: string[];
}
```

### D. Panchakarma Guidance System

5-fold detoxification therapy recommendations:

| Therapy | Sanskrit | Indicated For | Dosha Target |
|---------|----------|---------------|--------------|
| Vamana | वमन | Kapha disorders, respiratory | Kapha |
| Virechana | विरेचन | Pitta disorders, skin, liver | Pitta |
| Basti | बस्ति | Vata disorders, joints, neuro | Vata |
| Nasya | नस्य | Head & neck, sinus, mental | All doshas |
| Raktamokshana | रक्तमोक्षण | Blood disorders, skin | Pitta |

### E. Dinacharya (Daily Routine) Engine

Personalized daily routine based on user's Prakriti:

```typescript
interface DinacharyaSchedule {
  prakriti: PrakritiType;
  season: Season;
  
  schedule: {
    wakeTime: string;           // "5:30 AM - Brahma Muhurta"
    morningRoutine: string[];   // Oil pulling, tongue scraping
    exerciseTime: string;
    exerciseType: string[];     // Based on dosha
    breakfastTime: string;
    breakfastSuggestions: string[];
    lunchTime: string;
    lunchSuggestions: string[];
    dinnerTime: string;
    dinnerSuggestions: string[];
    sleepTime: string;
    sleepRoutine: string[];
  };
  
  seasonalModifications: string[]; // Ritucharya
}
```

### F. Ritucharya (Seasonal Routine)

| Season (Ritu) | Months | Dominant Dosha | Key Recommendations |
|---------------|--------|----------------|---------------------|
| Shishira (Winter) | Jan-Feb | Kapha ↑ | Warm foods, exercise, dry massage |
| Vasanta (Spring) | Mar-Apr | Kapha ↑↑ | Light diet, fasting, honey |
| Grishma (Summer) | May-Jun | Pitta ↑ | Cool foods, sweet, rest |
| Varsha (Monsoon) | Jul-Aug | Vata ↑ | Warm, oily, sour taste |
| Sharad (Autumn) | Sep-Oct | Pitta ↑ | Sweet, bitter, light foods |
| Hemanta (Pre-Winter) | Nov-Dec | Vata ↑ | Heavy, oily, strength-building |

---

## 5.3 Yoga & Meditation System

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        YOGA & MEDITATION MODULE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│  │   CONDITION     │────▶│   YOGA ENGINE   │────▶│  PERSONALIZED   │        │
│  │   + PRAKRITI    │     │   (Matching)    │     │    PROGRAM      │        │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘        │
│                                                                              │
│                          ┌─────────────────┐                                 │
│                          │  VIDEO LIBRARY  │                                 │
│                          │  (Self-hosted + │                                 │
│                          │   YouTube CMS)  │                                 │
│                          └─────────────────┘                                 │
│                                                                              │
│  ASANA DATABASE         PRANAYAMA           MEDITATION          KRIYAS      │
│  ─────────────          ──────────          ──────────          ──────      │
│  200+ Postures          15+ Techniques      20+ Methods         10+ Types   │
│  Video Guides           Breathing Guides    Guided Audio        Cleansing   │
│  Modifications          Timer/Counter       Progress Track      Safety      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### A. Asana (Posture) Database

```typescript
interface Asana {
  name: {
    sanskrit: string;      // e.g., "Bhujangasana"
    english: string;       // e.g., "Cobra Pose"
  };
  
  category: 'standing' | 'sitting' | 'prone' | 'supine' | 'inversion' | 'twist';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;        // e.g., "30-60 seconds"
  
  // Benefits
  targetAreas: string[];   // ["spine", "shoulders", "chest"]
  benefits: string[];
  doshaEffect: {
    vata: 'calming' | 'aggravating' | 'neutral';
    pitta: 'calming' | 'aggravating' | 'neutral';
    kapha: 'calming' | 'aggravating' | 'neutral';
  };
  
  // Therapeutic
  therapeuticFor: string[]; // ["back pain", "sciatica", "depression"]
  contraindications: string[]; // ["pregnancy", "hernia"]
  
  // Media
  imageUrl: string;
  videoUrl: string;
}
```

### Condition-to-Asana Mapping

| Condition | Recommended Asanas | Avoid | Duration |
|-----------|-------------------|-------|----------|
| Back Pain | Bhujangasana, Marjaryasana, Balasana | Deep twists | 15-20 min |
| Anxiety | Shavasana, Balasana, Viparita Karani | Hot yoga | 20-30 min |
| Diabetes | Surya Namaskar, Dhanurasana | None specific | 30-45 min |
| Insomnia | Supta Baddha Konasana, Legs-up-wall | Backbends | 15 min |
| Digestion | Vajrasana, Pavanamuktasana | Inversions after eating | 10-15 min |
| Migraine | Shavasana, Balasana, Setu Bandhasana | Inversions | 15-20 min |
| Hypertension | Shavasana, Sukhasana, Padmasana | Inversions | 20-30 min |

### B. Pranayama (Breathing) System

| Technique | Sanskrit | Effect | Best For |
|-----------|----------|--------|----------|
| Nadi Shodhana | नाड़ी शोधन | Calming | Anxiety, stress, sleep |
| Kapalabhati | कपालभाति | Energizing | Obesity, digestion, clarity |
| Bhastrika | भस्त्रिका | Heating | Kapha disorders, lethargy |
| Sheetali | शीतली | Cooling | Pitta disorders, fever, anger |
| Bhramari | भ्रामरी | Calming | Insomnia, anxiety, BP |
| Ujjayi | उज्जायी | Warming | Focus, thyroid, throat |

### C. Meditation Library

| Type | Description | Duration | Best For |
|------|-------------|----------|----------|
| Trataka | Candle gazing | 10-15 min | Focus, eye health |
| Yoga Nidra | Guided relaxation | 20-45 min | Deep rest, insomnia |
| Chakra Dhyana | Energy center focus | 15-30 min | Energy balance |
| Anapanasati | Breath awareness | 10-20 min | Anxiety, stress |
| Mantra Japa | Sound repetition | 10-30 min | Mental clarity |
| Loving-Kindness | Metta meditation | 15-20 min | Emotional healing |

### D. Video Content Strategy

```
VIDEO CONTENT HIERARCHY:
═══════════════════════

Level 1: Beginner Library (50+ videos)
├── Complete Beginners Course (10 videos)
├── Chair Yoga for Office (5 videos)
├── Gentle Morning Yoga (10 videos)
├── Pre-Sleep Yoga (5 videos)
└── Basics of Pranayama (5 videos)

Level 2: Condition-Specific (100+ videos)
├── Back Pain Relief Series (10 videos)
├── Yoga for Diabetes (10 videos)
├── Stress & Anxiety Relief (15 videos)
├── Weight Management (10 videos)
└── Women's Health (15 videos)

Level 3: Dosha-Specific (30+ videos)
├── Vata Balancing Practices (10 videos)
├── Pitta Cooling Practices (10 videos)
└── Kapha Energizing Practices (10 videos)
```

---

## 5.4 Siddha Medicine Integration

### Overview

Siddha is one of the oldest medical systems, originating in Tamil Nadu. It uses the concept of **Mukkutram** (3 humors) similar to Ayurveda's doshas.

| Concept | Tamil | Equivalent |
|---------|-------|------------|
| Vatham | வாதம் | Vata (Air) |
| Pittham | பித்தம் | Pitta (Fire) |
| Kabam | கபம் | Kapha (Water) |

### A. Envagai Thervu (8-Fold Examination)

```typescript
interface SiddhaExamination {
  naadi: string;         // Pulse examination
  sparisam: string;      // Touch/palpation
  naa: string;           // Tongue examination
  niram: string;         // Color/complexion
  mozhi: string;         // Voice quality
  vizhi: string;         // Eye examination
  malam: string;         // Stool analysis
  moothiram: string;     // Urine analysis
}
```

### B. Key Siddha Formulations

| Formulation | Tamil | Uses |
|-------------|-------|------|
| Triphala Choornam | திரிபலா சூரணம் | Digestive, detox |
| Chandamarutham | சந்தாமாருதம் | Respiratory |
| Karisalai | கரிசலாங்கண்ணி | Liver, eyes |
| Linga Chenduram | லிங்க செந்தூரம் | Weakness, anemia |

### C. Varma Points (108 Vital Points)

Similar to acupressure, Siddha includes **Varma** therapy targeting vital energy points.

---

## 5.5 Naturopathy Features

### Core Philosophy
1. **Pancha Mahabhutas** - 5 elements
2. **Nature Cure** - Body heals itself
3. **Prevention** - Better than cure
4. **Holistic** - Treat the whole person
5. **Lifestyle** - Root cause treatment

### Treatment Modalities

| Category | Treatments | Applications |
|----------|------------|--------------|
| Hydrotherapy | Hip bath, spine bath, steam | Circulation, detox |
| Mud Therapy | Mud pack, mud bath | Skin, toxin removal |
| Diet Therapy | Elimination, raw food, juice | Chronic conditions |
| Fasting | Water fast, juice fast | Detoxification |
| Chromotherapy | Color therapy | Mental balance |

### Condition-Based Recommendations

| Condition | Treatments | Diet | Duration |
|-----------|------------|------|----------|
| Hypertension | Hip bath, mud pack | Low sodium, DASH | 7-14 days |
| Diabetes | Chromotherapy, fasting | Raw food, low GI | 14-21 days |
| Obesity | Steam, massage, fasting | Elimination diet | 21-30 days |
| Arthritis | Mud pack, hydrotherapy | Anti-inflammatory | 14-21 days |

---

## 5.6 Unani Medicine (Overview)

Based on Greco-Arabic medicine with **4 Humors**:

| Humor | Arabic | Element | Temperament |
|-------|--------|---------|-------------|
| Dam | دم | Air | Hot-Moist |
| Balgham | بلغم | Water | Cold-Moist |
| Safra | صفراء | Fire | Hot-Dry |
| Sauda | سوداء | Earth | Cold-Dry |

### Mizaj (Temperament) Assessment

Determines the user's constitutional temperament to personalize Unani treatments.

---

## 5.7 Homeopathy Module (Overview)

### Principle
"Like cures like" - highly diluted substances that cause symptoms in healthy people cure similar symptoms in sick people.

### Symptom-Based Remedy Suggestions

| Condition | Top Remedies | Keynotes |
|-----------|--------------|----------|
| Anxiety | Argentum Nitricum, Gelsemium | Stage fright, anticipatory |
| Insomnia | Coffea, Passiflora | Active mind |
| Migraine | Belladonna, Natrum Mur | Throbbing, sun-triggered |
| Cold/Flu | Oscillococcinum, Gelsemium | Watery eyes, body aches |
| Digestion | Nux Vomica, Lycopodium | Bloating, after overeating |

---

## 5.8 User Preference Toggle

Allow users to choose their preferred treatment approach:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REMEDY PREFERENCE TOGGLE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Choose your preferred treatment approach:                                   │
│                                                                              │
│    [●] Ayurveda & Natural     [○] Modern Medicine    [○] Both              │
│                                                                              │
│  Additional preferences:                                                     │
│  ───────────────────────                                                     │
│  [✓] Show Yoga recommendations                                               │
│  [✓] Include home remedies                                                   │
│  [✓] Display Ayurvedic herbs                                                 │
│  [ ] Include Siddha medicines                                                │
│  [ ] Show Homeopathy options                                                 │
│                                                                              │
│  Dietary restrictions:                                                       │
│  [✓] Vegetarian  [ ] Vegan  [ ] Gluten-free  [ ] Dairy-free                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5.9 Integration with Diagnosis Engine

The diagnosis result now includes traditional medicine recommendations:

```typescript
interface EnhancedDiagnosisResult {
  // Clinical diagnosis (existing)
  condition: string;
  confidence: number;
  
  // Traditional medicine extensions
  traditionalMedicine: {
    ayurveda: {
      ayurvedicName: string;
      doshaInvolved: PrakritiType[];
      herbs: AyurvedicHerb[];
      panchakarma?: PanchakarmaRecommendation;
      dietaryAdvice: string[];
    };
    
    yoga: {
      recommendedAsanas: Asana[];
      pranayamaForCondition: Pranayama[];
      meditationType: Meditation;
      avoidAsanas: string[];
    };
    
    siddha?: {
      siddhaName: string;
      formulations: SiddhaHerb[];
    };
    
    naturopathy?: {
      treatments: NaturopathyTreatment[];
      dietPlan: string[];
    };
  };
}
```

---

## 5.10 API Endpoints for Traditional Medicine

```typescript
// Ayurveda APIs
GET  /api/ayurveda/prakriti/assess     // Take assessment
GET  /api/ayurveda/vikriti/current     // Get current imbalance
GET  /api/ayurveda/herbs               // List all herbs
GET  /api/ayurveda/herbs/:id           // Herb details
GET  /api/ayurveda/dinacharya          // Daily routine
GET  /api/ayurveda/ritucharya          // Seasonal routine

// Yoga APIs
GET  /api/yoga/library                  // All content
GET  /api/yoga/asanas                   // Asana library
GET  /api/yoga/pranayama                // Breathing techniques
GET  /api/yoga/meditation               // Meditation library
GET  /api/yoga/recommend/:condition     // Condition-based
GET  /api/yoga/recommend/:dosha         // Dosha-based
POST /api/yoga/log-practice             // Track practice

// Multi-System APIs
GET  /api/remedies/:condition           // All systems remedies
GET  /api/practitioners/:system         // Find AYUSH practitioners
```

---

## 5.11 AYUSH Practitioner Network

```typescript
interface AYUSHPractitioner {
  systems: ('ayurveda' | 'yoga' | 'siddha' | 'naturopathy' | 'unani' | 'homeopathy')[];
  qualifications: {
    degree: string;        // "BAMS", "BNYS", "BHMS"
    registrationNumber: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
  }[];
  
  specializations: string[]; // ["Panchakarma", "Yoga Therapy"]
  
  consultationModes: ('video' | 'audio' | 'in-person')[];
  fees: {
    video: number;
    inPerson: number;
  };
  
  rating: number;
  reviewCount: number;
}
```

---

## 5.12 Compliance & Safety for Traditional Medicine

| System | Regulatory Body | License Required |
|--------|-----------------|------------------|
| Ayurveda | CCRAS, State AYUSH | BAMS, MD (Ayu) |
| Yoga | None specific | Certified Instructor |
| Siddha | CCRAS, Tamil Nadu | BSMS |
| Naturopathy | CCRN | BNYS |
| Unani | CCRUM | BUMS |
| Homeopathy | CCH | BHMS |

### Safety Protocols
- ⚠️ Always display disclaimer: "Not a substitute for professional medical advice"
- ⚠️ Check contraindications before herb recommendations
- ⚠️ Verify pregnancy/lactation status
- ⚠️ Cross-check with current medications
- ⚠️ Emergency bypass: Traditional medicine NEVER bypasses emergency detection

---

# 6. User Workflows - Patient Journey

## 6.1 Complete Patient Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PATIENT JOURNEY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────┐   ┌────────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐ │
│   │  START  │──▶│   SIGNUP   │──▶│ONBOARDING│──▶│DASHBOARD │──▶│ CONSULT │ │
│   └─────────┘   └────────────┘   └──────────┘   └──────────┘   └────┬────┘ │
│                                                                      │      │
│   ┌─────────────────────────────────────────────────────────────────┘      │
│   │                                                                         │
│   ▼                                                                         │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│   │ AI       │──▶│ DIAGNOSIS │──▶│ REMEDIES │──▶│ BOOK     │               │
│   │ INTERVIEW│   │ RESULT   │   │ & ADVICE │   │ DOCTOR   │               │
│   └──────────┘   └──────────┘   └──────────┘   └──────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6.2 Signup & Authentication

### Supported Methods
- **Email/Password**: Traditional signup with email verification
- **Google OAuth**: One-click social login
- **Magic Link**: Passwordless email authentication

### Security Measures
- Rate limiting: 100 requests/minute per IP
- Input validation using Zod schemas
- CSRF protection
- Session management via Supabase Auth

```typescript
// Authentication Flow
1. User enters credentials
2. Supabase Auth validates
3. JWT token generated with role claims
4. Client stores token securely
5. Middleware validates on each request
```

## 6.3 Onboarding - Prakriti Assessment

The onboarding process collects essential health data:

### Step 1: Basic Information
- Full name
- Date of birth
- Gender
- Location (for epidemic tracking)

### Step 2: Physical Metrics
- Height and weight (BMI calculation)
- Blood type (if known)
- Existing conditions
- Current medications

### Step 3: Prakriti Questionnaire
A comprehensive 15-20 question assessment covering:
- Body frame and structure
- Skin type and temperature
- Digestive patterns
- Sleep quality and patterns
- Emotional tendencies
- Mental characteristics
- Energy levels

### Step 4: Profile Generation
```typescript
const prakritiResult = assessPrakriti(answers);
// Output:
{
  primaryDosha: 'vata',
  secondaryDosha: 'pitta',
  scores: { vata: 45, pitta: 35, kapha: 20 },
  confidence: 0.85,
  characteristics: ['creative', 'quick-thinking', 'light frame'],
  recommendations: ['warm foods', 'regular routine', 'oil massage']
}
```

## 6.4 Patient Dashboard Features

### A. Health Overview
- **Vikriti Tracking**: Dynamic dosha bar showing current imbalance
- **Health Score**: Composite wellness metric (0-100)
- **Recent Diagnoses**: Quick access to past consultations
- **Upcoming Appointments**: Calendar integration

### B. AI Consultation Interface
- **Symptom Intake Card**: Structured symptom collection
- **Interactive Body Map**: Click-to-select pain location
- **Smart Chat**: Conversational AI interview
- **Real-time Suggestions**: Adaptive questioning

### C. Health History
- **Timeline View**: Chronological health events
- **Diagnosis Archive**: All past AI assessments
- **Trend Analysis**: Symptom frequency patterns
- **Export Function**: PDF health reports

### D. Family Profiles (Premium)
- Add family members under one account
- Separate health histories
- Shared appointment management
- Parental controls for children's profiles

## 6.5 Diagnosis Session Flow

### Step 1: Symptom Intake
```
User Input Interface:
┌─────────────────────────────────────┐
│ Where does it hurt?                 │
│ [____Interactive Body Map____]      │
│                                     │
│ Pain Intensity: [■■■■■□□□□□] 5/10  │
│                                     │
│ Pain Type:                          │
│ ○ Sharp  ● Dull  ○ Burning         │
│                                     │
│ Duration: [Today ▼]                 │
│                                     │
│ Additional notes:                   │
│ [_____________________________]    │
│                                     │
│ [       Start Diagnosis      ]     │
└─────────────────────────────────────┘
```

### Step 2: AI Interview
The AI asks strategic follow-up questions:
- Max 5-7 questions (user fatigue prevention)
- Each question selected for maximum information gain
- Multiple choice or yes/no format
- "I don't know" option always available

### Step 3: Diagnosis Results
```
┌─────────────────────────────────────────────────────────────────────┐
│                    DIAGNOSIS RESULTS                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Most Likely: ACID REFLUX (GERD)                                    │
│  Confidence: ████████████░░░░░░░░ 87%                               │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  Other Possibilities:                                                │
│  • Gastritis (42%)                                                   │
│  • Peptic Ulcer (18%)                                                │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  Why this diagnosis?                                                 │
│  ✓ Burning sensation matches (high specificity)                     │
│  ✓ Worse after eating (classic trigger)                             │
│  ✓ Location: upper chest/stomach                                     │
│  ✗ No cardiac red flags detected                                     │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  📋 VIEW REMEDIES    📅 BOOK DOCTOR    📄 SAVE REPORT              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 4: Holistic Remedies
For each diagnosis, Arovia provides multi-modal treatment suggestions:

| Category | Example (for Acid Reflux) |
|----------|---------------------------|
| **Medical Advice** | OTC antacids, H2 blockers |
| **Home Remedies** | Cold milk, fennel seeds |
| **Ayurvedic** | Avipattikar Churna, Pitta-pacifying diet |
| **Lifestyle** | Elevate head while sleeping, avoid late meals |
| **Yoga/Exercise** | Vajrasana after meals, avoid inversions |

## 6.6 Appointment Booking

### Find Specialist Flow
1. **Smart Matching**: AI suggests specialists based on diagnosis
2. **Filters**: 
   - Specialty (General, Ayurveda, Cardiology, etc.)
   - Location (within X km)
   - Availability (today, this week)
   - Price range
   - Rating
3. **Doctor Profiles**:
   - Verified credentials
   - Patient reviews
   - Experience & specializations
   - Consultation fees

### Booking Process
```
1. Select doctor → View available slots
2. Choose date/time → Confirm slot
3. Payment → Escrow system holds funds
4. Pre-consult → AI summary sent to doctor
5. Consultation → Video call + AI-assisted
6. Post-consult → Notes, prescription, follow-up
```

---

# 7. Doctor Dashboard & Provider Portal

## 7.1 Dashboard Architecture

**Philosophy**: "AI as Copilot, Not Autopilot"

The dashboard never overrides the doctor; it augments them with data.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DOCTOR DASHBOARD LAYOUT                               │
├───────────────┬─────────────────────────────────────────────────────────┤
│               │                                                          │
│   SIDEBAR     │                 MAIN WORKSPACE                          │
│   ─────────   │                                                          │
│   My Schedule │  ┌────────────────────────────────────────────────────┐ │
│   Patient List│  │  TODAY'S OVERVIEW                                  │ │
│   Inbox       │  │  • 8 appointments scheduled                        │ │
│   Analytics   │  │  • 2 urgent follow-ups                             │ │
│   Settings    │  │  • Revenue: ₹12,450 today                          │ │
│               │  └────────────────────────────────────────────────────┘ │
│               │                                                          │
│               │  ┌────────────────────────────────────────────────────┐ │
│               │  │  NEXT PATIENT                                       │ │
│               │  │  Rahul M. | 10:30 AM | Migraine (AI: 92%)          │ │
│               │  │  [View AI Summary] [Start Consultation]            │ │
│               │  └────────────────────────────────────────────────────┘ │
│               │                                                          │
└───────────────┴─────────────────────────────────────────────────────────┘
```

## 7.2 Core Features

### A. AI-Assisted Patient Handoff

Before each consultation, doctor receives:
```typescript
PatientContext = {
  chiefComplaint: "Severe headache, left side",
  aiProvisionalDiagnosis: "Migraine (Confidence: 92%)",
  vikriti: "High Pitta (Heat) detected",
  redFlags: ["No neurological deficits reported"],
  relevantHistory: ["Previous migraines 3x/month"],
  currentMedications: ["Ibuprofen PRN"]
}
```

**Benefit**: Doctor doesn't ask "What brings you here?" but "I see you're having migraines again, is this episode similar to last month?"

### B. Active Consultation View

Split-screen layout during video call:

| Left Panel (60%) | Right Panel (40%) |
|------------------|-------------------|
| HD Video Feed | Tab 1: AI Summary |
| Chat overlay | Tab 2: Smart SOAP Note |
| Screen share | Tab 3: Patient History |
| | Tab 4: Ayurvedic Profile |

### C. Smart SOAP Notes

AI-assisted clinical documentation:
```
┌─────────────────────────────────────────────────────────────────────┐
│  SOAP NOTE - Auto-Generated                           [Edit] [Save] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SUBJECTIVE (Auto-transcribed):                                      │
│  "Patient reports throbbing headache on left side for 2 days.       │
│   Accompanied by nausea and light sensitivity. Triggered by         │
│   stress at work."                                                   │
│                                                                      │
│  OBJECTIVE:                                                          │
│  [ ] BP: ___/___  [ ] Temp: ___°F  [x] Alert, oriented x3          │
│                                                                      │
│  ASSESSMENT:                                                         │
│  Primary: Migraine without aura (ICD-10: G43.009)  [Auto-suggested] │
│                                                                      │
│  PLAN:                                                               │
│  [ ] Sumatriptan 50mg PRN                                            │
│  [ ] Lifestyle modifications                                         │
│  [ ] Follow-up in 2 weeks                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### D. Revenue & Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRACTICE ANALYTICS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  THIS MONTH                         PATIENT OUTCOMES                 │
│  ════════════                       ════════════════                 │
│  Consultations: 142                 Satisfaction: 4.8/5              │
│  Gross Revenue: ₹85,200             Follow-up Rate: 23%              │
│  Net Earnings: ₹68,160              Referral Rate: 15%               │
│  Commission: 20%                    Average Session: 18 min          │
│                                                                      │
│  ───────────────────────────────────────────────────────────────    │
│                                                                      │
│        Revenue Trend (6 months)                                      │
│  ₹100k│                     ╱─╲                                      │
│       │               ╱─╲  ╱   ╲                                     │
│   50k │         ╱─╲  ╱   ╲╱                                          │
│       │    ╱─╲  │                                                    │
│     0 │────────────────────────                                      │
│        Jul Aug Sep Oct Nov Dec                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 7.3 Advanced Clinical Tools

### A. Differential Diagnosis Explorer ("The Sandbox")
Interactive tool for hypothesis testing:
- Toggle symptoms on/off
- See real-time probability shifts
- Validate gut feelings against statistical data

### B. Integrated Referral Network
- One-click handoff to specialists
- Automatic context transfer
- Cross-specialty care coordination

### C. Patient Education Hub
- 500+ verified health content (PDFs, videos)
- "Prescribe Content" feature
- Tracking: Did patient view the material?

### D. Smart Schedule Optimizer
- AI triage for urgent cases
- Automatic gap filling from waitlist
- Similar case grouping

## 7.4 Compliance Features

### Session Recording & Transcription
- All video consultations automatically recorded
- Encrypted S3 storage (HIPAA compliant)
- Auto-transcription post-call
- Purpose: Legal defense, QA, dispute resolution

### Anti-Leakage Detection
Real-time monitoring for platform bypass attempts:
- Keyword detection: "Venmo", "Paytm", "Call me directly"
- Phone number/email pattern matching
- Warning pop-ups for ToS violations
- Strike system for repeat offenders

---

# 8. Admin Dashboard & God Mode

## 8.1 Overview

The Admin Dashboard is the "Control Tower" for Arovia.AI operations. It provides oversight on:
- Users & Doctors
- Finances & Transactions
- Clinical Quality
- Platform Integrity
- Epidemic Intelligence

## 8.2 Core Modules

### A. "The Pulse" (Home Screen)

**Live Metrics**:
- Active users / Active consultations
- Today's GMV (Gross Merchandise Value)
- Net Revenue (Commission)
- System uptime, AI Engine latency (P99)

**Urgent Action Queue**:
- "3 Suspicious Consultations labeled 'High Risk'"
- "5 New Doctor Applications pending verification"

### B. User & Provider Management

**Doctor Verification Portal**:
- View uploaded licenses/certificates
- Background check status
- Actions: `Approve`, `Reject (with reason)`, `Request More Info`

**User Support Console**:
- Search by Email/ID
- View activity logs
- **Impersonation Mode**: Read-only "login as user" for debugging

### C. Financial & Marketplace Operations

**Transaction Ledger**:
- Real-time feed of all payments
- Status: `Held`, `Released to Doctor`, `Refunded`

**Commission Manager**:
- Global Platform Fee (default: 20%)
- Custom overrides for top-tier doctors

**Payouts**:
- Weekly automated settlement approval

## 8.3 Compliance Command Center

### "Flagged Sessions" Queue

Filters:
- Leakage Detected
- Abusive Language
- Medical Malpractice Risk

Review Interface:
- Exact transcript snippet of trigger
- Audio clip playback
- Actions: `Dismiss` or `Confirm Violation`

### Ban Hammer
One-click account suspension with audit trail.

## 8.4 Clinical Quality Assurance (RLHF Loop)

### "Vignette" Manager
- Upload "Golden Set" medical cases
- Test AI accuracy against known answers

### AI vs Human Analysis
- Track disagreement rate
- Alerts: "AI diagnosed 'Flu' but Doctor diagnosed 'Pneumonia'"
- Triggers review of AI weights

## 8.5 Epidemic Intelligence (Bio-Surveillance)

### Real-Time Heatmap

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EPIDEMIC INTELLIGENCE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  INDIA MAP                           METRICS                         │
│  ─────────                           ───────                         │
│                                      National Risk: MEDIUM           │
│     [Heatmap                         Active Clusters: 3              │
│      showing                         Affected Pop: ~45,000           │
│      symptom                                                         │
│      clusters                        TOP ALERTS:                     │
│      by state]                       🔴 Fever spike in Mumbai        │
│                                      🟠 Respiratory in Delhi          │
│                                      🟡 Dengue in Chennai             │
│                                                                      │
│  ───────────────────────────────────────────────────────────────    │
│                                                                      │
│  INSIGHT: "200% spike in fever searches in Zone 4"                   │
│  ACTION: [Alert WHO] [Notify Hospitals] [Export Data]               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Value Proposition**:
- Early warning system for disease outbreaks
- Sellable to Government, WHO, Insurance companies
- Pattern detection before hospital reports

## 8.6 System Configuration

### Feature Flag Configurator

**Global Kill-Switches**:
- Disable 'Ayurvedic Mode' globally (regulatory compliance)
- Maintenance Mode for specific regions

**A/B Testing Control**:
- Roll out new features to X% of users
- Compare performance metrics

### Access Control Levels

| Role | Access |
|------|--------|
| Super Admin | Full access |
| Support Agent | Read-only User Management, no Financials |
| Medical Director | Clinical QA only, no Financials |
| Data Analyst | Anonymized analytics only |

---

# 9. Database Schema & Data Flow

## 9.1 Core Tables

```sql
-- User profile (extends Supabase auth.users)
TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  full_name TEXT,
  role TEXT CHECK (role IN ('patient', 'doctor', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ayurvedic constitution
TABLE ayurvedic_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  prakriti_type TEXT,
  prakriti_scores JSONB,
  vikriti_current JSONB,
  assessment_date TIMESTAMP
);

-- Doctor profiles
TABLE doctors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  specialty TEXT[],
  verified BOOLEAN DEFAULT FALSE,
  availability JSONB,
  consultation_fee DECIMAL,
  rating DECIMAL
);

-- Diagnosis sessions
TABLE diagnoses (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES profiles,
  symptoms JSONB,
  results JSONB,
  confidence_score DECIMAL,
  reasoning_trace JSONB,
  created_at TIMESTAMP
);

-- Appointments
TABLE appointments (
  id UUID PRIMARY KEY,
  doctor_id UUID REFERENCES doctors,
  patient_id UUID REFERENCES profiles,
  diagnosis_ref_id UUID REFERENCES diagnoses,
  status TEXT,
  starts_at TIMESTAMP,
  payment_status TEXT
);

-- Clinical notes (encrypted)
TABLE clinical_notes (
  id UUID PRIMARY KEY,
  appointment_id UUID REFERENCES appointments,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  encrypted_data TEXT
);

-- Payments & Transactions
TABLE transactions (
  id UUID PRIMARY KEY,
  appointment_id UUID REFERENCES appointments,
  amount DECIMAL,
  platform_fee DECIMAL,
  doctor_payout DECIMAL,
  status TEXT,
  created_at TIMESTAMP
);
```

## 9.2 Row-Level Security (RLS) Policies

```sql
-- Patients can only see their own data
CREATE POLICY "patients_own_data" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Doctors can see patients with active appointments
CREATE POLICY "doctor_patient_access" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid())
      AND appointments.patient_id = profiles.id
      AND appointments.status IN ('scheduled', 'in_progress', 'completed')
    )
  );

-- Admins have full access
CREATE POLICY "admin_full_access" ON profiles
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

## 9.3 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USER INPUT                                                                 │
│       │                                                                      │
│       ▼                                                                      │
│   ┌───────────────┐     ┌───────────────┐     ┌───────────────┐            │
│   │   Frontend    │────▶│  Validation   │────▶│  Sanitization │            │
│   │   (Next.js)   │     │    (Zod)      │     │  (XSS/SQL)    │            │
│   └───────────────┘     └───────────────┘     └───────────────┘            │
│                                                       │                      │
│                                                       ▼                      │
│                                               ┌───────────────┐              │
│                                               │   Middleware  │              │
│                                               │    (Auth)     │              │
│                                               └───────┬───────┘              │
│                                                       │                      │
│               ┌───────────────────────────────────────┼─────────┐            │
│               │                                       │         │            │
│               ▼                                       ▼         ▼            │
│       ┌───────────────┐               ┌───────────────┐ ┌───────────────┐   │
│       │   Diagnosis   │               │   Appointment │ │    Profile    │   │
│       │    Engine     │               │    Service    │ │    Service    │   │
│       └───────┬───────┘               └───────┬───────┘ └───────┬───────┘   │
│               │                               │                 │            │
│               └───────────────────────────────┼─────────────────┘            │
│                                               │                              │
│                                               ▼                              │
│                                       ┌───────────────┐                      │
│                                       │   Supabase    │                      │
│                                       │  PostgreSQL   │                      │
│                                       │    + RLS      │                      │
│                                       └───────────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 10. Security & Compliance

## 10.1 Security Architecture

Arovia.AI implements a **defense-in-depth** security model following OWASP best practices.

### Rate Limiting

| Layer | Limit | Purpose |
|-------|-------|---------|
| Backend (FastAPI) | 100 req/min/IP | DoS prevention |
| File Upload | 20 uploads/min/IP | Storage abuse |
| Frontend | 500ms debounce | UX + protection |

### Input Validation & Sanitization

All user inputs validated using Zod schemas:
- Length limits on all fields
- Type checking (string, number, email)
- Format validation
- Enum validation for dropdowns
- HTML/script tag removal (XSS)
- SQL injection pattern detection
- Null byte filtering

### File Upload Security
- Max size: 10MB
- MIME type whitelist
- Extension validation
- Filename sanitization (path traversal protection)
- Virus scanning ready (extensible)

## 10.2 OWASP Top 10 Mitigations

| Risk | Mitigation |
|------|------------|
| A01: Broken Access Control | Supabase RLS + Auth |
| A02: Cryptographic Failures | HTTPS, hashed passwords |
| A03: Injection | Zod validation, sanitization |
| A04: Insecure Design | Secure-by-default architecture |
| A05: Security Misconfiguration | Environment-based config |
| A06: Vulnerable Components | Regular dependency updates |
| A07: Authentication Failures | Rate limiting, password policies |
| A08: Data Integrity Failures | Input validation, CSRF tokens |
| A09: Logging Failures | Comprehensive error logging |
| A10: SSRF | URL sanitization |

## 10.3 Compliance Standards

### HIPAA Readiness
- PHI encrypted at rest and in transit
- Audit logging of all data access
- Role-based access control
- Data minimization practices

### GDPR Compliance
- Right to erasure implementation
- Data portability exports
- Consent management
- Privacy by design

### Future: FDA Class II Requirements
- Audit logging ✅
- Version control ✅
- Clinical validation study ❌ (planned)
- Risk analysis (FMEA) ❌ (planned)
- Quality management (ISO 13485) ❌ (planned)

## 10.4 Incident Response

### API Key Compromise Protocol
1. Immediately rotate all affected keys
2. Review logs for unauthorized access
3. Check database for data breach
4. Notify users if personal data affected
5. Document incident for prevention

### DoS Attack Response
1. Verify rate limiting is active
2. Block abusive IPs at firewall
3. Contact hosting provider for DDoS mitigation
4. Review attack patterns

---

# 11. Revenue Model & Monetization

## 11.1 Three-Pillar Revenue Strategy

### Pillar 1: Direct-to-Consumer (DTC) - "The Hook"

#### A. Marketplace Commission
- **Model**: 20% flat fee on consultation bookings
- **Mechanism**: Patient pays Arovia → Consult happens → 80% to Doctor

#### B. Contextual Commerce ("Ayurvedic Amazon")
- Products recommended inside diagnosis report
- Revenue: 15-20% affiliate commission
- Future: 60%+ margins on private label products

#### C. "Arovia Plus" Subscription ($5/month)
Features:
- Unlimited deep scans (full Bayesian analysis)
- Family profiles (up to 5 members)
- PDF health reports
- Priority doctor booking

### Pillar 2: Provider Solutions (B2B) - "The SaaS"

#### A. "Arovia Pro" Workspace ($50/month)
- AI Scribe (auto-generated SOAP notes)
- Patient Analytics
- Advanced scheduling
- Telemedicine suite

#### B. Featured Listings (Sponsored Search)
- Cost-per-click or monthly ad fee
- Labeled as "Sponsored" (legal requirement)

### Pillar 3: Data & Enterprise - "The Long Tail"

#### A. Clinical Trial Recruitment
- Match patients to pharma trials
- Revenue: $500-$2000 per successful recruit
- Consent-based opt-in system

#### B. Epidemic Intelligence
- Sell anonymized bio-surveillance data
- Customers: Government, WHO, Insurance
- API access for data partners

## 11.2 Revenue Projections

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REVENUE MODEL PROJECTIONS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  YEAR 1               YEAR 2               YEAR 3                           │
│  ──────               ──────               ──────                           │
│                                                                              │
│  Consultations        Consultations        Consultations                    │
│  5,000 @ ₹500        50,000 @ ₹500        200,000 @ ₹500                   │
│  Commission (20%)    Commission (20%)     Commission (20%)                  │
│  = ₹5,00,000         = ₹50,00,000         = ₹2,00,00,000                   │
│                                                                              │
│  Subscriptions       Subscriptions        Subscriptions                     │
│  1,000 users         10,000 users         50,000 users                      │
│  = ₹60,000/mo        = ₹6,00,000/mo       = ₹30,00,000/mo                  │
│                                                                              │
│  Doctor SaaS         Doctor SaaS          Doctor SaaS                       │
│  50 doctors          500 doctors          2,000 doctors                     │
│  = ₹2,50,000/mo      = ₹25,00,000/mo      = ₹1,00,00,000/mo                │
│                                                                              │
│  TOTAL (Annual):     TOTAL (Annual):      TOTAL (Annual):                   │
│  ~₹43 Lakhs          ~₹4.2 Cr             ~₹18 Cr                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 12. Current Implementation Status

## 12.1 Completed Features ✅

### Patient Dashboard
- [x] User authentication (Email, Google, Magic Link)
- [x] Onboarding flow with Prakriti assessment
- [x] Basic health dashboard
- [x] AI diagnosis interface
- [x] Symptom intake with body map
- [x] Diagnosis results with confidence scores
- [x] Health history timeline
- [x] Family profile management

### Doctor Dashboard
- [x] Doctor registration & verification
- [x] Schedule management
- [x] Patient inbox
- [x] Basic consultation view
- [x] Appointment management
- [x] Revenue tracking

### Admin Dashboard
- [x] User management
- [x] Doctor verification portal
- [x] Transaction ledger
- [x] Epidemic heatmap (basic)
- [x] Flagged sessions queue

### Core Engines
- [x] Diagnosis engine (Bayesian inference)
- [x] 265 conditions database
- [x] Emergency detection (<1ms)
- [x] Prakriti engine
- [x] Vikriti calculation
- [x] Information gain questioning

## 12.2 In Progress 🟡

- [ ] Clinical decision rules (Wells, PERC, HEART)
- [ ] Uncertainty quantification
- [ ] Symptom correlation detection
- [ ] Care pathway generation
- [ ] Real-time video consultation
- [ ] Payment gateway integration

## 12.3 Planned 🔴

- [ ] AI Scribe (auto-transcription)
- [ ] Full Bayesian Network with MCMC
- [ ] Wearable data integration
- [ ] Mobile app (React Native)
- [ ] Clinical validation study
- [ ] FDA 510(k) clearance

---

# 13. Future Roadmap & Planned Features

## 13.1 Phase 1: "Trust & Hook" (Weeks 1-4)

**Goal**: A working product that feels magical and safe.

### 1. Knowledge Base Upgrade
- Expand disease database to 500+ conditions
- Add sensitivity/specificity data from medical literature
- Cover 95% of common ER/GP complaints

### 2. Safety Layer Enhancement
- Implement deterministic "Red Flag" rules
- Add NEXUS, Ottawa, and Wells criteria
- Zero tolerance for missed emergencies

### 3. Retention Hook (Vikriti Dashboard)
- Real-time "Dosha Bar" visualization
- Symptom-to-dosha mapping
- Personalized daily recommendations

## 13.2 Phase 2: "Revenue Vision" (Weeks 5-6)

**Goal**: Demonstrate business model viably.

### 1. Doctor Marketplace Frontend
- Complete specialist search UI
- Profile pages with reviews
- Mock booking flow

### 2. Contextual Commerce
- Product recommendations in diagnosis
- Affiliate integration
- Shopping cart functionality

## 13.3 Phase 3: Deep Tech & Scale (Post-Funding)

### 1. Advanced Bayesian Engine
- Full Bayesian Network implementation
- Conditional dependency handling
- MCMC sampling for complex cases

### 2. RLHF (Reinforcement Learning from Human Feedback)
- Doctor grading interface
- Continuous model improvement
- Accuracy tracking dashboard

### 3. Live Marketplace Backend
- Real payment processing (Stripe/Razorpay)
- Calendar syncing (Google, Outlook)
- Automated settlements

## 13.4 Phase 4: Production Infrastructure (Month 3)

### 1. Care Pathway Generation
For each diagnosis, provide:
- Urgency level
- Next steps with timeline
- Red flags to escalate
- When to follow up

### 2. Monitoring & Alerting
- Emergency detection SLA
- Accuracy degradation alerts
- High uncertainty rate tracking

### 3. Precomputation & Caching
- Redis cache for common symptoms
- Bloom filter for cache checks
- Precompute top 100 symptom sets

## 13.5 Phase 5: Ayurvedic & Yoga Pivot

**Goal**: Become the world's most sophisticated Ayurvedic diagnostic platform.

### 1. Dosha-First Diagnostics
- Align AI to prioritize Ayurvedic assessments
- Map modern conditions to Ayurvedic classifications
- Jvara, Arshas, Atisara categorization

### 2. Hybrid Remedy Selector
- User toggle: Ayurvedic vs Allopathic
- Dual-view remedy display
- Personalized based on Prakriti

### 3. Comprehensive Ayurvedic Repository
- Dinacharya (daily routines)
- Ritucharya (seasonal routines)
- Panchakarma guidance
- Herb-condition mappings

### 4. Yoga Integration
- Map asanas to conditions
- Pranayama for specific doshas
- Meditation practices
- Integrated video platform

### 5. Video Content
- Self-hosted yoga videos
- YouTube integration
- Smart recommendations based on Vikriti

## 13.6 Phase 6: Clinical Validation (Month 4+)

### 1. Dataset Validation
Test against:
- NIH clinical case studies
- Published case reports
- Synthetic patient scenarios
- Anonymized EMR data

**Target**: >95% accuracy on validated datasets

### 2. Calibration Analysis
Ensure "80% confident" = "80% correct"

### 3. Safety Testing
- All emergency patterns vs real cases
- False negative rate for life-threatening conditions
- Adversarial testing (edge cases)

## 13.7 Long-Term Vision

### Wearable Integration
- Apple Health / Google Fit data ingestion
- Continuous Vikriti inputs
- Real-time health monitoring

### Nadi-Bot
Visual pulse diagnosis using smartphone camera sensors

### Global Expansion
- Multi-language support
- Regional condition databases
- Local practitioner networks

### Enterprise Health
- Corporate wellness programs
- Insurance partnerships
- Hospital system integration

---

# 14. Appendices

## Appendix A: API Reference

### Authentication
```
POST /api/auth/signup       - Create new account
POST /api/auth/login        - Email/password login
POST /api/auth/google       - Google OAuth
POST /api/auth/magic-link   - Passwordless login
GET  /api/auth/session      - Get current session
POST /api/auth/logout       - Sign out
```

### Diagnosis
```
POST /api/diagnosis/start    - Begin diagnosis session
POST /api/diagnosis/symptom  - Add symptom
POST /api/diagnosis/answer   - Answer follow-up question
GET  /api/diagnosis/{id}     - Get diagnosis result
GET  /api/diagnosis/history  - Get all past diagnoses
```

### Appointments
```
GET  /api/doctors            - List available doctors
GET  /api/doctors/{id}       - Get doctor profile
GET  /api/doctors/{id}/slots - Get available slots
POST /api/appointments       - Book appointment
GET  /api/appointments       - List user's appointments
PUT  /api/appointments/{id}  - Update/cancel appointment
```

### Admin
```
GET  /api/admin/users        - List all users
GET  /api/admin/doctors      - List all doctors
PUT  /api/admin/doctors/{id}/verify - Verify doctor
GET  /api/admin/transactions - List all transactions
GET  /api/admin/analytics    - Get platform analytics
```

## Appendix B: Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Authentication
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Payments
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Backend
RATE_LIMIT_PER_MINUTE=100
UPLOAD_RATE_LIMIT_PER_MINUTE=20
MAX_UPLOAD_SIZE_MB=10
ALLOWED_ORIGINS=http://localhost:3000,https://arovia.ai
```

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Prakriti** | Birth constitution; the inherent, unchangeable nature of a person |
| **Vikriti** | Current state; dynamic imbalance that changes with lifestyle |
| **Dosha** | Bio-energy; Vata (air), Pitta (fire), Kapha (water) |
| **Bayesian Inference** | Probabilistic method for updating beliefs based on evidence |
| **Information Gain** | Measure of how much uncertainty is reduced by a question |
| **RLS** | Row-Level Security; database-level access control |
| **SOAP** | Subjective, Objective, Assessment, Plan; clinical note format |
| **RLHF** | Reinforcement Learning from Human Feedback |

## Appendix D: Key File Locations

| Purpose | Path |
|---------|------|
| Diagnosis Engine | `src/lib/diagnosis/engine.ts` |
| Prakriti Engine | `src/lib/ayurveda/prakriti/prakritiEngine.ts` |
| Vikriti Engine | `src/lib/ayurveda/vikriti/vikritiEngine.ts` |
| API Client | `src/lib/api.ts` |
| Authentication | `src/context/AuthContext.tsx` |
| Database Types | `src/types/index.ts` |
| Patient Dashboard | `src/app/dashboard/page.tsx` |
| Doctor Dashboard | `src/app/doctor/page.tsx` |
| Admin Dashboard | `src/app/admin/page.tsx` |

## Appendix E: Performance Benchmarks

| Operation | Target | Current |
|-----------|--------|---------|
| Page Load (First Contentful Paint) | <1.5s | ~1.2s |
| Emergency Detection | <200ms | 0.50ms |
| Diagnosis Inference | <2500ms | ~1200ms |
| API Response (P95) | <150ms | ~100ms |
| Database Query (P95) | <50ms | ~30ms |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Jan 2026 | Team | Initial documentation |
| 2.0.0 | Feb 2026 | AI Assistant | Comprehensive update with all features |
| 3.0.0 | Feb 2026 | AI Assistant | Added Traditional Medicine Systems (AYUSH) section with Ayurveda, Yoga, Siddha, Naturopathy, Unani, Homeopathy |

---

**© 2026 Arovia.AI - All Rights Reserved**

*This document is confidential and intended for internal use only.*
