/**
 * Checkout & Order Orchestration Service
 * 
 * Manages:
 * 1. Order generation from cart & shipping address
 * 2. Schedule E-1 prescription governance
 * 3. Payment lifecycle (Razorpay / Stripe)
 * 4. Multi-supplier dispatch to Vaidyanath Group
 */

import { Cart, Order, OrderStatus, ShippingAddress, SupplierDispatchOrder } from '../types';
import { VaidyanathSupplierAdapter } from '../fulfillment/vaidyanathAdapter';

export interface CheckoutOptions {
  paymentMethod?: 'RAZORPAY' | 'STRIPE' | 'COD';
  prescriptionFileUrl?: string;
  notes?: string;
}

export class CheckoutService {
  private static orders: Map<string, Order> = new Map();

  constructor(private vaidyanathAdapter: VaidyanathSupplierAdapter) {}

  /**
   * Initialize a new order from a shopping cart
   */
  public async createOrder(
    cart: Cart,
    shippingAddress: ShippingAddress,
    options?: CheckoutOptions
  ): Promise<Order> {
    if (cart.items.length === 0) {
      throw new Error('Cannot checkout with an empty cart.');
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const requiresPrescription = cart.requiresPrescriptionAudit;

    // Check if prescription document is provided when required
    if (requiresPrescription && !options?.prescriptionFileUrl) {
      // Order enters prescription audit state awaiting verification
    }

    const initialStatus: OrderStatus = requiresPrescription && !options?.prescriptionFileUrl
      ? 'PRESCRIPTION_AUDIT'
      : 'PENDING_PAYMENT';

    // Segregate items by supplier
    const vaidyanathItems = cart.items.filter(item => item.brand === 'Vaidyanath Group' || item.sku.startsWith('VDN-'));
    const nativeItems = cart.items.filter(item => !item.sku.startsWith('VDN-'));

    const supplierDispatches: SupplierDispatchOrder[] = [];

    if (vaidyanathItems.length > 0) {
      supplierDispatches.push({
        supplierId: 'VAIDYANATH_GROUP',
        status: 'PENDING',
        lineItems: vaidyanathItems.map(i => ({
          sku: i.sku,
          quantity: i.quantity,
          unitPriceInINR: i.unitPriceInINR
        }))
      });
    }

    if (nativeItems.length > 0) {
      supplierDispatches.push({
        supplierId: 'NATIVE_WAREHOUSE',
        status: 'PENDING',
        lineItems: nativeItems.map(i => ({
          sku: i.sku,
          quantity: i.quantity,
          unitPriceInINR: i.unitPriceInINR
        }))
      });
    }

    const order: Order = {
      id: orderId,
      userId: cart.userId,
      cartId: cart.id,
      items: [...cart.items],
      shippingAddress,
      subtotalInINR: cart.subtotalInINR,
      taxInINR: Math.round(cart.subtotalInINR * 0.12), // 12% standard AYUSH GST
      shippingInINR: cart.shippingInINR,
      discountInINR: cart.discountInINR,
      totalInINR: cart.totalInINR,
      status: initialStatus,
      paymentMethod: options?.paymentMethod || 'RAZORPAY',
      paymentStatus: 'PENDING',
      supplierDispatches,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    CheckoutService.orders.set(orderId, order);
    return order;
  }

  /**
   * Process payment confirmation and trigger automated supplier dispatch
   */
  public async confirmPaymentAndDispatch(
    orderId: string,
    transactionId: string
  ): Promise<Order> {
    const order = CheckoutService.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    order.paymentStatus = 'PAID';
    order.paymentTransactionId = transactionId;
    order.status = 'PAYMENT_CONFIRMED';
    order.updatedAt = new Date().toISOString();

    // ─── Automated Dropship Dispatch to Vaidyanath Group ───────────
    for (let i = 0; i < order.supplierDispatches.length; i++) {
      const dispatch = order.supplierDispatches[i];

      if (dispatch.supplierId === 'VAIDYANATH_GROUP') {
        const result = await this.vaidyanathAdapter.submitDropshipOrder(order, order.shippingAddress);

        if (result.success) {
          dispatch.status = 'ACCEPTED';
          dispatch.externalOrderId = result.supplierOrderId;
          dispatch.carrierName = result.carrierName;
          dispatch.trackingNumber = result.trackingNumber;
          dispatch.trackingUrl = result.trackingUrl;
          dispatch.dispatchedAt = new Date().toISOString();
        } else {
          dispatch.status = 'FAILED';
          console.error(`[CheckoutService] Vaidyanath fulfillment dispatch failed: ${result.error}`);
        }
      } else if (dispatch.supplierId === 'NATIVE_WAREHOUSE') {
        dispatch.status = 'ACCEPTED';
        dispatch.externalOrderId = `NAT-${orderId}`;
      }
    }

    // Advance overall order state
    const anyDispatched = order.supplierDispatches.some(d => d.status === 'ACCEPTED');
    if (anyDispatched) {
      order.status = 'FULFILLMENT_REQUESTED';
    }

    CheckoutService.orders.set(orderId, order);
    return order;
  }

  /**
   * Get order by ID
   */
  public getOrder(orderId: string): Order | undefined {
    return CheckoutService.orders.get(orderId);
  }

  /**
   * List orders for a user
   */
  public getUserOrders(userId: string): Order[] {
    return Array.from(CheckoutService.orders.values()).filter(o => o.userId === userId);
  }
}
