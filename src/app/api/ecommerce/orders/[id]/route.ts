import { NextRequest, NextResponse } from 'next/server';
import { CheckoutService } from '@/lib/ecommerce/services/checkoutService';
import { VaidyanathSupplierAdapter } from '@/lib/ecommerce/fulfillment/vaidyanathAdapter';

const vaidyanathAdapter = new VaidyanathSupplierAdapter();
const checkoutService = new CheckoutService(vaidyanathAdapter);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const order = checkoutService.getOrder(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve order' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const transactionId = body.transactionId || `TXN-${Date.now()}`;

    const order = await checkoutService.confirmPaymentAndDispatch(id, transactionId);

    return NextResponse.json({
      success: true,
      order,
      message: 'Payment confirmed and automated supplier dropship dispatched successfully.'
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Payment confirmation failed' },
      { status: 400 }
    );
  }
}
