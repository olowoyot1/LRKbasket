import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <main className="max-w-2xl mx-auto px-7 py-16">
      <Link href="/" className="text-sm text-ink/50 mb-6 inline-block">
        ← Back to shopping
      </Link>
      <h1 className="font-display text-3xl font-semibold mb-2">Refund policy</h1>
      <p className="text-xs text-ink/50 mb-8 bg-cream rounded-lg px-3 py-2 inline-block">
        This is a starting template, not legal advice — have a lawyer review it before you rely on it.
      </p>

      <div className="space-y-6 text-sm text-ink/75 leading-relaxed">
        <section>
          <h2 className="font-semibold text-ink mb-1.5">Perishable goods</h2>
          <p>
            Because most of what we sell is fresh produce, we can't accept returns after delivery.
            If an item arrives damaged, spoiled, or different from what you ordered, contact us within
            24 hours with a photo and we'll replace it or refund that item.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink mb-1.5">Missing or incorrect items</h2>
          <p>
            If your order is missing an item you paid for, let us know within 24 hours of delivery
            and we'll send it or refund it.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink mb-1.5">How refunds are issued</h2>
          <p>
            Refunds for card payments are returned to the original payment method via Paystack and
            typically take 5–10 business days to reflect. Refunds for WhatsApp orders are arranged
            directly with you.
          </p>
        </section>
      </div>
    </main>
  );
}
