# Boolk — Travel Booking Platform

A Klook/Agoda-style travel booking system: a user-facing web app for browsing and booking hotels, activities, and transport (flights, trains, ferries, transfers), and an admin portal for managing the marketplace. Multi-currency (8 currencies), multi-language (English / 中文 / 日本語), and a member points programme. Both surfaces are fully responsive (mobile-first, desktop-enhanced).

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

### Seed accounts

| Role  | Email            | Password |
|-------|------------------|----------|
| Admin | admin@boolk.dev  | admin123 |
| User  | demo@boolk.dev   | demo123  |

## Surfaces

**User app** (`/`)
- Home with destination search (dates, guests, Hotels/Activities/Transport tabs), featured listings, popular destinations
- Transport search by origin/destination with route cards (times, carrier, duration) and per-passenger booking
- Language (EN/中文/日本語) and currency (USD, EUR, GBP, JPY, SGD, THB, MYR, IDR) pickers in the header; prices convert for display, charges stay in USD
- Member points: earn 1 pt per $1 on completed bookings, redeem 100 pts = $1 at checkout (up to 50% of the order); balance + ledger on the bookings page
- `/search` — filterable results (type, price, rating, sort); filter sidebar on desktop, sheet on mobile
- `/listing/[slug]` — gallery, amenities, reviews, live-priced booking widget (sticky card on desktop, bottom bar on mobile)
- `/checkout/[listingId]` — guest details + mock payment (demo only, no real charge)
- `/bookings` — upcoming/past trips, cancellation, post-stay reviews
- `/login`, `/register`

**Admin portal** (`/admin`, admin role required)
- Dashboard: revenue/bookings/listings/users KPIs, status breakdown, recent bookings
- Listings CRUD with activation and delete safeguards, including transport routes/schedules
- Bookings with validated status transitions (confirm → complete / cancel → refund) that automatically award, revoke, or refund member points
- User management (activate/deactivate, points balance + manual adjustments with audit notes) and review moderation
- Sidebar layout on desktop, drawer navigation on mobile

## Tech

- **Next.js 15** (App Router) · **TypeScript** (strict) · **Tailwind CSS**
- **Storage**: JSON-file repository layer (`src/lib/db.ts`) — seed data in `data/seed/`, runtime writes in `data/runtime/` (gitignored). All data access goes through one module, so swapping to Postgres/Prisma is localized.
- **Auth**: email/password with scrypt hashing and HMAC-signed HTTP-only cookie sessions (`src/lib/auth.ts`). Set `SESSION_SECRET` in production.
- **Payments**: mocked at checkout; `Booking.status` is the integration point for a real provider (e.g. Stripe).

## Project layout

```
src/
  app/
    (site)/        # user-facing pages
    admin/         # admin portal (role-guarded)
    api/           # route handlers (public, user, /api/admin, /api/auth)
  components/
    ui/            # shared design-system primitives
    site/          # user-app components
    admin/         # admin components
  lib/             # types, db repository, auth, formatting
data/seed/         # seeded users, listings, bookings, reviews
```

## Notes & decisions

See [QUESTIONS.md](./QUESTIONS.md) for the assumptions made during the build (inventory types, mock payments, storage choice, deployment caveats) and [SPEC.md](./SPEC.md) for the full functional spec.

> File-backed storage means serverless hosts won't persist writes; run on a VM/container, or swap the repository layer to a hosted database.
