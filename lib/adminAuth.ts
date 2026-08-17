import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE = 'lrk_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function expectedToken(): string {
  const secret = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export function checkPassword(password: string): boolean {
  const secret = process.env.ADMIN_PASSWORD || '';
  if (!secret) return false;
  // Constant-time-ish comparison to avoid trivial timing leaks.
  const a = Buffer.from(password);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function sessionToken(): string {
  return expectedToken();
}

/** For use in Server Components / layouts (reads cookies via next/headers). */
export function isAdminSession(): boolean {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return !!token && token === expectedToken();
}

/** For use in Route Handlers (reads cookies from the request). */
export function isAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  return !!token && token === expectedToken();
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: COOKIE_MAX_AGE,
};
