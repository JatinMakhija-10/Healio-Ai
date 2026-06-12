"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  CheckCircle2,
  CloudRain,
  HeartHandshake,
  Languages,
  Leaf,
  LockKeyhole,
  Mic,
  Moon,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
  X,
} from "lucide-react";

const languages = ["हिन्दी", "தமிழ்", "বাংলা", "English"];

const languageChoices = [
  {
    code: "hi",
    script: "हिन्दी",
    prompt: "Hindi mein shuru karein",
  },
  {
    code: "ta",
    script: "தமிழ்",
    prompt: "Tamilil thodangungal",
  },
  {
    code: "bn",
    script: "বাংলা",
    prompt: "Banglay shuru korun",
  },
  {
    code: "en",
    script: "English",
    prompt: "Continue in English",
  },
];

const trustSignals = [
  {
    icon: ShieldCheck,
    label: "Source-led evidence",
    detail: "Guidance is scored against curated articles, books, and public health sources.",
  },
  {
    icon: Stethoscope,
    label: "Doctor escalation",
    detail: "Clear signs for when a real doctor should step in.",
  },
  {
    icon: LockKeyhole,
    label: "No guessing",
    detail: "Structured math helps avoid random assumptions from symptom text.",
  },
];

const scenarioCards = [
  {
    icon: Baby,
    title: "Child has fever at night",
    copy: "Get safe home-care steps, Ayurvedic comfort routines, and red flags.",
  },
  {
    icon: Moon,
    title: "Parent feels uneasy after dinner",
    copy: "Compare symptoms with source-backed home remedies and doctor signals.",
  },
  {
    icon: HeartHandshake,
    title: "Family wellness doubts",
    copy: "Ask about Ayurvedic remedies, homeopathic context, and prevention.",
  },
];

const chatMessages = [
  {
    from: "user",
    text: "My child has fever since evening. What should I do now?",
  },
  {
    from: "healio",
    text: "Check temperature, give fluids, and keep them lightly dressed. I can suggest safe home remedies and traditional care, but breathing trouble or high fever needs a doctor urgently.",
  },
  {
    from: "healio",
    text: "Tell me the age and current temperature. I use source-backed scoring, not assumptions, to ask the next question.",
  },
];

const testimonials = [
  {
    quote: "It felt like asking someone sensible at home before deciding our next step.",
    name: "Priya S.",
    city: "Lucknow",
  },
  {
    quote: "The privacy wording was clear. I knew what was being used and why.",
    name: "Arjun R.",
    city: "Bengaluru",
  },
  {
    quote: "Large buttons and simple language made it easy for my father to use.",
    name: "Meera P.",
    city: "Ahmedabad",
  },
];

const privacyPoints = [
  "DPDP Act 2023 aligned consent language",
  "Clear medical-disclaimer links before commitment",
  "WhatsApp-friendly support path for Indian users",
];

const evidencePoints = [
  "100+ curated articles, books, and medically reviewed source notes",
  "Public government health data where available and relevant",
  "Structured scoring instead of one-shot assumptions",
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

function SectionHeader({
  kicker,
  title,
  copy,
}: {
  kicker: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="mx-auto mb-8 max-w-2xl text-center">
      <p className="mb-3 text-sm font-bold uppercase tracking-normal text-[#0F6E56]">{kicker}</p>
      <h2 className="text-3xl font-bold leading-tight tracking-normal text-[#1A1A2E] sm:text-4xl">
        {title}
      </h2>
      {copy ? <p className="mt-4 text-base leading-7 text-[#555555]">{copy}</p> : null}
    </div>
  );
}

function ChatDemo() {
  return (
    <div className="mx-auto max-w-md rounded-[8px] border border-[#DAD7CF] bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between border-b border-[#E5E3DC] pb-3">
        <div className="flex items-center gap-2">
          <HealioMark className="size-9 rounded-[8px]" />
          <div>
            <p className="text-sm font-bold text-[#1C1C1E]">Healio</p>
            <p className="text-xs text-[#6B6B6B]">Usually replies in seconds</p>
          </div>
        </div>
        <div className="rounded-full bg-[#E1F5EE] px-3 py-1 text-xs font-bold text-[#0F6E56]">
          Safe next steps
        </div>
      </div>

      <div className="space-y-3">
        {chatMessages.map((message, index) => (
          <div
            className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}
            key={`${message.from}-${index}`}
          >
            <div
              className={`max-w-[82%] rounded-[8px] px-4 py-3 text-sm leading-6 ${
                message.from === "user"
                  ? "bg-[#1A1A2E] text-white"
                  : "bg-[#F7F6F2] text-[#1C1C1E]"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div className="flex justify-start">
          <div className="flex min-h-12 items-center gap-1 rounded-[8px] bg-[#F7F6F2] px-4">
            <span className="size-2 animate-pulse rounded-full bg-[#0F6E56]" />
            <span className="size-2 animate-pulse rounded-full bg-[#0F6E56] [animation-delay:120ms]" />
            <span className="size-2 animate-pulse rounded-full bg-[#0F6E56] [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StickyCta({
  onStart,
  visible,
}: {
  onStart: () => void;
  visible: boolean;
}) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E3DC] bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-10px_28px_rgba(26,26,46,0.12)] transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#1A1A2E] px-5 text-base font-bold text-white"
        onClick={onStart}
        type="button"
      >
        Start my health check
        <ArrowRight className="ml-2 size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function LanguageSelectionOverlay({
  onChoose,
  onClose,
  open,
}: {
  onChoose: (code: string) => void;
  onClose: () => void;
  open: boolean;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-stretch bg-[#F7F6F2] text-[#1C1C1E]"
      role="dialog"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HealioMark className="size-11" />
            <span className="text-base font-bold">Healio</span>
          </div>
          <button
            aria-label="Close language selection"
            className="grid min-h-12 min-w-12 place-items-center rounded-[8px] border border-[#DAD7CF] bg-white text-[#1C1C1E]"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-normal text-[#0F6E56]">
            Choose your language
          </p>
          <h2 className="text-3xl font-bold leading-tight tracking-normal text-[#1A1A2E] sm:text-4xl">
            Start in the language your family actually uses.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#555555]">
            No account wall. Pick a language, describe what is happening, and get the first useful response before any save prompt.
          </p>

          <div className="mt-8 grid gap-3">
            {languageChoices.map((language) => (
              <button
                className="flex min-h-[72px] items-center justify-between rounded-[8px] border border-[#DAD7CF] bg-white px-4 text-left shadow-sm transition hover:border-[#9FE1CB] hover:bg-[#E1F5EE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6E56]"
                key={language.code}
                onClick={() => onChoose(language.code)}
                type="button"
              >
                <span>
                  <span className="block text-xl font-bold text-[#1A1A2E]">{language.script}</span>
                  <span className="mt-1 block text-sm font-semibold text-[#6B6B6B]">{language.prompt}</span>
                </span>
                <ArrowRight className="size-5 text-[#0F6E56]" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        <p className="pb-2 text-sm leading-6 text-[#6B6B6B]">
          Healio will still show doctor-escalation signals when symptoms may need professional care.
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [isLanguageOverlayOpen, setIsLanguageOverlayOpen] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    const footer = footerRef.current;

    if (!hero || !footer) {
      return;
    }

    const heroObserver = new IntersectionObserver(
      ([entry]) => setIsHeroVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );
    const footerObserver = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );

    heroObserver.observe(hero);
    footerObserver.observe(footer);

    return () => {
      heroObserver.disconnect();
      footerObserver.disconnect();
    };
  }, []);

  const openLanguageOverlay = () => setIsLanguageOverlayOpen(true);
  const closeLanguageOverlay = () => setIsLanguageOverlayOpen(false);
  const startConsult = (languageCode: string) => {
    window.localStorage.setItem("healio_preferred_language", languageCode);
    window.location.href = `/start?lang=${languageCode}`;
  };

  return (
    <main className="min-h-screen bg-[#F7F6F2] text-[#1C1C1E]">
      <section
        className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 pt-5 sm:px-6 lg:px-8"
        ref={heroRef}
      >
        <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <Link href="/" className="flex items-center gap-3" aria-label="Healio home">
            <HealioMark />
            <span className="text-lg font-bold tracking-normal text-[#1C1C1E]">Healio</span>
          </Link>

          <nav
            className="flex min-h-12 w-full items-center justify-between gap-1 overflow-x-auto text-sm font-semibold text-[#0F6E56] sm:w-auto sm:justify-start"
            aria-label="Choose language"
          >
            <Languages className="hidden size-4 shrink-0 sm:block" aria-hidden="true" />
            {languages.map((language, index) => (
              <button
                className="min-h-12 shrink-0 rounded-[8px] px-2.5 hover:bg-[#E1F5EE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6E56]"
                key={language}
                onClick={() => startConsult(languageChoices[index]?.code ?? "en")}
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
              Ayurveda, home remedies, homeopathy, safety signals
            </div>

            <h1 className="text-[2.5rem] font-bold leading-[1.15] tracking-normal text-[#1A1A2E] sm:text-5xl lg:text-6xl">
              Apke ghar ka{" "}
              <span className="text-[#0F6E56]">health guide.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#555555] sm:text-lg lg:mx-0">
              Simple, honest wellness guidance for Indian families, in your language, at any hour. Explore Ayurvedic home remedies, homeopathic context, and safe next steps without panic.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#1A1A2E] px-6 text-base font-bold text-white shadow-sm transition hover:bg-[#0F6E56] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6E56]"
                onClick={openLanguageOverlay}
                type="button"
              >
                Start my health check
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </button>
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

      <section className="border-y border-[#E5E3DC] bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            copy="The landing page now answers real household moments first, because trust starts with recognition."
            kicker="Made for familiar moments"
            title="For the questions families actually ask."
          />

          <div className="flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible">
            {scenarioCards.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  className="min-w-[82%] snap-start rounded-[8px] border border-[#E5E3DC] bg-[#FDFBF7] p-5 shadow-sm sm:min-w-0"
                  key={item.title}
                >
                  <div className="mb-5 grid size-12 place-items-center rounded-[8px] bg-[#E1F5EE] text-[#0F6E56]">
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold leading-snug text-[#1A1A2E]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#555555]">{item.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <ChatDemo />

          <div className="mx-auto max-w-xl text-center lg:text-left">
            <p className="mb-3 text-sm font-bold uppercase tracking-normal text-[#0F6E56]">See the product before tapping</p>
            <h2 className="text-3xl font-bold leading-tight tracking-normal text-[#1A1A2E] sm:text-4xl">
              A calm chat for home remedies, traditional care, and escalation signs.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#555555]">
              The demo shows the value-first flow: ask in plain language, get practical Ayurvedic or homeopathic context where suitable, then know exactly when professional care matters.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[8px] border border-[#C8E7DA] bg-[#E1F5EE] p-4">
                <p className="text-sm font-bold text-[#0F6E56]">Ayurvedic home care</p>
                <p className="mt-1 text-sm leading-6 text-[#555555]">Plain remedies and routines with clear safety limits.</p>
              </div>
              <div className="rounded-[8px] border border-[#DAD7CF] bg-white p-4">
                <p className="text-sm font-bold text-[#1A1A2E]">Homeopathic context</p>
                <p className="mt-1 text-sm leading-6 text-[#555555]">Traditional options are framed with evidence and caution.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#E1F5EE] py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-normal text-[#0F6E56]">Trust without assumptions</p>
            <h2 className="text-3xl font-bold leading-tight tracking-normal text-[#1A1A2E] sm:text-4xl">
              We use maths, sources, and safety rules before giving guidance.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#33594D]">
              Healio does not invent answers from a single message. It weighs symptom patterns against curated medical and traditional-wellness sources, then keeps doctor escalation visible when risk is present.
            </p>
          </div>
          <div className="rounded-[8px] border border-[#B8DED0] bg-white p-5 shadow-sm">
            <div className="mb-4 grid size-14 place-items-center rounded-[8px] bg-[#1A1A2E] text-white">
              <UserRoundCheck className="size-7" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A2E]">What the reasoning checks first</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#555555]">
              {evidencePoints.map((point) => (
                <li className="flex gap-3" key={point}>
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#0F6E56]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-[#E5E3DC] bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            copy="Peer voices are city-specific and practical, so social proof feels local instead of generic."
            kicker="Trusted by families"
            title="Real worries, calmer next steps."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure className="rounded-[8px] border border-[#E5E3DC] bg-[#FDFBF7] p-5" key={testimonial.name}>
                <blockquote className="text-base leading-7 text-[#1C1C1E]">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-[#E5E3DC] pt-4 text-sm font-bold text-[#0F6E56]">
                  {testimonial.name}, {testimonial.city}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="rounded-[8px] border border-[#DAD7CF] bg-white p-5 shadow-sm">
            <div className="grid size-14 place-items-center rounded-[8px] bg-[#E1F5EE] text-[#0F6E56]">
              <LockKeyhole className="size-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-3xl font-bold leading-tight text-[#1A1A2E]">Your symptoms stay with you.</h2>
            <p className="mt-4 text-base leading-7 text-[#555555]">
              Privacy is stated in plain terms before the user starts. Legal seriousness should feel reassuring, not intimidating.
            </p>
          </div>
          <div className="grid gap-3">
            {privacyPoints.map((point) => (
              <div className="flex min-h-16 items-center gap-3 rounded-[8px] border border-[#E5E3DC] bg-white p-4" key={point}>
                <ShieldCheck className="size-5 shrink-0 text-[#0F6E56]" aria-hidden="true" />
                <p className="text-sm font-semibold leading-6 text-[#1C1C1E]">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-6 rounded-[8px] border border-[#DAD7CF] bg-[#F7F6F2] p-5 md:grid-cols-[auto_1fr_auto] md:p-6">
            <div className="grid size-16 place-items-center rounded-[8px] bg-[#1D9E75] text-white">
              <CloudRain className="size-8" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-normal text-[#0F6E56]">Seasonal nudge</p>
              <h2 className="mt-2 text-2xl font-bold leading-tight text-[#1A1A2E]">Monsoon coughs, fever, and stomach upsets are rising.</h2>
              <p className="mt-2 text-base leading-7 text-[#555555]">
                Keep fluids ready, avoid unsafe street water, and ask early if symptoms feel unusual for your family.
              </p>
            </div>
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#0F6E56] px-5 text-sm font-bold text-[#0F6E56] hover:bg-[#E1F5EE]"
              onClick={openLanguageOverlay}
              type="button"
            >
              Ask now
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#1A1A2E] py-16 text-white" ref={footerRef}>
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <HealioMark className="mx-auto mb-5" />
          <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
            Start with one health question. No form, no password, no pressure.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/75">
            Choose your language, describe what is happening, and receive useful guidance before any save prompt.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-base font-bold text-[#1A1A2E] hover:bg-[#E1F5EE]"
              onClick={openLanguageOverlay}
              type="button"
            >
              Start my health check
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </button>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-6 text-base font-bold text-white hover:bg-white/10"
              href="/login"
            >
              Welcome back, login
            </Link>
          </div>

          <footer className="mt-12 border-t border-white/15 pt-6 text-left text-sm leading-6 text-white/70">
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
              <p>
                Healio.AI is an informational wellness tool and does not provide medical diagnosis, prescriptions, or emergency care. In an emergency in India, call 112 or visit the nearest emergency room.
              </p>
              <div>
                <p className="font-bold text-white">Grievance Officer</p>
                <p>Compliance Lead, Healio</p>
                <p>grievance@healio.health</p>
                <p>+91 98765 43210</p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white">Terms of Service</Link>
                <Link href="/medical-disclaimer" className="hover:text-white">Medical Disclaimer</Link>
                <Link href="https://wa.me/919876543210" className="inline-flex items-center gap-2 hover:text-white">
                  <Phone className="size-4" aria-hidden="true" />
                  WhatsApp support
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </section>

      <StickyCta onStart={openLanguageOverlay} visible={!isHeroVisible && !isFooterVisible} />
      <LanguageSelectionOverlay
        onChoose={startConsult}
        onClose={closeLanguageOverlay}
        open={isLanguageOverlayOpen}
      />
    </main>
  );
}
