export interface Patient {
    id: string;
    name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    email: string;
    phone: string;
    address: string;
    avatar?: string;
    bloodGroup: string;
    allergies: string[];
    condition: string;
    status: "Active" | "New" | "Follow-up" | "Stable" | "Recovered";
    risk: "High" | "Medium" | "Low";
    lastVisit: string;
    prakriti: string;
    vikriti: string;
    chiefComplaint: string;
    aiDiagnosis: string;
    aiConfidence: number;
    hasRedFlags: boolean;
    upcomingAppointment?: {
        id: string;
        date: Date;
        type: "Video Consult" | "In-Clinic" | "Follow-up";
        duration: number; // minutes
        status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled_by_patient' | 'cancelled_by_doctor' | 'no_show';
    };
    notes?: {
        subjective: string;
        objective: string;
        assessment: string;
        plan: string;
    };
    recentHealthTrends?: {
        trend: "Improving" | "Stable" | "Worsening";
        description: string;
    }[];
}

export const MOCK_PATIENTS: Patient[] = [
    {
        id: "PT-1001",
        name: "Aarav Patel",
        age: 42,
        gender: "Male",
        email: "aarav.patel@example.com",
        phone: "+91 98765 12345",
        address: "Colaba, Mumbai, MH",
        bloodGroup: "B+",
        allergies: ["Sulfa Drugs"],
        condition: "Hypertension",
        status: "Follow-up",
        risk: "Medium",
        lastVisit: "2 weeks ago",
        prakriti: "Pitta-Kapha",
        vikriti: "Pitta Aggravation",
        chiefComplaint: "Recurring headaches in the evening, mild dizziness.",
        aiDiagnosis: "Essential Hypertension",
        aiConfidence: 0.89,
        hasRedFlags: false,
        upcomingAppointment: {
            id: "apt-1001",
            date: new Date(new Date().setHours(10, 0, 0, 0)), // Today at 10 AM
            type: "Video Consult",
            duration: 30,
            status: "confirmed"
        },
        recentHealthTrends: [
            { trend: "Stable", description: "BP readings stabilized at 135/85 after medication adjustment." }
        ]
    },
    {
        id: "PT-1002",
        name: "Priya Sharma",
        age: 29,
        gender: "Female",
        email: "priya.sharma@example.com",
        phone: "+91 91234 56789",
        address: "Koramangala, Bangalore, KA",
        bloodGroup: "O+",
        allergies: ["Peanuts", "Dust Mites"],
        condition: "Migraine",
        status: "Active",
        risk: "Low",
        lastVisit: "2 days ago",
        prakriti: "Vata-Pitta",
        vikriti: "Vata Imbalance",
        chiefComplaint: "Pulsating headache on left side, sensitivity to light.",
        aiDiagnosis: "Migraine with Aura",
        aiConfidence: 0.94,
        hasRedFlags: false,
        upcomingAppointment: {
            id: "apt-1002",
            date: new Date(new Date().setHours(14, 30, 0, 0)), // Today at 2:30 PM
            type: "Video Consult",
            duration: 45,
            status: "confirmed"
        }
    },
    {
        id: "PT-1003",
        name: "Vikram Singh",
        age: 55,
        gender: "Male",
        email: "vikram.singh@example.com",
        phone: "+91 99887 77665",
        address: "Connaught Place, New Delhi, DL",
        bloodGroup: "A-",
        allergies: [],
        condition: "Type 2 Diabetes",
        status: "Active",
        risk: "High",
        lastVisit: "1 month ago",
        prakriti: "Kapha",
        vikriti: "Kapha Accumulation",
        chiefComplaint: "Increased thirst, fatigue, and blurry vision.",
        aiDiagnosis: "Uncontrolled Diabetes Mellitus",
        aiConfidence: 0.91,
        hasRedFlags: true,
        upcomingAppointment: {
            id: "apt-1003",
            date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
            type: "In-Clinic",
            duration: 60,
            status: "scheduled"
        }
    },
    {
        id: "PT-1004",
        name: "Ananya Gupta",
        age: 34,
        gender: "Female",
        email: "ananya.g@example.com",
        phone: "+91 88776 65544",
        address: "Salt Lake City, Kolkata, WB",
        bloodGroup: "AB+",
        allergies: ["Penicillin"],
        condition: "Hypothyroidism",
        status: "Stable",
        risk: "Low",
        lastVisit: "3 months ago",
        prakriti: "Kapha-Vata",
        vikriti: "Kapha Aggravation",
        chiefComplaint: "Weight gain despite low appetite, lethargy.",
        aiDiagnosis: "Hypothyroidism",
        aiConfidence: 0.96,
        hasRedFlags: false
    },
    {
        id: "PT-1005",
        name: "Rohan Das",
        age: 24,
        gender: "Male",
        email: "rohan.das@example.com",
        phone: "+91 77665 54433",
        address: "Hinjewadi, Pune, MH",
        bloodGroup: "O-",
        allergies: ["None"],
        condition: "Anxiety & Stress",
        status: "New",
        risk: "Medium",
        lastVisit: "Yesterday",
        prakriti: "Vata",
        vikriti: "Vata-Pittam (Stress)",
        chiefComplaint: "Insomnia, racing thoughts, stomach churning.",
        aiDiagnosis: "Generalized Anxiety Disorder",
        aiConfidence: 0.82,
        hasRedFlags: false,
        upcomingAppointment: {
            id: "apt-1005",
            date: new Date(new Date().setHours(16, 0, 0, 0)), // Today at 4:00 PM
            type: "Video Consult",
            duration: 45,
            status: "scheduled"
        }
    },
    {
        id: "PT-1006",
        name: "Meera Reddy",
        age: 62,
        gender: "Female",
        email: "meera.reddy@example.com",
        phone: "+91 66554 43322",
        address: "Banjara Hills, Hyderabad, TS",
        bloodGroup: "B+",
        allergies: ["Shellfish"],
        condition: "Osteoarthritis",
        status: "Follow-up",
        risk: "Medium",
        lastVisit: "1 week ago",
        prakriti: "Vata",
        vikriti: "Vata (Degenerative)",
        chiefComplaint: "Joint pain in knees, worse in morning.",
        aiDiagnosis: "Osteoarthritis",
        aiConfidence: 0.88,
        hasRedFlags: false,
        upcomingAppointment: {
            id: "apt-1006",
            date: new Date(new Date().setDate(new Date().getDate() + 2)), // Day after tomorrow
            type: "In-Clinic",
            duration: 30,
            status: "scheduled"
        }
    },
    {
        id: "PT-1007",
        name: "Kabir Khan",
        age: 8,
        gender: "Male",
        email: "parent.khan@example.com",
        phone: "+91 55443 32211",
        address: "Civil Lines, Jaipur, RJ",
        bloodGroup: "A+",
        allergies: ["Dairy", "Pollen"],
        condition: "Asthma",
        status: "Active",
        risk: "High",
        lastVisit: "2 days ago",
        prakriti: "Kapha-Pitta",
        vikriti: "Kapha (Respiratory)",
        chiefComplaint: "Wheezing after playing, tight chest.",
        aiDiagnosis: "Pediatric Asthma Exacerbation",
        aiConfidence: 0.93,
        hasRedFlags: true
    },
    {
        id: "PT-1008",
        name: "Saanvi Iyer",
        age: 27,
        gender: "Female",
        email: "saanvi.iyer@example.com",
        phone: "+91 44332 21100",
        address: "Mylapore, Chennai, TN",
        bloodGroup: "O+",
        allergies: ["None"],
        condition: "PCOS",
        status: "New",
        risk: "Low",
        lastVisit: "3 weeks ago",
        prakriti: "Kapha",
        vikriti: "Kapha-Vata Blockage",
        chiefComplaint: "Irregular cycles, acne flare-ups.",
        aiDiagnosis: "Polycystic Ovarian Syndrome",
        aiConfidence: 0.85,
        hasRedFlags: false
    }
];

export function getPatientById(id: string): Patient | undefined {
    return MOCK_PATIENTS.find(p => p.id === id);
}

export function getUpcomingAppointments() {
    return MOCK_PATIENTS
        .filter(p => p.upcomingAppointment)
        .map(p => ({
            id: p.upcomingAppointment!.id,
            patientName: p.name,
            patientAvatar: p.avatar,
            scheduledAt: p.upcomingAppointment!.date,
            duration: p.upcomingAppointment!.duration,
            status: p.upcomingAppointment!.status,

            // Clinical context
            chiefComplaint: p.chiefComplaint,
            aiDiagnosis: p.aiDiagnosis,
            aiConfidence: p.aiConfidence,
            hasRedFlags: p.hasRedFlags,
            isUrgent: p.risk === 'High',

            // Extra fields for logic if needed
            patientId: p.id,
        }))
        .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}
