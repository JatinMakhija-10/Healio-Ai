"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, Mail, ShieldCheck } from "lucide-react";

const requestTypes = [
  "Access my data",
  "Correct my data",
  "Delete my data",
  "Withdraw consent",
  "Export chat history",
  "Other privacy request",
];

export default function DataRequestPage() {
  const [requestType, setRequestType] = useState(requestTypes[0]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [details, setDetails] = useState("");
  const [isPrepared, setIsPrepared] = useState(false);

  const mailHref = useMemo(() => {
    const body = [
      `Request type: ${requestType}`,
      `Name: ${name || "Not provided"}`,
      `Contact: ${contact || "Not provided"}`,
      "",
      "Request details:",
      details || "Not provided",
    ].join("\n");

    return `mailto:privacy@arovia.ai?subject=${encodeURIComponent(`Arovia data request: ${requestType}`)}&body=${encodeURIComponent(body)}`;
  }, [contact, details, name, requestType]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPrepared(true);
  };

  return (
    <main className="arovia-public-page min-h-screen bg-[#F7F6F2] px-4 py-5 text-[#1C1C1E] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link className="inline-flex min-h-12 items-center gap-2 text-sm font-bold text-[#0F6E56]" href="/">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Arovia
        </Link>

        <section className="grid gap-6 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <div className="grid size-14 place-items-center rounded-[8px] bg-[#E1F5EE] text-[#0F6E56]">
              <ShieldCheck className="size-7" aria-hidden="true" />
            </div>
            <p className="mt-5 text-sm font-bold uppercase text-[#0F6E56]">Data rights</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-[#1A1A2E]">
              Data Request Form
            </h1>
            <p className="mt-4 text-base leading-7 text-[#555555]">
              Use this form to prepare a privacy request for access, correction, deletion, consent withdrawal, or export. Arovia does not store this form in the browser; it prepares an email so the request can be sent from your own inbox.
            </p>
            <div className="mt-6 rounded-[8px] border border-[#DAD7CF] bg-white p-4 text-sm leading-6 text-[#555555]">
              <p className="font-bold text-[#1A1A2E]">Before sending</p>
              <p className="mt-1">
                Do not include Aadhaar numbers, full medical files, prescriptions, or emergency symptoms in this request. For medical emergencies in India, call 112 or visit the nearest emergency room.
              </p>
            </div>
          </div>

          <form className="rounded-[8px] border border-[#DAD7CF] bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-[#1A1A2E]" htmlFor="requestType">
                Request type
                <select
                  className="min-h-12 rounded-[8px] border border-[#DAD7CF] bg-[#FDFBF7] px-3 text-base font-medium text-[#1C1C1E] outline-none focus:border-[#0F6E56] focus:ring-2 focus:ring-[#9FE1CB]"
                  id="requestType"
                  onChange={(event) => setRequestType(event.target.value)}
                  value={requestType}
                >
                  {requestTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#1A1A2E]" htmlFor="name">
                Name
                <input
                  className="min-h-12 rounded-[8px] border border-[#DAD7CF] bg-[#FDFBF7] px-3 text-base text-[#1C1C1E] outline-none focus:border-[#0F6E56] focus:ring-2 focus:ring-[#9FE1CB]"
                  id="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  value={name}
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#1A1A2E]" htmlFor="contact">
                Email or phone linked to Arovia
                <input
                  className="min-h-12 rounded-[8px] border border-[#DAD7CF] bg-[#FDFBF7] px-3 text-base text-[#1C1C1E] outline-none focus:border-[#0F6E56] focus:ring-2 focus:ring-[#9FE1CB]"
                  id="contact"
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="name@example.com"
                  value={contact}
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#1A1A2E]" htmlFor="details">
                Request details
                <textarea
                  className="min-h-36 resize-none rounded-[8px] border border-[#DAD7CF] bg-[#FDFBF7] p-3 text-base leading-7 text-[#1C1C1E] outline-none focus:border-[#0F6E56] focus:ring-2 focus:ring-[#9FE1CB]"
                  id="details"
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Tell us what data you want accessed, corrected, deleted, or exported."
                  value={details}
                />
              </label>
            </div>

            <button
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#1A1A2E] px-5 text-base font-bold text-white hover:bg-[#0F6E56]"
              type="submit"
            >
              <FileText className="mr-2 size-4" aria-hidden="true" />
              Prepare request
            </button>

            {isPrepared ? (
              <div className="mt-5 rounded-[8px] border border-[#B8DED0] bg-[#E1F5EE] p-4" role="status">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#0F6E56]" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-[#1A1A2E]">Your request is ready to send.</p>
                    <p className="mt-1 text-sm leading-6 text-[#555555]">
                      Open your email app and send this prepared request to Arovia privacy support.
                    </p>
                    <a
                      className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-[#0F6E56] px-4 text-sm font-bold text-white"
                      href={mailHref}
                    >
                      <Mail className="mr-2 size-4" aria-hidden="true" />
                      Send email request
                    </a>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-[#0F6E56]">
              <Link className="underline underline-offset-2" href="/privacy">Privacy Policy</Link>
              <Link className="underline underline-offset-2" href="/cookie-policy">Cookie Policy</Link>
              <Link className="underline underline-offset-2" href="/medical-disclaimer">Medical Disclaimer</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
