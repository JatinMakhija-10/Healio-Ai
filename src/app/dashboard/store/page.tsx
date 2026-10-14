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
  X,
  SlidersHorizontal,
  TrendingUp,
  Package,
} from 'lucide-react';
import { AYURVEDIC_CATALOG } from '@/lib/ecommerce/catalog/catalogData';
import { ProductCard } from '@/components/ecommerce/ProductCard';
import { CartDrawer } from '@/components/ecommerce/CartDrawer';
import { useCartStore } from '@/stores/cartStore';
import { DoshaType } from '@/lib/ecommerce/types';

/* ── Category definitions ────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'ALL',      label: 'All Products',    icon: Sparkles,    color: '#0F6E56', bg: '#EAF4EF' },
  { id: 'pitta',   label: 'Pacifies Pitta',  icon: Zap,         color: '#E9A21A', bg: '#FEF6E0' },
  { id: 'vata',    label: 'Pacifies Vata',   icon: Leaf,        color: '#2D6A4F', bg: '#EAF4EF' },
  { id: 'kapha',   label: 'Pacifies Kapha',  icon: FlaskConical,color: '#3D405B', bg: '#EEEEF5' },
  { id: 'rasayana',label: 'Rasayana',         icon: Sun,         color: '#C9675A', bg: '#FAEAE8' },
] as const;

/* ── Promo banner cards ──────────────────────────────────────────────── */
const PROMO_CARDS = [
  { id: 1, eyebrow: 'Up to 15% off', title: 'Classical\nFormulations', bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', accent: '#0F6E56', emoji: '🌿' },
  { id: 2, eyebrow: 'Up to 20% off', title: 'Ayurvedic\nRasayanas',    bg: 'linear-gradient(135deg, #FEF6E0 0%, #FDE68A 100%)', accent: '#C97A10', emoji: '✨' },
  { id: 3, eyebrow: 'Up to 10% off', title: 'Herbal Oils\n& Liniments', bg: 'linear-gradient(135deg, #EEF2FF 0%, #C7D2FE 100%)', accent: '#3D405B', emoji: '💧' },
  { id: 4, eyebrow: 'Up to 25% off', title: 'Immunity\nBoosters',      bg: 'linear-gradient(135deg, #FAEAE8 0%, #F9A8A0 100%)', accent: '#C9675A', emoji: '🛡️' },
];

/* ── Sort options ────────────────────────────────────────────────────── */
type SortKey = 'default' | 'price_asc' | 'price_desc' | 'rating' | 'name';
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'default',    label: 'Featured' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name',       label: 'Name A–Z' },
];

/* ── Stat badges for hero ────────────────────────────────────────────── */
const STATS = [
  { icon: ShieldCheck, text: 'AYUSH GMP Certified' },
  { icon: Truck,       text: 'Free Delivery ₹499+' },
  { icon: BadgeCheck,  text: 'Clinically Matched' },
];

/* ── Featured banners row ────────────────────────────────────────────── */
const FEATURE_STRIPS = [
  { icon: BadgeCheck,  title: '100% Authentic',       sub: 'Classical formulations' },
  { icon: ShieldCheck, title: 'AYUSH Compliant',       sub: 'Schedule E-1 verified' },
  { icon: Truck,       title: 'Pan-India Delivery',    sub: 'Express & reliable' },
  { icon: TrendingUp,  title: 'Dosha Matched',         sub: 'Personalised to you' },
  { icon: Package,     title: 'GMP Manufactured',      sub: 'Quality assured' },
];

export default function StorefrontPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'pitta' | 'vata' | 'kapha' | 'rasayana'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const toggleCart   = useCartStore((s) => s.toggleCart);
  const totalCount   = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));

  /* ── Filtered + sorted products ──────────────────────────────────── */
  const filteredProducts = useMemo(() => {
    let list = AYURVEDIC_CATALOG.filter((product) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        product.title.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.ayurvedicMetadata.classicalFormulationName.toLowerCase().includes(q);

      const matchesCategory =
        activeCategory === 'ALL' ||
        (activeCategory === 'rasayana'
          ? product.ayurvedicMetadata.form?.toLowerCase().includes('rasayana') ?? false
          : product.ayurvedicMetadata.doshaTarget.pacifies.includes(activeCategory as DoshaType));

      return matchesSearch && matchesCategory;
    });

    switch (sortKey) {
      case 'price_asc':  list = [...list].sort((a, b) => a.priceInINR - b.priceInINR); break;
      case 'price_desc': list = [...list].sort((a, b) => b.priceInINR - a.priceInINR); break;
      case 'rating':     list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      case 'name':       list = [...list].sort((a, b) => a.title.localeCompare(b.title)); break;
    }
    return list;
  }, [searchQuery, activeCategory, sortKey]);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? 'Featured';

  return (
    <div className="min-h-screen pb-24 bg-[#FDFAF6]">

      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0B5B47 0%, #0F6E56 45%, #1A7A5E 100%)', minHeight: 220 }}
      >
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '40%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

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
              Classical Ayurvedic medicines matched to your doshic constitution.
              Grounded in Samhitas and AYUSH pharmacopoeia — delivered to your door.
            </p>

            {/* Search */}
            <div className="relative mt-5 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                placeholder="Search herbs, formulations or conditions…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-sm rounded-2xl bg-white/15 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
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
            <span className="text-5xl font-black text-white">10k+</span>
            <span className="text-xs text-white/60 mt-1 font-medium">Ayurvedic products<br />curated daily</span>
          </div>
        </div>
      </div>

      {/* ── Feature strip ────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {FEATURE_STRIPS.map(({ icon: Icon, title, sub }) => (
          <div
            key={title}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-[#E8E3DC] shadow-sm text-center"
          >
            <div className="w-9 h-9 rounded-full bg-[#EAF4EF] flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-[#0F6E56]" />
            </div>
            <span className="text-[11px] font-bold text-slate-800">{title}</span>
            <span className="text-[10px] text-slate-500">{sub}</span>
          </div>
        ))}
      </div>

      {/* ── Category Filter Row ───────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {CATEGORIES.map(({ id, label, icon: Icon, color, bg }) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id as typeof activeCategory)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-150"
            style={{
              background:   activeCategory === id ? bg   : '#FFFFFF',
              borderColor:  activeCategory === id ? color : '#E8E3DC',
              boxShadow:    activeCategory === id ? `0 2px 12px 0 ${color}22` : '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="text-[12px] font-semibold text-center leading-tight" style={{ color: activeCategory === id ? color : '#374151' }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Promo Cards Row ───────────────────────────────────────────── */}
      <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {PROMO_CARDS.map((card) => (
          <div
            key={card.id}
            className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
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
              <button className="mt-3 flex items-center gap-1 text-[11px] font-semibold" style={{ color: card.accent }}>
                Shop Now <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <span className="absolute right-3 top-3 text-3xl select-none pointer-events-none" style={{ opacity: 0.35 }}>
              {card.emoji}
            </span>
          </div>
        ))}
      </div>

      {/* ── Products Section Header ───────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5 text-[#0F6E56]">
            Our Products
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Classical Pharmacy Formulations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            {searchQuery ? ` for "${searchQuery}"` : ''}
            {activeCategory !== 'ALL' ? ` · ${CATEGORIES.find(c => c.id === activeCategory)?.label}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-[#E8E3DC] hover:border-[#0F6E56]/40 transition shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {activeSortLabel}
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-10 z-20 w-48 bg-white rounded-2xl shadow-xl border border-[#E8E3DC] overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortKey(opt.value); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition hover:bg-[#EAF4EF] ${sortKey === opt.value ? 'text-[#0F6E56] font-bold bg-[#EAF4EF]' : 'text-slate-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart button (visible when has items) */}
          {totalCount > 0 && (
            <button
              onClick={toggleCart}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-semibold shadow-md transition hover:scale-105 active:scale-100"
              style={{ background: 'linear-gradient(135deg, #0F6E56, #0B5B47)' }}
            >
              <ShoppingBag className="w-4 h-4" />
              Regimen Cart ({totalCount})
            </button>
          )}
        </div>
      </div>

      {/* Product quality legend */}
      <div className="flex items-center gap-3 mb-6 text-xs text-slate-500">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span>AYUSH certified · Clinically matched to your dosha · GMP manufactured</span>
      </div>

      {/* ── Products Grid ────────────────────────────────────────────── */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 stroke-[1.5]" />
          <p className="text-base font-semibold text-slate-600">No formulations matched</p>
          <p className="text-sm mt-1">Try a different search term or reset the category filter.</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#0F6E56] hover:bg-[#0B5B47] transition shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ── Bottom Trust Strip ───────────────────────────────────────── */}
      <div
        className="mt-14 rounded-2xl p-5 flex flex-wrap items-center justify-center gap-6 text-sm"
        style={{ background: '#EAF4EF', border: '1px solid #C8E6C9' }}
      >
        {[
          { icon: BadgeCheck, text: '100% Authentic Formulations' },
          { icon: ShieldCheck, text: 'AYUSH Schedule E-1 Compliance' },
          { icon: Truck,       text: 'Pan-India Express Delivery' },
          { icon: Star,        text: 'Clinically Matched to Your Dosha' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-[#0F6E56] font-medium">
            <Icon className="w-4 h-4" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* ── Floating Cart Button ─────────────────────────────────────── */}
      {totalCount > 0 && (
        <button
          onClick={toggleCart}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3 rounded-full text-white font-semibold text-sm shadow-2xl transition-transform hover:scale-105 active:scale-100"
          style={{ background: 'linear-gradient(135deg, #0F6E56, #0B5B47)' }}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Regimen Cart ({totalCount})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
