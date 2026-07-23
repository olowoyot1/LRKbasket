import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { initializeTransaction } from '@/lib/paystack';
import { deliveryFeeFor } from '@/types';
import { getSettings } from '@/lib/settings';
import { restoreStock } from '@/lib/stock';
import { sendAdminOrderNotification, sendCustomerOrderConfirmation } from '@/lib/email';

const bodySchema = z.object({
  customerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
  channel: z.enum(['paystack', 'whatsapp']).default('paystack'),
  items: z
    .array(
      z.object({
        id: z.string(),
        qty: z.number().int().positive(),
      })
    )
    .min(1),
});

class OutOfStockError extends Error {
  constructor(public productName: string, public available: number) {
    super(`${productName} only has ${available} left in stock`);
  }
}

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid checkout payload' }, { status: 400 });
  }
  const { customerName, email, phone, address, items, channel } = parsed.data;

  // Look up authoritative prices and stock from the database - never trust
  // client-submitted values for either.
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.id) } },
  });
  if (products.length === 0) {
    return NextResponse.json({ error: 'No valid products in cart' }, { status: 400 });
  }

  const orderItems = items
    .map((i) => {
      const product = products.find((p) => p.id === i.id);
      if (!product) return null;
      return { productId: product.id, name: product.name, price: product.price, qty: i.qty };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const settings = await getSettings();
  const deliveryFee = deliveryFeeFor(subtotal, {
    fee: settings.deliveryFee,
    threshold: settings.freeDeliveryThreshold,
  });
  const total = subtotal + deliveryFee;

  const reference = `lrk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  let order;
  try {
    // Reserve stock and create the order atomically: if any item is out of
    // stock, the whole transaction rolls back and nothing is decremented.
    order = await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.qty } },
          data: { stock: { decrement: item.qty } },
        });
        if (updated.count === 0) {
          const product = products.find((p) => p.id === item.productId);
          throw new OutOfStockError(item.name, product?.stock ?? 0);
        }
      }
      return tx.order.create({
        data: {
          reference,
          customerName,
          email,
          phone,
          address,
          subtotal,
          deliveryFee,
          total,
          channel: channel === 'whatsapp' ? 'WHATSAPP' : 'PAYSTACK',
          items: { create: orderItems },
        },
      });
    });
  } catch (err) {
    if (err instanceof OutOfStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const emailPayload = {
    reference,
    customerName,
    email,
    phone,
    address,
    channel: channel === 'whatsapp' ? ('WHATSAPP' as const) : ('PAYSTACK' as const),
    items: orderItems,
    subtotal,
    deliveryFee,
    total,
  };

  // Best-effort notifications - never block or fail checkout on email issues.
  await sendAdminOrderNotification(emailPayload);

  // WhatsApp orders skip Paystack entirely - the order is logged, stock is
  // reserved, and the shopper's order summary is sent to the store's
  // WhatsApp number instead. Confirm by email now, since there's no webhook
  // to trigger one later the way there is for Paystack.
  if (channel === 'whatsapp') {
    await sendCustomerOrderConfirmation(emailPayload);
    return NextResponse.json({ reference, subtotal, deliveryFee, total });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  try {
    const paystack = await initializeTransaction({
      email,
      amountNaira: total,
      reference,
      callbackUrl: `${appUrl}/order/${reference}`,
      metadata: { orderId: order.id },
    });
    return NextResponse.json({ authorizationUrl: paystack.authorization_url, reference });
  } catch (err) {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
    await restoreStock(orderItems);
    const message = err instanceof Error ? err.message : 'Payment initialization failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
