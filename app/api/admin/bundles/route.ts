import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';
import { getBundleProgress } from '@/lib/groupBuy';

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

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await prisma.bundle.findMany({
    orderBy: { createdAt: 'asc' },
    include: { items: { include: { product: true } } },
  });

  const bundles = await Promise.all(
    rows.map(async (b) => ({
      ...b,
      progress: b.groupBuyEnabled ? await getBundleProgress(b.id, b.groupBuyTarget) : null,
    }))
  );

  return NextResponse.json({ bundles });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = bundleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid bundle data' }, { status: 400 });
  }
  const { items, ...bundleData } = parsed.data;
  const bundle = await prisma.bundle.create({
    data: { ...bundleData, items: { create: items } },
    include: { items: { include: { product: true } } },
  });
  return NextResponse.json({ bundle }, { status: 201 });
}
