# Healio.AI Mindmap - Phase 4: Patient Dashboard (Detailed)
## Personal Health & Wellness Hub

---

## 🏥 1. OVERVIEW & ACCESS
- **URL**: `/dashboard`
- **Access Control**: Valid Session + (`role === 'patient'`)
- **Onboarding Check**: If `!onboarding_completed` → Redirect to `/onboarding`.
- **Purpose**: The central interface for health tracking, AI consultations, and finding care.

---

## 🧭 2. NAVIGATION & STRUCTURE
**Visual Framework**:
- **Sidebar**: Light/Clean theme (unlike Doctor's dark mode).
- **Core Items**:
  1. **Home**: `/dashboard`
  2. **Find Care**: `/dashboard/search`
  3. **Assessment**: `/dashboard/consult` (AI Chat)
  4. **Wellness**: `/dashboard/wellness` (Ayurveda Hub)
  5. **History**: `/dashboard/history`
  6. **Family**: `/dashboard/family`

---

## 🏠 3. DASHBOARD HOME (`/dashboard`)
**"Your Health at a Glance"**

### **A. Primary Actions**
- **Greeting**: "Good Afternoon, [Name]"
- **New Consultation (CTA)**:
  - **Action**: Opens Pre-assessment Dialog.
  - **Info**: "Time Estimate: 2-5 mins", "Medical Disclaimer".
  - **Dest**: `/dashboard/consult`

### **B. Live Insights**
- **Active Pathway**: `PathwayCard` (e.g., "Day 3 of Flu Recovery").
- **Metrics Cards**:
  - **Last Assessment**: Time ago + Condition.
  - **Pain Trend**: Latest intensity (e.g., "6/10").
  - **Daily Tip**: Random health nugget.

### **C. Ayurveda Prompt**
- **Trigger**: If `!prakriti_profile`.
- **UI**: detailed card calling to "Discover Body Type".
- **Action**: Links to `/dashboard/assessment/prakriti`.

---

## 🌿 4. WELLNESS HUB (`/dashboard/wellness`)
**"The Ayurvedic Engine"**

### **Access Model**
- **Freemium**: Basic view is blurred/locked.
- **Premium**: Requires `plus` or `pro` subscription.

### **Data Visualization**
- **Vikriti Score**: 0-100 gauge (Harmony/Balance).
- **Dosha Levels**:
  - **VATA**: Wind/Motion (Balanced/Aggravated).
  - **PITTA**: Fire/Metabolism (High/Low).
  - **KAPHA**: Water/Structure (Stable/Heavy).

### **Guidance Logic**
| Component | Logic Source | Example Output |
|-----------|--------------|----------------|
| **Diet** | `Pitta > 70` | "Avoid spicy foods today." |
| **Yoga** | `Vata > 60` | "Grounding poses (Tree Pose)." |
| **Sleep** | `Kapha < 30` | "Wake up by 6 AM." |

---

## 🔍 5. FIND CARE (`/dashboard/search`)
**"Connect with Specialists"**

### **Search Engine**
- **Inputs**: Name, Keyword, Specialty.
- **Filters**: Quick tags (Cardiology, Dermatology, Ayurveda).
- **Sorting**: "Recommended" (default), Rating, Experience.

### **Doctor Card UI**
- **Identity**: Avatar, Name, Specialty.
- **Credibility**: Verified Badge (Blue Check), Star Rating (4.9).
- ** Logistics**:
  - Experience: "10+ Years"
  - Fee: "₹500"
  - Mode: "Video / In-person"

### **Booking Logic (`PatientBookingModal`)**
1. **Select Doctor**: Click "Book Appointment".
2. **Choose Slot**: Available times from Doctor's calendar.
3. **Pay**: Integration with Stripe/Razorpay.
4. **Confirm**: Email sent + Added to `/dashboard/history`.

---

## 🤖 6. AI CONSULTATION (`/dashboard/consult`)
**"The Virtual Diagnostician"**

### **Core Loop (`ChatInterface`)**
1. **Symptom Input**: User types "I have a headache."
2. **AI Analysis**:
   - Extracts `Entity`: "Headache"
   - Asks `Follow-up`: "Is it throbbing or dull?"
3. **Safety Check**:
   - Scans for *Red Flags* (e.g., "worst headache of my life").
   - If found → Trigger Emergency Alert.
4. **Diagnosis**:
   - Generates differential diagnosis.
   - Suggests `Care Pathway`.

---

## 🧠 KEY MINDMAP BRANCHES

### **1. PATIENT JOURNEY**
- **Onboarding**: Profile & Basics
- **Dashboard**: Daily status
- **Consult**: AI Triage -> Doctor

### **2. HEALTH INTELLIGENCE**
- **AI Triage**: Symptom Checker
- **Ayurveda**: Dosha Tracking (Premium)
- **Care Plans**: Daily tasks (Meds, Yoga)

### **3. CARE NETWORK**
- **Discovery**: Search & Filter
- **Booking**: Payments & Slots
- **Records**: History & Prescriptions
```
