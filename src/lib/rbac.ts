import { User } from '@supabase/supabase-js';

export type UserRole = 'patient' | 'doctor' | 'admin';

/**
 * Get the role of the current user from their metadata or profile.
 */
export function getUserRole(user: User | null): UserRole {
    if (!user) return 'patient';

    // Check user_metadata first (set during signup/update)
    const metadataRole = user.user_metadata?.role as UserRole | undefined;
    if (metadataRole && ['patient', 'doctor', 'admin'].includes(metadataRole)) {
        return metadataRole;
    }

    // Default to patient
    return 'patient';
}

/**
 * Check if user is a doctor
 */
export function isDoctor(user: User | null): boolean {
    return getUserRole(user) === 'doctor';
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: User | null): boolean {
    return getUserRole(user) === 'admin';
}

/**
 * Check if user is a patient
 */
export function isPatient(user: User | null): boolean {
    return getUserRole(user) === 'patient';
}

/**
 * Get the home dashboard route based on user role
 */
export function getDashboardRoute(role: UserRole): string {
    switch (role) {
        case 'admin':
            return '/admin';
        case 'doctor':
            return '/doctor';
        case 'patient':
        default:
            return '/dashboard';
    }
}

/**
 * Check if a route is allowed for a given role
 */
export function isRouteAllowed(pathname: string, role: UserRole): boolean {
    // Admin routes
    if (pathname.startsWith('/admin')) {
        return role === 'admin';
    }

    // Doctor routes
    if (pathname.startsWith('/doctor')) {
        return role === 'doctor' || role === 'admin';
    }

    // Patient dashboard routes
    if (pathname.startsWith('/dashboard')) {
        return role === 'patient' || role === 'admin';
    }

    // Public routes are always allowed
    return true;
}

/**
 * Role display names for UI
 */
export const roleDisplayNames: Record<UserRole, string> = {
    patient: 'Patient',
    doctor: 'Doctor',
    admin: 'Administrator',
};

/**
 * Role badge colors for UI
 */
export const roleBadgeColors: Record<UserRole, { bg: string; text: string }> = {
    patient: { bg: 'bg-blue-100', text: 'text-blue-700' },
    doctor: { bg: 'bg-teal-100', text: 'text-teal-700' },
    admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
};
