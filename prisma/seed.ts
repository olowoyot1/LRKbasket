import { PrismaClient } from '@prisma/client';
import { STARTER_PRODUCTS, STARTER_BUNDLES, DEFAULT_SETTINGS } from '../lib/seedData';

const prisma = new PrismaClient();

async function main() {
  await prisma.bundleItem.deleteMany();
  await prisma.bundle.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

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

  console.log(`Seeded ${STARTER_PRODUCTS.length} products, ${STARTER_BUNDLES.length} bundles, and default settings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
