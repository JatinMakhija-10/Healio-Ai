"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-8 flex h-14 items-center">
          <button onClick={() => router.back()} className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-12 px-4 md:px-8 max-w-4xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-primary">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-foreground/90">
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
              <p>
                Welcome to Healio.AI ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us.
              </p>
              <p>
                When you visit our website and use our services (the "Services"), you trust us with your personal information. We take your privacy very seriously. In this privacy policy, we describe our privacy practices in accordance with the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules), and the Digital Personal Data Protection Act, 2023 (DPDPA) of India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
              <p>
                We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Personal Data:</strong> Names, email addresses, and account credentials used to access the chatbot.</li>
                <li><strong>Health/Medical Data & Chat Transcripts:</strong> Any symptoms, conditions, or related queries you input into our AI chatbot. Note: As per SPDI Rules, physical, physiological, and mental health conditions are considered Sensitive Personal Data. We process this text solely to provide the Healio.AI assistant services. Do not upload or paste highly sensitive, personally identifying health records (like full medical charts or Aadhaar numbers) into the chat.</li>
                <li><strong>Automatically Collected Data:</strong> IP address, device characteristics, operating system, and information about how you interact with the chatbot interface.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
              <p>
                We use personal information and chat interactions collected via our Services for a variety of business purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>To facilitate conversational interactions with our AI assistant.</li>
                <li>To maintain chat history so you can review previous consultations or symptoms discussed.</li>
                <li>To respond to user inquiries and offer technical support.</li>
                <li>For data analysis to improve our chatbot's conversational accuracy, safety guardrails, and pain management algorithms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">4. Will Your Information Be Shared With Anyone?</h2>
              <p>
                We only share and disclose your information in the following situations:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Compliance with Laws:</strong> We may disclose where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process.</li>
                <li><strong>Vital Interests and Legal Rights:</strong> We may disclose your information where we believe it is necessary to investigate, prevent, or take action regarding potential violations of our policies, suspected fraud, situations involving potential threats to the safety of any person and illegal activities.</li>
                <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">5. How Long Do We Keep Your Information?</h2>
              <p>
                We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). 
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">6. Keeping Your Information Safe & Data Localization</h2>
              <p>
                We have implemented appropriate technical and organizational security measures—in accordance with industry standards—designed to protect the security of any personal information we process. Data is stored and processed with compliant cloud providers. Following applicable Indian cyber laws, any core data processing adheres to requisite geographic and structural constraints. However, please also remember that we cannot guarantee that the internet itself is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">7. Grievance Officer & Contact Us</h2>
              <p>
                In accordance with the Information Technology Act, 2000 and the rules made thereunder, if you have questions, comments, or grievances about this notice or the processing of your Sensitive Personal Data, you may email our Grievance Officer at grievance@healio.ai or contact us at privacy@healio.ai.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
