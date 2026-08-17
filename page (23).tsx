import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';

const PAGE_SIZE = 20;
const VALID_STATUSES = ['PENDING', 'PAID', 'FAILED'] as const;

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1);
  const statusParam = req.nextUrl.searchParams.get('status');
  const status = (VALID_STATUSES as readonly string[]).includes(statusParam || '')
    ? (statusParam as (typeof VALID_STATUSES)[number])
    : undefined;

  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    orders,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
