
export const SPECIALIZATIONS = [
    "Ayurveda",
    "General Medicine",
    "Dermatology",
    "Cardiology",
    "Gynecology",
    "Pediatrics",
    "Neurology",
    "Orthopedics",
    "Psychiatry",
    "Nutrition & Dietetics",
    "Homeopathy",
    "Physiotherapy",
    "Dentistry"
] as const;

export type Specialization = typeof SPECIALIZATIONS[number];
