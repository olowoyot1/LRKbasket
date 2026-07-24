export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  tag: string;
  icon: string;
  color: string;
  imageUrl?: string | null;
  stock: number;
};

export type BundleItemView = {
  productId: string;
  name: string;
  qty: number;
};

export type Bundle = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  tag: string;
  color: string;
  active: boolean;
  groupBuyEnabled: boolean;
  groupBuyTarget: number;
  groupBuyDiscountPercent: number;
  items: BundleItemView[];
  // Computed server-side, not stored:
  effectivePrice: number;
  compareAtPrice: number; // sum of component prices bought individually
  groupBuy?: { committed: number; target: number; unlocked: boolean };
};

export type CartLine = {
  id: string;
  name: string;
  price: number;
  qty: number;
  kind: 'product' | 'bundle';
};

export const CATEGORIES: { id: string; label: string }[] = [
  { id: 'produce', label: 'Fresh produce' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'grains', label: 'Grains & legumes' },
  { id: 'dairy', label: 'Dairy & eggs' },
  { id: 'raw', label: 'Raw & sprouted' },
  { id: 'pantry', label: 'Pantry' },
];

// Fallback defaults, used only until the DB-backed settings (lib/settings.ts)
// have loaded. The source of truth lives in the Settings table, editable
// from /admin.
export const FREE_DELIVERY_THRESHOLD = 15000;
export const DELIVERY_FEE = 1500;

export function deliveryFeeFor(
  subtotal: number,
  opts?: { fee?: number; threshold?: number }
): number {
  const fee = opts?.fee ?? DELIVERY_FEE;
  const threshold = opts?.threshold ?? FREE_DELIVERY_THRESHOLD;
  if (subtotal === 0) return 0;
  return subtotal >= threshold ? 0 : fee;
}

export function formatNaira(n: number): string {
  return '₦' + n.toLocaleString('en-NG');
}
