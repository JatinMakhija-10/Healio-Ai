'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingBag, Search, Filter, Sparkles, ShieldCheck } from 'lucide-react';
import { AYURVEDIC_CATALOG } from '@/lib/ecommerce/catalog/catalogData';
import { ProductCard } from '@/components/ecommerce/ProductCard';
import { CartDrawer } from '@/components/ecommerce/CartDrawer';
import { useCartStore } from '@/stores/cartStore';
import { DoshaType } from '@/lib/ecommerce/types';

export default function StorefrontPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedDosha, setSelectedDosha] = useState<'ALL' | DoshaType>('ALL');

  const toggleCart = useCartStore((state) => state.toggleCart);
  const totalCartCount = useCartStore((state) => state.items.reduce((s, i) => s + i.quantity, 0));

  const filteredProducts = useMemo(() => {
    return AYURVEDIC_CATALOG.filter((product) => {
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.ayurvedicMetadata.classicalFormulationName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBrand =
        selectedBrand === 'ALL' || product.brand.toLowerCase() === selectedBrand.toLowerCase();

      const matchesDosha =
        selectedDosha === 'ALL' ||
        product.ayurvedicMetadata.doshaTarget.pacifies.includes(selectedDosha as DoshaType);

      return matchesSearch && matchesBrand && matchesDosha;
    });
  }, [searchQuery, selectedBrand, selectedDosha]);

  return (
    <div className="min-h-screen pb-16">
      {/* Top Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-900 to-zinc-900 text-white p-8 mb-8 shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Official Supplier Partner: Vaidyanath Group
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Ayurvedic Pharmacy & Formulations
          </h1>
          <p className="mt-3 text-sm text-emerald-100/80 leading-relaxed">
            Order authentic classical medicines directly within Healio.AI. Every product is matched to your doshic constitution and backed by classical Samhitas.
          </p>

          <div className="flex items-center gap-4 mt-5 text-xs text-emerald-200">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>AYUSH Certified GMP</span>
            </div>
            <span>•</span>
            <div>Free Delivery above ₹499</div>
            <span>•</span>
            <div>Direct Dropship Logistics</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search classical herbs, formulations, or ailments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        {/* Dosha Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['ALL', 'pitta', 'vata', 'kapha'] as const).map((dosha) => (
            <button
              key={dosha}
              onClick={() => setSelectedDosha(dosha)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedDosha === dosha
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {dosha === 'ALL' ? 'All Doshas' : `Pacifies ${dosha.toUpperCase()}`}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-base font-medium">No Ayurvedic formulations matched your search.</p>
          <p className="text-xs mt-1">Try resetting the dosha filter or searching for another herb.</p>
        </div>
      )}

      {/* Floating Cart Trigger */}
      {totalCartCount > 0 && (
        <button
          onClick={toggleCart}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xl transition transform hover:scale-105"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Regimen Cart ({totalCartCount})</span>
        </button>
      )}

      {/* Cart Drawer Modal */}
      <CartDrawer />
    </div>
  );
}
