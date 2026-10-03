'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, AlertTriangle, ExternalLink, Info, ShieldCheck, Sparkles, Leaf } from 'lucide-react';
import { ProductSKU, TraceabilityMetadata } from '@/lib/ecommerce/types';
import { useCartStore } from '@/stores/cartStore';

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
  matchScore
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imgError, setImgError] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const discountPercent = Math.round(
    ((product.mrpInINR - product.priceInINR) / product.mrpInINR) * 100
  );

  const handleAddToCart = () => {
    addItem(product, 1, traceability);
  };

  return (
    <div className={`relative flex flex-col rounded-2xl border transition-all duration-200 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-md ${
      !isSafe ? 'border-amber-400 dark:border-amber-600/60' : 'border-zinc-200 dark:border-zinc-800'
    }`}>
      {/* Brand & Partner Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
            {product.brand}
          </span>
          {product.ayurvedicMetadata.isScheduleE1 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/90 dark:text-amber-300 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              Schedule E-1
            </span>
          )}
        </div>
        {matchScore !== undefined && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{matchScore}% Match</span>
          </div>
        )}
      </div>

      {/* Product Image & Basic Info */}
      <div className="p-4 flex gap-4">
        {/* Product Image Box with Fallback */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-50 dark:from-emerald-950 dark:via-zinc-800 dark:to-teal-950 border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col items-center justify-center text-center p-1.5 shadow-inner">
          {!imgError && product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              unoptimized
              onError={() => setImgError(true)}
              className="object-cover transition-opacity duration-300"
              sizes="96px"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-300 h-full w-full">
              <div className="p-2 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 mb-1">
                <Leaf className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
              </div>
              <span className="text-[9px] font-bold leading-tight text-emerald-900 dark:text-emerald-200 line-clamp-1 px-1">
                {product.ayurvedicMetadata.form.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
            {product.title}
          </h4>
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-0.5 italic line-clamp-1">
            {product.ayurvedicMetadata.classicalFormulationName} ({product.unit})
          </p>

          {/* Dosha Targets */}
          <div className="flex flex-wrap gap-1 mt-2">
            {product.ayurvedicMetadata.doshaTarget.pacifies.map((dosha) => (
              <span
                key={dosha}
                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800/40"
              >
                ↓ {dosha.toUpperCase()}
              </span>
            ))}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold uppercase">
              {product.ayurvedicMetadata.form}
            </span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mt-2.5">
            <span className="text-base font-extrabold text-zinc-900 dark:text-white">
              ₹{product.priceInINR}
            </span>
            {product.mrpInINR > product.priceInINR && (
              <>
                <span className="text-xs line-through text-zinc-400 dark:text-zinc-500">
                  ₹{product.mrpInINR}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {discountPercent}% OFF
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Clinical Traceability & Dosage Banner */}
      {traceability && (
        <div className="mx-4 mb-3 p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Prescribed Dosage & Anupana</span>
          </div>
          <p className="text-emerald-800 dark:text-emerald-300 mt-1 text-[11px]">
            {traceability.recommendedDosage} with <strong className="font-semibold">{traceability.anupana}</strong>
          </p>
        </div>
      )}

      {/* Safety Alerts */}
      {safetyAlerts.length > 0 && (
        <div className="mx-4 mb-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
          {safetyAlerts.map((alert, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Accordion Toggle for Classical Monograph Reference */}
      {showDetails && (
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-100 dark:border-zinc-800 text-xs space-y-2">
          <div>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">Classical Citation: </span>
            <span className="text-zinc-600 dark:text-zinc-300">{product.ayurvedicMetadata.classicalTextReference}</span>
          </div>
          <div>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">Key Botanical Ingredients: </span>
            <span className="text-zinc-600 dark:text-zinc-300">
              {product.ayurvedicMetadata.botanicalComposition.map(b => b.herbName).join(', ')}
            </span>
          </div>
          <div>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">AYUSH License: </span>
            <span className="font-mono text-zinc-600 dark:text-zinc-300">{product.ayurvedicMetadata.ayushLicenseNumber}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 pt-2 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800/80 mt-auto">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          title="Classical monograph details"
        >
          <Info className="w-4 h-4" />
        </button>

        {product.stockQuantity > 0 ? (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isSafe}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs ${
              !isSafe
                ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed'
                : 'bg-[#0F6E56] hover:bg-[#0B5B47] text-white active:scale-98'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Regimen</span>
          </button>
        ) : (
          <a
            href={product.affiliateFallbackUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 bg-zinc-800 text-white hover:bg-zinc-900 transition"
          >
            <span>Shop Online</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
