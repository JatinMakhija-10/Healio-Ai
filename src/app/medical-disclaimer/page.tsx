/* eslint-disable react/no-unescaped-entities */
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function MedicalDisclaimer() {
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
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-primary">Medical Disclaimer</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-foreground/90">
            <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-lg mb-8">
              <p className="font-semibold text-destructive mb-0 mt-0">
                IF YOU ARE EXPERIENCING A MEDICAL EMERGENCY, PLEASE CALL 112, 108, OR YOUR LOCAL EMERGENCY SERVICES IMMEDIATELY.
              </p>
            </div>

            {/* Beta Notice */}
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
              <h2 className="text-base font-bold text-amber-900 mt-0 mb-2 flex items-center gap-2">
                🧪 Beta Product — Results May Vary
              </h2>
              <p className="text-sm text-amber-800 mt-0 mb-0">
                Arovia.AI is currently in <strong>Beta</strong>. All features — including AI-assisted symptom analysis, diagnosis suggestions, and homeopathic/Ayurvedic remedy recommendations — are <strong>experimental</strong>. Outputs may be inaccurate, incomplete, or inappropriate for your specific health situation. Do not rely solely on this application for any health decision. Results will vary from person to person.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">1. Not Medical Advice (Telemedicine Practice Guidelines)</h2>
              <p>
                The information, text, graphics, images, and other material contained on Arovia.AI (the "Service") are for informational and educational purposes only. The Service is <strong>not intended to be a substitute for professional medical advice, diagnosis, or treatment by a Registered Medical Practitioner (RMP)</strong> as defined by the National Medical Commission (NMC).
              </p>
              <p>
                Always seek the advice of your physician or other qualified health provider within your jurisdiction with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on or through the Service. Wait times or recommendations should not replace immediate consultation at the nearest hospital/clinic.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">2. Chatbot AI Limitations and Hallucinations</h2>
              <p>
                The Arovia.AI chatbot utilizes large language models (LLMs) to converse, process information, and provide suggestions related to pain management and general wellness. <strong>The AI is a machine, not a doctor.</strong> It cannot make clinical diagnoses, prescribe medication, or order tests.
              </p>
              <p>
                Due to the nature of generative AI, the chatbot may occasionally "hallucinate"—meaning it could generate responses that sound highly convincing and professional but are factually incorrect, incomplete, or medically unsafe. 
              </p>
              <p>
                Any suggestions, differential insights, or relief techniques provided by the Arovia.AI chatbot should be thoroughly discussed with a licensed healthcare professional before taking action or altering any existing treatment plan.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">3. Homeopathy &amp; Alternative Medicine Disclaimer</h2>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-purple-800 mt-0 mb-1">⚠️ Important: Please read before using homeopathic suggestions.</p>
                <p className="text-sm text-purple-700 mb-0">
                  Homeopathic and Ayurvedic remedy suggestions displayed by Arovia.AI are <strong>AI-generated, experimental, and for informational purposes only</strong>. They have <strong>not</strong> been evaluated by any drug regulatory authority (e.g., CDSCO, FDA).
                </p>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Do not take any homeopathic or Ayurvedic medicine without first consulting a qualified and registered practitioner</strong> in that field.</li>
                <li>Homeopathy is not universally accepted by mainstream medical science and its efficacy for many conditions has not been established through randomised controlled trials.</li>
                <li>Some herbal or homeopathic preparations can interact with prescription medications. Always disclose all supplements and alternative medicines to your primary care physician.</li>
                <li>Results displayed by the AI are generated based on pattern matching — they <strong>will vary significantly</strong> based on your specific constitution, medical history, and other factors only a practitioner can assess.</li>
                <li>Arovia.AI makes <strong>no promises or guarantees</strong> about the effectiveness of any remedy shown.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">4. No Doctor-Patient Relationship</h2>
              <p>
                Chatting with the Arovia.AI assistant does not create a doctor-patient, therapist-client, or any other professional healthcare relationship. Your interactions with the bot are strictly at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">5. Assumption of Risk</h2>
              <p>
                Reliance on any information provided by Arovia.AI, its employees, others appearing on the Service at the invitation of Arovia.AI, or other visitors to the Service is solely at your own risk. We disclaim any liability for any decisions made based on the information provided by our AI systems.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
