import { prisma } from './prisma';

type SavedOrderItem = {
  productId: string | null;
  bundleId: string | null;
  qty: number;
};

/**
 * Takes an order's saved line items - each is either a plain product
 * (productId set) or a bundle (bundleId set) - and expands them into a
 * merged productId -> qty map suitable for lib/stock.ts's restoreStock /
 * reserveStock. Bundle lines are expanded to their component products,
 * multiplied by however many bundles were on the order.
 */
export async function stockDeltasForOrderItems(
  items: SavedOrderItem[]
): Promise<{ productId: string; qty: number }[]> {
  const productLines = items.filter((i) => i.productId !== null);
  const bundleLines = items.filter((i) => i.bundleId !== null);

  const bundleComponents =
    bundleLines.length > 0
      ? await prisma.bundleItem.findMany({
          where: { bundleId: { in: bundleLines.map((i) => i.bundleId as string) } },
        })
      : [];

  const deltas = new Map<string, number>();
  for (const line of productLines) {
    const id = line.productId as string;
    deltas.set(id, (deltas.get(id) ?? 0) + line.qty);
  }
  for (const line of bundleLines) {
    const components = bundleComponents.filter((c) => c.bundleId === line.bundleId);
    for (const component of components) {
      const needed = component.qty * line.qty;
      deltas.set(component.productId, (deltas.get(component.productId) ?? 0) + needed);
    }
  }

  return [...deltas.entries()].map(([productId, qty]) => ({ productId, qty }));
}
