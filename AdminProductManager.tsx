import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';
import { STARTER_PRODUCTS, STARTER_BUNDLES, DEFAULT_SETTINGS } from '@/lib/seedData';

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    return NextResponse.json(
      { error: 'The database already has products - seeding was skipped to avoid overwriting them.' },
      { status: 409 }
    );
  }

  await prisma.product.createMany({ data: STARTER_PRODUCTS });
  const products = await prisma.product.findMany();
  const idByName = new Map(products.map((p) => [p.name, p.id]));

  for (const bundle of STARTER_BUNDLES) {
    const items = bundle.items
      .map((i) => {
        const productId = idByName.get(i.productName);
        return productId ? { productId, qty: i.qty } : null;
      })
      .filter((x): x is { productId: string; qty: number } => x !== null);

    if (items.length === 0) continue;
    const { items: _ignored, ...bundleData } = bundle;
    await prisma.bundle.create({ data: { ...bundleData, items: { create: items } } });
  }

  await prisma.settings.upsert({
    where: { id: 'settings' },
    update: {},
    create: { id: 'settings', ...DEFAULT_SETTINGS },
  });

  return NextResponse.json({ ok: true, count: STARTER_PRODUCTS.length, bundleCount: STARTER_BUNDLES.length });
}
