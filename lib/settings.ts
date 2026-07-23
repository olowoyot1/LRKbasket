import { prisma } from './prisma';

export type StoreSettings = {
  deliveryFee: number;
  freeDeliveryThreshold: number;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  deliveryFee: 1500,
  freeDeliveryThreshold: 15000,
};

/**
 * Reads store-wide settings from the database, falling back to defaults if
 * the row hasn't been seeded yet or the database is briefly unreachable -
 * pricing should never hard-fail the storefront.
 */
export async function getSettings(): Promise<StoreSettings> {
  try {
    const row = await prisma.settings.findUnique({ where: { id: 'settings' } });
    if (!row) return DEFAULT_SETTINGS;
    return { deliveryFee: row.deliveryFee, freeDeliveryThreshold: row.freeDeliveryThreshold };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
