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

  // api.whatsapp.com/send (not wa.me) - wa.me 404s if there's no phone
  // number in the URL path at all, which is exactly what happened when
  // NEXT_PUBLIC_WHATSAPP_NUMBER wasn't set. This endpoint handles a missing
  // phone gracefully too, so a misconfigured number degrades to "open
  // WhatsApp with this message, let the shopper pick who to send it to"
  // instead of a dead link.
  const params_ = new URLSearchParams({ text: message });
  if (number) params_.set('phone', number);
  return `https://api.whatsapp.com/send?${params_.toString()}`;
}

/**
 * Builds a "share to invite" link for a group-buy bundle - unlike
 * buildWhatsAppOrderLink, this has no fixed recipient, so WhatsApp opens the
 * contact picker and lets the shopper choose who to invite themselves.
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

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}
