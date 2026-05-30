import { track } from "@vercel/analytics";

export interface DiagnosisData {
  primaryDiagnosis: string;
  painArea: string;
  intensity: number;
  specialistType: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
}

export interface BookingData {
  doctorId: string;
  specialty: string;
  amount: number;
  consultationType: 'video' | 'chat' | 'in_person';
}

export interface SubscriptionData {
  plan: 'plus' | 'pro';
  amount: number;
  billingPeriod: 'monthly' | 'yearly';
}

export const trackEvent = {
  /**
   * Track when a new consultation conversation is started.
   */
  consultationStarted: (mode: 'voice' | 'text' = 'text') => {
    track("consultation_started", { mode });
  },

  /**
   * Track when a patient complete their clinical diagnostic flow and receives results.
   */
  diagnosisCompleted: (data: DiagnosisData) => {
    track("diagnosis_completed", {
      primary_diagnosis: data.primaryDiagnosis,
      pain_area: data.painArea,
      intensity: data.intensity.toString(),
      specialist_type: data.specialistType,
      urgency_level: data.urgencyLevel,
    });
  },

  /**
   * Track when a high-risk red-flag emergency is detected by the AI.
   */
  emergencyDetected: (condition: string, symptoms: string[]) => {
    track("emergency_detected", {
      condition,
      symptoms: symptoms.join(", "),
    });
  },

  /**
   * Track when a specialist booking is successfully completed.
   */
  doctorBooked: (data: BookingData) => {
    track("doctor_booked", {
      doctor_id: data.doctorId,
      specialty: data.specialty,
      amount: data.amount.toString(),
      consultation_type: data.consultationType,
    });
  },

  /**
   * Track when a subscription has been successfully purchased or upgraded.
   */
  subscriptionUpgraded: (data: SubscriptionData) => {
    track("subscription_upgraded", {
      plan: data.plan,
      amount: data.amount.toString(),
      billing_period: data.billingPeriod,
    });
  },

  /**
   * Track when a user saves a wellness routine to their routine dashboard.
   */
  wellnessRoutineSaved: (routineTitle: string, isAiSuggested: boolean) => {
    track("wellness_routine_saved", {
      routine_title: routineTitle,
      is_ai_suggested: isAiSuggested.toString(),
    });
  },
};
