'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, AlertTriangle, CheckCircle, ExternalLink, Info, ShieldCheck, Sparkles } from 'lucide-react';
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
  const addItem = useCartStore((state) => state.addItem);

  const discountPercent = Math.round(
    ((product.mrpInINR - product.priceInINR) / product.mrpInINR) * 100
  );

  const handleAddToCart = () => {
    addItem(product, 1, traceability);
  };

  return (
    <div className={`relative flex flex-col rounded-2xl border transition-all duration-200 bg-white/95 dark:bg-zinc-900/95 overflow-hidden shadow-sm hover:shadow-md ${
      !isSafe ? 'border-amber-400 dark:border-amber-600/60' : 'border-zinc-200 dark:border-zinc-800'
    }`}>
      {/* Brand & Partner Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            {product.brand}
          </span>
          {product.ayurvedicMetadata.isScheduleE1 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Schedule E-1
            </span>
          )}
        </div>
        {matchScore !== undefined && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{matchScore}% Match</span>
          </div>
        )}
      </div>

      {/* Product Image & Basic Info */}
      <div className="p-4 flex gap-4">
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
            {product.title}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 italic line-clamp-1">
            {product.ayurvedicMetadata.classicalFormulationName} ({product.unit})
          </p>

          {/* Dosha Targets */}
          <div className="flex flex-wrap gap-1 mt-2">
            {product.ayurvedicMetadata.doshaTarget.pacifies.map((dosha) => (
              <span
                key={dosha}
                className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 font-medium"
              >
                ↓ {dosha.toUpperCase()}
              </span>
            ))}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase">
              {product.ayurvedicMetadata.form}
            </span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mt-2.5">
            <span className="text-base font-bold text-zinc-900 dark:text-white">
              ₹{product.priceInINR}
            </span>
            {product.mrpInINR > product.priceInINR && (
              <>
                <span className="text-xs line-through text-zinc-400">
                  ₹{product.mrpInINR}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {discountPercent}% OFF
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Clinical Traceability & Dosage Banner */}
      {traceability && (
        <div className="mx-4 mb-3 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Prescribed Dosage & Anupana</span>
          </div>
          <p className="text-emerald-800/90 dark:text-emerald-300/90 mt-1 text-[11px]">
            {traceability.recommendedDosage} with <strong className="font-semibold">{traceability.anupana}</strong>
          </p>
        </div>
      )}

      {/* Safety Alerts */}
      {safetyAlerts.length > 0 && (
        <div className="mx-4 mb-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
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
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-100 dark:border-zinc-800 text-xs space-y-2">
          <div>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Classical Citation: </span>
            <span className="text-zinc-600 dark:text-zinc-400">{product.ayurvedicMetadata.classicalTextReference}</span>
          </div>
          <div>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Key Botanical Ingredients: </span>
            <span className="text-zinc-600 dark:text-zinc-400">
              {product.ayurvedicMetadata.botanicalComposition.map(b => b.herbName).join(', ')}
            </span>
          </div>
          <div>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">AYUSH License: </span>
            <span className="font-mono text-zinc-600 dark:text-zinc-400">{product.ayurvedicMetadata.ayushLicenseNumber}</span>
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
            className={`flex-1 py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${
              !isSafe
                ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Regimen</span>
          </button>
        ) : (
          <a
            href={product.affiliateFallbackUrl || 'https://www.baidyanath.co.in'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 bg-zinc-800 text-white hover:bg-zinc-900 transition"
          >
            <span>Buy on Baidyanath</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
