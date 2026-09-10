/**
 * Core Type Definitions for Healio.AI E-Commerce & Product Integration
 * 
 * Implements:
 * 1. Product Catalog & Canonical Ayurvedic Formulations
 * 2. Clinical Traceability (linking purchased products directly to diagnostic engine recommendations)
 * 3. AYUSH Ministry compliance (Schedule E-1 prescription safety checks)
 * 4. Multi-supplier order dispatch (Vaidyanath Group B2B dropship, native inventory, affiliate fallback)
 */

import { DoshaType } from '../ayurveda/types';

export { DoshaType };

export type ProductForm =
  | 'churna'        // Powder
  | 'vati'          // Tablet / Pill
  | 'asava_arishta' // Fermented liquid / tonic
  | 'taila'         // Medicated oil
  | 'ghrita'        // Medicated ghee
  | 'kashaya'       // Decoction
  | 'avaleha'       // Herbal paste / jam (e.g. Chyawanprash)
  | 'capsule'       // Standardized extract capsule
  | 'syrup';        // Liquid syrup

export interface BotanicalIngredient {
  herbName: string;
  latinName?: string;
  sanskritName?: string;
  percentage?: number;
  partUsed?: string; // e.g. "Root", "Fruit", "Bark"
}

export interface AyurvedicProductMetadata {
  classicalFormulationName: string;     // Canonical name e.g. "Avipattikar Churna"
  classicalTextReference: string;       // e.g. "Bhavaprakasha Nighantu, Vatadi Varga"
  form: ProductForm;
  doshaTarget: {
    pacifies: DoshaType[];              // Doshas reduced by this product
    aggravates?: DoshaType[];           // Doshas that may be aggravated if taken improperly
  };
  ayushLicenseNumber: string;           // AYUSH GMP License
  isScheduleE1: boolean;                // Schedule E(1) poisonous/regulated ingredient (requires prescription)
  contraindications: string[];          // e.g. ["pregnancy", "severe hypertension", "ulcerative colitis"]
  recommendedAnupana: string[];         // e.g. ["warm water", "honey", "cow's milk", "ghee"]
  botanicalComposition: BotanicalIngredient[];
  ageSuitability: {
    minAge: number;
    maxAge?: number;
  };
}

export interface ProductSKU {
  id: string;
  sku: string;
  brand: string;                        // e.g. "Vaidyanath Group", "Dabur", "Kottakkal Arya Vaidya Sala"
  title: string;
  description: string;
  priceInINR: number;
  mrpInINR: number;
  stockQuantity: number;
  unit: string;                         // e.g. "100g", "60 Tablets", "200ml"
  imageUrl: string;
  supplierId: 'VAIDYANATH_GROUP' | 'NATIVE_WAREHOUSE' | 'AFFILIATE_PARTNER';
  ayurvedicMetadata: AyurvedicProductMetadata;
  isAvailableForDirectPurchase: boolean;
  affiliateFallbackUrl?: string;
  rating: number;
  reviewCount: number;
}

export interface TraceabilityMetadata {
  diagnosticId: string;
  targetDosha: DoshaType;
  recommendedDosage: string;            // e.g. "3g twice daily with lukewarm water before meals"
  anupana: string;                      // e.g. "lukewarm water"
  rationale: string;                    // Clinical reason connecting symptom/dosha to this product
  clinicalSafetyApproved: boolean;
}

export interface CartItem {
  productId: string;
  sku: string;
  title: string;
  brand: string;
  unitPriceInINR: number;
  quantity: number;
  imageUrl: string;
  ayurvedicMetadata: AyurvedicProductMetadata;
  traceability?: TraceabilityMetadata;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotalInINR: number;
  discountInINR: number;
  shippingInINR: number;
  totalInINR: number;
  requiresPrescriptionAudit: boolean;   // Set to true if any cart item has isScheduleE1 = true
  prescriptionFileUrl?: string;
}

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'PRESCRIPTION_AUDIT'
  | 'FULFILLMENT_REQUESTED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

export interface SupplierDispatchOrder {
  supplierId: 'VAIDYANATH_GROUP' | 'NATIVE_WAREHOUSE' | 'AFFILIATE_PARTNER';
  externalOrderId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'FAILED';
  trackingNumber?: string;
  carrierName?: string;
  trackingUrl?: string;
  lineItems: Array<{
    sku: string;
    quantity: number;
    unitPriceInINR: number;
  }>;
  dispatchedAt?: string;
  deliveredAt?: string;
}

export interface Order {
  id: string;
  userId?: string;
  cartId: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  subtotalInINR: number;
  taxInINR: number;
  shippingInINR: number;
  discountInINR: number;
  totalInINR: number;
  status: OrderStatus;
  paymentMethod: 'RAZORPAY' | 'STRIPE' | 'COD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentTransactionId?: string;
  supplierDispatches: SupplierDispatchOrder[];
  createdAt: string;
  updatedAt: string;
}
