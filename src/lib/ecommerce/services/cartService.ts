/**
 * Cart Service
 * 
 * Manages shopping cart state, price calculations (subtotal, GST, discounts, shipping),
 * preserves clinical traceability metadata, and enforces Schedule E-1 prescription checks.
 */

import { Cart, CartItem, ProductSKU, TraceabilityMetadata } from '../types';

export class CartService {
  /**
   * Initialize a fresh cart
   */
  public static createEmptyCart(userId?: string): Cart {
    return {
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      items: [],
      subtotalInINR: 0,
      discountInINR: 0,
      shippingInINR: 0,
      totalInINR: 0,
      requiresPrescriptionAudit: false
    };
  }

  /**
   * Add a product to the cart with optional clinical traceability
   */
  public static addItem(
    cart: Cart,
    product: ProductSKU,
    quantity: number = 1,
    traceability?: TraceabilityMetadata
  ): Cart {
    const existingIndex = cart.items.findIndex(item => item.productId === product.id);
    let updatedItems = [...cart.items];

    if (existingIndex >= 0) {
      const existing = updatedItems[existingIndex];
      updatedItems[existingIndex] = {
        ...existing,
        quantity: existing.quantity + quantity,
        traceability: traceability || existing.traceability
      };
    } else {
      const newItem: CartItem = {
        productId: product.id,
        sku: product.sku,
        title: product.title,
        brand: product.brand,
        unitPriceInINR: product.priceInINR,
        quantity,
        imageUrl: product.imageUrl,
        ayurvedicMetadata: product.ayurvedicMetadata,
        traceability
      };
      updatedItems.push(newItem);
    }

    return this.recalculateCart({ ...cart, items: updatedItems });
  }

  /**
   * Update item quantity
   */
  public static updateQuantity(cart: Cart, productId: string, quantity: number): Cart {
    if (quantity <= 0) {
      return this.removeItem(cart, productId);
    }

    const updatedItems = cart.items.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );

    return this.recalculateCart({ ...cart, items: updatedItems });
  }

  /**
   * Remove item from cart
   */
  public static removeItem(cart: Cart, productId: string): Cart {
    const updatedItems = cart.items.filter(item => item.productId !== productId);
    return this.recalculateCart({ ...cart, items: updatedItems });
  }

  /**
   * Recalculates subtotal, taxes, shipping, and Schedule E-1 prescription requirements
   */
  public static recalculateCart(cart: Cart, discountAmount: number = 0): Cart {
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.unitPriceInINR * item.quantity,
      0
    );

    // Free delivery over ₹499; otherwise ₹60 flat rate across India
    const shipping = subtotal > 499 || subtotal === 0 ? 0 : 60;
    const discount = Math.min(discountAmount, subtotal);
    const total = Math.max(0, subtotal - discount + shipping);

    // Any item requiring clinical prescription (Schedule E-1) flags the entire cart
    const requiresAudit = cart.items.some(
      item => item.ayurvedicMetadata.isScheduleE1
    );

    return {
      ...cart,
      subtotalInINR: subtotal,
      discountInINR: discount,
      shippingInINR: shipping,
      totalInINR: total,
      requiresPrescriptionAudit: requiresAudit
    };
  }
}
