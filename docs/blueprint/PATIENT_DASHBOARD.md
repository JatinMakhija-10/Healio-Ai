# Patient Dashboard: Personal Health Mastery

## 1. Goal: Empowerment through Personalization
The dashboard transforms raw clinical and Ayurvedic data into an interactive recovery roadmap.

## 2. Feature: Care Pathway Algorithm
The active pathway (`src/lib/diagnosis/care-pathways/pathwayEngine.ts`) is generated dynamically.

### Step 1: Baseline Fetch
Fetches the `basePathway` from the library based on the condition ID.

### Step 2: Personalization logic
- **Algorithm**: `applyAdjustments()`
  - If `user.Prakriti == 'Vata'`, apply Vata-specific modifications (e.g., warmer food, slower yoga).
  - If `seasonal_multiplier` is active, adjust daily actions to counter provocations.

### Step 3: Estimated Duration Math
Estimates the recovery window based on health status:
$$EstDuration = BaseDuration \times (1 + \text{ImbalanceFactor} - \text{AgniFactor})$$
- Severe Vikriti adds +30% to duration.
- Balanced Agni (Sama) subtracts -15%.

## 3. UI Buttons and Actions
- **"New Consultation" Button**: Triggers a global state reset and initializes the `DiagnosticDialogue`.
- **"Start Assessment" (Prakriti)**: 
  - **Logic**: Only visible if `user.user_metadata.ayurvedic_profile` is undefined.
  - **Action**: Redirects to the multi-step questionnaire flow.
- **Pathway Check-off**: 
  - Each action in the `PathwayCard` is interactive. 
  - **Backend**: Marking an action as complete updates the `pathway_adherence` table to calculate the "Wellness Score."

## 4. State Management (Persistence)
- **Consultation History**: Uses `healio_consultation_history` in LocalStorage for sub-second dashboard loading, which is then synced with Supabase for cross-device access.
- **Real-time Sync**: The dashboard uses a "Heuristic ID" mapping for condition names to ensure the UI can render base pathways even if the database response is delayed.

## 5. Feature: Red Flag Visibility
- **Logic**: Dashboard scans the latest pathway's `redFlags` array. 
- **Action**: If any `emergency` flag matches recent symptom inputs, a persistent alert banner is rendered using Radix-UI's `Alert` component.
