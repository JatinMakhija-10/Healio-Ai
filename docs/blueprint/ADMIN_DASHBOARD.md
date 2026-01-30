# Admin Dashboard: System Control & Intelligence

## 1. Goal: Governance and Scaling
The Admin Dashboard manages professionals, monitor system integrity, and maintains the knowledge base.

## 2. Automated Workflows
### A. Doctor Verification State Machine
- **State: Pending**: Doctor signs up; account is restricted via `rbac.ts`.
- **State: Review**: Admin clicks "Review Application," fetching license data from Supabase storage.
- **State: Active**: On "Approve," a database trigger updates the `doctors` table, enabling appointment booking.

### B. Revenue & Payout Logic
The platform uses a commission-based model explained in `src/app/admin/page.tsx`:
- **Formula**: $PlatformRevenue = NetTransactionValue \times 0.20$
- **Implementation**: Handled via Stripe Connect integration logic.

## 3. Feature: Platform Governance
- **"Flagged Sessions" Widget**: 
    - **Logic**: Aggregates sessions where the AI confidence was $<30\%$ but the user completed the flow. 
    - **Goal**: Identifies "Knowledge Gaps" for the medical team to fill.
- **"Live Activity" Feed**: 
    - **Tech**: Uses Supabase Realtime (WebSockets) to broadcast actions from `Dr. Sharma` or `Priya M.` directly to the Admin UI.

## 4. System Health Metrics
- **Avg Latency Calculation**: 
    - Measured from `client_request_time` to `ai_result_ready`.
    - **Target**: P99 should be $<200ms$ for clinical responsiveness.
- **Uptime Logic**: Monitored via a ping-service; displayed as a percentage of successful heartbeat responses over a 30-day window.

## 5. Knowledge Base (The Brain)
- **Edit Condition Button**: Opens a form to modify the `matchCriteria`. 
- **Impact**: Changes here instantly affect the `calculateBayesianScore()` logic platform-wide.
- **Audit Requirement**: Every change requires a "Reason for Update" which is logged for clinical safety auditing.
