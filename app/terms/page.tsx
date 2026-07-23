import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-7 py-16">
      <Link href="/" className="text-sm text-ink/50 mb-6 inline-block">
        ← Back to shopping
      </Link>
      <h1 className="font-display text-3xl font-semibold mb-2">Terms of service</h1>
      <p className="text-xs text-ink/50 mb-8 bg-cream rounded-lg px-3 py-2 inline-block">
        This is a starting template, not legal advice — have a lawyer review it before you rely on it.
      </p>

      <div className="space-y-6 text-sm text-ink/75 leading-relaxed">
        <section>
          <h2 className="font-semibold text-ink mb-1.5">Orders</h2>
          <p>
            Placing an order through this site is an offer to buy, which we may accept or decline
            (for example if an item is out of stock). Prices are shown in Nigerian naira and include
            no taxes unless stated otherwise.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink mb-1.5">Payment</h2>
          <p>
            Online payments are processed securely by Paystack. Orders sent via WhatsApp are confirmed
            and paid for directly with us in that chat.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink mb-1.5">Delivery</h2>
          <p>
            Delivery times are estimates, not guarantees, and may vary with traffic, weather, or
            product availability. Please double-check your delivery address before checking out.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink mb-1.5">Liability</h2>
          <p>
            We aren't liable for indirect or consequential losses arising from delayed or failed
            deliveries beyond our reasonable control.
          </p>
        </section>
      </div>
    </main>
  );
}
