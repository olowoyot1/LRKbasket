import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';
import { restoreStock, reserveStock } from '@/lib/stock';

const bodySchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FAILED']),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const newStatus = parsed.data.status;
  const items = existing.items.map((i) => ({ productId: i.productId, qty: i.qty }));

  // Stock is reserved (decremented) once, at order creation. Keep it in sync
  // when an order moves into or out of FAILED - a failed/cancelled order
  // gives its stock back; reinstating it takes stock again.
  try {
    if (newStatus === 'FAILED' && existing.status !== 'FAILED') {
      await restoreStock(items);
    } else if (newStatus !== 'FAILED' && existing.status === 'FAILED') {
      await reserveStock(items);
    }
  } catch (err) {
    console.error('Failed to adjust stock for order status change:', err);
  }

  const order = await prisma.order.update({ where: { id: params.id }, data: { status: newStatus } });
  return NextResponse.json({ order });
}
