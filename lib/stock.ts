import { prisma } from './prisma';

type StockItem = { productId: string; qty: number };

/** Adds qty back to each product's stock (e.g. when an order is cancelled/failed). */
export async function restoreStock(items: StockItem[]): Promise<void> {
  await prisma.$transaction(
    items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      })
    )
  );
}

/** Best-effort re-reservation when an order moves out of FAILED back to PENDING/PAID. */
export async function reserveStock(items: StockItem[]): Promise<void> {
  await prisma.$transaction(
    items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } },
      })
    )
  );
}
