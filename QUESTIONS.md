# Open Questions (assumptions made — please review)

I proceeded with best-guess answers as instructed. Each item lists the question and the decision I implemented.

1. **What inventory types should the platform support?**
   → Implemented **hotels/stays** (Agoda-style) and **activities/experiences** (Klook-style). Flights, transport, and packages are out of scope for v1 but the data model has a `category` field so new types can be added.

2. **Real database or lightweight storage?**
   → Implemented a **JSON-file-backed repository layer** (`src/lib/db.ts`) so the app runs anywhere with zero infrastructure. All data access goes through one repository module, so swapping to Postgres/Prisma or Supabase later is a single-file change. For production I'd recommend Postgres + Prisma.

3. **Real payments?**
   → No. Checkout implements a **mock payment step** (card form, no real charge). Stripe would be the natural integration point; the booking flow already has a `payment` status field.

4. **Auth provider?**
   → Implemented **email/password with signed cookie sessions** (scrypt hashing, no external service). Seeded accounts: admin `admin@boolk.dev` / `admin123`, demo user `demo@boolk.dev` / `demo123`. For production I'd add OAuth (Google) and email verification.

5. **Single app or separate apps for user site vs admin portal?**
   → **One Next.js app**: user site at `/`, admin portal at `/admin` (route-guarded by role). Simpler to deploy and share code; can be split later if teams diverge.

6. **Multi-currency / multi-language?**
   → v1 is **USD and English only**. Prices are stored as integer cents so currency conversion can be added cleanly.

7. **Search scope?**
   → Destination text search + filters (category, price range, rating, dates, guests). No external geo/availability APIs; availability is derived from seeded inventory and existing bookings.

8. **Reviews & ratings?**
   → Seeded ratings/review counts are displayed; users can leave a review after a completed booking (simple 1–5 stars + text).

9. **Admin capabilities for v1?**
   → Dashboard (revenue/bookings KPIs), listings CRUD, bookings management (confirm/cancel/refund status), user management (view/deactivate), reviews moderation.

10. **Deployment target?**
    → Built to run with `npm run dev` / `npm run build && npm start` anywhere. Note: file-backed storage means serverless hosts (Vercel) won't persist writes — use a VM/container host, or swap the repository layer to a hosted DB.
