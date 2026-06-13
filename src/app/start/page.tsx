"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Leaf,
  LockKeyhole,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

const languageLabels: Record<string, string> = {
  hi: "हिन्दी",
  ta: "தமிழ்",
  bn: "বাংলা",
  en: "English",
};

const prompts: Record<string, { question: string; helper: string; opening: string }> = {
  hi: {
    question: "Aaj aapko ya family mein kisi ko kya pareshani hai?",
    helper: "Example: bacche ko bukhar hai, khansi hai, pet dard hai",
    opening: "Namaste. Mujhe symptoms bataiye. Main pehle simple questions poochunga, phir safe home care aur doctor signal dunga.",
  },
  ta: {
    question: "Indru ungalukku allathu kudumbathil yaarukku enna prachanai?",
    helper: "Example: fever, cough, stomach pain",
    opening: "Vanakkam. Symptoms-ai simple-a sollunga. Naan safe home care matrum doctor signal-ai clear-a solven.",
  },
  bn: {
    question: "Aaj apnar ba poribarer kar ki osubidha hocche?",
    helper: "Example: fever, cough, stomach pain",
    opening: "Nomoskar. Symptoms bolun. Ami safe home care aar doctor signal clear kore bolbo.",
  },
  en: {
    question: "What is bothering you or someone in your family today?",
    helper: "Example: my child has fever, cough, stomach pain",
    opening: "Tell me what you are experiencing. I will ask simple questions, then show safe home care and when to see a doctor.",
  },
};

function HealioMark() {
  return (
    <div className="grid size-12 place-items-center rounded-[8px] bg-[#1D9E75] text-white shadow-sm">
      <Leaf className="size-7" aria-hidden="true" />
    </div>
  );
}

export default function StartPage() {
  const [language] = useState(() => {
    if (typeof window === "undefined") {
      return "en";
    }

    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang") || window.localStorage.getItem("healio_preferred_language") || "en";
    return languageLabels[lang] ? lang : "en";
  });
  const [symptom, setSymptom] = useState("");
  const [hasResponse, setHasResponse] = useState(false);

  const copy = useMemo(() => prompts[language] ?? prompts.en, [language]);

  const handleSubmit = () => {
    if (!symptom.trim()) {
      return;
    }
    setHasResponse(true);
  };

  return (
    <main className="healio-public-page min-h-screen bg-[#F7F6F2] px-4 py-5 text-[#1C1C1E] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-3xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/" aria-label="Back to Healio home">
            <HealioMark />
            <span className="text-lg font-bold">Healio</span>
          </Link>
          <div className="rounded-full border border-[#B8DED0] bg-[#E1F5EE] px-4 py-2 text-sm font-bold text-[#0F6E56]">
            {languageLabels[language]}
          </div>
        </header>

        <section className="grid flex-1 items-center py-8">
          <div className="grid gap-5">
            <div className="rounded-[8px] border border-[#DAD7CF] bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <HealioMark />
                <div>
                  <p className="font-bold text-[#1A1A2E]">Healio</p>
                  <p className="mt-1 text-sm leading-6 text-[#555555]">{copy.opening}</p>
                </div>
              </div>

              <label className="text-sm font-bold text-[#1A1A2E]" htmlFor="symptom">
                {copy.question}
              </label>
              <textarea
                aria-describedby="symptom-helper"
                className="mt-3 min-h-32 w-full resize-none rounded-[8px] border border-[#DAD7CF] bg-[#FDFBF7] p-4 text-base leading-7 outline-none transition focus:border-[#0F6E56] focus:ring-2 focus:ring-[#9FE1CB]"
                id="symptom"
                onChange={(event) => setSymptom(event.target.value)}
                placeholder={copy.helper}
                value={symptom}
              />
              <p className="mt-2 text-sm leading-6 text-[#6B6B6B]" id="symptom-helper">
                {copy.helper}
              </p>
              <button
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#1A1A2E] px-6 text-base font-bold text-white transition hover:bg-[#0F6E56] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!symptom.trim()}
                onClick={handleSubmit}
                type="button"
              >
                Get first guidance
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </button>
            </div>

            {hasResponse ? (
              <section
                aria-labelledby="first-guidance-title"
                aria-live="polite"
                className="rounded-[8px] border border-[#B8DED0] bg-[#E1F5EE] p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 text-sm font-bold uppercase text-[#0F6E56]">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  First guidance, no account needed
                </div>
                <h1 className="mt-3 text-2xl font-bold leading-tight text-[#1A1A2E]" id="first-guidance-title">
                  Start with safe home care, then watch the doctor signals.
                </h1>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[8px] bg-white p-4">
                    <Leaf className="mb-2 size-5 text-[#0F6E56]" aria-hidden="true" />
                    <p className="text-sm font-bold">Home remedies</p>
                    <p className="mt-1 text-sm leading-6 text-[#555555]">
                      Use gentle fluids, rest, and culturally familiar care only when symptoms are mild.
                    </p>
                  </div>
                  <div className="rounded-[8px] bg-white p-4">
                    <HeartPulse className="mb-2 size-5 text-[#0F6E56]" aria-hidden="true" />
                    <p className="text-sm font-bold">Source scoring</p>
                    <p className="mt-1 text-sm leading-6 text-[#555555]">
                      Healio weighs symptoms against curated articles, books, and public health sources.
                    </p>
                  </div>
                  <div className="rounded-[8px] bg-white p-4">
                    <CheckCircle2 className="mb-2 size-5 text-[#0F6E56]" aria-hidden="true" />
                    <p className="text-sm font-bold">Doctor signal</p>
                    <p className="mt-1 text-sm leading-6 text-[#555555]">
                      Severe, persistent, worsening, or unusual symptoms should be checked by a qualified doctor.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[8px] border border-[#DAD7CF] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <LockKeyhole className="mt-1 size-5 shrink-0 text-[#0F6E56]" aria-hidden="true" />
                    <div>
                      <p className="font-bold">Ready for the full consult?</p>
                      <p className="mt-1 text-sm leading-6 text-[#555555]">
                        Sign in to continue the guided chat, save history, and get more personalized follow-up questions. You can also start a fresh concern without saving.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Link
                      className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#1A1A2E] px-4 text-sm font-bold text-white"
                      href="/login?redirectTo=/dashboard/consult"
                    >
                      <MessageCircle className="mr-2 size-4" aria-hidden="true" />
                      Continue full consult
                    </Link>
                    <Link
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#0F6E56] px-4 text-sm font-bold text-[#0F6E56]"
                      href="/data-request"
                    >
                      <ShieldCheck className="mr-2 size-4" aria-hidden="true" />
                      Privacy options
                    </Link>
                    <button
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#DAD7CF] bg-white px-4 text-sm font-bold text-[#1C1C1E]"
                      onClick={() => {
                        setSymptom("");
                        setHasResponse(false);
                      }}
                      type="button"
                    >
                      <RotateCcw className="mr-2 size-4" aria-hidden="true" />
                      Ask another concern
                    </button>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
