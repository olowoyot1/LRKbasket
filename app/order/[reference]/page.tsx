import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { verifyTransaction } from '@/lib/paystack';
import { formatNaira } from '@/types';
import ClearCartOnPaid from '@/components/ClearCartOnPaid';
import { restoreStock } from '@/lib/stock';
import { sendCustomerOrderConfirmation } from '@/lib/email';

export const revalidate = 0;

export default async function OrderPage({ params }: { params: { reference: string } }) {
  const order = await prisma.order.findUnique({
    where: { reference: params.reference },
    include: { items: true },
  });

  if (!order) {
    return (
      <main className="max-w-lg mx-auto px-7 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold mb-3">Order not found</h1>
        <Link href="/" className="text-sm text-ink/50">
          ← Back to shopping
        </Link>
      </main>
    );
  }

  // Fallback in case the webhook hasn't landed yet: verify directly with Paystack.
  // WhatsApp orders are confirmed manually in chat, so they skip this entirely.
  let status = order.status;
  if (order.channel === 'PAYSTACK' && status === 'PENDING') {
    try {
      const result = await verifyTransaction(order.reference);
      if (result.status === 'success') {
        await prisma.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
        status = 'PAID';
        await sendCustomerOrderConfirmation({
          reference: order.reference,
          customerName: order.customerName,
          email: order.email,
          phone: order.phone,
          address: order.address,
          channel: 'PAYSTACK',
          items: order.items,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
        });
      } else if (result.status === 'failed') {
        await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
        await restoreStock(order.items.map((i) => ({ productId: i.productId, qty: i.qty })));
        status = 'FAILED';
      }
    } catch {
      // Paystack verification failed or is unavailable - leave status as-is.
    }
  }

  const isWhatsApp = order.channel === 'WHATSAPP';

  const statusCopy: Record<string, { title: string; body: string }> = {
    PAID: {
      title: 'Order received',
      body: "Your basket is being packed. We'll text you updates as it heads out for delivery.",
    },
    PENDING: isWhatsApp
      ? {
          title: 'Order sent to WhatsApp',
          body: "We've logged your order. Confirm it and arrange payment in the WhatsApp chat that just opened.",
        }
      : {
          title: 'Payment pending',
          body: "We haven't confirmed payment for this order yet. If you completed payment, this will update shortly.",
        },
    FAILED: {
      title: 'Payment did not go through',
      body: 'Your order was not charged. You can return to your basket and try again.',
    },
  };
  const copy = statusCopy[status];

  return (
    <main className="max-w-lg mx-auto px-7 py-20 text-center">
      <ClearCartOnPaid paid={status === 'PAID'} />
      <div className="w-14 h-14 rounded-full bg-yellow text-purpleDark flex items-center justify-center mx-auto mb-4 font-display text-2xl">
        {status === 'PAID' ? '✓' : status === 'FAILED' ? '✕' : '…'}
      </div>
      <h1 className="font-display text-2xl font-semibold mb-2">{copy.title}</h1>
      <p className="text-ink/60 text-sm mb-8">{copy.body}</p>

      <div className="text-left bg-cream rounded-card p-5 mb-6">
        <div className="font-mono text-xs text-ink/50 mb-3">Ref: {order.reference}</div>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-1.5">
            <span>
              {item.name} × {item.qty}
            </span>
            <span className="font-mono">{formatNaira(item.price * item.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-semibold pt-2.5 mt-1.5 border-t border-dashed border-ink/20">
          <span>Total</span>
          <span className="font-mono">{formatNaira(order.total)}</span>
        </div>
      </div>

      <Link href="/" className="text-sm text-ink/50">
        ← Back to shopping
      </Link>
    </main>
  );
}
