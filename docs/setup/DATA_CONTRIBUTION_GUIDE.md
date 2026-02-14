# Healio.AI Data Contribution Guide

This guide explains how to manually expand the Healio.AI medical dataset by generating content with ChatGPT, validating it with medical professionals, and integrating it into the codebase.

---

## Prerequisite: Understanding the Data Structure

Each medical condition in Healio.AI is a TypeScript object with the following structure:

```typescript
interface Condition {
  id: string;               // Unique identifier (e.g., 'acute_bronchitis')
  name: string;             // Display name (e.g., 'Acute Bronchitis')
  description: string;      // 1-sentence summary
  matchCriteria: {
    locations: string[];    // Body parts (e.g., 'chest', 'lungs')
    types: string[];        // Pain/Symptom types (e.g., 'coughing', 'wheezing')
    triggers: string[];     // Aggravating factors (e.g., 'cold air', 'exercise')
    specialSymptoms: string[]; // Key identifiers (e.g., 'productive cough', 'low-grade fever')
  };
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  prevalence?: 'common' | 'uncommon' | 'rare';
  redFlags?: string[];      // Emergency symptoms requiring immediate care
  remedies: Remedy[];       // Standard medical/home care
  indianHomeRemedies: Remedy[]; // Ayurvedic or traditional Indian remedies
  exercises?: Exercise[];   // Physical therapy or yoga
  warnings: string[];       // "Do nots" (e.g., "Avoid cough suppressants if productive")
  seekHelp: string;         // When to see a doctor
}
```

---

## Step 1: Generate Data with ChatGPT

Use the following prompt to generate structured data for new conditions. Replace `[CONDITION_NAME]` with the specific condition you want to add.

### **ChatGPT Prompt Template**

> "Act as a senior medical consultant and Ayurvedic practitioner. I need to add `[CONDITION_NAME]` to a medical diagnosis app.
>
> Please provide the data in the following JSON format. Ensure the content is clinically accurate but accessible to laypeople.
>
> **Requirements:**
> 1. **Match Criteria**: List distinct keywords users might say.
> 2. **Remedies**: Provide 1-2 standard medical/home care tips (evidence-based).
> 3. **Indian Remedies**: Provide 2-3 specific Indian/Ayurvedic home remedies (specify ingredients and method).
> 4. **Red Flags**: Critical symptoms that mean 'Go to ER'.
> 5. **Severity**: Choose one: mild, moderate, severe, critical.
>
> **JSON Format:**
> ```json
> {
>   "id": "snake_case_id",
>   "name": "Display Name",
>   "description": "One sentence summary.",
>   "matchCriteria": {
>     "locations": ["array", "of", "body", "parts"],
>     "types": ["adjectives", "for", "pain", "or", "feeling"],
>     "triggers": ["actions", "that", "worsen", "it"],
>     "specialSymptoms": ["specific", "diagnostic", "symptoms"]
>   },
>   "severity": "mild/moderate/severe",
>   "remedies": [
>     { "name": "", "description": "", "ingredients": [], "method": "" }
>   ],
>   "indianHomeRemedies": [
>     { "name": "", "description": "", "ingredients": [], "method": "" }
>   ],
>   "warnings": ["Array of strings"],
>   "seekHelp": "String describing when to see a doctor"
> }
> ```
>
> Please generate data for: `[CONDITION_NAME]`"

---

## Step 2: Doctor/Expert Review

Before adding code, review the generated data with a doctor. Use this checklist:

### **Consultation Checklist**
1.  **Red Flag Accuracy**: Are the `redFlags` complete? Is anything missing that could be life-threatening?
2.  **Symptom Distinctness**: Are the `specialSymptoms` specific enough to distinguish this from similar conditions? (e.g., Distinguishing *Migraine* vs. *Tension Headache*).
3.  **Remedy Safety**: Are the `indianHomeRemedies` safe? (e.g., "Is putting garlic in the ear actually safe for this ear infection?").
4.  **Triage Level**: Is the `severity` rating correct? Should this always be a 'seek help immediately' case?

---

## Step 3: Add to Codebase

Once matched and verified, add the data to the application.

### 1. Create/Edit the Condition File
Navigate to: `src/lib/diagnosis/conditions/`

*   **Option A (Existing Category):** If adding a dental issue, open `dental.ts`.
*   **Option B (New Category):** Create a new file (e.g., `cardiology.ts`).

**Example Code (in `src/lib/diagnosis/conditions/cardiology.ts`):**

```typescript
import { Condition } from "../types";

export const cardiologyConditions: Record<string, Condition> = {
    hypertension: {
        id: 'hypertension',
        name: 'High Blood Pressure',
        // ... paste your JSON content here (convert JSON syntax to JS object)
    }
};
```

### 2. Register the New Category (If you created a new file)
Open `src/lib/diagnosis/conditions.ts`.

1.  **Import** your new file at the top:
    ```typescript
    import { cardiologyConditions } from "./conditions/cardiology";
    ```

2.  **Add** it to the `CONDITIONS` export:
    ```typescript
    export const CONDITIONS: Record<string, Condition> = {
        ...COMMON_CONDITIONS,
        // ... existing imports
        ...cardiologyConditions, // Add this line
    };
    ```

### 3. Verification
Run the application and test the diagnosis engine:
1.  Go to the chat.
2.  Describe the symptoms of the new condition.
3.  Ensure the engine asks relevant questions and eventually concludes with your new diagnosis.

---

# PART 2: MASS SCALE STRATEGY (100k+ Conditions)

> [!WARNING]
> **Scalability Alert**: The manual method above (adding code to TypeScript files) works for ~500-2,000 conditions.
> For **100,000+ conditions**, you **MUST** migrate to a database (Supabase, Firebase, or MongoDB). Loading 100k objects into the browser memory will crash the user's device.

## Strategic Workflow for Bulk Data
To achieve 100,000+ conditions manually with AI help, follow this 3-phase loop.

### Phase 1: Generate Categories (The Map)
First, you need a list of 100+ categories to organize your work.

**ChatGPT Prompt:**
> "I am building a comprehensive medical database. Generate a list of 100 distinct medical categories (e.g., 'Cardiology - Arrhythmias', 'Dermatology - Eczema Types', 'Pediatrics - Viral Infections').
> Return the list as a simple JSON array of strings."

### Phase 2: Bulk Condition Generation (The Factory)
Do not generate one by one. Generate batches of 10-20 conditions at a time.

**ChatGPT Prompt:**
> "Act as a medical expert. I need to populate the category: `[CATEGORY_NAME]` (e.g., 'Dermatology - Fungal Infections').
>
> Generate **20 distinct conditions** for this category.
> Return ONLY a JSON Array of objects matching this schema (minimized for size):
>
> ```json
> [
>   {
>     "id": "tinea_pedis",
>     "name": "Athlete's Foot",
>     "description": "Fungal infection between toes.",
>     "matchCriteria": {
>       "locations": ["feet", "toes"],
>       "types": ["itching", "burning"],
>       "triggers": ["sweating", "tight shoes"],
>       "specialSymptoms": ["peeling skin", "itchy blister"]
>     },
>     "severity": "mild",
>     "remedies": [{"name": "Antifungal Cream", "description": "Apply twice daily.", "ingredients": [], "method": ""}],
>     "indianHomeRemedies": [{"name": "Neem Oil", "description": "Antifungal.", "ingredients": [], "method": "Apply to feet."}],
>     "warnings": ["Wash hands after touching."],
>     "seekHelp": "If diabetic or foot swells."
>   }
>   // ... 19 more
> ]
> ```
> Ensure accurate medical distinctions between the conditions."

### Phase 3: Ingestion (The Warehouse)
**Do NOT paste these into TypeScript files.**

1.  **Save as JSON**: Copy the ChatGPT output into a file named `raw_data/[category_name].json`.
2.  **Database Script**: You will need a script to read these JSON files and upload them to your database (Supabase/PostgreSQL).

**Recommended File Structure for Bulk Data:**
```text
/data-ingestion
  /raw-json
    cardiology_arrhythmias.json
    dermatology_fungal.json
    ... (100+ files)
  upload_script.ts
```

> [!TIP]
> **Ask the Developer**: "I have generated 50 JSON files with medical data. Please write a script to upload these to Supabase."

