import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';

const bundleSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(1),
  price: z.number().int().positive(),
  imageUrl: z.string().url().optional().nullable(),
  tag: z.string().min(1),
  color: z.enum(['yellow', 'purple']),
  active: z.boolean(),
  groupBuyEnabled: z.boolean(),
  groupBuyTarget: z.number().int().min(0),
  groupBuyDiscountPercent: z.number().int().min(0).max(90),
  items: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.number().int().positive(),
      })
    )
    .min(1),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = bundleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid bundle data' }, { status: 400 });
  }
  const { items, ...bundleData } = parsed.data;

  try {
    // Replace the item list wholesale - simplest way to handle additions,
    // removals, and quantity changes in one edit.
    const bundle = await prisma.$transaction(async (tx) => {
      await tx.bundleItem.deleteMany({ where: { bundleId: params.id } });
      return tx.bundle.update({
        where: { id: params.id },
        data: { ...bundleData, items: { create: items } },
        include: { items: { include: { product: true } } },
      });
    });
    return NextResponse.json({ bundle });
  } catch {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await prisma.bundle.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete - it may have existing orders' }, { status: 409 });
  }
}
