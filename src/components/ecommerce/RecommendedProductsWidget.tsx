'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, Sparkles, AlertCircle, ShieldCheck, ArrowUpRight } from 'lucide-react';
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

  const toggleCart = useCartStore((state) => state.toggleCart);
  const totalCartCount = useCartStore((state) => state.items.reduce((s, i) => s + i.quantity, 0));

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
            preferredBrand: 'Vaidyanath Group'
          })
        });

        const data = await res.json();
        if (data.success && isMounted) {
          setMatches(data.matches);
        } else if (isMounted) {
          setError(data.error || 'Failed to match products');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error connecting to product engine');
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

    return () => {
      isMounted = false;
    };
  }, [diagnosticId, recommendedFormulations, patientVikriti, patientPrakriti, patientConditions]);

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Matching clinical formulations to verified Vaidyanath Group inventory...
        </p>
      </div>
    );
  }

  if (error || matches.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/20 dark:from-emerald-950/20 dark:via-zinc-900 dark:to-teal-950/20 p-5">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-100 dark:border-emerald-950/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Verified Ayurvedic Products & Direct Purchase
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Grounded in your diagnostic report. Sourced from partner <strong className="font-semibold text-zinc-700 dark:text-zinc-300">Vaidyanath Group</strong>.
          </p>
        </div>

        {totalCartCount > 0 && (
          <button
            onClick={toggleCart}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition shadow-xs self-start sm:self-auto"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View Regimen Cart ({totalCartCount})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid of Matched Products */}
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

      {/* Bottom Compliance & Authenticity Guarantee */}
      <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-emerald-950/60 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>100% Authentic AYUSH GMP Certified Formulations</span>
        </div>
        <span>Direct Vaidyanath Group Dropship</span>
      </div>
    </div>
  );
};
