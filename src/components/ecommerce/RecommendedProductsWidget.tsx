'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, Sparkles, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { ProductMatchResult } from '@/lib/ecommerce/catalog/matcher';
import { DoshaType } from '@/lib/ecommerce/types';
import { ProductCard } from './ProductCard';
import { useCartStore } from '@/stores/cartStore';

interface RecommendedProductsWidgetProps {
  diagnosticId: string;
  recommendedFormulations: string[];
  patientVikriti: DoshaType;
  patientConditions?: string[];
  patientPrakriti?: DoshaType;
}

export const RecommendedProductsWidget: React.FC<RecommendedProductsWidgetProps> = ({
  diagnosticId,
  recommendedFormulations,
  patientVikriti,
  patientConditions = [],
  patientPrakriti
}) => {
  const [matches, setMatches] = useState<ProductMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleCart      = useCartStore((state) => state.toggleCart);
  const totalCartCount  = useCartStore((state) => state.items.reduce((s, i) => s + i.quantity, 0));

  useEffect(() => {
    let isMounted = true;
    async function fetchMatches() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/ecommerce/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            diagnosticId,
            recommendedFormulations,
            patientVikriti,
            patientPrakriti,
            patientConditions,
            preferredBrand: 'Arovia Pharmacy'
          })
        });

        const data = await res.json();
        if (data.success && isMounted) {
          setMatches(data.matches);
        } else if (isMounted) {
          setError(data.error || 'Failed to match products');
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error connecting to product engine');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (recommendedFormulations.length > 0) {
      fetchMatches();
    } else {
      setIsLoading(false);
    }

    return () => { isMounted = false; };
  }, [diagnosticId, recommendedFormulations, patientVikriti, patientPrakriti, patientConditions]);

  /* ── Loading state ─────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border border-[#D4EDE5] bg-[#EAF4EF] flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#0F6E56] border-t-transparent animate-spin" />
        <p className="text-xs text-slate-600">
          Matching clinical formulations to verified Arovia pharmacy inventory…
        </p>
      </div>
    );
  }

  if (error || matches.length === 0) return null;

  /* ── Widget ────────────────────────────────────────────────────────── */
  return (
    <div className="mt-6 rounded-2xl border border-[#C8E6C9] bg-gradient-to-br from-[#EAF4EF] via-white to-[#F5F3EE] p-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4EDE5]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#EAF4EF] border border-[#C8E6C9]">
              <Sparkles className="w-4 h-4 text-[#0F6E56]" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Verified Ayurvedic Products &amp; Direct Purchase
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grounded in your diagnostic report. Sourced from Arovia&apos;s{' '}
            <strong className="font-semibold text-slate-700">AYUSH Certified</strong> partner network.
          </p>
        </div>

        {totalCartCount > 0 && (
          <button
            onClick={toggleCart}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-xs font-semibold transition shadow-sm hover:shadow self-start sm:self-auto"
            style={{ background: '#0F6E56' }}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View Regimen Cart ({totalCartCount})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {matches.map((result) => (
          <ProductCard
            key={result.product.id}
            product={result.product}
            traceability={result.traceability}
            safetyAlerts={result.safetyAlerts}
            isSafe={result.isSafe}
            matchScore={result.matchScore}
          />
        ))}
      </div>

      {/* Compliance footer */}
      <div className="mt-4 pt-3 border-t border-[#D4EDE5] flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#0F6E56]" />
          <span>100% Authentic AYUSH GMP Certified Formulations</span>
        </div>
        <span>Direct Dropship</span>
      </div>
    </div>
  );
};
