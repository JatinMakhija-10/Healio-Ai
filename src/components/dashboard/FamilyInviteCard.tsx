"use client";

import { Users, Share2 } from "lucide-react";

export function FamilyInviteCard({ className = "" }: { className?: string }) {
  const handleInviteWhatsApp = () => {
    const text = encodeURIComponent(
      "I've been using Arovia.AI for family health advice — join my family circle so we can share summaries and get care guidance: https://arovia.ai/signup?ref=family"
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div
      className={`rounded-xl border border-[#B8DED0] bg-[#E1F5EE] p-4 text-[#1C1C1E] shadow-xs ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#0F6E56] text-white">
          <Users className="size-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-[#1A1A2E]">
            Keep track of your whole family's health
          </h4>
          <p className="mt-0.5 text-xs leading-5 text-[#33594D]">
            Invite family members to join your Arovia circle so you can share consultation summaries and coordinate care easily.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleInviteWhatsApp}
              className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#0F6E56] px-4 text-xs font-bold text-white transition hover:bg-[#0B5F4A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6E56]"
            >
              <Share2 className="mr-1.5 size-3.5" />
              Invite via WhatsApp
            </button>
            <span className="text-[11px] font-semibold text-[#0F6E56]">
              Earn 1 Family Consult credit per invite
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
