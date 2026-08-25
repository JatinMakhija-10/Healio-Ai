'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';


export default function LoginPage() {
    const router = useRouter();
    const { signInWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) throw signInError;

            if (session) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                // If no profile exists yet, still allow patient dashboard access
                if (!profile) {
                    router.push('/dashboard');
                    return;
                }

                if (profile.role === 'patient') {
                    router.push('/dashboard');
                } else if (profile.role === 'doctor') {
                    const { data: doctorProfile } = await supabase
                        .from('doctors')
                        .select('verification_status, is_profile_complete')
                        .eq('user_id', session.user.id)
                        .maybeSingle();

                    if (!doctorProfile?.is_profile_complete) {
                        router.push('/doctor/onboarding');
                    } else {
                        router.push('/doctor');
                    }
                } else if (profile.role === 'admin') {
                    router.push('/admin');
                } else {
                    // Default fallback for unknown roles
                    router.push('/dashboard');
                }
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError('');
        try {
            await signInWithGoogle();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setError(error.message || 'Failed to sign in with Google');
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F6F2] py-12 px-4 overflow-y-auto">
            {/* Card */}
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg shadow-[#1A1A2E]/8 p-8 border border-[#DAD7CF]">
                {/* AroviaMark + Brand Header */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 rounded-[8px] bg-[#C8E7DA] opacity-50" />
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-[8px] border border-[#B8DED0] bg-white shadow-sm">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                                <path d="M14 3C9.5 3 5.5 6.5 5.5 11.5C5.5 17.5 14 25 14 25C14 25 22.5 17.5 22.5 11.5C22.5 6.5 18.5 3 14 3Z" fill="#0F6E56" />
                                <path d="M14 8C12 10 11 13 12 16C13 13 15 11 18 10C16.5 8.5 15 7.5 14 8Z" fill="#E1F5EE" />
                            </svg>
                        </div>
                    </div>
                    <h1 style={{ fontFamily: "var(--font-dm-serif), serif", fontWeight: 400 }} className="text-2xl text-[#1A1A2E] tracking-tight">Welcome back</h1>
                    <p className="text-[#6B6B6B] mt-1.5 text-sm">Sign in to your Arovia account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#F7F6F2] border border-[#DAD7CF] rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] transition-all text-sm text-[#1A1A2E] placeholder:text-[#9CA3AF]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block text-sm font-medium text-[#555555]">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#F7F6F2] border border-[#DAD7CF] rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] transition-all text-sm text-[#1A1A2E]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#1A1A2E] text-white rounded-full text-sm font-semibold hover:bg-[#0F6E56] disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:opacity-90 mt-2"
                    >
                        {loading ? 'Signing in...' : 'Login'}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-white text-slate-500 font-medium tracking-wide uppercase">Or continue with</span>
                    </div>
                </div>

                {/* Google Sign In */}
                <button
                    onClick={handleGoogleLogin}
                    type="button"
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all bg-white text-slate-700 text-sm font-semibold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {googleLoading ? (
                        <>
                            <svg className="w-4 h-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Connecting to Google...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 4.63c1.61 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Sign in with Google
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-slate-500 mt-5">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-teal-600 font-semibold hover:text-teal-700 hover:underline">
                        Sign up
                    </Link>
                </p>

                {/* Legal Links Footer */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
                    <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
                    <Link href="/medical-disclaimer" className="hover:text-slate-600 transition-colors">Medical Disclaimer</Link>
                </div>
            </div>
        </div>
    );
}
