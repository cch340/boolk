# Boolk — Travel Booking Platform Spec

Klook/Agoda-style travel platform. One Next.js app, two surfaces. Both must be fully responsive (mobile-first, breakpoints for tablet/desktop).

## Stack
- Next.js 15 (App Router) + TypeScript (strict), Tailwind CSS
- No external DB: JSON-file repository layer in `src/lib/db.ts`, data files in `data/*.json` (gitignored except `data/seed/`)
- Sessions: HTTP-only signed cookie (`src/lib/auth.ts`), scrypt password hashing via node:crypto
- Prices in integer cents, USD. Dates as ISO strings.

## Domain model (`src/lib/types.ts`)
- `User { id, email, name, passwordHash, role: 'user'|'admin', active, createdAt }`
- `Listing { id, type: 'hotel'|'activity', title, slug, city, country, description, images: string[], pricePerUnitCents, unitLabel ('night'|'person'), rating, reviewCount, amenities/highlights: string[], maxGuests, featured, active, createdAt }`
- `Booking { id, userId, listingId, checkIn, checkOut?, guests, totalCents, status: 'pending'|'confirmed'|'cancelled'|'completed'|'refunded', guestName, guestEmail, createdAt }`
- `Review { id, listingId, userId, bookingId, rating 1-5, text, status: 'visible'|'hidden', createdAt }`

## Repository layer
`src/lib/db.ts` exposes typed CRUD per entity (list/get/create/update/remove + query helpers). Reads seed from `data/seed/*.json` on first access, persists working copies to `data/runtime/*.json`. All mutation goes through this module.

## Auth (`src/lib/auth.ts` + `src/app/api/auth/*`)
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Session cookie: HMAC-signed `userId.expiry.signature` (SESSION_SECRET env, dev fallback constant)
- Helpers: `getSessionUser()`, `requireUser()`, `requireAdmin()` for server components/route handlers

## User surface (routes under `src/app/(site)/`)
- `/` home: hero with search bar (destination, dates, guests, type tabs Hotels/Activities), featured listings, popular destinations, value-props strip
- `/search` results: filters sidebar (desktop) / filter sheet (mobile) — type, price range, rating, sort; card grid
- `/listing/[slug]` detail: image gallery, facts, amenities, reviews, sticky booking widget (desktop) / bottom bar (mobile) with date+guest selection and live price
- `/checkout/[listingId]` guest details + mock payment form → creates booking (status confirmed)
- `/bookings` my bookings (auth required): upcoming/past, cancel action, leave review on completed
- `/login`, `/register`
- Header: logo, search shortcut, nav, user menu; mobile hamburger. Footer.

## Admin surface (routes under `src/app/admin/`, role-guarded, redirect non-admins to /login)
- Layout: sidebar (collapsible on mobile → top bar + drawer)
- `/admin` dashboard: KPI cards (revenue, bookings, active listings, users), recent bookings table, bookings-by-status summary
- `/admin/listings` table + create/edit forms (all Listing fields), activate/deactivate, delete
- `/admin/bookings` table with filters, status transitions (confirm/cancel/refund/complete)
- `/admin/users` table, toggle active, role display
- `/admin/reviews` moderate (hide/show)

## API (route handlers under `src/app/api/`)
- Public: `GET /api/listings` (query params: q, type, minPrice, maxPrice, minRating, sort), `GET /api/listings/[slug]`
- User: `POST /api/bookings`, `GET /api/bookings` (own), `POST /api/bookings/[id]/cancel`, `POST /api/reviews`
- Admin (all under `/api/admin/`, requireAdmin): listings CRUD, bookings list/status PATCH, users list/PATCH, reviews list/PATCH

## Design language
- Clean travel-brand look: white surfaces, slate text, brand color indigo-600 with amber accents; rounded-xl cards, subtle shadows
- Listing images: use https://picsum.photos/seed/{slug}-{n}/800/600 style URLs in seed data (remote images allowed in next.config)
- Everything keyboard/touch friendly; test at 375px and 1280px widths

## Seed data
- ~12 hotels + ~12 activities across Tokyo, Bangkok, Singapore, Bali, Paris, Rome; varied prices/ratings; 8+ featured
- 2 users (admin/demo as in QUESTIONS.md), ~10 bookings in varied statuses, ~15 reviews

---

# Round 2 — Transport, Multi-currency, Multi-language, Member Points

## Domain extensions (`src/lib/types.ts`)
- `ListingType` gains `'transport'`. New `TransportMode = 'flight'|'train'|'bus'|'ferry'|'transfer'`.
- `Listing` gains optional `transport?: { mode: TransportMode; originCity: string; originCode: string; destinationCity: string; destinationCode: string; carrier: string; serviceCode: string; departureTime: string; arrivalTime: string; durationMinutes: number }` (present iff type === 'transport'; unitLabel 'person'; `city` = originCity for search compatibility).
- New `PointsTransaction { id, userId, bookingId?, delta (int, +earn/-redeem), reason: 'earn'|'redeem'|'redeem-refund'|'earn-revoke'|'admin-adjust', note?, createdAt }`.
- `Booking` gains `currency: string` (display currency chosen at checkout, records stay USD), `pointsRedeemed: number` (points spent), `discountCents: number` (USD value of redemption), `pointsEarned: number` (0 until completed).
- `ListingQuery` gains `mode?: TransportMode`, `origin?: string`, `destination?: string` (match transport city/code, case-insensitive substring).

## Currency (`src/lib/currency.ts`)
- `CURRENCIES`: USD $, EUR €, GBP £, JPY ¥, SGD S$, THB ฿, MYR RM, IDR Rp with static `ratePerUsd` and `decimals` (JPY/IDR 0).
- `convertFromUsdCents(cents, code)`, `formatMoney(cents, code)` (converted display string), cookie `currency` (default USD).
- All storage/charging stays USD cents. `formatPrice` remains USD-only; UI uses `formatMoney` with active currency.

## i18n (`src/lib/i18n/`)
- Locales: `en`, `zh`, `ja`. Dictionary modules `en.ts`/`zh.ts`/`ja.ts` typed by a shared key union; `getLocale()` reads cookie `locale` (default en); `t(locale, key, vars?)` with `{var}` interpolation.
- USER SURFACE fully translated (header/footer, home, search, listing, checkout, bookings, auth pages, validation/status labels). ADMIN stays English.
- Locale + currency pickers live in the site header (client component posting to `POST /api/prefs` which sets cookies, then refresh).

## Points (`src/lib/points.ts`)
- Rules: earn floor(totalCents/100) points when booking → completed; redeem at checkout 100 pts = 100 cents (USD), max 50% of order, integer multiples of 100.
- `getBalance(userId)`, `award/redeem/refundRedemption/revokeEarn/adminAdjust` — all append ledger entries via db; guard against double-award (one 'earn' per booking) and over-redemption.
- Wire-in: POST /api/bookings applies redemption (validate balance, write 'redeem' entry, set pointsRedeemed/discountCents, total = gross − discount); booking cancel (user or admin) refunds redeemed points; admin transition to 'completed' awards earn; 'refunded' revokes earned points.

## Surfaces
- User: home gets a Transport search tab (origin/destination/date); /search supports type=transport + mode filter and renders route cards (origin → destination, times, carrier); /listing/[slug] transport layout shows route/schedule facts and books passengers on a date; checkout shows points balance + redemption slider/input and live discount, totals in active currency (with "charged in USD" note); /bookings shows points earned/redeemed per booking; new points summary (balance + ledger) on the bookings page or /account/points.
- Admin (English, USD): listings form gains transport fields when type=transport; bookings table shows currency/points columns and triggers points side-effects on transitions; users page shows points balance with manual adjust (delta + note → 'admin-adjust'); dashboard adds points-outstanding KPI.

## Seed additions
- 10 transport listings (flights TYO⇄SIN/BKK, trains Tokyo→Kyoto / Paris→Rome, ferries Bali, airport transfers) across existing cities; a few points ledger entries for the demo user consistent with completed bookings.

