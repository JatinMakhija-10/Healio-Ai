# Healio Phase 1 Product Requirements Document (PRD)

## 🎯 Project Context
**Healio** is an AI-driven digital health platform. This document outlines the scope strictly for **Phase 1**. Anything outside this scope is explicitly forbidden to keep the project simple, clean, and focused.

---

## 🔴 PHASE 1 GOLDEN RULE
**Homeopathy consultations only.** No Ayurveda. No Allopathy. No doctor marketplace. No payments. No advanced analytics. Just a clean, guided, conversational homeopathy consultation experience.

---

## 🧱 Scope of Work

### 1. User Onboarding (Simple)
- Name, Age, Gender
- Basic health preferences
- **Exclude:** Complex Prakriti/Dosha quizzes (reserved for Phase 2)
- Clean, minimal, 2–3 step flow
- Store data in Supabase `profiles` table

---

### 2. Dashboard (Minimal)
A clean, simple dashboard with exactly 3 elements:
1. **"Start New Consultation"** — Primary CTA, prominent button.
2. **"My Consultations"** — List of past/ongoing consultations (read-only, basic view).
3. **"My Profile"** — Name, age, basic health info.

**Design Rules:**
- No clutter. No widgets. No charts.
- Mobile-first responsive layout.
- Soft, calming color palette (whites, light greens, soft blues).
- Use Tailwind CSS utility classes exclusively.

---

### 3. New Consultation Flow
Step-by-step guided flow when starting a new consultation:

- **Step 1 — Chief Complaint:** Dropdown to select a primary symptom from a curated list of 30–40 common homeopathic complaints (e.g., Headache, Cold & Cough, Fever, Acidity, Skin rash, Anxiety, Insomnia, Joint pain, Digestive issues, Fatigue). Provide a free-text input as a fallback.
- **Step 2 — Symptom Details (Dropdowns):**
  - Duration: Today / 2–3 days / 1 week / 2 weeks / 1 month / More than 1 month
  - Severity: Mild / Moderate / Severe
  - Time of day when worse: Morning / Afternoon / Evening / Night / No pattern
  - Better or worse with: Heat / Cold / Rest / Movement / Food / No pattern
- **Step 3 — Additional Symptoms:** Multi-select checkboxes for associated symptoms (e.g., Nausea, Fatigue, Headache, Chills, Sweating, Loss of appetite).
- **Step 4 — Hand off to AI Bot:** All collected data is passed as context to the AI chatbot, which takes over the consultation conversationally.

---

### 4. AI Chatbot (The Core of Phase 1)

**Personality:**
- Warm, supportive, human-like (NOT robotic or clinical).
- Speaks in simple English (no jargon).
- Patient and encouraging.
- Asks one question at a time to avoid overwhelming the user.

**Chatbot Flow:**
1. **Greeting:** Greet the user by name (e.g., *"Hi [Name], I'm here to help. Let's understand what you're going through."*)
2. **Acknowledge:** Acknowledge the selected chief complaint.
3. **Investigation:** Ask 4–6 follow-up questions using the homeopathic case-taking methodology:
   - *Modalities:* What makes it better or worse?
   - *Sensations:* How does the pain/discomfort feel? (burning, stabbing, dull, throbbing)
   - *Mental/Emotional state:* Any stress, anxiety, or mood changes?
   - *Sleep:* How is your sleep?
   - *Appetite:* Any changes in appetite or thirst?
4. **Conclusion:** After gathering sufficient information, provide:
   - A summary of the user's experience.
   - 2–3 possible homeopathic remedies with a brief explanation.
   - Lifestyle suggestions.
   - **Disclaimer:** *"This is for informational purposes only. Please consult a qualified homeopathic practitioner for treatment."*

**Technical Implementation:**
- Use **Claude API (claude-sonnet-4-6)** via Anthropic API.
- **System Prompt Instructions:**
  - "You are a compassionate homeopathic health assistant named Healio."
  - "Only discuss homeopathy. Do not recommend allopathic drugs or Ayurvedic treatments."
  - "Never make a definitive medical diagnosis."
  - "Always include a disclaimer at the end."
  - "Ask one question at a time. Be warm and conversational."
  - "Use the following patient context to personalize your responses: {patient_context}"
- Pass the full consultation form data as context in the first system message.
- Maintain full conversation history in state for multi-turn dialogue.

---

### 5. Voice-to-Text Input
- Add a microphone icon button inside the chat input field.
- **On click:** Activate the browser's Web Speech API (`SpeechRecognition`).
- Convert spoken words to text and populate the chat input field.
- Show a visual indicator (pulsing red dot) when recording is active.
- **On stop:** Auto-submit or allow the user to edit before sending.
- **Fallback:** Gracefully hide the microphone button if the browser does not support the Speech API.

---

### 6. Consultation History (Basic View)
- List of past consultations displaying: Date, Chief Complaint, Status (Completed / In Progress).
- Click to view the full chat transcript (read-only).
- Store in Supabase `consultations` table.

---

## 🗄️ Database Schema (Supabase)

```sql
-- User profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  full_name TEXT,
  age INTEGER,
  gender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultation sessions
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  chief_complaint TEXT,
  form_data JSONB, -- All dropdown selections from the form
  status TEXT DEFAULT 'in_progress', -- in_progress | completed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID REFERENCES consultations(id),
  role TEXT, -- 'user' | 'assistant'
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 Design Guidelines
- **Font:** Inter or Poppins (clean, modern, readable).
- **Colors:**
  - Primary: Soft green `#4CAF7D` or teal `#2A9D8F`
  - Background: Off-white `#F9FAFB`
  - Text: Dark gray `#1F2937`
  - Accent: Warm amber `#F4A261` for CTAs
- **Components:** Rounded corners, soft shadows, generous whitespace.
- **Mobile-first:** All screens must work perfectly on mobile.
- **Theme:** No dark mode in Phase 1 (keep it simple).

---

## 🚫 EXCLUSIONS (DO NOT BUILD IN PHASE 1)
- ❌ Ayurveda or Allopathy features
- ❌ Doctor marketplace or booking
- ❌ Payment gateway
- ❌ Advanced analytics or heatmaps
- ❌ Prakriti/Dosha quiz
- ❌ Admin dashboard
- ❌ Family profiles
- ❌ Epidemic intelligence
- ❌ PDF report generation
- ❌ Video consultations

---

## ✅ PHASE 1 DONE CRITERIA
- [ ] User can sign up and onboard in under 2 minutes
- [ ] User can start a new homeopathy consultation
- [ ] Dropdown selections guide the user smoothly
- [ ] Voice-to-text works on the chat input
- [ ] AI bot responds warmly, asks follow-up questions one at a time
- [ ] Bot provides homeopathic remedy suggestions with disclaimer
- [ ] User can view past consultations
- [ ] All data saved to Supabase
- [ ] Works well on mobile

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI:** Anthropic Claude API (claude-sonnet-4-6)
- **Database & Auth:** Supabase (PostgreSQL + Auth)
- **Voice:** Web Speech API (browser-native)
- **Deployment:** Vercel
