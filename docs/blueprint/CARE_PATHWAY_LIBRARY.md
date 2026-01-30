# Care Pathway Library: Phase-Based Protocol Engine

## 1. Goal: Evidence-Based Recovery
The Library (`src/lib/diagnosis/care-pathways/pathwayLibrary.ts`) acts as a digital protocol manual, guiding patients from Day 1 to Full Recovery.

## 2. Structural Component: The Phase
Each pathway is divided into discrete `TreatmentPhase` objects.
- **Day-Range Management**: Phases (e.g., "Onset", "Peak", "Recovery") have specific start/end days.
- **Categorized Actions**: Tasks are tagged as `lifestyle`, `diet`, `ayurvedic`, or `monitoring`.
- **Priority Logic**: Actions are ranked (Critical, Important, Recommended) to focus user attention.

## 3. Recursive Personalization logic
The `PersonalizedPathway` engine performs a recursive merge of the baseline protocol with patient-specific metadata.

### Modification Hooks
Found in `ayurvedicModifications`:
1. **Prakriti Overrides**: 
   - *Example*: Vata types get "Abhyanga" added to all phases automatically.
2. **Agni Adjustments**: 
   - *Example*: Manda Agni (Weak Fire) triggers a "Portion Size Reduction" across all dietary tasks.
3. **Seasonal Multipliers**: 
   - *Example*: In Winter, "Chyawanprash" is dynamically injected into the daily routine.

## 4. Clinical Safety: Checkpoint System
Pathways include mandatory `MonitoringSchedule` checkpoints:
- **Condition-Based Logic**: 
  - `IF (temperature > 101 for 3 days) THEN "Alert Doctor" ELSE "Continue Care"`.
- **Red Flag Escalation**: Continuous background scanning of user inputs against the `redFlags` array for immediate ER referrals.

## 5. UI Implementation
- **PathwayCard Component**: Renders the current phase based on the calculation:
$$Phase_{active} = \forall p \in Phases : day \in [p.start, p.end]$$
- **Progressive Persistence**: Completed tasks are saved to `pathway_adherence`, powering the "Wellness Trend" in the Dashboard.
