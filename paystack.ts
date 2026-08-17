import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-7 py-16">
      <Link href="/" className="text-sm text-ink/50 mb-6 inline-block">
        ← Back to shopping
      </Link>
      <h1 className="font-display text-3xl font-semibold mb-2">Privacy policy</h1>
      <p className="text-xs text-ink/50 mb-8 bg-cream rounded-lg px-3 py-2 inline-block">
        This is a starting template, not legal advice — have a lawyer review it before you rely on it.
      </p>

      <div className="space-y-6 text-sm text-ink/75 leading-relaxed">
        <section>
          <h2 className="font-semibold text-ink mb-1.5">Information we collect</h2>
          <p>
            When you place an order, we collect your name, email address, phone number, and delivery
            address. If you check out with Paystack, payment card details are handled directly by
            Paystack and never pass through our servers. If you send an order via WhatsApp, that
            conversation is subject to WhatsApp's own privacy terms.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink mb-1.5">How we use it</h2>
          <p>
            We use your information to fulfil and deliver your order, contact you about its status,
            and keep records for accounting and customer support purposes.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink mb-1.5">Sharing</h2>
          <p>
            We share order details with our payment processor (Paystack) to process payment, and with
            delivery staff to fulfil your order. We do not sell your information to third parties.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink mb-1.5">Your choices</h2>
          <p>
            You can ask us to delete your order history or correct inaccurate information by
            contacting us using the details on our storefront.
          </p>
        </section>
      </div>
    </main>
  );
}
