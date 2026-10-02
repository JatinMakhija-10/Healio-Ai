'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Sparkles,
  ShieldCheck,
  Leaf,
  Zap,
  FlaskConical,
  Sun,
  ChevronRight,
  Star,
  Truck,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react';
import { AYURVEDIC_CATALOG } from '@/lib/ecommerce/catalog/catalogData';
import { ProductCard } from '@/components/ecommerce/ProductCard';
import { CartDrawer } from '@/components/ecommerce/CartDrawer';
import { useCartStore } from '@/stores/cartStore';
import { DoshaType } from '@/lib/ecommerce/types';

/* ── Category definitions ────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'ALL', label: 'All Products', icon: Sparkles, color: '#0F6E56' },
  { id: 'pitta', label: 'Pacifies Pitta', icon: Zap, color: '#E9A21A' },
  { id: 'vata', label: 'Pacifies Vata', icon: Leaf, color: '#2D6A4F' },
  { id: 'kapha', label: 'Pacifies Kapha', icon: FlaskConical, color: '#3D405B' },
  { id: 'rasayana', label: 'Rasayana', icon: Sun, color: '#C9675A' },
] as const;

/* ── Promo banner cards (like reference "Medication at one place" row) ── */
const PROMO_CARDS = [
  {
    id: 1,
    eyebrow: 'Up to 15% off',
    title: 'Classical\nFormulations',
    bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    accent: '#0F6E56',
    emoji: '🌿',
  },
  {
    id: 2,
    eyebrow: 'Up to 20% off',
    title: 'Ayurvedic\nRasayanas',
    bg: 'linear-gradient(135deg, #FEF6E0 0%, #FDE68A 100%)',
    accent: '#E9A21A',
    emoji: '✨',
  },
  {
    id: 3,
    eyebrow: 'Up to 10% off',
    title: 'Herbal Oils\n& Liniments',
    bg: 'linear-gradient(135deg, #EEF2FF 0%, #C7D2FE 100%)',
    accent: '#3D405B',
    emoji: '💧',
  },
  {
    id: 4,
    eyebrow: 'Up to 25% off',
    title: 'Immunity\nBoosters',
    bg: 'linear-gradient(135deg, #FAEAE8 0%, #F9A8A0 100%)',
    accent: '#C9675A',
    emoji: '🛡️',
  },
];

/* ── Stat badges for hero ─────────────────────────────────────────── */
const STATS = [
  { icon: ShieldCheck, text: 'AYUSH GMP Certified' },
  { icon: Truck, text: 'Free Delivery ₹499+' },
  { icon: BadgeCheck, text: 'Clinically Matched' },
];

export default function StorefrontPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'pitta' | 'vata' | 'kapha' | 'rasayana'>('ALL');

  const toggleCart = useCartStore((s) => s.toggleCart);
  const totalCartCount = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));

  const filteredProducts = useMemo(() => {
    return AYURVEDIC_CATALOG.filter((product) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        product.title.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.ayurvedicMetadata.classicalFormulationName.toLowerCase().includes(q);

      const matchesCategory =
        activeCategory === 'ALL' ||
        activeCategory === 'rasayana' ||
        product.ayurvedicMetadata.doshaTarget.pacifies.includes(activeCategory as DoshaType);

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen pb-20">

      {/* ─── Hero Banner ─────────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #0B5B47 0%, #0F6E56 45%, #1A7A5E 100%)',
          minHeight: 220,
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: 'absolute', top: -60, right: -60, width: 280, height: 280,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: -40, left: '40%', width: 200, height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}
        />

        <div className="relative z-10 p-7 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white/80 text-[11px] font-semibold uppercase tracking-widest mb-4">
              <Sparkles className="w-3 h-3" />
              Arovia Herbal Pharmacy
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Authentic Ayurvedic<br />
              <span style={{ color: '#9FE1CB' }}>Medicines & Formulations</span>
            </h1>
            <p className="mt-2 text-sm text-white/70 leading-relaxed max-w-md">
              Order classical Ayurvedic medicines matched to your doshic constitution.
              Every product is grounded in classical Samhitas and AYUSH pharmacopoeia.
            </p>

            {/* Search */}
            <div className="relative mt-5 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                placeholder="Search herbs, formulations or conditions…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-white/15 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
              />
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap items-center gap-4 mt-5">
              {STATS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-white/70">
                  <Icon className="w-4 h-4 text-emerald-300" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero stat card */}
          <div
            className="hidden md:flex flex-col items-center justify-center rounded-2xl px-8 py-6 text-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <span className="text-4xl font-black text-white">10,000+</span>
            <span className="text-xs text-white/60 mt-1 font-medium">Ayurvedic products<br />curated daily</span>
          </div>
        </div>
      </div>

      {/* ─── Category Icon Row (like reference "Medicine / Wellness / Diagnostic / Health Corner") ── */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id as typeof activeCategory)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-150 group"
            style={{
              background: activeCategory === id ? color + '14' : '#FFFFFF',
              borderColor: activeCategory === id ? color : '#E5E7EB',
              boxShadow: activeCategory === id
                ? `0 2px 12px 0 ${color}22`
                : '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: color + '18' }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="text-[12px] font-semibold text-center leading-tight" style={{ color: activeCategory === id ? color : '#374151' }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Promo Cards Row (like reference "Medication at one place / Naturally Good / …") ─── */}
      <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {PROMO_CARDS.map((card) => (
          <div
            key={card.id}
            className="relative rounded-2xl overflow-hidden cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md"
            style={{ background: card.bg, minHeight: 120 }}
          >
            <div className="p-4 flex flex-col justify-between h-full" style={{ minHeight: 120 }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: card.accent, opacity: 0.7 }}>
                  {card.eyebrow}
                </p>
                <h3 className="text-sm font-bold leading-snug whitespace-pre-line" style={{ color: card.accent }}>
                  {card.title}
                </h3>
              </div>
              <button
                className="mt-3 flex items-center gap-1 text-[11px] font-semibold transition-opacity"
                style={{ color: card.accent }}
              >
                Shop Now <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <span
              className="absolute right-3 top-3 text-3xl select-none pointer-events-none"
              style={{ opacity: 0.35 }}
            >
              {card.emoji}
            </span>
          </div>
        ))}
      </div>

      {/* ─── Products Section ─────────────────────────────────────────── */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#0F6E56' }}>
            Our Daily Products
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Classical Pharmacy Formulations
          </h2>
        </div>
        {totalCartCount > 0 && (
          <button
            onClick={toggleCart}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-semibold shadow-md transition hover:scale-105"
            style={{ background: '#0F6E56' }}
          >
            <ShoppingBag className="w-4 h-4" />
            Regimen Cart ({totalCartCount})
          </button>
        )}
      </div>

      {/* Product star rating legend */}
      <div className="flex items-center gap-3 mb-6 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span>AYUSH certified · Clinically matched to your dosha · GMP manufactured</span>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 stroke-[1.5]" />
          <p className="text-base font-semibold text-slate-600">No formulations matched</p>
          <p className="text-sm mt-1">Try resetting the category filter or a different search term.</p>
        </div>
      )}

      {/* ─── Bottom Trust Strip ────────────────────────────────────────── */}
      <div
        className="mt-12 rounded-2xl p-5 flex flex-wrap items-center justify-center gap-6 text-sm"
        style={{ background: '#EAF4EF', border: '1px solid #C8E6C9' }}
      >
        {[
          { icon: BadgeCheck, text: '100% Authentic Formulations' },
          { icon: ShieldCheck, text: 'AYUSH Schedule E-1 Compliance' },
          { icon: Truck, text: 'Pan-India Express Delivery' },
          { icon: Star, text: 'Clinically Matched to Your Dosha' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-[#0F6E56] font-medium">
            <Icon className="w-4 h-4" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* Floating cart button (always visible when cart has items) */}
      {totalCartCount > 0 && (
        <button
          onClick={toggleCart}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3 rounded-full text-white font-semibold text-sm shadow-xl transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #0F6E56, #0B5B47)' }}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Regimen Cart ({totalCartCount})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
