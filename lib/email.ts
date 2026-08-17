import { Resend } from 'resend';
import { emailIsConfigured } from './env';
import { formatNaira } from '@/types';

type OrderEmailItem = { name: string; price: number; qty: number };

type OrderEmailData = {
  reference: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  channel: 'PAYSTACK' | 'WHATSAPP';
  items: OrderEmailItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

function client(): Resend | null {
  if (!emailIsConfigured()) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function itemRows(items: OrderEmailItem[]): string {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0">${i.name} × ${i.qty}</td><td style="padding:4px 0;text-align:right">${formatNaira(
          i.price * i.qty
        )}</td></tr>`
    )
    .join('');
}

/**
 * Notifies the store owner of a new order. Best-effort: failures are logged,
 * never thrown, so a broken email integration can't break checkout.
 */
export async function sendAdminOrderNotification(order: OrderEmailData): Promise<void> {
  const resend = client();
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!resend || !to) return;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: `New order ${order.reference} — ${formatNaira(order.total)} (${order.channel === 'WHATSAPP' ? 'WhatsApp' : 'Paystack'})`,
      html: `
        <div style="font-family:sans-serif;font-size:14px;color:#1B1B1F">
          <h2 style="margin:0 0 4px">New order</h2>
          <p style="color:#666;margin:0 0 16px">Ref: ${order.reference} · ${order.channel === 'WHATSAPP' ? 'Sent via WhatsApp' : 'Paid via Paystack'}</p>
          <p><strong>${order.customerName}</strong><br>${order.phone}<br>${order.email}<br>${order.address}</p>
          <table style="width:100%;border-collapse:collapse;margin-top:12px">
            ${itemRows(order.items)}
            <tr><td style="padding-top:8px;border-top:1px solid #eee">Subtotal</td><td style="padding-top:8px;border-top:1px solid #eee;text-align:right">${formatNaira(order.subtotal)}</td></tr>
            <tr><td>Delivery</td><td style="text-align:right">${order.deliveryFee === 0 ? 'Free' : formatNaira(order.deliveryFee)}</td></tr>
            <tr><td style="font-weight:600">Total</td><td style="text-align:right;font-weight:600">${formatNaira(order.total)}</td></tr>
          </table>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send admin order notification email:', err);
  }
}

/**
 * Confirms the order with the customer. Best-effort, same as above.
 */
export async function sendCustomerOrderConfirmation(order: OrderEmailData): Promise<void> {
  const resend = client();
  if (!resend) return;

  const statusLine =
    order.channel === 'WHATSAPP'
      ? "We've received your order and will confirm it with you on WhatsApp shortly."
      : 'Payment received — your order is being packed.';

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: order.email,
      subject: `Your LRK Basket order (${order.reference})`,
      html: `
        <div style="font-family:sans-serif;font-size:14px;color:#1B1B1F">
          <h2 style="margin:0 0 4px">Thanks, ${order.customerName.split(' ')[0]}!</h2>
          <p style="color:#666;margin:0 0 16px">${statusLine}</p>
          <table style="width:100%;border-collapse:collapse">
            ${itemRows(order.items)}
            <tr><td style="padding-top:8px;border-top:1px solid #eee">Subtotal</td><td style="padding-top:8px;border-top:1px solid #eee;text-align:right">${formatNaira(order.subtotal)}</td></tr>
            <tr><td>Delivery</td><td style="text-align:right">${order.deliveryFee === 0 ? 'Free' : formatNaira(order.deliveryFee)}</td></tr>
            <tr><td style="font-weight:600">Total</td><td style="text-align:right;font-weight:600">${formatNaira(order.total)}</td></tr>
          </table>
          <p style="color:#999;margin-top:20px;font-size:12px">Order reference: ${order.reference}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send customer order confirmation email:', err);
  }
}
