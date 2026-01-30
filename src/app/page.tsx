"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Lock, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-start items-center p-4 pt-12 md:pt-24 relative overflow-hidden">
      {/* Background Decor - Subtle Clinical Gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-50 to-transparent -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-6 text-center"
      >
        {/* Logo / Brand */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-teal-600 text-white p-2 rounded-xl">
              <Stethoscope size={32} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Hero Text */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Understand your pain. <br />
            <span className="text-teal-600">Safely.</span>
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            A clinical-grade assistant to help you make sense of your symptoms before seeing a doctor.
          </p>
        </div>

        {/* Main CTA Card */}
        <Card className="border-slate-200 shadow-lg shadow-slate-200/50 backdrop-blur-sm bg-white/90">
          <CardContent className="p-4 space-y-4">
            <Button asChild size="lg" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 text-md font-medium shadow-md transition-all">
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                <span className="bg-white px-3 text-slate-500 font-semibold">Trusted by 10k+ Patients</span>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full rounded-xl h-12 border-slate-200 text-slate-600 hover:bg-slate-50">
              <Link href="/login">
                Already have an account? Login
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex justify-center gap-6 text-slate-400 text-xs font-medium"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-teal-600" />
            <span>Privacy First</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock size={14} className="text-teal-600" />
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-teal-600 rounded-full" />
            <span>Educational Use Only</span>
          </div>
        </motion.div>

        {/* Legal Footer */}
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal">
          By continuing, you agree that Healio.AI is an informational tool and does not provide medical diagnosis or treatment advice.
        </p>
      </motion.div>
    </div>
  );
}
