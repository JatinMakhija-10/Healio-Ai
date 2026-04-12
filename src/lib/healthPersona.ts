import type { User } from "@supabase/supabase-js";

/** Shape of `user_metadata.medical_profile` across onboarding + prakriti flows */
export type MedicalProfileRecord = {
    persona_built?: boolean;
    age?: string | number;
    gender?: string;
    weight?: string | number;
    height?: string | number;
    conditions?: string[];
    allergies?: string;
    smoking?: string;
    alcohol?: string;
    medications?: string;
    pregnant?: boolean;
    isPregnant?: boolean;
    kidney_liver_disease?: boolean;
    hasKidneyLiverDisease?: boolean;
    recent_surgery?: string | boolean;
    /** String or list depending on writer */
    family_history?: string | string[];
};

export type ResolvedHealthPersona = {
    /** Merged view for header + cards: server metadata, pending fills only missing top-level keys; `medical_profile` resolved below */
    metadata: Record<string, unknown>;
    medical: MedicalProfileRecord;
    ayurvedic: unknown;
    isPersonaBuilt: boolean;
    age: string | number | undefined;
    gender: string | undefined;
    weight: string | number | undefined;
    height: string | number | undefined;
};

function pickDisplay(top: unknown, nested: unknown): string | number | undefined {
    if (top !== undefined && top !== null && top !== "") return top as string | number;
    if (nested !== undefined && nested !== null && nested !== "") return nested as string | number;
    return undefined;
}

function normalizeMedical(raw: unknown): MedicalProfileRecord {
    if (!raw || typeof raw !== "object") return {};
    return { ...(raw as MedicalProfileRecord) };
}

/** True when server `medical_profile` should not be replaced by pending localStorage. */
function serverMedicalIsAuthoritative(serverMp: MedicalProfileRecord): boolean {
    if (serverMp.persona_built) return true;
    const hasValue = (v: unknown) => {
        if (v === undefined || v === null) return false;
        if (typeof v === "string") return v.trim() !== "";
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "boolean") return v;
        return true;
    };
    return (
        hasValue(serverMp.conditions) ||
        hasValue(serverMp.allergies) ||
        hasValue(serverMp.age) ||
        hasValue(serverMp.gender) ||
        hasValue(serverMp.weight) ||
        hasValue(serverMp.height) ||
        hasValue(serverMp.smoking) ||
        hasValue(serverMp.alcohol) ||
        hasValue(serverMp.medications) ||
        hasValue(serverMp.family_history)
    );
}

/**
 * Merge Supabase `user_metadata` with optional pending onboarding blob from localStorage.
 * Pending data never overwrites an authoritative server `medical_profile` (persona or any filled medical fields).
 */
export function resolveHealthPersona(
    user: User | null,
    pendingLocal: Record<string, unknown> | null | undefined
): ResolvedHealthPersona {
    const server = { ...(user?.user_metadata || {}) } as Record<string, unknown>;
    const serverMp = normalizeMedical(server.medical_profile);

    const pending =
        pendingLocal && typeof pendingLocal === "object" ? pendingLocal : null;
    const pendingMp = pending ? normalizeMedical(pending["medical_profile"]) : {};

    let finalMp: MedicalProfileRecord;
    if (serverMedicalIsAuthoritative(serverMp)) {
        finalMp = { ...serverMp };
    } else {
        finalMp = { ...pendingMp, ...serverMp };
    }

    const metadata: Record<string, unknown> = { ...server, medical_profile: finalMp };

    if (pending) {
        for (const key of Object.keys(pending)) {
            if (key === "medical_profile") continue;
            const sv = metadata[key];
            const empty = sv === undefined || sv === null || sv === "";
            if (empty && pending[key] !== undefined && pending[key] !== null && pending[key] !== "") {
                metadata[key] = pending[key];
            }
        }
    }

    const medical = normalizeMedical(metadata.medical_profile);
    const ayurvedic = metadata.ayurvedic_profile;

    return {
        metadata,
        medical,
        ayurvedic,
        isPersonaBuilt: Boolean(medical.persona_built),
        age: pickDisplay(metadata.age, medical.age),
        gender: pickDisplay(metadata.gender, medical.gender) as string | undefined,
        weight: pickDisplay(metadata.weight, medical.weight),
        height: pickDisplay(metadata.height, medical.height),
    };
}

/** Format family_history for display (string or joined array). */
export function formatFamilyHistory(fh: string | string[] | undefined): string | null {
    if (fh === undefined || fh === null) return null;
    if (Array.isArray(fh)) return fh.length ? fh.join(", ") : null;
    const s = String(fh).trim();
    return s || null;
}
