import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCustomerOrderConfirmation } from '@/lib/email';

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

  if (!signature || signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === 'charge.success') {
    const reference: string | undefined = event.data?.reference;
    if (reference) {
      const { count } = await prisma.order.updateMany({
        where: { reference, status: 'PENDING' },
        data: { status: 'PAID' },
      });

      // Only fire the confirmation once, on the transition into PAID -
      // updateMany's count is 0 if the order was already PAID (Paystack can
      // retry webhook delivery).
      if (count > 0) {
        const order = await prisma.order.findUnique({ where: { reference }, include: { items: true } });
        if (order) {
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
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
