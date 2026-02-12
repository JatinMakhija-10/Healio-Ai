# Healio.AI Mindmap - Phase 1: Authentication Flow
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

---

## 🔑 KEY INSIGHTS FOR XMIND MAPPING

### **Main Branches for Your Mindmap**

#### **Level 1: HEALIO.IN**
- Subbranch: Hero Section
- Subbranch: CTA Buttons
  - "Get Started" → Signup
  - "Login" → Login
- Subbranch: Trust Elements
  - Privacy First
  - Encrypted
  - Educational Use

---

#### **Level 2: SIGNUP PAGE**
- Subbranch: Email/Password Method
  - Validation Rules
  - Supabase Auth Call
  - Role Assignment (patient)
  - Redirect to `/onboarding`
  
- Subbranch: Google OAuth Method
  - OAuth Flow
  - Auto-role assignment
  - Callback handling

---

#### **Level 3: LOGIN PAGE**
- Subbranch: Authentication Process
  - Credential Verification
  - Fetch User Profile
  - Check Role
  
- Subbranch: Role-Based Routing
  - Patient → `/dashboard`
  - Doctor (incomplete) → `/doctor/onboarding`
  - Doctor (complete) → `/doctor`
  - Admin → `/admin`
  - No profile → `/onboarding`

---

#### **Level 4: THREE DASHBOARDS**

**Patient Dashboard (`/dashboard`)**
- Subbranch: Features
  - AI Diagnosis
  - Appointments
  - Medical History
  - Ayurvedic Profiles

**Doctor Dashboard (`/doctor`)**
- Subbranch: Onboarding Required
  - Profile Completion
  - Verification Pending/Approved
- Subbranch: Features
  - Patient Queue
  - Consultations
  - Revenue Tracking

**Admin Dashboard (`/admin`)**
- Subbranch: Features
  - Doctor Verification
  - System Analytics
  - Flagged Content
  - Emergency Monitoring

---

## 💡 TECHNICAL LOGIC SUMMARY

### **Signup Logic (NEW USERS)**
```javascript
User fills signup form
  → Validate email & password
  → Call Supabase Auth signup
  → Set role in metadata ('patient' or 'doctor')
  
  → IF role = 'patient':
      Redirect to /onboarding
  → IF role = 'doctor':
      Redirect to /doctor/onboarding
      
  (Admin has NO signup - manually created)
```

### **Login Logic (EXISTING USERS)**
```javascript
User enters credentials
  → Authenticate via Supabase
  → Fetch profile from database
  → Read role from profiles table
  
  → IF role = 'patient':
      Direct to /dashboard
  → IF role = 'doctor':
      Direct to /doctor
  → IF role = 'admin':
      Direct to /admin
      
  (No onboarding check - already completed)
```

### **Onboarding Logic**
```javascript
PATIENT ONBOARDING (/onboarding):
  → Collect: Full Name, Age, Gender, Medical History
  → Save to profiles table
  → Redirect to /dashboard
  
DOCTOR ONBOARDING (/doctor/onboarding):
  → Collect: Specialization, License, Experience, Fee
  → Save to doctors table
  → Set verification_status = 'pending'
  → Redirect to /doctor (awaiting admin approval)
```

---

## ✅ PHASE 1 COMPLETE

**What We Covered:**
1. ✅ Landing page structure (healio.in)
2. ✅ Signup page logic (email + Google OAuth)
3. ✅ Login page logic (role-based routing)
4. ✅ How authentication leads to all 3 dashboards
5. ✅ Detailed explanations of routing logic

**Next Phase:**
- Deep dive into each dashboard's features
- Internal flows within patient/doctor/admin dashboards
- Database relationships and data flow
