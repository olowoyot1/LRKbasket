import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';

const productSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  price: z.number().int().positive(),
  unit: z.string().min(1),
  tag: z.string().min(1),
  icon: z.string().min(1),
  color: z.enum(['yellow', 'purple']),
  imageUrl: z.string().url().optional().nullable(),
  stock: z.number().int().min(0),
  active: z.boolean(),
});

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = productSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product data' }, { status: 400 });
  }
  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json({ product }, { status: 201 });
}
