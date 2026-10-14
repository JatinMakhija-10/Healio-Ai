'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
  Tag,
  Check,
  Sparkles,
  Leaf,
  PackageCheck,
  Truck,
  Gift,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

/* ── Progress bar toward free shipping ──────────────────────────────── */
function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const threshold = 499;
  const progress = Math.min(100, (subtotal / threshold) * 100);
  const remaining = Math.max(0, threshold - subtotal);

  if (subtotal >= threshold) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
        <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        🎉 You&apos;ve unlocked <strong>FREE delivery</strong>!
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Truck className="w-3.5 h-3.5" />
          Add <strong className="text-slate-700">₹{remaining}</strong> more for free delivery
        </span>
        <span className="font-semibold text-[#0F6E56]">{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#0F6E56] to-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/* ── Main CartDrawer ─────────────────────────────────────────────────── */
export const CartDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    setOpen,
    updateQuantity,
    removeItem,
    clearCart,
    subtotalInINR,
    discountInINR,
    shippingInINR,
    totalInINR,
    requiresPrescriptionAudit,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const totalCount = items.reduce((s, i) => s + i.quantity, 0);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const ok = applyCoupon(couponInput);
    if (!ok) {
      setCouponError('Invalid coupon. Try AROVIA10');
    } else {
      setCouponError('');
      setCouponInput('');
    }
  };

  const handleProceedToCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const res = await fetch('/api/ecommerce/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: { id: 'cart_current', items, subtotalInINR, discountInINR, shippingInINR, totalInINR, requiresPrescriptionAudit },
          shippingAddress: {
            fullName: 'Ayurvedic Patient',
            phone: '+91 98765 43210',
            street: '108 Shanti Nagar',
            city: 'New Delhi',
            state: 'Delhi',
            postalCode: '110001',
            country: 'India',
            email: 'patient@arovia.ai',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Order Confirmed!\nOrder ID: ${data.order.id}\nStatus: ${data.order.status}\nFulfillment: Processing with Arovia Logistics`);
        clearCart();
        setOpen(false);
      } else {
        alert(`Checkout Error: ${data.error}`);
      }
    } catch (err: unknown) {
      alert(`Checkout failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    /* ── Overlay ──────────────────────────────────────────────────────── */
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div className="w-screen max-w-md pointer-events-auto flex flex-col bg-[#FDFAF6] shadow-2xl border-l border-[#E8E3DC]">

          {/* ── Header ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E3DC] bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#EAF4EF] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#0F6E56]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-none">Ayurvedic Regimen</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">{totalCount} item{totalCount !== 1 ? 's' : ''} in your cart</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-slate-400 hover:text-red-500 transition underline underline-offset-2"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Schedule E-1 Prescription Warning ─────────────────── */}
          {requiresPrescriptionAudit && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">AYUSH Schedule E-1 Compliance: </strong>
                Your cart contains potent herbs requiring BAMS physician sign-off. Arovia will attach your diagnostic verification automatically.
              </div>
            </div>
          )}

          {/* ── Free Shipping Progress ─────────────────────────────── */}
          {items.length > 0 && (
            <div className="px-4 pt-3">
              <FreeShippingBar subtotal={subtotalInINR} />
            </div>
          )}

          {/* ── Cart Items ────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 px-6">
                <div className="w-20 h-20 rounded-full bg-[#EAF4EF] flex items-center justify-center mb-4">
                  <Leaf className="w-10 h-10 text-[#0F6E56] stroke-[1.5]" />
                </div>
                <p className="font-semibold text-slate-800 text-sm">Your regimen is empty</p>
                <p className="text-xs text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
                  Add Ayurvedic products matched to your dosha from the pharmacy.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F6E56] hover:bg-[#0B5B47] transition shadow-sm"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 p-3 rounded-2xl bg-white border border-[#E8E3DC] shadow-sm hover:shadow transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#EAF4EF] border border-[#D4EDE5]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Leaf className="w-7 h-7 text-[#0F6E56]" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">{item.title}</h4>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-0.5 text-slate-300 hover:text-red-500 transition flex-shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.brand}</p>
                    {item.traceability && (
                      <p className="text-[10px] text-[#0F6E56] font-medium mt-0.5">
                        Dosage: {item.traceability.recommendedDosage}
                      </p>
                    )}

                    {/* Price + Qty */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-slate-900">
                        ₹{item.unitPriceInINR * item.quantity}
                      </span>
                      <div className="flex items-center gap-1 bg-[#F5F3EF] border border-[#E0DDD8] rounded-lg px-1.5 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-0.5 text-slate-600 hover:text-slate-900 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold w-4 text-center text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-0.5 text-slate-600 hover:text-slate-900 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Footer / Checkout ────────────────────────────────── */}
          {items.length > 0 && (
            <div className="border-t border-[#E8E3DC] bg-white px-5 py-4 space-y-3">

              {/* Coupon */}
              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Coupon code (e.g. AROVIA10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#E0DDD8] bg-[#F8F5F0] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/30 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition"
                  >
                    Apply
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <Gift className="w-3.5 h-3.5" />
                    {appliedCoupon} — saving ₹{discountInINR}
                  </span>
                  <button onClick={removeCoupon} className="text-slate-400 hover:text-red-500 transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-[11px] text-red-500 -mt-1">{couponError}</p>
              )}

              {/* Price summary */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({totalCount} items)</span>
                  <span>₹{subtotalInINR}</span>
                </div>
                {discountInINR > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Coupon discount</span>
                    <span>−₹{discountInINR}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span>
                    {shippingInINR === 0
                      ? <strong className="text-emerald-700 font-semibold">FREE</strong>
                      : `₹${shippingInINR}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-[#E8E3DC]">
                  <span>Total (incl. GST)</span>
                  <span>₹{totalInINR}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 pt-1">
                {[
                  { icon: PackageCheck, label: 'Authentic' },
                  { icon: Sparkles, label: 'AYUSH Certified' },
                  { icon: Truck, label: 'Express Delivery' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <Icon className="w-3.5 h-3.5 text-[#0F6E56]" />
                    <span className="text-[9px] text-slate-500 font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={isCheckingOut}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: isCheckingOut ? '#9CA3AF' : 'linear-gradient(135deg, #0F6E56, #0B5B47)' }}
              >
                {isCheckingOut ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing your order…
                  </span>
                ) : (
                  <>
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
