import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { initializeTransaction } from '@/lib/paystack';
import { deliveryFeeFor } from '@/types';
import { getSettings } from '@/lib/settings';
import { restoreStock } from '@/lib/stock';
import { getBundleProgress, effectiveBundlePrice } from '@/lib/groupBuy';
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
        kind: z.enum(['product', 'bundle']).default('product'),
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

  const productRequests = items.filter((i) => i.kind === 'product');
  const bundleRequests = items.filter((i) => i.kind === 'bundle');

  const products = await prisma.product.findMany({
    where: { id: { in: productRequests.map((i) => i.id) } },
  });
  const bundles = await prisma.bundle.findMany({
    where: { id: { in: bundleRequests.map((i) => i.id) }, active: true },
    include: { items: { include: { product: true } } },
  });

  if (products.length === 0 && bundles.length === 0) {
    return NextResponse.json({ error: 'No valid items in cart' }, { status: 400 });
  }

  // Product line items: authoritative price/name from the database.
  const productLineItems = productRequests
    .map((i) => {
      const product = products.find((p) => p.id === i.id);
      if (!product) return null;
      return { productId: product.id, bundleId: null, name: product.name, price: product.price, qty: i.qty };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Bundle line items: price reflects group-buy status *before* this order
  // (this order's own quantity only counts toward unlocking future orders).
  const bundleLineItems = await Promise.all(
    bundleRequests.map(async (i) => {
      const bundle = bundles.find((b) => b.id === i.id);
      if (!bundle) return null;
      const progress = bundle.groupBuyEnabled
        ? await getBundleProgress(bundle.id, bundle.groupBuyTarget)
        : undefined;
      const price = bundle.groupBuyEnabled
        ? effectiveBundlePrice(bundle.price, bundle.groupBuyDiscountPercent, progress?.unlocked ?? false)
        : bundle.price;
      return { bundleId: bundle.id, productId: null, name: bundle.name, price, qty: i.qty };
    })
  );
  const validBundleLineItems = bundleLineItems.filter((x): x is NonNullable<typeof x> => x !== null);

  const orderItems = [...productLineItems, ...validBundleLineItems];
  if (orderItems.length === 0) {
    return NextResponse.json({ error: 'No valid items in cart' }, { status: 400 });
  }

  // Merge stock deltas across standalone products AND bundle components, so
  // a product appearing both on its own and inside a bundle is reserved
  // correctly as one combined amount.
  const stockDeltas = new Map<string, number>();
  const productNames = new Map<string, string>();
  for (const p of products) productNames.set(p.id, p.name);
  for (const line of productLineItems) {
    stockDeltas.set(line.productId!, (stockDeltas.get(line.productId!) ?? 0) + line.qty);
  }
  for (const bundleReq of bundleRequests) {
    const bundle = bundles.find((b) => b.id === bundleReq.id);
    if (!bundle) continue;
    for (const component of bundle.items) {
      productNames.set(component.productId, component.product.name);
      const needed = component.qty * bundleReq.qty;
      stockDeltas.set(component.productId, (stockDeltas.get(component.productId) ?? 0) + needed);
    }
  }

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
    // Reserve stock and create the order atomically: if anything (a plain
    // product or a bundle's component) is out of stock, the whole
    // transaction rolls back and nothing is decremented.
    order = await prisma.$transaction(async (tx) => {
      for (const [productId, qty] of stockDeltas) {
        const updated = await tx.product.updateMany({
          where: { id: productId, stock: { gte: qty } },
          data: { stock: { decrement: qty } },
        });
        if (updated.count === 0) {
          const current = await tx.product.findUnique({ where: { id: productId } });
          throw new OutOfStockError(productNames.get(productId) ?? 'An item', current?.stock ?? 0);
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

  const restoreDeltas = [...stockDeltas.entries()].map(([productId, qty]) => ({ productId, qty }));

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
    await restoreStock(restoreDeltas);
    const message = err instanceof Error ? err.message : 'Payment initialization failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
