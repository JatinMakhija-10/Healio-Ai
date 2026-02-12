# Healio.AI Documentation Bundle
## Phase 1 & Phase 2

---

**Generated on:** 10 Feb 2026
**Project:** Healio.AI
**Includes:**
1. Phase 1: Authentication Flow
2. Phase 2: Admin Dashboard

<div style="page-break-after: always;"></div>

# Phase 1: Authentication Flow
## Landing Page → Signup/Login → Dashboards

---

## 🌐 1. HEALIO.IN (Landing Page - `/`)

### **Overview**
- **URL**: `healio.in` or `localhost:3000/`
- **Purpose**: First touchpoint for all users
- **Design**: Minimal, professional, clinical-grade aesthetic
- **File**: `src/app/page.tsx`

### **Key Elements**

#### **A. Hero Section**
```
┌─────────────────────────────────────┐
│   🩺 HEALIO.AI LOGO (Stethoscope)   │
│                                     │
│   "Understand your pain.            │
│    Safely."                         │
│                                     │
│   A clinical-grade assistant to     │
│   help you make sense of symptoms   │
└─────────────────────────────────────┘
```

#### **B. Call-to-Action (CTA) Buttons**
1. **Primary CTA**: "Get Started" → Redirects to `/signup`
2. **Secondary CTA**: "Already have an account? Login" → Redirects to `/login`

#### **C. Trust Badges**
- ✅ Privacy First (Data protection)
- 🔒 Encrypted (Secure communication)
- ℹ️ Educational Use Only (Medical disclaimer)

#### **D. Legal Disclaimer**
> "By continuing, you agree that Healio.AI is an informational tool and does not provide medical diagnosis or treatment advice."

**Key Insight**: The landing page is intentionally simple to reduce cognitive load and build trust before signup.

---

## 🔐 2. SIGNUP PAGE (`/signup`)

### **Overview**
- **File**: `src/app/signup/page.tsx`
- **Purpose**: User registration & account creation
- **Default Role**: `patient` (hardcoded)

### **Signup Flow Logic**

```mermaid
graph TD
    A[User clicks "Get Started"] --> B[Signup Form Displayed]
    B --> C{Signup Method}
    C -->|Email/Password| D[Enter Email + Password + Confirm]
    C -->|Google OAuth| E[Google Sign-In Popup]
    
    D --> F{Validation}
    F -->|Password < 8 chars| G[Error: Password too short]
    F -->|Passwords Don't Match| H[Error: Password mismatch]
    F -->|Valid| I[Create Account via Supabase Auth]
    
    E --> I
    
    I --> J{Account Created - Role Assignment}
    J -->|Patient Signup| K[Redirect to /onboarding]
    J -->|Doctor Signup| L[Redirect to /doctor/onboarding]
    
    Note: Admin accounts have NO signup page - manually created in database
```

### **Technical Details**

#### **A. Email/Password Signup**
**Function**: `handleSignup()`
1. **Validation**:
   - Password length ≥ 8 characters
   - Password === Confirm Password
   
2. **Supabase Call**:
   ```typescript
   supabase.auth.signUp({
     email: email,
     password: password,
     options: {
       emailRedirectTo: '/auth/callback',
       data: { role: 'patient' }  // Default role from signup page
     }
   })
   ```

3. **Routing After Signup** (New Users):
   - ✅ **Patient Signup**: Redirect to `/onboarding`
   - ✅ **Doctor Signup**: Redirect to `/doctor/onboarding`
   - ❌ **Email confirmation required**: Show message "Check email"

#### **B. Google OAuth Signup**
**Function**: `signInWithGoogle('patient')`
1. **OAuth Flow**:
   ```typescript
   supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: '/auth/callback',
       queryParams: {
         access_type: 'offline',
         prompt: 'consent'
       }
     }
   })
   ```

2. **Redirect**: Google → Callback → Onboarding

#### **C. Database Actions (Backend Trigger)**
When signup succeeds, Supabase trigger creates:
1. **`profiles` table entry**:
   - `id`: User UUID
   - `role`: 'patient'
   - `email`: User email
   - `created_at`: Timestamp


---

## 🔄 **CRITICAL DISTINCTION: SIGNUP vs LOGIN**

### **SIGNUP (New Users) → ONBOARDING**
```
Patient Signup → /onboarding (collect profile)
Doctor Signup → /doctor/onboarding (collect credentials)
Admin → NO SIGNUP PAGE (manually created in database)
```

### **LOGIN (Existing Users) → DIRECT TO DASHBOARD**
```
Patient Login → /dashboard (skip onboarding)
Doctor Login → /doctor (skip onboarding)
Admin Login → /admin
```

**Why the difference?**
- **SIGNUP**: New user account needs profile completion (name, age, medical history)
- **LOGIN**: Profile already exists in database, go straight to dashboard

---

## 🔑 3. LOGIN PAGE (`/login`)

### **Overview**
- **File**: `src/app/login/page.tsx`
- **Purpose**: Authenticate existing users
- **Key Feature**: Role-based routing after login

### **Login Flow Logic**

```mermaid
graph TD
    A[User enters Email + Password] --> B[Submit Login Form]
    B --> C{Supabase Authentication}
    C -->|Invalid| D[Show Error Message]
    C -->|Valid| E[Fetch User Profile from DB]
    
    E --> F{Check User Role}
    
    F -->|role: 'patient'| G[✅ Direct to /dashboard]
    F -->|role: 'doctor'| H[✅ Direct to /doctor]
    F -->|role: 'admin'| I[✅ Direct to /admin]
    
    Note1: Login = Existing users → Skip onboarding
    Note2: Onboarding already completed during signup
```

### **Technical Details**

#### **A. Authentication Logic**
**Function**: `handleLogin()`

1. **Step 1: Verify Credentials**
   ```typescript
   const { session } = await supabase.auth.signInWithPassword({
     email, password
   });
   ```

2. **Step 2: Fetch User Profile**
   ```typescript
   const profile = await supabase
     .from('profiles')
     .select('role')
     .eq('id', session.user.id)
     .single();
   ```

3. **Step 3: Role-Based Routing (LOGIN - Existing Users)**
   | Role | Redirect Path | Note |
   |------|---------------|------|
   | `patient` | `/dashboard` | ✅ Direct access |
   | `doctor` | `/doctor` | ✅ Direct access |
   | `admin` | `/admin` | ✅ Direct access |
   
   **Key Point**: Login bypasses onboarding because users already completed it during signup.

#### **B. Google OAuth Login**
**Function**: `handleGoogleLogin()`
- Same as signup, but checks if user exists
- If existing user → Direct to dashboard
- If new user → Onboarding flow

---

## 🎯 4. AUTHENTICATION CONTEXT (`AuthContext.tsx`)

### **Overview**
- **File**: `src/context/AuthContext.tsx`
- **Purpose**: Global authentication state management
- **Key Responsibility**: Session persistence & role-based routing

### **Core Functions**

#### **A. `signup(email, password, role)`**
```typescript
// Called from signup page
signup(email, password, 'patient')
  ↓
Creates user in Supabase Auth
  ↓
Sets role in user_metadata
  ↓
IF session exists:
  - role === 'doctor' → /doctor/onboarding
  - role === 'patient' → /onboarding
ELSE:
  - Show "Check Email" message
```

#### **B. `login(email, password)`**
```typescript
// Called from login page (though login page has custom logic)
login(email, password)
  ↓
Authenticate with Supabase
  ↓
Fetch user role from profiles table
  ↓
Route based on role & onboarding status
```

#### **C. Session Management**
```typescript
useEffect(() => {
  // On app load, check if session exists
  supabase.auth.getSession()
    ↓
  If session found:
    - setUser(session.user)
    - fetchProfile(user.id)
    - Listen for auth state changes
})
```

**Real-time Profile Updates**:
- Subscribes to `profiles` table changes
- Subscribes to `doctors` table changes (if doctor)
- Updates context automatically when DB changes

---

## 🚪 5. ROUTING TO DASHBOARDS

### **Overview**
After successful login/signup, users are routed to one of **3 main dashboards** based on their role.

### **Dashboard Routing Matrix**

```
┌─────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION                          │
│                    (Signup/Login Success)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │  Check User Role          │
         │  (from profiles table)    │
         └─────────────┬─────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
   │ PATIENT │   │ DOCTOR  │   │ ADMIN   │
   │  ROLE   │   │  ROLE   │   │  ROLE   │
   └────┬────┘   └────┬────┘   └────┬────┘
        │              │              │
        │         ┌────▼────┐         │
        │         │ Doctor  │         │
        │         │ Profile │         │
        │         │Complete?│         │
        │         └────┬────┘         │
        │         ┌────┴────┐         │
        │    ┌────▼───┐ ┌───▼────┐   │
        │    │  No    │ │  Yes   │   │
        │    └────┬───┘ └───┬────┘   │
        │         │         │         │
   ┌────▼────┐ ┌─▼─────────▼──┐ ┌───▼────┐
   │/dashboard│ │/doctor       │ │/admin  │
   │         │ │/onboarding   │ │        │
   └─────────┘ └──────────────┘ └────────┘
```

### **Detailed Dashboard Paths**

#### **1. PATIENT DASHBOARD** (`/dashboard`)
- **Condition**: `role === 'patient'`
- **Entry Point**: Always direct to `/dashboard`
- **Key Features**:
  - AI Symptom Checker
  - Diagnosis History
  - Ayurvedic Profile (Prakriti/Vikriti)
  - Book Appointments
  - Chat with Doctors
  - Health Records

**Onboarding Requirement**: 
- New patients go through `/onboarding` first
- Collects: Full Name, Age, Gender, Medical History

---

#### **2. DOCTOR DASHBOARD** (`/doctor`)
- **Condition**: `role === 'doctor' AND is_profile_complete === true`
- **Entry Point**: `/doctor`
- **Key Features**:
  - Patient Consultations Queue
  - Appointment Management
  - Revenue Tracking
  - Patient Medical Records
  - Prescription Management
  - Video Consultation Interface

**Doctor Onboarding** (`/doctor/onboarding`):
- **Triggered When**: `is_profile_complete === false`
- **Data Collected**:
  - Specialization
  - License Number
  - Years of Experience
  - Bio
  - Consultation Fee
  - Availability Schedule

**Verification Flow**:
```
Doctor Signup
  ↓
/doctor/onboarding (Complete Profile)
  ↓
Profile Submitted
  ↓
verification_status: 'pending'
  ↓
Admin Reviews (in /admin)
  ↓
verification_status: 'approved' or 'rejected'
  ↓
IF approved:
  - verified: true
  - Can start consultations
IF rejected:
  - rejection_reason: "..."
  - Must resubmit
```

---

#### **3. ADMIN DASHBOARD** (`/admin`)
- **Condition**: `role === 'admin'`
- **Entry Point**: `/admin`
- **Key Features**:
  - System-wide Analytics
  - Doctor Verification Management
  - Flagged Sessions Review
  - Epidemic Heatmap (India)
  - User Management
  - Revenue Oversight
  - Clinical Q&A Moderation
  - Emergency Pattern Monitoring

**Admin Access**:
- Manually granted via database
- Typically for internal Healio.AI team
- Has override access to all dashboards

---

## 📊 6. RELATIONSHIP DIAGRAM

### **Complete Authentication → Dashboard Flow**

```
┌───────────────────────────────────────────────────────────────────┐
│                          HEALIO.AI                                 │
│                     Authentication System                          │
└───────────────────────────────────────────────────────────────────┘

     ┌─────────────────────────────────────────────────────────────┐
     │ 1. LANDING PAGE (healio.in)                                 │
     │    • "Get Started" button                                   │
     │    • "Login" link                                           │
     └─────────────┬───────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼────┐           ┌───▼────┐
   │ SIGNUP  │           │ LOGIN  │
   │ (NEW)   │           │(EXIST) │
   └────┬────┘           └───┬────┘
        │                    │
        │                    │
     ┌──▼──────────┐    ┌───▼─────────┐
     │ SUPABASE    │    │ SUPABASE    │
     │ AUTH        │    │ AUTH        │
     │ (Create)    │    │ (Verify)    │
     └──┬──────────┘    └───┬─────────┘
        │                    │
     ┌──▼──────────┐    ┌───▼─────────┐
     │ ONBOARDING  │    │ DASHBOARD   │
     │             │    │ (DIRECT)    │
     └──┬──────────┘    └───┬─────────┘
        │                    │
   ┌────▼────────────┐  ┌───▼──────────────┐
   │ Patient:        │  │ Patient:         │
   │ /onboarding     │  │ /dashboard       │
   │                 │  │                  │
   │ Doctor:         │  │ Doctor:          │
   │ /doctor/        │  │ /doctor          │
   │ onboarding      │  │                  │
   │                 │  │ Admin:           │
   │ Admin:          │  │ /admin           │
   │ (No signup)     │  │                  │
   └─────────────────┘  └──────────────────┘

KEY DIFFERENCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNUP → Onboarding (collect profile data)
LOGIN  → Dashboard (profile already exists)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

<div style="page-break-after: always;"></div>

# Phase 2: Admin Dashboard
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
         │                           │                          │
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
