import type { CartLine } from '@/types';
import { formatNaira } from '@/types';

export function buildWhatsAppOrderLink(params: {
  reference: string;
  customerName: string;
  phone: string;
  address: string;
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const itemLines = params.lines
    .map((l) => `- ${l.name} x${l.qty} - ${formatNaira(l.price * l.qty)}`)
    .join('\n');

  const message = [
    `New order from LRK Basket`,
    `Ref: ${params.reference}`,
    ``,
    `Customer: ${params.customerName}`,
    `Phone: ${params.phone}`,
    `Address: ${params.address}`,
    ``,
    `Items:`,
    itemLines,
    ``,
    `Subtotal: ${formatNaira(params.subtotal)}`,
    `Delivery: ${params.deliveryFee === 0 ? 'Free' : formatNaira(params.deliveryFee)}`,
    `Total: ${formatNaira(params.total)}`,
    ``,
    `Please confirm and share payment details.`,
  ].join('\n');

  const base = number ? `https://wa.me/${number}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a "share to invite" link for a group-buy bundle - unlike
 * buildWhatsAppOrderLink, this has no fixed recipient (no phone number in
 * the wa.me URL), so WhatsApp opens the contact picker and lets the shopper
 * choose who to invite themselves.
 */
export function buildGroupBuyShareLink(params: {
  bundleName: string;
  storeUrl: string;
  committed: number;
  target: number;
  discountPercent: number;
}): string {
  const remaining = Math.max(0, params.target - params.committed);
  const message = [
    `I'm ${remaining} people away from unlocking ${params.discountPercent}% off the "${params.bundleName}" bundle on LRK Basket!`,
    `Join in and we all get the discount:`,
    params.storeUrl,
  ].join('\n');

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
