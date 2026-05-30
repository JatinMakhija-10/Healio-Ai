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
    activityLevel?: string;
    /** Flat comma-separated string — written for DDI compat */
    medications?: string;
    /** Structured list written by persona builder */
    medicationList?: Array<{ name: string; type: string; duration: string }>;
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

/**
 * Flatten onboarding's nested `vitals`/`lifestyle` sub-objects and legacy camelCase
 * fields into a single flat MedicalProfileRecord so the UI always reads the same keys.
 *
 * Onboarding writes:  `medical_profile.vitals.{age,gender,height,weight}`,
 *                     `medical_profile.lifestyle.{smoking,alcohol,exercise,…}`,
 *                     `medical_profile.drugAllergies`, `medical_profile.foodAllergies`,
 *                     `medical_profile.familyHistory`
 *
 * Persona builder writes flat fields directly.  Both shapes are accepted here.
 */
function flattenMedical(mp: MedicalProfileRecord): MedicalProfileRecord {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = mp as any;
    const vitals   = raw.vitals   ?? {};
    const lifestyle = raw.lifestyle ?? {};

    // Merge drugAllergies + foodAllergies → allergies string
    const mergedAllergies = (() => {
        if (mp.allergies) return mp.allergies;
        const parts = [
            ...(Array.isArray(raw.drugAllergies) ? raw.drugAllergies : []),
            ...(Array.isArray(raw.foodAllergies)  ? raw.foodAllergies  : []),
        ].filter(Boolean);
        return parts.length ? parts.join(", ") : undefined;
    })();

    return {
        ...mp,
        // Vitals: flat field wins, vitals sub-object is fallback
        age:    mp.age    ?? vitals.age,
        gender: mp.gender ?? vitals.gender,
        weight: mp.weight ?? vitals.weight,
        height: mp.height ?? vitals.height,
        // Lifestyle: flat field wins, lifestyle sub-object is fallback
        smoking:       mp.smoking       ?? lifestyle.smoking,
        alcohol:       mp.alcohol       ?? lifestyle.alcohol,
        activityLevel: mp.activityLevel ?? lifestyle.exercise,
        // Allergies merged
        allergies: mergedAllergies,
        // camelCase family_history alias
        family_history: mp.family_history ?? raw.familyHistory,
        // persona_built true for both builder path AND completed onboarding
        persona_built: Boolean(mp.persona_built ?? raw.onboarding_completed),
    };
}

/** True when server `medical_profile` should not be replaced by pending localStorage. */
function serverMedicalIsAuthoritative(serverMp: MedicalProfileRecord): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = serverMp as any;
    if (serverMp.persona_built || raw.onboarding_completed) return true;
    const hasValue = (v: unknown) => {
        if (v === undefined || v === null) return false;
        if (typeof v === "string") return v.trim() !== "";
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "boolean") return v;
        return true;
    };
    // Check both flat and nested forms
    const vitals   = raw.vitals   ?? {};
    const lifestyle = raw.lifestyle ?? {};
    return (
        hasValue(serverMp.conditions) ||
        hasValue(serverMp.allergies) ||
        hasValue(raw.drugAllergies) ||
        hasValue(raw.foodAllergies) ||
        hasValue(serverMp.age)    || hasValue(vitals.age) ||
        hasValue(serverMp.gender) || hasValue(vitals.gender) ||
        hasValue(serverMp.weight) || hasValue(vitals.weight) ||
        hasValue(serverMp.height) || hasValue(vitals.height) ||
        hasValue(serverMp.smoking) || hasValue(lifestyle.smoking) ||
        hasValue(serverMp.alcohol) || hasValue(lifestyle.alcohol) ||
        hasValue(serverMp.medications) ||
        hasValue(serverMp.family_history) || hasValue(raw.familyHistory)
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

    // Normalise nested onboarding shape → flat fields the UI expects
    finalMp = flattenMedical(finalMp);

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
