# Boolk — Travel Booking Platform

A Klook/Agoda-style travel booking system: a user-facing web app for browsing and booking hotels & activities, and an admin portal for managing the marketplace. Both surfaces are fully responsive (mobile-first, desktop-enhanced).

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
- Home with destination search (dates, guests, Hotels/Activities tabs), featured listings, popular destinations
- `/search` — filterable results (type, price, rating, sort); filter sidebar on desktop, sheet on mobile
- `/listing/[slug]` — gallery, amenities, reviews, live-priced booking widget (sticky card on desktop, bottom bar on mobile)
- `/checkout/[listingId]` — guest details + mock payment (demo only, no real charge)
- `/bookings` — upcoming/past trips, cancellation, post-stay reviews
- `/login`, `/register`

**Admin portal** (`/admin`, admin role required)
- Dashboard: revenue/bookings/listings/users KPIs, status breakdown, recent bookings
- Listings CRUD with activation and delete safeguards
- Bookings with validated status transitions (confirm → complete / cancel → refund)
- User management (activate/deactivate) and review moderation
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
