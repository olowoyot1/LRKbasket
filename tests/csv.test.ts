import { describe, it, expect } from 'vitest';
import { parseCSV, csvToObjects, objectsToCSV } from '@/lib/csv';

describe('parseCSV', () => {
  it('parses simple comma-separated rows', () => {
    const rows = parseCSV('name,price\nTomatoes,1500\nOnions,800');
    expect(rows).toEqual([
      ['name', 'price'],
      ['Tomatoes', '1500'],
      ['Onions', '800'],
    ]);
  });

  it('handles quoted fields containing commas', () => {
    const rows = parseCSV('name,tag\n"Soup, starter pack",Bundle');
    expect(rows).toEqual([
      ['name', 'tag'],
      ['Soup, starter pack', 'Bundle'],
    ]);
  });

  it('handles escaped quotes inside quoted fields', () => {
    const rows = parseCSV('name\n"Ada\'s ""famous"" stew mix"');
    expect(rows[1][0]).toBe('Ada\'s "famous" stew mix');
  });

  it('ignores blank trailing lines', () => {
    const rows = parseCSV('name,price\nTomatoes,1500\n\n');
    expect(rows).toEqual([
      ['name', 'price'],
      ['Tomatoes', '1500'],
    ]);
  });
});

describe('csvToObjects', () => {
  it('maps rows to objects keyed by header', () => {
    const objs = csvToObjects([
      ['name', 'price'],
      ['Tomatoes', '1500'],
    ]);
    expect(objs).toEqual([{ name: 'Tomatoes', price: '1500' }]);
  });

  it('returns an empty array for an empty input', () => {
    expect(csvToObjects([])).toEqual([]);
  });
});

describe('objectsToCSV', () => {
  it('round-trips through parseCSV/csvToObjects', () => {
    const csv = objectsToCSV([{ name: 'Soup, starter pack', price: 3800 }], ['name', 'price']);
    const parsed = csvToObjects(parseCSV(csv));
    expect(parsed).toEqual([{ name: 'Soup, starter pack', price: '3800' }]);
  });
});
