import Link from "next/link";
import { ArrowLeft, Cookie, Database, Languages, LockKeyhole, ShieldCheck } from "lucide-react";

const cookieGroups = [
  {
    icon: Languages,
    title: "Language preference",
    items: ["healio_preferred_language"],
    copy: "Remembers the language selected on the landing page so the first guidance flow can open in the same language.",
  },
  {
    icon: ShieldCheck,
    title: "Consent notice",
    items: ["healio_cookie_consent"],
    copy: "Stores whether the cookie and local-storage notice was accepted on this device.",
  },
  {
    icon: LockKeyhole,
    title: "Account session",
    items: ["Supabase authentication cookies"],
    copy: "Used only when a user signs in so protected dashboard and consult pages can recognize the account session.",
  },
  {
    icon: Database,
    title: "Product analytics",
    items: ["Vercel Analytics events when enabled"],
    copy: "Used in aggregate to understand page performance and improve public flows. Healio does not sell health data.",
  },
];

export default function CookiePolicyPage() {
  return (
    <main className="healio-public-page min-h-screen bg-[#F7F6F2] px-4 py-5 text-[#1C1C1E] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link className="inline-flex min-h-12 items-center gap-2 text-sm font-bold text-[#0F6E56]" href="/">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Healio
        </Link>

        <section className="py-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="grid size-14 place-items-center rounded-[8px] bg-[#E1F5EE] text-[#0F6E56]">
                <Cookie className="size-7" aria-hidden="true" />
              </div>
              <p className="mt-5 text-sm font-bold uppercase text-[#0F6E56]">Cookie policy</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-[#1A1A2E]">
                What Healio stores on your device
              </h1>
              <p className="mt-4 text-base leading-7 text-[#555555]">
                Healio uses essential cookies and local storage for language choice, consent state, account sessions, and service improvement. These tools help the app work reliably; they are not used to sell health information.
              </p>
              <p className="mt-4 text-sm leading-6 text-[#6B6B6B]">
                Last updated: June 14, 2026
              </p>
            </div>

            <div className="grid gap-3">
              {cookieGroups.map((group) => {
                const Icon = group.icon;

                return (
                  <article className="rounded-[8px] border border-[#DAD7CF] bg-white p-4 shadow-sm" key={group.title}>
                    <div className="flex items-start gap-3">
                      <div className="grid size-11 shrink-0 place-items-center rounded-[8px] bg-[#E1F5EE] text-[#0F6E56]">
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#1A1A2E]">{group.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-[#555555]">{group.copy}</p>
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {group.items.map((item) => (
                            <li className="rounded-full border border-[#B8DED0] bg-[#E1F5EE] px-3 py-1 text-xs font-bold text-[#0F6E56]" key={item}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <section className="mt-8 rounded-[8px] border border-[#DAD7CF] bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold text-[#1A1A2E]">Your choices</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <p className="font-bold text-[#1A1A2E]">Clear local choices</p>
                <p className="mt-1 text-sm leading-6 text-[#555555]">
                  You can clear site data in your browser to reset language and cookie consent preferences.
                </p>
              </div>
              <div>
                <p className="font-bold text-[#1A1A2E]">Manage account data</p>
                <p className="mt-1 text-sm leading-6 text-[#555555]">
                  Use the Data Request Form to ask for access, correction, deletion, export, or consent withdrawal.
                </p>
              </div>
              <div>
                <p className="font-bold text-[#1A1A2E]">Read the full notice</p>
                <p className="mt-1 text-sm leading-6 text-[#555555]">
                  The Privacy Policy explains how symptom text, account data, and service metadata are handled.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1A1A2E] px-4 text-sm font-bold text-white" href="/data-request">
                Data Request Form
              </Link>
              <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#DAD7CF] bg-white px-4 text-sm font-bold text-[#1C1C1E]" href="/privacy">
                Privacy Policy
              </Link>
              <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#DAD7CF] bg-white px-4 text-sm font-bold text-[#1C1C1E]" href="/medical-disclaimer">
                Medical Disclaimer
              </Link>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
