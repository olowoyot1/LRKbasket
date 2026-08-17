import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';
import { getSettings } from '@/lib/settings';

const bodySchema = z.object({
  deliveryFee: z.number().int().min(0),
  freeDeliveryThreshold: z.number().int().min(0),
});

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid settings' }, { status: 400 });
  }
  const settings = await prisma.settings.upsert({
    where: { id: 'settings' },
    update: parsed.data,
    create: { id: 'settings', ...parsed.data },
  });
  return NextResponse.json({ settings });
}
