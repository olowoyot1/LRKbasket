# LRK Basket

A farm-to-door grocery storefront built on the standard Vercel stack:

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Prisma + Postgres** for products, orders, and settings
- **Paystack** for online checkout, plus a **Send to WhatsApp** option for shoppers who'd rather order in chat
- **Vercel Blob** for product photos, **Resend** for order emails, **Vercel Analytics** for traffic

## 1. Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Required? | Where to get it |
|---|---|---|
| `DATABASE_URL` | Yes | A Postgres connection string. Easiest: [Vercel Postgres](https://vercel.com/storage/postgres) or [Neon](https://neon.tech) (free tiers, plug straight into Vercel). |
| `PAYSTACK_SECRET_KEY` | Yes, for online payment | [Paystack dashboard → Settings → API Keys](https://dashboard.paystack.com/#/settings/developer). Use the **test** key while developing. |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` locally. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Yes, for WhatsApp checkout | Store's WhatsApp number, international format, digits only — e.g. `2348012345678`. |
| `ADMIN_PASSWORD` | Yes | Any password — signs you in at `/admin`. |
| `BLOB_READ_WRITE_TOKEN` | Optional | For product photo uploads. See §5. |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL` | Optional | For order emails. See §4. |

Push the schema and seed the product catalog:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

Run it:

```bash
npm run dev
```

Run the test suite any time:

```bash
npm test
```

## 2. How checkout works

The `/checkout` page always shows two buttons: **Pay now** and **Send order to WhatsApp**. Both go through the same `POST /api/checkout`, which re-prices every item against the database (never trusts client-sent prices) and reserves stock atomically — if anything in the cart is out of stock, the whole order is rejected with a clear error and nothing is decremented.

**Pay now (Paystack)**
1. Creates a `PENDING` order, decrements stock, asks Paystack to initialize a transaction.
2. The shopper is redirected to Paystack to pay.
3. Paystack calls `POST /api/paystack/webhook` on success, which flips the order to `PAID` and emails the customer a confirmation.
4. Paystack also redirects the shopper back to `/order/[reference]`, which double-checks payment status directly with Paystack as a fallback in case the webhook is late. If payment actually failed, stock is restored automatically.

**Send order to WhatsApp**
1. Creates a `PENDING` order, decrements stock, skips Paystack entirely.
2. The browser opens `wa.me/<NEXT_PUBLIC_WHATSAPP_NUMBER>` with the itemized order pre-filled (see `lib/whatsapp.ts`).
3. The shopper lands on `/order/[reference]` with an "order sent to WhatsApp" confirmation — payment is arranged in the chat, and you mark it paid from `/admin` once confirmed.

## 3. Managing the store — `/admin`

Sign in with `ADMIN_PASSWORD` at `/admin`. Three tabs, all cookie-protected (both the pages and the underlying APIs check the session, so there's no way to hit the data endpoints unauthenticated):

- **Products** — add, edit, or delete products: name, category, price, unit, stock on hand, tag, icon, accent color, and an optional photo (uploaded to Vercel Blob; falls back to the line-art icon if none is set). Out-of-stock and low-stock (≤5) products are flagged inline.
- **Orders** — every order from both Paystack and WhatsApp, paginated (20 per page) and filterable by status. Click a row for contact info, delivery address, and the itemized order. **Mark as paid / failed / pending** updates the order and keeps stock in sync — marking an order failed gives its reserved stock back; reinstating it takes that stock again.
- **Settings** — delivery fee and free-delivery threshold, editable without touching code. Read by the storefront and checkout on every request, so changes apply immediately.

`/admin` itself is excluded from search engines (`app/robots.ts` + `noindex` on every admin route), and the login endpoint is rate-limited to 5 attempts per 15 minutes per IP. That's a reasonable bar for a small storefront, not enterprise-grade protection — see the comment in `lib/rateLimit.ts` if you outgrow it.

`prisma/seed.ts` is still there for bootstrapping a fresh database; after that, day-to-day changes go through `/admin`.

## 4. Order emails (optional)

Set `RESEND_API_KEY`, `EMAIL_FROM`, and `ADMIN_NOTIFICATION_EMAIL` and two things start happening automatically, via [Resend](https://resend.com):

- You get an email at `ADMIN_NOTIFICATION_EMAIL` the moment any order comes in (Paystack or WhatsApp).
- The customer gets a confirmation email — immediately for WhatsApp orders, on successful payment for Paystack orders.

`EMAIL_FROM` must be a verified sender or domain in your Resend account. Leave these unset and the app runs exactly the same, it just won't send order emails (failures are logged, never allowed to break checkout).

## 5. Product photos (optional)

In your Vercel project: **Storage → Create → Blob**, then connect it to the project — this sets `BLOB_READ_WRITE_TOKEN` automatically. For local dev, run `vercel env pull .env` after `vercel link`, or copy the token from Project Settings → Environment Variables. Without it, the photo upload button shows a clear error but everything else keeps working — products just show their icon.

## 6. Deploying to Vercel

1. Push this project to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Add a Postgres database from the Storage tab (or paste a Neon connection string) — sets `DATABASE_URL` automatically.
4. Add the rest of the environment variables from the table in §1, in **Project Settings → Environment Variables** (use your **live** Paystack key for production).
5. Deploy. `prisma generate` runs automatically via `postinstall`.
6. Run the migration against production once, from your machine:
   ```bash
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   DATABASE_URL="your-production-url" npm run db:seed
   ```
7. In the Paystack dashboard, set your webhook URL to:
   ```
   https://your-domain.vercel.app/api/paystack/webhook
   ```

Every subsequent `git push` redeploys automatically.

## 7. Project structure

```
app/
  page.tsx                     storefront (server component)
  checkout/page.tsx             delivery details, Pay now / Send to WhatsApp
  order/[reference]/page.tsx    order confirmation + Paystack verification fallback
  privacy/, terms/, refund-policy/   template legal pages (not legal advice - review before use)
  robots.ts, sitemap.ts         SEO basics
  icon.tsx                      generated favicon
  admin/login/page.tsx          admin sign-in (rate-limited)
  admin/(dashboard)/            product manager, orders, settings (auth-gated)
  api/checkout/route.ts         creates order, reserves stock, initializes Paystack
  api/paystack/webhook/route.ts marks orders paid, sends confirmation email
  api/admin/products/           product CRUD
  api/admin/orders/             paginated order list + status updates
  api/admin/settings/           delivery pricing
  api/admin/upload/route.ts     product photo uploads to Vercel Blob
lib/
  prisma.ts, paystack.ts, whatsapp.ts, email.ts, settings.ts, stock.ts,
  adminAuth.ts, rateLimit.ts, env.ts
components/                     cart context, header, product grid, cart drawer, admin UI
prisma/schema.prisma             Product / Order / OrderItem / Settings models
prisma/seed.ts                    19-item starter catalog + default settings
tests/                            unit tests for pricing logic and the rate limiter
```

## 8. Known limitations

Being upfront about what this doesn't do, so nothing here is a surprise:

- **No customer accounts.** Checkout is guest-only; customers can't look up past orders themselves. Their only record is the confirmation page and (if email is configured) their inbox.
- **Test coverage is a starting point, not comprehensive.** `tests/` covers pricing logic and the rate limiter as an example of how to add more — it doesn't cover the API routes or UI.
- **Categories are still hardcoded** (`types/index.ts`), unlike products, stock, and delivery pricing, which are all editable from `/admin`.
- **The rate limiter is per-instance**, not distributed (see §3) — fine for a small store, worth upgrading to Vercel Firewall or Upstash if traffic grows.
