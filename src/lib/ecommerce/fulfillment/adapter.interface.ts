/**
 * Supplier Fulfillment Adapter Interface
 * 
 * Standardizes communication across different e-commerce fulfillment partners,
 * including direct B2B API integrations (Vaidyanath Group), internal 3PL warehouses,
 * and fallback affiliate programs.
 */

import { ProductSKU, Order, ShippingAddress, SupplierDispatchOrder } from '../types';

export interface StockStatus {
  sku: string;
  inStock: boolean;
  availableQuantity: number;
  leadTimeDays: number;
}

export interface FulfillmentSubmissionResult {
  success: boolean;
  supplierOrderId?: string;
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  error?: string;
}

export interface TrackingDetails {
  supplierOrderId: string;
  status: SupplierDispatchOrder['status'];
  carrierName: string;
  trackingNumber: string;
  trackingUrl: string;
  currentLocation?: string;
  lastUpdated: string;
  estimatedDeliveryDate: string;
}

export interface ISupplierFulfillmentAdapter {
  readonly supplierId: 'VAIDYANATH_GROUP' | 'NATIVE_WAREHOUSE' | 'AFFILIATE_PARTNER';

  /**
   * Check real-time inventory levels for given SKUs
   */
  checkInventory(skus: string[]): Promise<Map<string, StockStatus>>;

  /**
   * Dispatch an order for direct dropship fulfillment
   */
  submitDropshipOrder(order: Order, address: ShippingAddress): Promise<FulfillmentSubmissionResult>;

  /**
   * Fetch live courier tracking status
   */
  trackShipment(supplierOrderId: string): Promise<TrackingDetails | null>;

  /**
   * Generate an authenticated affiliate deep link for out-of-stock or affiliate-only products
   */
  generateAffiliateLink(product: ProductSKU, affiliateRef?: string): string;
}
