'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  AlertTriangle,
  ExternalLink,
  Info,
  ShieldCheck,
  Sparkles,
  Leaf,
  Star,
  Heart,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
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
  matchScore,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const discountPercent = product.mrpInINR > product.priceInINR
    ? Math.round(((product.mrpInINR - product.priceInINR) / product.mrpInINR) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem(product, 1, traceability);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const rating = product.rating ?? 4.5;
  const reviewCount = product.reviewCount ?? 0;

  return (
    <div
      className={`relative flex flex-col rounded-2xl bg-white border transition-all duration-200 overflow-hidden group ${
        !isSafe
          ? 'border-amber-300 shadow-sm shadow-amber-100'
          : 'border-[#DAD7CF] shadow-sm hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* ── Discount badge ── */}
      {discountPercent > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-[#0F6E56] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {discountPercent}% OFF
        </div>
      )}

      {/* ── Wishlist button ── */}
      <button
        onClick={() => setWishlisted((w) => !w)}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 border border-[#DAD7CF] hover:border-rose-300 transition"
        title="Save to wishlist"
      >
        <Heart
          className={`w-3.5 h-3.5 transition ${wishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}
        />
      </button>

      {/* ── Product image ── */}
      <div className="relative w-full h-44 bg-gradient-to-br from-[#EAF4EF] to-[#F0F9F5] overflow-hidden">
        {!imgError && product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            unoptimized
            onError={() => setImgError(true)}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#0F6E56]">
            <div className="p-3 rounded-full bg-[#0F6E56]/10 mb-2">
              <Leaf className="w-8 h-8 text-[#0F6E56]" />
            </div>
            <span className="text-[11px] font-bold text-[#0B5B47] uppercase tracking-wide">
              {product.ayurvedicMetadata.form}
            </span>
          </div>
        )}
      </div>

      {/* ── Brand & match score row ── */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#EAF4EF] text-[#0F6E56] border border-[#C8E6C9]">
            {product.brand}
          </span>
          {product.ayurvedicMetadata.isScheduleE1 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Sch E-1
            </span>
          )}
        </div>
        {matchScore !== undefined && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#0F6E56]">
            <Sparkles className="w-3.5 h-3.5" />
            {matchScore}% Match
          </div>
        )}
      </div>

      {/* ── Product info ── */}
      <div className="px-4 pt-2 pb-1 flex-1">
        <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
          {product.title}
        </h4>
        <p className="text-[11px] font-medium text-[#0F6E56] mt-0.5 italic line-clamp-1">
          {product.ayurvedicMetadata.classicalFormulationName} · {product.unit}
        </p>

        {/* Star rating */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3 h-3 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}`}
              />
            ))}
          </div>
          <span className="text-[11px] text-slate-500">
            {rating.toFixed(1)} {reviewCount > 0 && `(${reviewCount.toLocaleString()})`}
          </span>
        </div>

        {/* Dosha tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {product.ayurvedicMetadata.doshaTarget.pacifies.map((dosha) => (
            <span
              key={dosha}
              className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF4EF] text-[#0B5B47] font-semibold border border-[#C8E6C9] uppercase"
            >
              ↓ {dosha}
            </span>
          ))}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase">
            {product.ayurvedicMetadata.form}
          </span>
        </div>

        {/* Stock indicator */}
        <div className="mt-2">
          {product.stockQuantity > 0 ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              In Stock · {product.stockQuantity} units
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">Out of stock</span>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-lg font-extrabold text-slate-900">₹{product.priceInINR}</span>
          {product.mrpInINR > product.priceInINR && (
            <span className="text-xs line-through text-slate-400">₹{product.mrpInINR}</span>
          )}
        </div>
      </div>

      {/* ── Traceability / dosage banner ── */}
      {traceability && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-[#EAF4EF] border border-[#C8E6C9] text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#0B5B47]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0F6E56]" />
            Prescribed Dosage
          </div>
          <p className="text-[#0F6E56] mt-0.5 text-[11px]">
            {traceability.recommendedDosage} with <strong>{traceability.anupana}</strong>
          </p>
        </div>
      )}

      {/* ── Safety alerts ── */}
      {safetyAlerts.length > 0 && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
          {safetyAlerts.map((alert, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Classical monograph accordion ── */}
      {showDetails && (
        <div className="mx-4 mt-2 p-3 rounded-xl bg-[#F5F3EE] border border-[#E0DDD8] text-xs space-y-1.5">
          <div>
            <span className="font-bold text-slate-700">Classical Citation: </span>
            <span className="text-slate-600">{product.ayurvedicMetadata.classicalTextReference}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Key Botanicals: </span>
            <span className="text-slate-600">
              {product.ayurvedicMetadata.botanicalComposition.map((b) => b.herbName).join(', ')}
            </span>
          </div>
          <div>
            <span className="font-bold text-slate-700">AYUSH License: </span>
            <span className="font-mono text-slate-600">{product.ayurvedicMetadata.ayushLicenseNumber}</span>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="p-4 pt-3 flex items-center gap-2 border-t border-[#F0EDE8] mt-3">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition flex items-center gap-1"
          title="Classical monograph details"
        >
          <Info className="w-4 h-4" />
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {product.stockQuantity > 0 ? (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isSafe}
            className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition ${
              !isSafe
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-[#0F6E56] hover:bg-[#0B5B47] text-white shadow-sm hover:shadow-md active:scale-[0.98]'
            }`}
          >
            {justAdded ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Regimen</span>
              </>
            )}
          </button>
        ) : (
          <a
            href={product.affiliateFallbackUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 bg-slate-800 text-white hover:bg-slate-900 transition"
          >
            <span>Shop Online</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
