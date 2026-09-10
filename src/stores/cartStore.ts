/**
 * Zustand Cart Store for Healio.AI E-Commerce Integration
 * 
 * Supports adding products directly from diagnostic recommendation cards
 * with attached clinical traceability metadata.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProductSKU, CartItem, TraceabilityMetadata } from '@/lib/ecommerce/types';
import { CartService } from '@/lib/ecommerce/services/cartService';

interface CartState {
  items: CartItem[];
  subtotalInINR: number;
  discountInINR: number;
  shippingInINR: number;
  totalInINR: number;
  requiresPrescriptionAudit: boolean;
  isOpen: boolean;
  appliedCoupon: string | null;

  // Actions
  addItem: (product: ProductSKU, quantity?: number, traceability?: TraceabilityMetadata) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  toggleCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotalInINR: 0,
      discountInINR: 0,
      shippingInINR: 0,
      totalInINR: 0,
      requiresPrescriptionAudit: false,
      isOpen: false,
      appliedCoupon: null,

      addItem: (product, quantity = 1, traceability) => {
        const state = get();
        const currentCart = {
          id: 'client_cart',
          items: state.items,
          subtotalInINR: state.subtotalInINR,
          discountInINR: state.discountInINR,
          shippingInINR: state.shippingInINR,
          totalInINR: state.totalInINR,
          requiresPrescriptionAudit: state.requiresPrescriptionAudit
        };

        const updatedCart = CartService.addItem(currentCart, product, quantity, traceability);

        set({
          items: updatedCart.items,
          subtotalInINR: updatedCart.subtotalInINR,
          discountInINR: updatedCart.discountInINR,
          shippingInINR: updatedCart.shippingInINR,
          totalInINR: updatedCart.totalInINR,
          requiresPrescriptionAudit: updatedCart.requiresPrescriptionAudit,
          isOpen: true // Automatically open drawer on item add
        });
      },

      removeItem: (productId) => {
        const state = get();
        const currentCart = {
          id: 'client_cart',
          items: state.items,
          subtotalInINR: state.subtotalInINR,
          discountInINR: state.discountInINR,
          shippingInINR: state.shippingInINR,
          totalInINR: state.totalInINR,
          requiresPrescriptionAudit: state.requiresPrescriptionAudit
        };

        const updatedCart = CartService.removeItem(currentCart, productId);

        set({
          items: updatedCart.items,
          subtotalInINR: updatedCart.subtotalInINR,
          discountInINR: updatedCart.discountInINR,
          shippingInINR: updatedCart.shippingInINR,
          totalInINR: updatedCart.totalInINR,
          requiresPrescriptionAudit: updatedCart.requiresPrescriptionAudit
        });
      },

      updateQuantity: (productId, quantity) => {
        const state = get();
        const currentCart = {
          id: 'client_cart',
          items: state.items,
          subtotalInINR: state.subtotalInINR,
          discountInINR: state.discountInINR,
          shippingInINR: state.shippingInINR,
          totalInINR: state.totalInINR,
          requiresPrescriptionAudit: state.requiresPrescriptionAudit
        };

        const updatedCart = CartService.updateQuantity(currentCart, productId, quantity);

        set({
          items: updatedCart.items,
          subtotalInINR: updatedCart.subtotalInINR,
          discountInINR: updatedCart.discountInINR,
          shippingInINR: updatedCart.shippingInINR,
          totalInINR: updatedCart.totalInINR,
          requiresPrescriptionAudit: updatedCart.requiresPrescriptionAudit
        });
      },

      clearCart: () => {
        set({
          items: [],
          subtotalInINR: 0,
          discountInINR: 0,
          shippingInINR: 0,
          totalInINR: 0,
          requiresPrescriptionAudit: false,
          appliedCoupon: null
        });
      },

      setOpen: (isOpen) => set({ isOpen }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      applyCoupon: (code) => {
        const cleanCode = code.trim().toUpperCase();
        if (cleanCode === 'HEALIO10') {
          const discount = Math.round(get().subtotalInINR * 0.10);
          set({
            appliedCoupon: cleanCode,
            discountInINR: discount,
            totalInINR: Math.max(0, get().subtotalInINR - discount + get().shippingInINR)
          });
          return true;
        }
        return false;
      },

      removeCoupon: () => {
        set({
          appliedCoupon: null,
          discountInINR: 0,
          totalInINR: get().subtotalInINR + get().shippingInINR
        });
      }
    }),
    {
      name: 'healio-ecommerce-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        subtotalInINR: state.subtotalInINR,
        discountInINR: state.discountInINR,
        shippingInINR: state.shippingInINR,
        totalInINR: state.totalInINR,
        requiresPrescriptionAudit: state.requiresPrescriptionAudit
      })
    }
  )
);
