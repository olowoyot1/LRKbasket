import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS, checkPassword, sessionToken } from '@/lib/adminAuth';
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit';

function clientKey(req: NextRequest): string {
  // Vercel sets x-forwarded-for; fall back to a shared bucket if it's missing
  // (e.g. local dev), which is fine since it only affects that one caller.
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(req: NextRequest) {
  const key = clientKey(req);
  const limit = checkRateLimit(key);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil((limit.retryAfterSeconds || 60) / 60)} minute(s).` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === 'string' ? body.password : '';

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  resetRateLimit(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, sessionToken(), ADMIN_COOKIE_OPTIONS);
  return res;
}
