"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { UserRole, getUserRole, getDashboardRoute } from "@/lib/rbac";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    role: UserRole;
    signup: (email: string, password: string, role?: UserRole) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Derive role from user
    const role = getUserRole(user);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signup = async (email: string, password: string, signupRole: UserRole = 'patient') => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: signupRole,
                },
            },
        });
        if (error) throw error;

        // Doctors go to onboarding, patients go to onboarding
        if (signupRole === 'doctor') {
            router.push("/doctor/onboarding");
        } else {
            router.push("/onboarding");
        }
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

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Error signing out", error);
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, loading, role, signup, login, logout }}>
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
