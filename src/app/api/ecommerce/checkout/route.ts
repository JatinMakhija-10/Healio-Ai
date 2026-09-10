import { NextRequest, NextResponse } from 'next/server';
import { Cart, ShippingAddress } from '@/lib/ecommerce/types';
import { CheckoutService, CheckoutOptions } from '@/lib/ecommerce/services/checkoutService';
import { VaidyanathSupplierAdapter } from '@/lib/ecommerce/fulfillment/vaidyanathAdapter';

const vaidyanathAdapter = new VaidyanathSupplierAdapter();
const checkoutService = new CheckoutService(vaidyanathAdapter);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cart = body.cart as Cart;
    const shippingAddress = body.shippingAddress as ShippingAddress;
    const options = body.options as CheckoutOptions | undefined;

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot checkout with an empty cart.' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.postalCode) {
      return NextResponse.json(
        { success: false, error: 'Incomplete shipping address: fullName, phone, and postalCode are required.' },
        { status: 400 }
      );
    }

    const order = await checkoutService.createOrder(cart, shippingAddress, options);

    return NextResponse.json({
      success: true,
      order,
      // Payment payload for client integration (e.g. Razorpay options)
      paymentPayload: {
        gateway: order.paymentMethod,
        orderId: order.id,
        amount: order.totalInINR * 100, // In paise
        currency: 'INR',
        name: 'Healio.AI Ayurvedic Healthcare',
        description: `Order ${order.id} (${order.items.length} items)`,
        customer: {
          name: shippingAddress.fullName,
          phone: shippingAddress.phone,
          email: shippingAddress.email
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error processing checkout' },
      { status: 500 }
    );
  }
}
