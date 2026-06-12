"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Languages,
  Leaf,
  LockKeyhole,
  Mic,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

const languages = ["हिन्दी", "தமிழ்", "বাংলা", "English"];

const trustSignals = [
  {
    icon: ShieldCheck,
    label: "Evidence labels",
    detail: "Every suggestion shows how strong the evidence is.",
  },
  {
    icon: Stethoscope,
    label: "Doctor escalation",
    detail: "Clear signs for when a real doctor should step in.",
  },
  {
    icon: LockKeyhole,
    label: "DPDP-aware privacy",
    detail: "Built for Indian personal data expectations.",
  },
];

function HealioMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid size-[52px] place-items-center rounded-[8px] bg-[#1D9E75] text-white shadow-sm ${className}`}
      aria-hidden="true"
    >
      <Leaf className="size-8" strokeWidth={2.4} />
    </div>
  );
}

function FamilyIllustration() {
  return (
    <div
      className="relative mx-auto aspect-[4/3] w-full max-w-[420px]"
      aria-label="Illustration of an Indian family using Healio at home"
      role="img"
    >
      <div className="absolute inset-x-4 bottom-3 h-16 rounded-[8px] bg-[#E5E3DC]" />
      <div className="absolute left-8 top-14 h-40 w-28 rounded-t-[52px] rounded-b-[8px] bg-[#CFEFE4] shadow-sm">
        <div className="absolute left-1/2 top-5 size-16 -translate-x-1/2 rounded-full bg-[#8B5E3C]" />
        <div className="absolute left-1/2 top-8 size-11 -translate-x-1/2 rounded-full bg-[#B9855B]" />
        <div className="absolute left-5 top-28 h-7 w-[72px] rounded-full bg-[#1D9E75]" />
      </div>
      <div className="absolute right-10 top-20 h-36 w-24 rounded-t-[48px] rounded-b-[8px] bg-[#EFE7D6] shadow-sm">
        <div className="absolute left-1/2 top-3 size-[60px] -translate-x-1/2 rounded-full bg-[#4A3728]" />
        <div className="absolute left-1/2 top-7 size-10 -translate-x-1/2 rounded-full bg-[#A77755]" />
        <div className="absolute left-4 top-[92px] h-6 w-16 rounded-full bg-[#D8B56D]" />
      </div>
      <div className="absolute bottom-9 left-1/2 w-[140px] -translate-x-1/2 rounded-[8px] border border-[#DAD7CF] bg-white p-2 shadow-lg">
        <div className="mb-2 flex items-center gap-1.5">
          <HealioMark className="size-7 rounded-[6px]" />
          <div>
            <div className="h-2.5 w-12 rounded-full bg-[#1C1C1E]" />
            <div className="mt-1 h-1.5 w-18 rounded-full bg-[#9E9E9E]" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-4 rounded-[6px] bg-[#E1F5EE]" />
          <div className="h-4 w-10/12 rounded-[6px] bg-[#F7F6F2]" />
          <div className="ml-auto h-4 w-8/12 rounded-[6px] bg-[#1D9E75]" />
        </div>
      </div>
      <div className="absolute left-2 top-5 rounded-full border border-[#DAD7CF] bg-white px-3 py-2 text-xs font-semibold text-[#0F6E56] shadow-sm">
        2:14 AM
      </div>
      <div className="absolute right-2 bottom-20 rounded-full border border-[#DAD7CF] bg-white px-3 py-2 text-xs font-semibold text-[#1C1C1E] shadow-sm">
        Fever care
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F7F6F2] text-[#1C1C1E]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3" aria-label="Healio home">
            <HealioMark />
            <span className="text-lg font-bold tracking-normal text-[#1C1C1E]">Healio</span>
          </Link>

          <nav
            className="flex min-h-12 items-center gap-1 overflow-x-auto text-sm font-semibold text-[#0F6E56]"
            aria-label="Choose language"
          >
            <Languages className="size-4 shrink-0" aria-hidden="true" />
            {languages.map((language) => (
              <button
                className="min-h-12 shrink-0 rounded-[8px] px-2.5 hover:bg-[#E1F5EE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6E56]"
                key={language}
                type="button"
              >
                {language}
              </button>
            ))}
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="mb-5 inline-flex min-h-12 items-center gap-2 rounded-full border border-[#B8DED0] bg-[#E1F5EE] px-4 text-sm font-semibold text-[#0F6E56]">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              AYUSH-reviewed wellness guidance
            </div>

            <h1 className="text-[2.5rem] font-bold leading-[1.15] tracking-normal text-[#1A1A2E] sm:text-5xl lg:text-6xl">
              Apke ghar ka{" "}
              <span className="text-[#0F6E56]">health guide.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#555555] sm:text-lg lg:mx-0">
              Simple, honest wellness guidance for Indian families, in your language, at any hour. Useful for the 2am fever question and calm enough for everyday doubts.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#1A1A2E] px-6 text-base font-bold text-white shadow-sm transition hover:bg-[#0F6E56] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6E56]"
                href="/dashboard/consult"
              >
                Start my health check
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#D6D2C8] bg-white px-6 text-base font-bold text-[#1C1C1E] transition hover:border-[#9FE1CB] hover:bg-[#E1F5EE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6E56]"
                href="/login"
              >
                Welcome back, login
              </Link>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {trustSignals.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="rounded-[8px] border border-[#E5E3DC] bg-white p-3 text-left shadow-sm"
                    key={item.label}
                  >
                    <Icon className="mb-2 size-6 text-[#0F6E56]" aria-hidden="true" />
                    <p className="text-sm font-bold text-[#1C1C1E]">{item.label}</p>
                    <p className="mt-1 text-sm leading-5 text-[#6B6B6B]">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-lg"
            initial={{ opacity: 0, y: 18 }}
            transition={{ delay: 0.12, duration: 0.55, ease: "easeOut" }}
          >
            <FamilyIllustration />
            <div className="mx-auto mt-4 flex max-w-sm items-center gap-3 rounded-[8px] border border-[#DAD7CF] bg-white p-3 shadow-sm">
              <div className="grid size-12 shrink-0 place-items-center rounded-[8px] bg-[#E1F5EE] text-[#0F6E56]">
                <Mic className="size-6" aria-hidden="true" />
              </div>
              <p className="text-left text-sm leading-5 text-[#555555]">
                Prefer speaking? Voice-first symptom entry is ready for low-literacy and elder-friendly use.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="flex justify-center pt-2 text-sm font-semibold text-[#6B6B6B]">
          <span aria-hidden="true">Scroll for how it works</span>
        </div>
      </section>
    </main>
  );
}
