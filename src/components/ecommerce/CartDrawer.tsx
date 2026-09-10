'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldAlert, Tag, Check, Sparkles } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    setOpen,
    updateQuantity,
    removeItem,
    subtotalInINR,
    discountInINR,
    shippingInINR,
    totalInINR,
    requiresPrescriptionAudit,
    appliedCoupon,
    applyCoupon,
    removeCoupon
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const ok = applyCoupon(couponInput);
    if (!ok) {
      setCouponError('Invalid coupon code. Try HEALIO10');
    } else {
      setCouponError('');
      setCouponInput('');
    }
  };

  const handleProceedToCheckout = async () => {
    setIsCheckingOut(true);
    try {
      // Simulate checkout order initialization
      const res = await fetch('/api/ecommerce/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: {
            id: 'cart_current',
            items,
            subtotalInINR,
            discountInINR,
            shippingInINR,
            totalInINR,
            requiresPrescriptionAudit
          },
          shippingAddress: {
            fullName: 'Ayurvedic Patient',
            phone: '+91 98765 43210',
            street: '108 Shanti Nagar',
            city: 'New Delhi',
            state: 'Delhi',
            postalCode: '110001',
            country: 'India',
            email: 'patient@healio.ai'
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Order Created Successfully!\nOrder ID: ${data.order.id}\nStatus: ${data.order.status}\nFulfillment: Dispatched to Vaidyanath Group Logistics`);
        setOpen(false);
      } else {
        alert(`Checkout Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Prescribed Ayurvedic Regimen ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Schedule E-1 Prescription Notification */}
          {requiresPrescriptionAudit && (
            <div className="mx-4 mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">AYUSH Schedule E-1 Compliance: </strong>
                Your cart contains potent classical herbs requiring BAMS physician sign-off. Healio will attach your diagnostic verification automatically.
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <ShoppingBag className="w-12 h-12 mb-3 stroke-[1.5]" />
                <p className="font-medium text-sm text-zinc-700 dark:text-zinc-300">Your regimen cart is empty</p>
                <p className="text-xs text-zinc-500 mt-1">Items recommended from your consultation report can be added here.</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex gap-3"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {item.title}
                        </h4>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-zinc-400 hover:text-red-500 transition p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {item.brand}
                      </p>
                      {item.traceability && (
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
                          Dosage: {item.traceability.recommendedDosage}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        ₹{item.unitPriceInINR * item.quantity}
                      </span>
                      <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-1.5 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-0.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-0.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300"
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

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 space-y-3">
              {/* Coupon Code Section */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Coupon (e.g. HEALIO10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600 transition"
                >
                  Apply
                </button>
              </form>

              {couponError && <p className="text-[11px] text-red-500">{couponError}</p>}
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg">
                  <span className="flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3" /> {appliedCoupon} applied (-₹{discountInINR})
                  </span>
                  <button onClick={removeCoupon} className="text-[11px] underline">Remove</button>
                </div>
              )}

              {/* Price Calculation Summary */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-zinc-200/80 dark:border-zinc-800">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <span>₹{subtotalInINR}</span>
                </div>
                {discountInINR > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount</span>
                    <span>-₹{discountInINR}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Standard Shipping</span>
                  <span>{shippingInINR === 0 ? <strong className="text-emerald-600 font-medium">FREE</strong> : `₹${shippingInINR}`}</span>
                </div>
                {shippingInINR > 0 && (
                  <p className="text-[10px] text-zinc-400">Add ₹{499 - subtotalInINR} more for free delivery</p>
                )}
                <div className="flex justify-between font-bold text-sm text-zinc-900 dark:text-zinc-100 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span>Total (inc. GST)</span>
                  <span>₹{totalInINR}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={isCheckingOut}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
              >
                {isCheckingOut ? (
                  <span>Processing with Vaidyanath Logistics...</span>
                ) : (
                  <>
                    <span>Proceed to Direct Checkout</span>
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
