"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Stethoscope, Loader2, ArrowRight, GraduationCap, Shield, Users } from "lucide-react";
import { SignupSchema, type SignupInput } from "@/lib/validation/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

export default function DoctorSignupPage() {
    const { signup } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState("");
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        watch
    } = useForm<SignupInput>({
        resolver: zodResolver(SignupSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: ""
        },
        mode: "onChange"
    });

    const passwordValue = watch("password");
    const hasMinLen = passwordValue.length >= 8;
    const hasUpper = /[A-Z]/.test(passwordValue);
    const hasLower = /[a-z]/.test(passwordValue);
    const hasNumber = /\d/.test(passwordValue);

    useEffect(() => {
        router.prefetch("/doctor/register");
    }, [router]);

    const onSubmit = async (data: SignupInput) => {
        setAuthError("");
        setIsLoading(true);

        try {
            // Pass 'doctor' as the role
            await signup(data.email, data.password, 'doctor');
        } catch (err: any) {
            setAuthError(err.message || "Failed to create account. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative p-4 overflow-hidden">
            {/* Dynamic Background - Teal/Purple for doctors */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-md"
            >
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
                        <div className="bg-gradient-to-br from-teal-400 to-teal-600 text-white p-3 rounded-xl shadow-lg shadow-teal-500/30">
                            <Stethoscope size={36} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                {/* Why Join Banner */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-3 text-center">Why Join Healio.AI?</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center mx-auto mb-2">
                                <Users className="h-5 w-5 text-teal-400" />
                            </div>
                            <p className="text-xs text-slate-300">Reach 10K+ patients</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                                <GraduationCap className="h-5 w-5 text-purple-400" />
                            </div>
                            <p className="text-xs text-slate-300">AI-assisted diagnosis</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                                <Shield className="h-5 w-5 text-amber-400" />
                            </div>
                            <p className="text-xs text-slate-300">Verified credentials</p>
                        </div>
                    </div>
                </div>

                <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                    <CardHeader className="space-y-1 text-center pb-2">
                        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold mx-auto mb-2">
                            <Stethoscope className="h-3.5 w-3.5" />
                            Doctor Registration
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                            Join Our Medical Network
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-base">
                            Create your account to start helping patients
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-medium">Professional Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="doctor@hospital.com"
                                    {...register("email")}
                                    className={`bg-white border-slate-200 transition-all h-11 ${errors.email ? "border-red-500 focus:ring-red-200" : "focus:border-teal-500 focus:ring-teal-100"}`}
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-xs font-medium pl-1">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register("password")}
                                    className={`bg-white border-slate-200 transition-all h-11 ${errors.password ? "border-red-500 focus:ring-red-200" : "focus:border-teal-500 focus:ring-teal-100"}`}
                                />
                                {touchedFields.password && !errors.password && passwordValue && (
                                    <div className="flex gap-2 mt-2 px-1">
                                        <div className={`h-1.5 flex-1 rounded-full transition-all ${hasMinLen ? "bg-teal-500" : "bg-slate-200"}`} />
                                        <div className={`h-1.5 flex-1 rounded-full transition-all ${hasUpper && hasLower ? "bg-teal-500" : "bg-slate-200"}`} />
                                        <div className={`h-1.5 flex-1 rounded-full transition-all ${hasNumber ? "bg-teal-500" : "bg-slate-200"}`} />
                                    </div>
                                )}
                                {errors.password && (
                                    <p className="text-red-500 text-xs font-medium pl-1">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register("confirmPassword")}
                                    className={`bg-white border-slate-200 transition-all h-11 ${errors.confirmPassword ? "border-red-500 focus:ring-red-200" : "focus:border-teal-500 focus:ring-teal-100"}`}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-red-500 text-xs font-medium pl-1">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            {authError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center justify-center text-center">
                                    {authError}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white h-12 font-medium text-base shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] rounded-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Register as Doctor <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-3">
                            <p className="text-sm text-slate-500">
                                Already have an account?{" "}
                                <Link href="/login" className="text-teal-600 hover:text-teal-700 font-semibold hover:underline decoration-2 underline-offset-2">
                                    Log in
                                </Link>
                            </p>
                            <p className="text-xs text-slate-400">
                                Looking to get diagnosed?{" "}
                                <Link href="/signup" className="text-teal-600 hover:text-teal-700 font-medium">
                                    Sign up as patient
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-slate-400 mt-6">
                    By registering, you agree to our credential verification process.
                    <br />
                    Your profile will be reviewed within 24-48 hours.
                </p>
            </motion.div>
        </div>
    );
}
