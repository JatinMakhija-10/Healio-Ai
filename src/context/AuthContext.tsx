"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { UserRole, getUserRole, getDashboardRoute } from "@/lib/rbac";

// Profile types matching Supabase schema
export interface Profile {
    id: string;
    email: string | null;
    role: string;
    full_name: string | null;
    phone: string | null;
    created_at: string;
    updated_at: string;
}

export interface DoctorProfile {
    id: string;
    user_id: string;
    specialization: string | null;
    license_number: string | null;
    experience_years: number | null;
    bio: string | null;
    consultation_fee: number | null;
    verification_status: string;
    verified: boolean;
    verified_at: string | null;
    verified_by: string | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    role: UserRole;
    profile: Profile | null;
    doctorProfile: DoctorProfile | null;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    updateDoctorProfile: (updates: Partial<DoctorProfile>) => Promise<void>;
    signup: (email: string, password: string, role?: UserRole) => Promise<void>;
    signInWithMagicLink: (email: string, role?: UserRole) => Promise<{ success: boolean; message: string }>;
    signInWithGoogle: (role?: UserRole) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
    const router = useRouter();

    // Derive role from user
    const role = getUserRole(user);

    // Fetch profile data from Supabase
    const fetchProfile = async (userId: string) => {
        try {
            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // If user is a doctor, fetch doctor profile
            if (profileData?.role === 'doctor') {
                const { data: doctorData, error: doctorError } = await supabase
                    .from('doctors')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (doctorError && doctorError.code !== 'PGRST116') { // Ignore "not found" error
                    console.error('Error fetching doctor profile:', doctorError);
                }
                setDoctorProfile(doctorData);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setDoctorProfile(null);
            }
            setLoading(false);
        });

        // Set up real-time subscriptions for profile changes
        let profileSubscription: any = null;
        let doctorSubscription: any = null;

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                // Subscribe to profile changes
                profileSubscription = supabase
                    .channel('profile_changes')
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`
                    }, (payload) => {
                        if (payload.new) {
                            setProfile(payload.new as Profile);
                        }
                    })
                    .subscribe();

                // Subscribe to doctor profile changes if applicable
                if (user.user_metadata?.role === 'doctor') {
                    doctorSubscription = supabase
                        .channel('doctor_profile_changes')
                        .on('postgres_changes', {
                            event: '*',
                            schema: 'public',
                            table: 'doctors',
                            filter: `user_id=eq.${user.id}`
                        }, (payload) => {
                            if (payload.new) {
                                setDoctorProfile(payload.new as DoctorProfile);
                            }
                        })
                        .subscribe();
                }
            }
        });

        return () => {
            authSubscription.unsubscribe();
            if (profileSubscription) {
                supabase.removeChannel(profileSubscription);
            }
            if (doctorSubscription) {
                supabase.removeChannel(doctorSubscription);
            }
        };
    }, []);

    const signup = async (email: string, password: string, signupRole: UserRole = 'patient') => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Redirect URL for email confirmation (adjust per environment if needed)
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    role: signupRole,
                },
            },
        });
        if (error) throw error;

        // Check if session exists (Auto-login) or if email confirmation is required
        if (data.session) {
            // Doctors go to onboarding, patients go to onboarding
            if (signupRole === 'doctor') {
                router.push("/doctor/onboarding");
            } else {
                router.push("/onboarding");
            }
        } else {
            // Email confirmation required
            // You might want to show a toast here or redirect to a "Check Email" page
            // For now, we'll let the UI handle the "success" state (usually shows "Check email")
            console.log("Signup successful, check email for confirmation.");
            // Optionally redirect to login or check-email page
            // router.push("/login?message=check_email");
        }
    };

    const signInWithMagicLink = async (email: string, signupRole: UserRole = 'patient') => {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        role: signupRole,
                    },
                },
            });

            if (error) throw error;

            return {
                success: true,
                message: 'Check your email for the magic link to sign in!'
            };
        } catch (error) {
            console.error('Magic link error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to send magic link'
            };
        }
    };

    const signInWithGoogle = async (signupRole: UserRole = 'patient') => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        if (error) throw error;
    };

    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        // Force a session refresh to ensure we have latest metadata
        const { data: { user } } = await supabase.auth.getUser();

        const userRole = user?.user_metadata?.role || 'patient';

        // Route based on role
        if (userRole === 'admin') {
            router.push('/admin');
        } else if (userRole === 'doctor') {
            router.push('/doctor');
        } else {
            // Patient
            const hasCompletedOnboarding = user?.user_metadata?.onboarding_completed;
            if (hasCompletedOnboarding) {
                router.push("/dashboard");
            } else {
                router.push("/onboarding");
            }
        }
    };

    // Update profile data
    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;

        // Optimistic update
        setProfile(prev => prev ? { ...prev, ...updates } : null);
    };

    // Update doctor profile data
    const updateDoctorProfile = async (updates: Partial<DoctorProfile>) => {
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('doctors')
            .update(updates)
            .eq('user_id', user.id);

        if (error) throw error;

        // Optimistic update
        setDoctorProfile(prev => prev ? { ...prev, ...updates } : null);
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Error signing out", error);

        // Clear application data to prevent leakage between users
        localStorage.removeItem('healio_consultation_history');
        localStorage.removeItem('healio_pending_profile');
        localStorage.removeItem('healio_pref_ayurvedic');
        localStorage.removeItem('healio_pref_uncertainty');
        localStorage.removeItem('healio_pref_detailed');

        router.push("/");
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            role,
            profile,
            doctorProfile,
            updateProfile,
            updateDoctorProfile,
            signup,
            signInWithMagicLink,
            signInWithGoogle,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

/**
 * Hook to require a specific role, redirects if not authorized
 */
export const useRequireRole = (requiredRole: UserRole) => {
    const { user, loading, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            if (role !== requiredRole && role !== 'admin') {
                // Redirect to appropriate dashboard
                router.push(getDashboardRoute(role));
            }
        } else if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, role, requiredRole, router]);

    return { user, loading, role, isAuthorized: role === requiredRole || role === 'admin' };
};
