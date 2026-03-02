// PHASE 1 FEATURE FLAG SYSTEM
// ============================
// This config controls which features are visible in the app.
// Phase 1 = lean homeopathy consultation tool only.
// To enable Phase 2 features, flip the relevant boolean to `true`.

export const PHASE_CONFIG = {
    // Navigation & Sections
    showLearnSection: false,        // Phase 2
    showWellnessSection: false,     // Phase 2
    showVideoConsult: false,        // Phase 2
    showDoctorMarketplace: false,   // Phase 2
    showFamilyProfiles: false,      // Phase 2
    showPathway: false,             // Phase 2
    showInbox: false,               // Phase 2
    showPatientAnalytics: false,    // Phase 2
    showVideos: false,              // Phase 2

    // Dashboard Widgets
    showDoshaWidgets: false,        // Phase 2 — Prakriti/Vikriti/Dosha
    showDailyTipCard: false,        // Phase 2
    showPainTrend: false,           // Phase 2
    showAppointments: false,        // Phase 2

    // Diagnosis Card
    showBookDoctor: false,          // Phase 2
    showModernMedicine: false,      // Phase 2
    showAyurveda: false,            // Phase 2
    showYogaExercise: false,        // Phase 2
    showVideoContent: false,        // Phase 2
    showClinicalScores: false,      // Phase 2 — ICD-10, Wells Score, HEART Score

    // Onboarding
    showExtendedOnboarding: false,  // Phase 2 — Steps 2-7 (vitals, family, safety, etc.)
    showPrakritiAssessment: false,  // Phase 2

    // Doctor Portal
    showDoctorPortal: false,        // Phase 2

    // Admin
    showAdminPanel: false,          // Phase 2 (keep code, hide access)
};
