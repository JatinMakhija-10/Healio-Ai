'use client';

import React, { useState } from 'react';
import {
  Plus,
  Minus,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ProductSKU, TraceabilityMetadata } from '@/lib/ecommerce/types';
import { useCartStore } from '@/stores/cartStore';
import { AyurvedicFormIllustration } from './AyurvedicFormIllustration';
import {
  getFormLabel,
  formatPackSize,
  formatDoshaPacification,
  getDiscountPercentage,
} from '@/lib/ecommerce/formatters';

interface ProductCardProps {
  product: ProductSKU;
  traceability?: TraceabilityMetadata;
  safetyAlerts?: string[];
  isSafe?: boolean;
  matchScore?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  traceability,
  safetyAlerts = [],
  isSafe = true,
  matchScore,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Cart actions & state
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItem = useCartStore((s) =>
    s.items.find((item) => item.productId === product.id)
  );
  const quantityInCart = cartItem?.quantity || 0;

  const discountPercent = getDiscountPercentage(
    product.mrpInINR,
    product.priceInINR
  );

  const handleAddToCart = () => {
    addItem(product, 1, traceability);
  };

  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-lg border transition-all duration-150 bg-white dark:bg-[#1A211E] text-[#1B2420] dark:text-[#E8EDE9] shadow-xs hover:shadow-md ${
        !isSafe
          ? 'border-amber-400 dark:border-amber-600'
          : 'border-[#DDD8CB] dark:border-[#2B3530]'
      }`}
    >
      {/* ── Top Header Strip: Warnings / Match Badge (Clean, no repeating brand) ─ */}
      {(product.ayurvedicMetadata.isScheduleE1 || matchScore !== undefined || !isSafe) && (
        <div className="flex items-center justify-between px-3.5 pt-3 pb-1 gap-2 text-xs">
          <div>
            {product.ayurvedicMetadata.isScheduleE1 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-[4px]">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                Schedule E-1 · Prescription
              </span>
            )}
          </div>

          {matchScore !== undefined && (
            <span className="text-[11px] font-medium text-[#0E6B52] dark:text-[#3FB58F]">
              {matchScore}% profile match
            </span>
          )}
        </div>
      )}

      {/* ── Card Main Content ────────────────────────────────────────── */}
      <div className="p-3.5 flex flex-col flex-1">
        {/* Consistent 4:3 Form Packshot Illustration */}
        <div className="w-full mb-3">
          <AyurvedicFormIllustration
            form={product.ayurvedicMetadata.form}
            title={product.title}
            unit={product.unit}
          />
        </div>

        {/* Product Name (Up to 2 lines, no truncation) */}
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="text-left font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem] text-[#1B2420] dark:text-[#E8EDE9] hover:text-[#0E6B52] dark:hover:text-[#3FB58F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E6B52] rounded-[4px]"
          title="Click to view classical formulation details"
        >
          {product.title}
        </button>

        {/* Pack Size & Form (Plain text, no duplicate title) */}
        <p className="text-xs text-[#55625A] dark:text-[#9AA8A0] mt-1">
          {formatPackSize(product.unit)} · {getFormLabel(product.ayurvedicMetadata.form)}
        </p>

        {/* Dosha Pacification (Plain sentence case, no down arrows) */}
        <p className="text-xs text-[#55625A] dark:text-[#9AA8A0] mt-1.5 font-medium">
          {formatDoshaPacification(product.ayurvedicMetadata.doshaTarget.pacifies)}
        </p>

        {/* Optional honest rating with review count */}
        {product.rating > 0 && product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#55625A] dark:text-[#9AA8A0]">
            <span className="text-amber-600 dark:text-amber-400 font-semibold">★ {product.rating.toFixed(1)}</span>
            <span>({product.reviewCount} verified reviews)</span>
          </div>
        )}

        {/* Pricing Block */}
        <div className="mt-3 pt-2.5 border-t border-[#DDD8CB]/60 dark:border-[#2B3530]/60">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-[#1B2420] dark:text-[#E8EDE9]">
              ₹{product.priceInINR}
            </span>
            {product.mrpInINR > product.priceInINR && (
              <>
                <span className="text-xs text-[#55625A] dark:text-[#9AA8A0] line-through">
                  MRP ₹{product.mrpInINR}
                </span>
                <span className="text-xs text-[#55625A] dark:text-[#9AA8A0]">
                  ({discountPercent}% off)
                </span>
              </>
            )}
          </div>
          <span className="text-[11px] text-[#55625A] dark:text-[#9AA8A0] block mt-0.5">
            MRP includes all taxes
          </span>
        </div>

        {/* Clinical Traceability / Prescribed Dosage (when prescribed) */}
        {traceability && (
          <div className="mt-3 p-2.5 rounded-[4px] bg-[#EAF4EF] dark:bg-[#152720] border border-[#C8E6C9] dark:border-[#1E4233] text-xs">
            <div className="font-semibold text-[#0E6B52] dark:text-[#3FB58F]">
              Prescribed Dosage & Anupana
            </div>
            <p className="text-[#1B2420] dark:text-[#E8EDE9] mt-0.5 text-[11px]">
              {traceability.recommendedDosage} with{' '}
              <strong>{traceability.anupana}</strong>
            </p>
          </div>
        )}

        {/* Safety Alerts (e.g. contraindications for patient) */}
        {safetyAlerts.length > 0 && (
          <div className="mt-3 p-2.5 rounded-[4px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
            {safetyAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>{alert}</span>
              </div>
            ))}
          </div>
        )}

        {/* Classical Monograph Details Accordion */}
        {showDetails && (
          <div className="mt-3 p-3 rounded-[4px] bg-[#F7F5F0] dark:bg-[#151B18] border border-[#DDD8CB] dark:border-[#2B3530] text-xs space-y-2 text-[#1B2420] dark:text-[#E8EDE9]">
            <div>
              <span className="font-semibold text-[#55625A] dark:text-[#9AA8A0]">
                Classical Citation:{' '}
              </span>
              <span>{product.ayurvedicMetadata.classicalTextReference}</span>
            </div>
            <div>
              <span className="font-semibold text-[#55625A] dark:text-[#9AA8A0]">
                AYUSH License:{' '}
              </span>
              <span className="font-mono">{product.ayurvedicMetadata.ayushLicenseNumber}</span>
            </div>
            {product.ayurvedicMetadata.botanicalComposition.length > 0 && (
              <div>
                <span className="font-semibold text-[#55625A] dark:text-[#9AA8A0]">
                  Composition:{' '}
                </span>
                <span>
                  {product.ayurvedicMetadata.botanicalComposition
                    .map((b) => b.herbName)
                    .join(', ')}
                </span>
              </div>
            )}
            {product.ayurvedicMetadata.recommendedAnupana.length > 0 && (
              <div>
                <span className="font-semibold text-[#55625A] dark:text-[#9AA8A0]">
                  Recommended Anupana:{' '}
                </span>
                <span>{product.ayurvedicMetadata.recommendedAnupana.join(', ')}</span>
              </div>
            )}
            {product.ayurvedicMetadata.contraindications.length > 0 && (
              <div>
                <span className="font-semibold text-amber-800 dark:text-amber-400">
                  Contraindications:{' '}
                </span>
                <span>{product.ayurvedicMetadata.contraindications.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Card Action Footer ────────────────────────────────────────── */}
      <div className="px-3.5 pb-3.5 pt-2 flex items-center gap-2 border-t border-[#DDD8CB]/50 dark:border-[#2B3530]/50">
        {/* Text Button: Details with visible label and adequate tap area */}
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="h-9 px-2.5 text-xs font-medium text-[#55625A] hover:text-[#1B2420] dark:text-[#9AA8A0] dark:hover:text-[#E8EDE9] hover:bg-[#F7F5F0] dark:hover:bg-[#2B3530]/50 rounded-[4px] transition flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E6B52]"
          aria-expanded={showDetails}
          aria-label={`${showDetails ? 'Hide' : 'View'} formulation details for ${product.title}`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Details</span>
          {showDetails ? (
            <ChevronUp className="w-3 h-3 ml-0.5" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-0.5" />
          )}
        </button>

        {/* Primary Action Button / Quantity Stepper */}
        {isOutOfStock ? (
          <button
            type="button"
            disabled
            className="flex-1 h-9 px-3 rounded-[8px] text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-500 cursor-not-allowed text-center"
          >
            Out of stock
          </button>
        ) : quantityInCart > 0 ? (
          /* Quantity stepper once added */
          <div className="flex-1 h-9 flex items-center justify-between border border-[#0E6B52] dark:border-[#3FB58F] bg-[#0E6B52]/5 dark:bg-[#3FB58F]/10 rounded-[8px] px-2 text-[#0E6B52] dark:text-[#3FB58F]">
            <button
              type="button"
              onClick={() => updateQuantity(product.id, quantityInCart - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[#0E6B52]/10 dark:hover:bg-[#3FB58F]/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E6B52]"
              aria-label={`Decrease quantity of ${product.title}`}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold px-2">
              {quantityInCart} in regimen
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(product.id, quantityInCart + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[#0E6B52]/10 dark:hover:bg-[#3FB58F]/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E6B52]"
              aria-label={`Increase quantity of ${product.title}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Calmer outline button: "Add to regimen" */
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isSafe}
            className={`flex-1 h-9 px-3 rounded-[8px] font-semibold text-xs flex items-center justify-center gap-1.5 transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E6B52] ${
              !isSafe
                ? 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed'
                : 'border-[#0E6B52] text-[#0E6B52] dark:border-[#3FB58F] dark:text-[#3FB58F] hover:bg-[#0E6B52] hover:text-white dark:hover:bg-[#3FB58F] dark:hover:text-[#121715] active:scale-98'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to regimen</span>
          </button>
        )}
      </div>
    </div>
  );
};
