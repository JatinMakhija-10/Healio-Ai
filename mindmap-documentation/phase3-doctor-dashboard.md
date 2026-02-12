# Healio.AI Mindmap - Phase 3: Doctor Dashboard (Detailed)
## Clinical Workspace & Practice Management

---

## 👨‍⚕️ 1. OVERVIEW & ACCESS
- **URL**: `/doctor`
- **Access Control**: Valid Session + (`role === 'doctor'`) + (`verification_status === 'verified/pending'`)
- **Redirect Logic**: 
  - If `verification_status === 'pending'`, redirects to `/doctor/pending` (restricted view).
  - If `role !== 'doctor'`, redirects to `/login`.
- **Purpose**: The primary workspace for clinicians to manage appointments, patients, and earnings.

---

## 🧭 2. NAVIGATION STRUCTURE (`DoctorSidebar`)
**Visual Framework**:
- **Sidebar**: Dark Gradient (`from-slate-900 to-slate-950`).
- **Brand**: "Healio.AI" + Stethoscope Icon (Teal).
- **Profile**: Bottom-anchored user card with Avatar and Logout.

### **Sidebar Menu Items**
1. **Dashboard**: `/doctor` (Home)
2. **My Schedule**: `/doctor/schedule` (Calendar)
3. **Patients**: `/doctor/patients` (Records)
4. **Inbox**: `/doctor/inbox` (Chat - *Badge: Unread count*)
5. **Analytics**: `/doctor/analytics` (Revenue)
6. **Settings**: `/doctor/settings` (Profile/Availability)

---

## 🩺 3. CLINICAL DASHBOARD (`/doctor`)
**"The Daily Briefing"**

### **A. Header Section**
- **Greeting**: "Good Morning, Dr. [Name]"
- **Status Context**: "You have X consultations today."
- **Quick Actions**:
  - `View Schedule`: Jumps to Calendar.
  - `Quick Consult`: Starts an immediate video session (Teal Button).

### **B. Alerts & Warnings**
- **Profile Incomplete** (Amber): If specific fields (Bio, Specialty) are missing.
- **Verification Pending** (Blue): If admin hasn't approved yet.
- **Urgent Clinical Alerts** (Red): If today's patients have "Red Flags" (e.g., high-risk symptoms).

### **C. Stats Grid (Key Metrics)**
| Metric | Visual | Data Logic |
|--------|--------|------------|
| **Today's Count** | 📅 Teal Icon | Count of appointments `scheduled` for Today |
| **This Week** | 👥 Blue Icon | Count of appointments `scheduled` for curr week |
| **Completed** | ✅ Green Icon | Count of `status === 'completed'` for Today |
| **Earnings** | 🟣 Purple Icon | Sum of `doctor_payout` for current month |

### **D. Today's Signal (Appointment List)**
- **Card**: `AppointmentCard` component.
- **Data**: Patient Name, Time, Chief Complaint.
- **Visuals**:
  - **AI Tag**: "Pending Analysis" or Diagnosis summary.
  - **Urgency**: Red border if `isUrgent === true`.
- **Empty State**: "No Appointments Today" + CTA to Update Availability.

---

## 📅 4. SCHEDULE MANAGEMENT (`/doctor/schedule`)
**Power Tool for Time Management**

### **Interface Components**
- **Calendar View**: `react-big-calendar` implementation.
- **Toolbar**: Month/Week/Day toggle, Today button.
- **Sync Button**: Connects with Google/Outlook Calendar.

### **Booking Workflow (Manual)**
1. **Click "+ New Appointment"** OR Select Calendar Slot.
2. **Modal Opens**: Select Patient (Dropdown) + Date/Time + Notes.
3. **Save**: Triggers `createAppointment` API.
   - Updates DB `appointments` table.
   - Sends confirmation email to Patient.

### **Slot Logic**
- **Availability**: Defined in Settings (e.g., "Mon-Fri 9am-5pm").
- **Conflict Check**: Prevents double-booking same slot.

---

## 👥 5. PATIENT MANAGEMENT (`/doctor/patients`)
**Digital Medical Records (EMR Lite)**

### **List View**
- **Search**: By Name (Real-time filter).
- **Columns**:
  - **Patient**: Avatar + Name + Email.
  - **Role**: Badge (Standard/Premium).
  - **Actions**: Arrow button → View Profile.

### **Patient Details (Drill-down)**
*(Future Scope / In Progress)*
- **History**: Past consultations timeline.
- **Documents**: Uploaded lab reports/prescriptions.
- **Notes**: Private clinical notes (Doctor-only view).

---

## 📈 6. REVENUE & ANALYTICS (`/doctor/analytics`)
**Financial Health Monitor**

### **A. Money Flow Metrics**
- **Total Revenue**: Sum of `paid` invoices.
- **Pending**: Sum of `pending` invoices (work done, not yet paid).
- **Approved**: Sum of `processing` invoices (on way to bank).

### **B. Invoice Status Breakdown**
- **Paid** (Green): Validated and transferred.
- **Pending** (Amber): Awaiting Admin approval.
- **Approved** (Blue): Approved by Admin, processing via Stripe/Razorpay.

### **C. Performance Stats**
- **Total Consultations**: Number of completed sessions.
- **Paid Rate**: % of invoices successfully paid.
- **Avg per Consult**: Total Revenue / Total Consultations.

### **D. Payout History**
- **Table**: Recent bank transfers.
- **Fields**: Transaction ID, Date, Amount (₹), Status Badge.

---

## 🔗 7. RELATIONSHIP DIAGRAM
**Doctor System Integrations**

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│  DOCTOR ACTION  │       │     SYSTEM LOGIC     │       │   EXTERNAL / DB │
└────────┬────────┘       └──────────┬───────────┘       └────────┬────────┘
         │                           │                          │
         │ (Set Avail.)              │ (Update slots)           │
         ├──────────────────────────►│─────────────────────────►│ [DB] Availability
         │                           │                          │
         │ (Join Call)               │ (Video Handshake)        │
         ├──────────────────────────►│◄────────────────────────►│ WebRTC / Daily.co
         │                           │                          │
         │ (Write Rx)                │ (Generate PDF)           │
         ├──────────────────────────►│─────────────────────────►│ [DB] Prescriptions
         │                           │                          │
         │ (Finish Call)             │ (Trigger Invoice)        │
         ├──────────────────────────►│─────────────────────────►│ [DB] Invoices
         │                           │                          │
         │ (View $$)                 │ (Calc Totals)            │
         ├──────────────────────────►│◄─────────────────────────┤ [DB] Transactions
         │                           │                          │
         │ (Chat)                    │ (Realtime Msg)           │
         ├──────────────────────────►│─────────────────────────►│ [DB] Messages
```

---

## 🧠 KEY MINDMAP BRANCHES

### **1. WORKSPACE**
- **Sidebar**: Key Navigation
- **Header**: Alerts & Actions
- **Dashboard**: Daily Overview

### **2. CLINICAL OPS**
- **Schedule**: Calendar & Slots
- **Patients**: Record Lookup
- **Consultation**: Video & Notes (Core Loop)

### **3. BUSINESS OPS**
- **Revenue**: Earnings Tracking
- **Invoices**: Status Monitoring
- **Payouts**: Bank Transfers

### **4. SETTINGS**
- **Profile**: Bio, Specialty, Fee
- **Verification**: License Upload
- **Availability**: Time Rules
```
