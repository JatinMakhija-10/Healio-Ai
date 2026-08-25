"use client";

/**
 * AskAroviaResponseRenderer
 *
 * Plan ref: Part IV §4.3 + Enhanced Plan §7
 *
 * Renders the full 7-block AskAroviaResponse structure inside the chat UI.
 * Each block maps to a distinct visual section.
 *
 * Rendering rules enforced here (plan §4.3 + §4.10):
 *  1. EscalationBlock L4/L5 → non-dismissible EscalationAlert at top, home_care hidden
 *  2. SafetyNoteBlock → always rendered last, never suppressible
 *  3. Every HomeCareItem shows its EvidenceLabelBadge
 *  4. WatchForBlock red flags → amber alert box
 *  5. FollowUpBlock → only rendered when suggestedQuestions or related content is present
 */

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Info,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EvidenceLabelBadge } from "@/components/wellness/EvidenceLabelBadge";
import { EscalationAlert } from "@/components/wellness/EscalationAlert";
import {
  type AskAroviaResponse,
  type AcknowledgementBlock,
  type UnderstandingBlock,
  type EscalationBlock,
  type HomeCareBlock,
  type WatchForBlock,
  type SafetyNoteBlock,
  type FollowUpBlock,
  homeCareAllowed,
  STANDARD_SAFETY_NOTE,
} from "@/lib/wellness/askAroviaResponse";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AskAroviaResponseRendererProps {
  response: AskAroviaResponse;
  /** Called when a follow-up question chip is tapped */
  onFollowUpQuestion?: (question: string) => void;
  /** Called when "View content" is tapped on the related content link */
  onViewContent?: (contentId: string) => void;
  /** Called when "Start routine" is tapped */
  onStartRoutine?: (routineId: string) => void;
  className?: string;
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export function AskAroviaResponseRenderer({
  response,
  onFollowUpQuestion,
  onViewContent,
  onStartRoutine,
  className,
}: AskAroviaResponseRendererProps) {
  // Pull typed blocks from the response
  const blocks = response.blocks;
  const ack       = blocks.find(b => b.type === 'acknowledgement')  as AcknowledgementBlock | undefined;
  const understand = blocks.find(b => b.type === 'understanding')   as UnderstandingBlock   | undefined;
  const escalation = blocks.find(b => b.type === 'escalation')      as EscalationBlock      | undefined;
  const homeCare   = blocks.find(b => b.type === 'home_care')       as HomeCareBlock        | undefined;
  const watchFor   = blocks.find(b => b.type === 'watch_for')       as WatchForBlock        | undefined;
  const safetyNote = blocks.find(b => b.type === 'safety_note')     as SafetyNoteBlock      | undefined;
  const followUp   = blocks.find(b => b.type === 'follow_up')       as FollowUpBlock        | undefined;

  const allowHomeCare = homeCareAllowed(response);
  const isHighEscalation = escalation?.level === 'L4' || escalation?.level === 'L5';

  return (
    <div className={cn("space-y-4 text-sm", className)}>

      {/* ── Block 1: Acknowledgement ─────────────────────────────────────── */}
      {ack && (
        <p className="text-gray-700 leading-relaxed">{ack.text}</p>
      )}

      {/* ── Block 3: Escalation (rendered early if L3+) ──────────────────── */}
      {escalation && escalation.level !== 'L1' && (
        <EscalationAlert
          level={escalation.level}
          reason={escalation.reason}
          action={escalation.action}
          practitionerTip={escalation.practitionerTip}
        />
      )}

      {/* ── Block 2: Understanding ───────────────────────────────────────── */}
      {understand && (
        <div className="rounded-[8px] border border-[#DAD7CF] bg-[#FDFBF7] px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Info className="size-3.5 text-gray-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              What I understood
            </span>
          </div>
          <p className="text-gray-600 leading-relaxed">{understand.summary}</p>
          {understand.assumptions && understand.assumptions.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {understand.assumptions.map((a, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                  <span className="mt-1 size-1 rounded-full bg-gray-300 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Block 1 (L1) Escalation inline badge ─────────────────────────── */}
      {escalation && escalation.level === 'L1' && (
        <div className="flex items-center gap-2 text-xs text-[#2D6A4F]">
          <CheckCircle className="size-3.5 shrink-0" />
          <span>{escalation.action}</span>
        </div>
      )}

      {/* ── Block 4: Home care ───────────────────────────────────────────── */}
      {homeCare && allowHomeCare && homeCare.items.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="size-3.5 text-[#E9A21A]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {homeCare.heading}
            </span>
          </div>
          <div className="space-y-2">
            {homeCare.items.map((item, i) => (
              <div
                key={i}
                className="rounded-[8px] border border-[#DAD7CF] bg-white px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-gray-800">{item.title}</span>
                  <EvidenceLabelBadge
                    label={item.evidenceLabel}
                    size="sm"
                    showTooltip={true}
                  />
                </div>
                <p className="mt-1 text-gray-600 leading-relaxed">{item.description}</p>
                {item.timing && (
                  <p className="mt-1.5 text-xs text-gray-400">{item.timing}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suppression notice at L4/L5 */}
      {isHighEscalation && homeCare && (
        <p className="text-xs text-gray-500 italic">
          Home-care suggestions are not shown when urgent medical attention is needed.
        </p>
      )}

      {/* ── Block 5: Watch for ───────────────────────────────────────────── */}
      {watchFor && (watchFor.redFlags.length > 0 || watchFor.yellowFlags?.length) && (
        <div className="space-y-2 rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
              When to seek help
            </span>
          </div>

          {watchFor.redFlags.length > 0 && (
            <ul className="space-y-1">
              {watchFor.redFlags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-amber-800">
                  <span className="mt-1.5 size-1.5 rounded-full bg-red-400 shrink-0" />
                  {flag}
                </li>
              ))}
            </ul>
          )}

          {watchFor.yellowFlags && watchFor.yellowFlags.length > 0 && (
            <ul className="space-y-1 border-t border-amber-200 pt-2">
              {watchFor.yellowFlags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-amber-700">
                  <span className="mt-1.5 size-1.5 rounded-full bg-amber-400 shrink-0" />
                  {flag}
                </li>
              ))}
            </ul>
          )}

          {watchFor.revisitAfter && (
            <p className="text-xs text-amber-600 border-t border-amber-200 pt-2">
              No improvement after <strong>{watchFor.revisitAfter}</strong>? Please see a practitioner.
            </p>
          )}
        </div>
      )}

      {/* ── Block 7: Follow-up suggestions ───────────────────────────────── */}
      {followUp && (
        followUp.suggestedQuestions?.length ||
        followUp.relatedContentId ||
        followUp.relatedRoutineId
      ) ? (
        <div className="space-y-2">
          {followUp.suggestedQuestions && followUp.suggestedQuestions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare className="size-3.5 text-gray-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  You might also ask
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {followUp.suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onFollowUpQuestion?.(q)}
                    className="flex items-center gap-1 rounded-full border border-[#2D6A4F]/30 bg-[#EAF4EF] px-3 py-1.5 text-xs font-medium text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white transition-colors"
                  >
                    {q}
                    <ChevronRight className="size-3 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {followUp.relatedContentId && onViewContent && (
              <button
                onClick={() => onViewContent(followUp.relatedContentId!)}
                className="text-xs text-[#3D405B] underline underline-offset-2 hover:text-[#2D6A4F] transition-colors"
              >
                Read: full care guide
              </button>
            )}
            {followUp.relatedRoutineId && onStartRoutine && (
              <button
                onClick={() => onStartRoutine(followUp.relatedRoutineId!)}
                className="text-xs text-[#3D405B] underline underline-offset-2 hover:text-[#2D6A4F] transition-colors"
              >
                Try: suggested routine
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Block 6: Safety note (always last, never suppressible) ────────── */}
      <div className="rounded-[8px] border border-[#DAD7CF] bg-[#FDFBF7] px-4 py-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <ShieldCheck className="size-3.5 text-gray-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Important
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          {safetyNote?.text ?? STANDARD_SAFETY_NOTE}
        </p>
        {safetyNote?.cautionGroups && safetyNote.cautionGroups.length > 0 && (
          <p className="mt-1.5 text-xs text-gray-500">
            <span className="font-medium">Extra caution for: </span>
            {safetyNote.cautionGroups.join(", ")}.
          </p>
        )}
      </div>

    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

export function AskAroviaResponseSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 animate-pulse", className)}>
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-4 bg-gray-100 rounded w-full" />
      <div className="h-20 bg-gray-100 rounded-[8px]" />
      <div className="space-y-2">
        <div className="h-16 bg-gray-100 rounded-[8px]" />
        <div className="h-16 bg-gray-100 rounded-[8px]" />
      </div>
      <div className="h-12 bg-gray-100 rounded-[8px]" />
      <div className="h-10 bg-gray-50 rounded-[8px]" />
    </div>
  );
}
