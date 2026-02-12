# Healio.AI Mindmap - Phase 2: Admin Dashboard (Detailed)
## Central Command & Control System

---

## 🛡️ 1. OVERVIEW & ACCESS
- **URL**: `/admin`
- **Access Control**: Valid Session + (`role === 'admin'`)
- **Redirects**: Non-admins are kicked to `/login`
- **Purpose**: A "God View" of the platform for Trust, Safety, and Revenue operations.

---

## 🧭 2. NAVIGATION STRUCTURE (`AdminLayout`)
**Visual Framework**:
- **Sidebar (Left)**: Dark mode (`bg-slate-950`), Collapsible, white text.
- **Header (Top)**: White (`bg-white`), Search bar, Notification Bell, "System Operational" Status.
- **Main Content**: Light gray background (`bg-slate-100`) for contrast.

### **Sidebar Menu Items**
1. **Overview** → `The Pulse` (Live Dashboard)
2. **Management**
   - Doctor Verification (Badge: Count of pending apps)
   - Users
3. **Financials**
   - Transactions
   - Invoices
4. **Quality & Compliance**
   - Flagged Sessions (Badge: Count of alerts)
   - Clinical QnA
5. **Strategic**
   - Epidemic Heatmap
   - Analytics

---

## 📊 3. THE PULSE (Dashboard Home)
**URL**: `/admin`

### **A. Live Metrics Engine (Auto-refreshes)**
| Metric | Source Logic | Calculation | UI Color |
|--------|--------------|-------------|----------|
| **Active Users** | `RealtimeProvider` | Count of unique socket connections | 🔵 Blue |
| **Live Consultations** | `consultations` table | Count where `status === 'in_progress'` | 🟢 Green |
| **Today's GMV** | `transactions` table | Sum of `amount` where `created_at` = Today | 🟣 Purple |
| **Net Revenue** | `transactions` table | Sum of `platform_fee` (20% of GMV) | 🧼 Teal |

### **B. System Health Bar**
- **Uptime**: Mocked data (e.g., 99.9%) or server status API.
- **AI Latency**: P99 metric from `ai_logs` table (e.g., "42ms").
- **Pending Doctors**: Count from `doctors` where `status === 'pending'`.
- **Flagged Sessions**: Count from `chat_sessions` where `risk_score > 0.8`.

### **C. Urgent Action Queue**
**Logic**: Priority sorting algorithm:
1. **URGENT**: Compliance flags (Risk of harm)
2. **HIGH**: Doctor applications (> 48hrs pending)
3. **MEDIUM**: Refund requests

**UI Component**: List with color-coded icons (Red Shield, Amber User, Blue Card).

### **D. Live Activity Feed**
- **Event Listeners**: Supabase Realtime subscriptions on:
  - `INSERT` on `transactions`
  - `UPDATE` on `doctors` (verification)
  - `INSERT` on `consultations`

---

## 👨‍⚕️ 4. DOCTOR VERIFICATION (`/admin/doctors`)
**Purpose**: Vetting credentials before allowing practice.

### **UI Components**
- **Stats Header**: "3 Pending Applications" (Amber Badge)
- **Search & Filter**: By Name, Specialty, Date

### **Doctor Card Data Points**
- Avatar + Full Name
- Specialty (e.g., "General Medicine, Ayurveda")
- Applied Date ("2 days ago")
- Status Chip (`Pending Review`, `Approved`, `Rejected`)

### **Detailed Review Panel (Modal/Side view)**
| Field | Data Source | Action |
|-------|-------------|--------|
| **License No.** | `license_number` | Verify with Medical Council |
| **Document** | `license_document_url` | "View PDF" button |
| **Experience** | `experience_years` | Validate against grad date |
| **Bio** | `bio` | Check for professionalism |

### **Action Logic**
1. **✅ Approve**:
   - Update `doctors` table: `verification_status = 'approved'`
   - Update `profiles` metadata: `is_verified = true`
   - Trigger email: "You are live on Healio!"
   
2. **❓ Request Info**:
   - Update `status = 'more_info_required'`
   - Input: Admin writes specific question
   - Trigger email: "Action required on application"

3. **❌ Reject**:
   - Update `status = 'rejected'`
   - Input: Mandatory "Rejection Reason"
   - Trigger email: "Application update"

---

## 💰 5. FINANCIAL MANAGEMENT

### **A. Transactions Ledger (`/admin/transactions`)**
**Table Columns**:
1. **Transaction ID**: `txn_001...` (Click to copy)
2. **Patient**: Payer Name
3. **Doctor**: Provider Name
4. **Amount**: Total paid (e.g., ₹500)
5. **Fee**: Platform cut (e.g., ₹100)
6. **Payment Status**: `Succeeded` (Green), `Failed` (Red)
7. **Payout Status**: `Released` (Green), `Held` (Amber)

### **B. Invoice Processing (`/admin/invoices`)**
**Workflow**:
1. **Auto-Generates**: When consultation marked "Completed".
2. **Admin Review**: Checks details (Duration, Patient feedback).
3. **Approval**:
   - Admin clicks "Approve & Pay"
   - Server calls Stripe Connect / Razorpay Route
   - Funds transferred to Doctor's connected account.

---

## 🛡️ 6. QUALITY & SAFETY

### **A. Flagged Sessions (`/admin/compliance`)**
**Detection Logic**:
- AI scans chat logs for regex/keywords: `["suicide", "kill", "refund", "scam"]`.
- Generates `ComplianceAlert` object.

**Review Interface**:
- **Risk Score**: 0-100% (Red > 80%)
- **Snippet**: "I want to end it all..." (Highlighted)
- **Actions**:
  - `Dismiss`: False positive.
  - `Intervene`: Push alert to Doctor.
  - `Ban User`: Extreme cases.

### **B. Clinical Q&A (`/admin/clinical-qna`)**
- **Database**: `clinical_knowledge_base`
- **Function**: Correction mechanism for the AI Diagnosis Engine.
- **Workflow**:
  - AI gives answer X.
  - Doctor tags as "Inaccurate".
  - Admin (Chief Medical Officer) updates the 'Ground Truth'.

---

## 👥 7. USER MANAGEMENT (`/admin/users`)
**Table View**:
- **User**: Avatar + Name + Email
- **Role**: `Admin` (Purple), `Doctor` (Blue), `Patient` (Gray)
- **Joined**: Date timestamp
- **Actions**: `View Profile` → See full history.

**Stats**:
- **Total Users**: Count from `profiles`.
- **Growth**: Chart of new signups (Last 30 days).

---

## 🔗 8. DETAILED SYSTEM INTEGRATION

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│  USER ACTION    │       │   SUPABASE TRIGGER   │       │   ADMIN DASH    │
└────────┬────────┘       └──────────┬───────────┘       └────────┬────────┘
         │                           │                          │
         │ (Sign Up)                 │ (Insert profile)         │
         ├──────────────────────────►│                          │
         │                           │◄─────────────────────────┤ (View User)
         │                           │                          │
         │ (Apply as Doc)            │ (Insert doctors)         │
         ├──────────────────────────►│                          │
         │                           │-------------------------►│ (New App Alert)
         │                           │                          │
         │                           │◄-------------------------┤ (Verify Doc)
         │                           │                          │
         │ (Pay ₹500)                │ (Insert transaction)     │
         ├──────────────────────────►│                          │
         │                           │-------------------------►│ (GMV Update)
         │                           │                          │
         │                           │◄-------------------------┤ (Approve Invoice)
         │                           │                          │
         │ (Chat msg)                │ (AI Scan Service)        │
         ├──────────────────────────►│                          │
         │                           │--[If Risk > 80%]--------►│ (Flagged Alert)
└────────┴────────┘       └──────────┴───────────┘       └────────┴────────┘
```

---

## 🧠 KEY MINDMAP BRANCHES (Expanded)

### **1. DASHBOARD UI**
- **Sidebar**: Nav Links, Badges (3 Pending)
- **Header**: Search, Notifications, Status
- **Metric Cards**: Validated Data Sources

### **2. DOCTOR OPERATIONS**
- **Verification Flow**: New → Review → Decision
- **Data Check**: License, Bio, Specialty
- **Triggers**: Email Notifications

### **3. REVENUE OPS**
- **Ledger**: Track every Rupee
- **Invoices**: Validation before Payout
- **Fees**: Commission Calculation (20%)

### **4. PLATFORM SAFETY**
- **AI Sentinel**: Keyword scanning
- **Risk Scoring**: 0-100 scale
- **Intervention**: Manual admin overrides

### **5. DATA & ANALYTICS**
- **Epidemic Map**: Geo-location of symptoms
- **System Health**: Uptime & Latency
- **User Growth**: SignUp trends
```
