import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';
import { parseCSV, csvToObjects } from '@/lib/csv';
import { ICON_NAMES } from '@/lib/icons';
import { CATEGORIES } from '@/types';

const MAX_ROWS = 500;
const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

const rowSchema = z.object({
  name: z.string().min(2, 'name is required'),
  category: z.enum(CATEGORY_IDS as [string, ...string[]], {
    errorMap: () => ({ message: `category must be one of: ${CATEGORY_IDS.join(', ')}` }),
  }),
  price: z.coerce.number().int().positive('price must be a positive whole number'),
  unit: z.string().min(1, 'unit is required'),
  tag: z.string().min(1, 'tag is required'),
  icon: z.enum(ICON_NAMES as [string, ...string[]], {
    errorMap: () => ({ message: `icon must be one of: ${ICON_NAMES.join(', ')}` }),
  }),
  color: z.enum(['yellow', 'purple'], { errorMap: () => ({ message: 'color must be yellow or purple' }) }),
  stock: z.coerce.number().int().min(0, 'stock must be 0 or more'),
  imageUrl: z
    .string()
    .url('imageUrl must be a valid URL')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value || value.trim() === '') return fallback;
  return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const csv = typeof body.csv === 'string' ? body.csv : '';
  if (!csv.trim()) {
    return NextResponse.json({ error: 'No CSV content provided' }, { status: 400 });
  }

  const rows = csvToObjects(parseCSV(csv));
  if (rows.length === 0) {
    return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows - max ${MAX_ROWS} per import` }, { status: 400 });
  }

  const results: { row: number; name: string; status: 'created' | 'updated' | 'error'; message?: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // +1 for header row, +1 for 1-indexing
    const raw = rows[i];
    const parsed = rowSchema.safeParse(raw);

    if (!parsed.success) {
      results.push({
        row: rowNumber,
        name: raw.name || '(unnamed)',
        status: 'error',
        message: parsed.error.issues.map((iss) => iss.message).join('; '),
      });
      continue;
    }

    const data = {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl ?? null,
      active: parseBoolean(raw.active, true),
    };

    try {
      const existing = await prisma.product.findFirst({ where: { name: data.name } });
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
        results.push({ row: rowNumber, name: data.name, status: 'updated' });
      } else {
        await prisma.product.create({ data });
        results.push({ row: rowNumber, name: data.name, status: 'created' });
      }
    } catch (err) {
      results.push({
        row: rowNumber,
        name: data.name,
        status: 'error',
        message: err instanceof Error ? err.message : 'Database error',
      });
    }
  }

  const summary = {
    created: results.filter((r) => r.status === 'created').length,
    updated: results.filter((r) => r.status === 'updated').length,
    errors: results.filter((r) => r.status === 'error').length,
  };

  return NextResponse.json({ results, summary });
}
