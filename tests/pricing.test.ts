import { describe, it, expect } from 'vitest';
import { deliveryFeeFor, formatNaira } from '@/types';

describe('deliveryFeeFor', () => {
  it('charges nothing for an empty cart', () => {
    expect(deliveryFeeFor(0)).toBe(0);
  });

  it('charges the default fee below the free-delivery threshold', () => {
    expect(deliveryFeeFor(5000)).toBe(1500);
  });

  it('is free at or above the free-delivery threshold', () => {
    expect(deliveryFeeFor(15000)).toBe(0);
    expect(deliveryFeeFor(20000)).toBe(0);
  });

  it('respects a custom fee and threshold from settings', () => {
    expect(deliveryFeeFor(4000, { fee: 500, threshold: 5000 })).toBe(500);
    expect(deliveryFeeFor(5000, { fee: 500, threshold: 5000 })).toBe(0);
  });
});

describe('formatNaira', () => {
  it('formats whole numbers with the naira sign and thousands separators', () => {
    expect(formatNaira(1500)).toBe('₦1,500');
    expect(formatNaira(0)).toBe('₦0');
    expect(formatNaira(1234567)).toBe('₦1,234,567');
  });
});
