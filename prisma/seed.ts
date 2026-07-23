import { PrismaClient } from '@prisma/client';
import { STARTER_PRODUCTS, DEFAULT_SETTINGS } from '../lib/seedData';

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.product.createMany({ data: STARTER_PRODUCTS });
  await prisma.settings.upsert({
    where: { id: 'settings' },
    update: {},
    create: { id: 'settings', ...DEFAULT_SETTINGS },
  });
  console.log(`Seeded ${STARTER_PRODUCTS.length} products and default settings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
