'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  X,
  ShieldCheck,
  Truck,
  FileText,
  BadgeCheck,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { AYURVEDIC_CATALOG } from '@/lib/ecommerce/catalog/catalogData';
import { ProductCard } from '@/components/ecommerce/ProductCard';
import { CartDrawer } from '@/components/ecommerce/CartDrawer';
import { useCartStore } from '@/stores/cartStore';
import { DoshaType, ProductForm } from '@/lib/ecommerce/types';
import { FORM_DISPLAY_LABELS } from '@/lib/ecommerce/formatters';

/* ── Dosha filter tabs definition ──────────────────────────────────── */
type DoshaFilter = 'ALL' | 'pitta' | 'vata' | 'kapha' | 'tridoshic';

interface DoshaTabOption {
  id: DoshaFilter;
  label: string;
}

const DOSHA_TABS: DoshaTabOption[] = [
  { id: 'ALL', label: 'All' },
  { id: 'pitta', label: 'Pacifies Pitta' },
  { id: 'vata', label: 'Pacifies Vata' },
  { id: 'kapha', label: 'Pacifies Kapha' },
  { id: 'tridoshic', label: 'Tridoshic' },
];

/* ── Available Form filters ────────────────────────────────────────── */
const AVAILABLE_FORMS: Array<{ id: 'ALL' | ProductForm; label: string }> = [
  { id: 'ALL', label: 'All forms' },
  { id: 'churna', label: FORM_DISPLAY_LABELS.churna },
  { id: 'vati', label: FORM_DISPLAY_LABELS.vati },
  { id: 'taila', label: FORM_DISPLAY_LABELS.taila },
  { id: 'asava_arishta', label: FORM_DISPLAY_LABELS.asava_arishta },
  { id: 'avaleha', label: FORM_DISPLAY_LABELS.avaleha },
];

export default function StorefrontPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDosha, setSelectedDosha] = useState<DoshaFilter>('ALL');
  const [selectedForm, setSelectedForm] = useState<'ALL' | ProductForm>('ALL');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'name_asc'>('recommended');

  const toggleCart = useCartStore((s) => s.toggleCart);
  const totalCartCount = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));

  /* ── Live item counts for dosha filter tabs ──────────────────────── */
  const doshaCounts = useMemo(() => {
    const counts: Record<DoshaFilter, number> = {
      ALL: AYURVEDIC_CATALOG.length,
      pitta: 0,
      vata: 0,
      kapha: 0,
      tridoshic: 0,
    };

    AYURVEDIC_CATALOG.forEach((p) => {
      const pacifies = p.ayurvedicMetadata.doshaTarget.pacifies;
      const isTridoshic =
        pacifies.includes('vata') &&
        pacifies.includes('pitta') &&
        pacifies.includes('kapha');

      if (pacifies.includes('pitta')) counts.pitta += 1;
      if (pacifies.includes('vata')) counts.vata += 1;
      if (pacifies.includes('kapha')) counts.kapha += 1;
      if (isTridoshic) counts.tridoshic += 1;
    });

    return counts;
  }, []);

  /* ── Filtered & sorted products ──────────────────────────────────── */
  const filteredProducts = useMemo(() => {
    let list = AYURVEDIC_CATALOG.filter((product) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        product.title.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.ayurvedicMetadata.classicalFormulationName.toLowerCase().includes(q) ||
        product.ayurvedicMetadata.botanicalComposition.some(
          (b) =>
            b.herbName.toLowerCase().includes(q) ||
            (b.latinName && b.latinName.toLowerCase().includes(q))
        );

      const pacifies = product.ayurvedicMetadata.doshaTarget.pacifies;
      const isTridoshic =
        pacifies.includes('vata') &&
        pacifies.includes('pitta') &&
        pacifies.includes('kapha');

      const matchesDosha =
        selectedDosha === 'ALL' ||
        (selectedDosha === 'tridoshic' ? isTridoshic : pacifies.includes(selectedDosha as DoshaType));

      const matchesForm =
        selectedForm === 'ALL' || product.ayurvedicMetadata.form === selectedForm;

      return matchesSearch && matchesDosha && matchesForm;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.priceInINR - b.priceInINR;
        case 'price_desc':
          return b.priceInINR - a.priceInINR;
        case 'rating':
          return b.rating - a.rating;
        case 'name_asc':
          return a.title.localeCompare(b.title);
        case 'recommended':
        default:
          return 0;
      }
    });

    return list;
  }, [searchQuery, selectedDosha, selectedForm, sortBy]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedDosha('ALL');
    setSelectedForm('ALL');
    setSortBy('recommended');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedDosha !== 'ALL' ||
    selectedForm !== 'ALL' ||
    sortBy !== 'recommended';

  return (
    <div className="min-h-screen pb-20 text-[#1B2420] dark:text-[#E8EDE9]">

      {/* ─── Compact Header (Products visible without scrolling) ─────── */}
      <div className="pt-2 pb-5 border-b border-[#DDD8CB] dark:border-[#2B3530]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1B2420] dark:text-[#E8EDE9]">
              Ayurvedic Store
            </h1>
            <p className="mt-1 text-xs text-[#55625A] dark:text-[#9AA8A0]">
              Classical formulations matched to your dosha profile from your consultation.
              <span className="hidden sm:inline text-[#55625A]/70 dark:text-[#9AA8A0]/70 ml-1.5">
                Purchases are in INR and do not consume consultation credits.
              </span>
            </p>
          </div>

          {/* Header Regimen Cart Button */}
          {totalCartCount > 0 && (
            <button
              type="button"
              onClick={toggleCart}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[8px] border border-[#0E6B52] bg-[#0E6B52] text-white hover:bg-[#0B5B47] text-xs font-semibold transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E6B52]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Regimen Cart ({totalCartCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Unified Sticky Toolbar (Search, Filters, Sort, Counts) ──── */}
      <div className="sticky top-0 z-20 py-3 bg-[#FDF8F0]/95 dark:bg-[#121715]/95 backdrop-blur-xs border-b border-[#DDD8CB] dark:border-[#2B3530] mb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#55625A] dark:text-[#9AA8A0]" />
            <input
              type="text"
              placeholder="Search formulations, herbs or ingredients…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-[8px] bg-white dark:bg-[#1A211E] border border-[#DDD8CB] dark:border-[#2B3530] text-[#1B2420] dark:text-[#E8EDE9] placeholder:text-[#55625A]/60 dark:placeholder:text-[#9AA8A0]/60 focus:outline-none focus:ring-2 focus:ring-[#0E6B52] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#55625A] hover:text-[#1B2420] dark:text-[#9AA8A0] dark:hover:text-[#E8EDE9]"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Form Filter & Sort Tooling */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Form filter dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#55625A] dark:text-[#9AA8A0] hidden sm:inline" />
              <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value as typeof selectedForm)}
                className="h-8 px-2.5 text-xs rounded-[8px] bg-white dark:bg-[#1A211E] border border-[#DDD8CB] dark:border-[#2B3530] text-[#1B2420] dark:text-[#E8EDE9] focus:outline-none focus:ring-2 focus:ring-[#0E6B52] transition"
                aria-label="Filter by Ayurvedic form"
              >
                {AVAILABLE_FORMS.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#55625A] dark:text-[#9AA8A0] hidden sm:inline" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-8 px-2.5 text-xs rounded-[8px] bg-white dark:bg-[#1A211E] border border-[#DDD8CB] dark:border-[#2B3530] text-[#1B2420] dark:text-[#E8EDE9] focus:outline-none focus:ring-2 focus:ring-[#0E6B52] transition"
                aria-label="Sort product list"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Rating</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="h-8 px-2 text-[11px] font-medium text-[#55625A] hover:text-[#1B2420] dark:text-[#9AA8A0] dark:hover:text-[#E8EDE9] underline transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ─── Dosha Filter Chips (Single row text tabs with counts) ──── */}
        <div className="mt-3 flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2">
            {DOSHA_TABS.map((tab) => {
              const count = doshaCounts[tab.id];
              const isSelected = selectedDosha === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedDosha(tab.id)}
                  className={`h-7 px-3 rounded-[4px] text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E6B52] ${
                    isSelected
                      ? 'bg-[#0E6B52] text-white font-semibold'
                      : 'border border-[#DDD8CB] dark:border-[#2B3530] bg-white dark:bg-[#1A211E] text-[#55625A] dark:text-[#9AA8A0] hover:text-[#1B2420] dark:hover:text-[#E8EDE9]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] font-medium ${
                      isSelected ? 'text-white/80' : 'text-[#55625A]/70 dark:text-[#9AA8A0]/70'
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Accurate Result Count */}
          <div className="text-xs text-[#55625A] dark:text-[#9AA8A0] whitespace-nowrap shrink-0">
            {filteredProducts.length === AYURVEDIC_CATALOG.length
              ? `${filteredProducts.length} formulations`
              : `${filteredProducts.length} of ${AYURVEDIC_CATALOG.length} formulations`}
          </div>
        </div>
      </div>

      {/* ─── Product Listing Section ─────────────────────────────────── */}
      <section aria-label="Ayurvedic Formulations Catalog">
        {/* Section title (Clean sentence case, no gold stars or redundant text) */}
        <div className="mb-4">
          <h2 className="text-base font-bold text-[#1B2420] dark:text-[#E8EDE9]">
            Classical Formulations
          </h2>
        </div>

        {/* Responsive Grid with sensible 260px-300px card width */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Empty state when no formulations match query */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 px-4 rounded-lg border border-[#DDD8CB] dark:border-[#2B3530] bg-white dark:bg-[#1A211E] text-[#55625A] dark:text-[#9AA8A0] mt-4">
            <FileText className="w-10 h-10 mx-auto mb-2 text-[#55625A]/50 dark:text-[#9AA8A0]/50 stroke-[1.5]" />
            <p className="text-sm font-semibold text-[#1B2420] dark:text-[#E8EDE9]">
              No formulations match your search or filter criteria
            </p>
            <p className="text-xs mt-1">
              Try resetting the form or dosha filter, or checking for alternate herb names.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-[8px] border border-[#0E6B52] text-[#0E6B52] dark:border-[#3FB58F] dark:text-[#3FB58F] hover:bg-[#0E6B52]/10 dark:hover:bg-[#3FB58F]/10 transition"
            >
              Reset all filters
            </button>
          </div>
        )}
      </section>

      {/* ─── Bottom Trust & Compliance Strip (Accurate copy) ─────────── */}
      <aside
        className="mt-12 rounded-[12px] p-5 border border-[#DDD8CB] dark:border-[#2B3530] bg-white dark:bg-[#1A211E] flex flex-wrap items-center justify-around gap-4 text-xs text-[#55625A] dark:text-[#9AA8A0]"
        aria-label="Quality and compliance standards"
      >
        <div className="flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-[#0E6B52] dark:text-[#3FB58F] shrink-0" />
          <span>Classical Samhita Formulations</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0E6B52] dark:text-[#3FB58F] shrink-0" />
          <span>AYUSH Schedule E-1 Prescription Audit</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#0E6B52] dark:text-[#3FB58F] shrink-0" />
          <span>Pan-India Express Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#0E6B52] dark:text-[#3FB58F] shrink-0" />
          <span>Matched to your consultation profile</span>
        </div>
      </aside>

      {/* ─── Medical Disclaimer on Store Page ────────────────────────── */}
      <div className="mt-4 text-center text-[11px] text-[#55625A]/80 dark:text-[#9AA8A0]/80 max-w-2xl mx-auto leading-relaxed">
        Ayurvedic formulations are traditional preparations grounded in classical pharmacopoeia.
        Please consult a certified Ayurvedic practitioner before beginning any new medicinal regimen.
      </div>

      {/* ─── Floating Regimen Cart Button ────────────────────────────── */}
      {totalCartCount > 0 && (
        <button
          type="button"
          onClick={toggleCart}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-white font-semibold text-xs shadow-lg bg-[#0E6B52] hover:bg-[#0B5B47] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E6B52]"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Regimen Cart ({totalCartCount})</span>
        </button>
      )}

      {/* Regimen Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
