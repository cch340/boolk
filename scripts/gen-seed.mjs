// Generates data/seed/*.json with real scrypt password hashes and
// referentially-consistent bookings/reviews. Run: node scripts/gen-seed.mjs
import { scryptSync, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.join(__dirname, "..", "data", "seed");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

const iso = (d) => new Date(d).toISOString();

// ---------------------------------------------------------------- users
const users = [
  {
    id: "usr_admin01",
    email: "admin@boolk.dev",
    name: "Ava Administrator",
    passwordHash: hashPassword("admin123"),
    role: "admin",
    active: true,
    createdAt: iso("2025-01-05T09:00:00Z"),
  },
  {
    id: "usr_demo001",
    email: "demo@boolk.dev",
    name: "Danny Demo",
    passwordHash: hashPassword("demo123"),
    role: "user",
    active: true,
    createdAt: iso("2025-02-12T14:30:00Z"),
  },
];

// ------------------------------------------------------------- listings
const img = (slug, n) => `https://picsum.photos/seed/${slug}-${n}/800/600`;
const images = (slug) => [img(slug, 1), img(slug, 2), img(slug, 3), img(slug, 4)];

const hotelAmenities = [
  "Free WiFi",
  "Air conditioning",
  "Swimming pool",
  "24h front desk",
  "Breakfast included",
  "Fitness center",
  "Airport shuttle",
  "Spa & wellness",
  "Restaurant & bar",
  "Room service",
];

const activityHighlights = [
  "Expert local guide",
  "Skip-the-line entry",
  "Small group experience",
  "Hotel pickup available",
  "Instant confirmation",
  "Free cancellation",
  "All equipment provided",
  "Photo opportunities",
];

function pick(arr, n, seed) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[(seed + i * 3) % arr.length]);
  return [...new Set(out)];
}

const hotelDefs = [
  ["Tokyo", "Japan", "Shinjuku Skyline Hotel", "Floor-to-ceiling views over the neon sprawl of Shinjuku, minutes from the station.", 18900, 4.7, 214, true, 3],
  ["Tokyo", "Japan", "Asakusa Ryokan Retreat", "A tranquil traditional inn with tatami suites and a cedar onsen near Senso-ji.", 15400, 4.8, 168, true, 2],
  ["Bangkok", "Thailand", "Riverside Grand Bangkok", "Five-star riverside luxury with an infinity pool overlooking the Chao Phraya.", 12900, 4.6, 302, true, 4],
  ["Bangkok", "Thailand", "Sukhumvit Boutique Stay", "Design-led rooms in the heart of the city's best dining and nightlife district.", 8700, 4.4, 141, false, 2],
  ["Singapore", "Singapore", "Marina Bay Horizon", "Iconic rooftop pool and skyline views steps from Gardens by the Bay.", 24500, 4.9, 421, true, 3],
  ["Singapore", "Singapore", "Chinatown Heritage Hotel", "Restored shophouse charm with modern comforts in vibrant Chinatown.", 11200, 4.5, 187, false, 2],
  ["Bali", "Indonesia", "Ubud Jungle Villas", "Private pool villas tucked into the rice terraces and rainforest of Ubud.", 16800, 4.8, 256, true, 4],
  ["Bali", "Indonesia", "Seminyak Beach Resort", "Barefoot beachfront luxury with sunset cocktails and a world-class spa.", 14300, 4.6, 198, true, 3],
  ["Paris", "France", "Le Marais Maison", "A chic boutique hotel on a quiet cobbled street in the historic Marais.", 21900, 4.7, 233, true, 2],
  ["Paris", "France", "Eiffel View Apartments", "Elegant serviced apartments with balconies framing the Eiffel Tower.", 26700, 4.8, 176, false, 4],
  ["Rome", "Italy", "Trastevere Terrace Hotel", "Romantic rooftop terrace and antique-filled rooms in bohemian Trastevere.", 17600, 4.6, 210, true, 3],
  ["Rome", "Italy", "Colosseum Central Inn", "Comfortable, well-located rooms a five-minute stroll from the Colosseum.", 9800, 4.3, 154, false, 2],
];

const activityDefs = [
  ["Tokyo", "Japan", "Tsukiji Street Food Walking Tour", "Graze your way through the outer market tasting sushi, tamago and matcha with a local foodie.", 6500, 4.8, 512, true, 8],
  ["Tokyo", "Japan", "Mt. Fuji & Hakone Day Trip", "A full-day escape to Mt. Fuji's fifth station, a lake cruise and a ropeway ride.", 13500, 4.7, 348, true, 12],
  ["Bangkok", "Thailand", "Floating Markets & Canals Tour", "Long-tail boat ride through Damnoen Saduak and the hidden klongs of old Siam.", 4900, 4.5, 421, true, 10],
  ["Bangkok", "Thailand", "Thai Cooking Class & Market Visit", "Shop a local market then cook four classic Thai dishes with a professional chef.", 5500, 4.9, 289, true, 8],
  ["Singapore", "Singapore", "Gardens by the Bay Night Tour", "Wander the glowing Supertrees and cloud forest after dark with skip-the-line entry.", 4200, 4.6, 367, false, 15],
  ["Singapore", "Singapore", "Sentosa Adventure Day Pass", "Cable car, luge rides and beach club access across Singapore's playground island.", 7800, 4.4, 233, true, 6],
  ["Bali", "Indonesia", "Ubud Rice Terrace & Temple Cycling", "Downhill cycling through Tegalalang terraces with a temple stop and Balinese lunch.", 3900, 4.7, 445, true, 12],
  ["Bali", "Indonesia", "Nusa Penida Snorkel Boat Trip", "Speedboat to crystal bays to snorkel with manta rays and see Kelingking cliff.", 6200, 4.6, 318, true, 20],
  ["Paris", "France", "Louvre Skip-the-Line Guided Tour", "See the Mona Lisa and the museum's masterpieces with an art-historian guide.", 7900, 4.7, 502, true, 10],
  ["Paris", "France", "Seine Dinner Cruise", "A three-course French dinner cruising past illuminated Paris landmarks.", 11900, 4.5, 276, false, 30],
  ["Rome", "Italy", "Colosseum Underground Tour", "Access the arena floor and underground chambers with a small expert group.", 8900, 4.8, 389, true, 8],
  ["Rome", "Italy", "Vatican Museums & Sistine Chapel", "Early-access guided tour of the Vatican Museums, galleries and Sistine Chapel.", 8400, 4.7, 461, true, 12],
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const listings = [];
let createdSeq = 0;
function makeListing(def, type, seq) {
  const [city, country, title, description, price, rating, reviewCount, featured, maxGuests] = def;
  const slug = slugify(title);
  createdSeq += 1;
  const created = iso(new Date("2025-01-10T00:00:00Z").getTime() + createdSeq * 86400000);
  return {
    id: `lst_${type === "hotel" ? "h" : "a"}${String(seq + 1).padStart(2, "0")}`,
    type,
    title,
    slug,
    city,
    country,
    description,
    images: images(slug),
    pricePerUnitCents: price,
    unitLabel: type === "hotel" ? "night" : "person",
    rating,
    reviewCount,
    amenities: type === "hotel" ? pick(hotelAmenities, 6, seq) : [],
    highlights: type === "activity" ? pick(activityHighlights, 5, seq) : [],
    maxGuests,
    featured,
    active: true,
    createdAt: created,
  };
}

hotelDefs.forEach((d, i) => listings.push(makeListing(d, "hotel", i)));
activityDefs.forEach((d, i) => listings.push(makeListing(d, "activity", i)));

// ---------------------------------------------------------- transport
const transportHighlights = [
  "Instant confirmation",
  "Mobile e-ticket",
  "Free cancellation up to 24h",
  "Reserved seating",
  "English-speaking support",
];

// [mode, originCity, originCode, destCity, destCode, carrier, serviceCode,
//  dep, arr, durationMinutes, title, description, priceCents, rating,
//  reviewCount, featured, maxGuests, country]
const transportDefs = [
  ["flight", "Tokyo", "HND", "Singapore", "SIN", "ANA", "NH843", "10:55", "17:25", 450,
    "Tokyo → Singapore Direct Flight", "Nonstop widebody service from Haneda to Changi with checked baggage and in-flight meals included.", 32900, 4.6, 128, true, 9, "Japan"],
  ["flight", "Tokyo", "NRT", "Bangkok", "BKK", "Thai Airways", "TG641", "09:15", "14:05", 390,
    "Tokyo → Bangkok Direct Flight", "Comfortable daytime flight from Narita to Suvarnabhumi with generous legroom and hot meals.", 28500, 4.5, 96, false, 9, "Japan"],
  ["flight", "Singapore", "SIN", "Bali", "DPS", "Singapore Airlines", "SQ938", "08:20", "11:00", 160,
    "Singapore → Bali Direct Flight", "Morning departure from Changi to Ngurah Rai — the fastest way to start your Bali escape.", 15900, 4.7, 143, true, 9, "Singapore"],
  ["train", "Tokyo", "TYO", "Kyoto", "KYO", "JR Central", "NZM17", "09:00", "11:15", 135,
    "Tokyo → Kyoto Shinkansen", "Reserved seat on the Nozomi bullet train gliding to Kyoto in just over two hours at 285 km/h.", 11200, 4.9, 210, true, 5, "Japan"],
  ["train", "Paris", "PAR", "Rome", "ROM", "Euronight", "EN220", "19:15", "09:40", 865,
    "Paris → Rome Overnight Train", "Sleep your way south in a private couchette, waking to the Italian countryside near Rome.", 18900, 4.3, 78, false, 4, "France"],
  ["ferry", "Bali", "SNR", "Gili Trawangan", "GIL", "Blue Water Express", "BW09", "08:00", "10:30", 150,
    "Bali → Gili Trawangan Fast Boat", "Air-conditioned fast ferry from Sanur to the Gili Islands with hotel-area pickup available.", 5900, 4.4, 187, true, 6, "Indonesia"],
  ["ferry", "Singapore", "HFC", "Bintan", "BTN", "Bintan Resort Ferries", "BRF14", "10:35", "11:35", 60,
    "Singapore → Bintan Ferry", "Quick crossing from HarbourFront to Bintan's resort belt — customs and seating included.", 4800, 4.3, 92, false, 8, "Singapore"],
  ["transfer", "Bangkok", "BKK", "Bangkok City", "CBD", "Bangkok Premier Transfers", "PVT01", "On request", "On request", 60,
    "Bangkok Airport Private Transfer", "Private air-conditioned car from Suvarnabhumi to your hotel with a meet-and-greet driver.", 3200, 4.6, 154, false, 4, "Thailand"],
  ["transfer", "Singapore", "SIN", "Singapore City", "CBD", "Changi City Transfers", "CT02", "On request", "On request", 30,
    "Changi Airport Private Transfer", "Door-to-door private sedan from Changi Airport to any central Singapore address.", 3800, 4.7, 121, true, 4, "Singapore"],
  ["transfer", "Tokyo", "HND", "Tokyo City", "CBD", "Airport Limousine", "LB88", "On request", "On request", 55,
    "Haneda Airport Limousine Bus", "Comfortable coach service from Haneda directly to major Tokyo hotels and stations.", 1800, 4.5, 203, false, 45, "Japan"],
];

function makeTransport(def, seq) {
  const [mode, originCity, originCode, destinationCity, destinationCode, carrier,
    serviceCode, departureTime, arrivalTime, durationMinutes, title, description,
    price, rating, reviewCount, featured, maxGuests, country] = def;
  const slug = slugify(title);
  createdSeq += 1;
  const created = iso(new Date("2025-01-10T00:00:00Z").getTime() + createdSeq * 86400000);
  return {
    id: `lst_t${String(seq + 1).padStart(2, "0")}`,
    type: "transport",
    title,
    slug,
    city: originCity, // mirror originCity for search compatibility
    country,
    description,
    images: images(slug),
    pricePerUnitCents: price,
    unitLabel: "person",
    rating,
    reviewCount,
    amenities: [],
    highlights: pick(transportHighlights, 4, seq),
    maxGuests,
    featured,
    active: true,
    createdAt: created,
    transport: {
      mode,
      originCity,
      originCode,
      destinationCity,
      destinationCode,
      carrier,
      serviceCode,
      departureTime,
      arrivalTime,
      durationMinutes,
    },
  };
}

transportDefs.forEach((d, i) => listings.push(makeTransport(d, i)));

// ------------------------------------------------------------- bookings
const byId = (id) => listings.find((l) => l.id === id);
const addDays = (base, days) => iso(new Date(base).getTime() + days * 86400000);

function nights(a, b) {
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
}

// [listingId, checkInDate, nights|null, guests, status, createdOffsetDays]
const bookingDefs = [
  ["lst_h01", "2026-08-14", 2, 2, "confirmed", -20],
  ["lst_h05", "2026-09-02", 3, 2, "confirmed", -15],
  ["lst_a01", "2026-08-20", null, 2, "confirmed", -12],
  ["lst_h07", "2026-06-10", 4, 3, "completed", -60],
  ["lst_a09", "2026-05-22", null, 2, "completed", -70],
  ["lst_a11", "2026-05-25", null, 4, "completed", -68],
  ["lst_h03", "2026-07-30", 2, 2, "pending", -3],
  ["lst_a07", "2026-08-05", null, 2, "cancelled", -25],
  ["lst_h09", "2026-04-15", 3, 2, "refunded", -95],
  ["lst_a12", "2026-06-01", null, 3, "completed", -55],
];

const bookings = bookingDefs.map((d, i) => {
  const [listingId, checkIn, nightsN, guests, status, offset] = d;
  const l = byId(listingId);
  const isHotel = l.type === "hotel";
  const checkOut = isHotel ? addDays(checkIn, nightsN) : undefined;
  const units = isHotel ? nights(checkIn, checkOut) : guests;
  const totalCents = l.pricePerUnitCents * units;
  const pointsEarned = status === "completed" ? Math.floor(totalCents / 100) : 0;
  return {
    id: `bkg_${String(i + 1).padStart(2, "0")}`,
    userId: "usr_demo001",
    listingId,
    checkIn: iso(checkIn),
    ...(checkOut ? { checkOut } : {}),
    guests,
    totalCents,
    status,
    guestName: "Danny Demo",
    guestEmail: "demo@boolk.dev",
    createdAt: addDays("2026-07-16", offset),
    // Round 2 fields — records stay USD; no redemptions in the seed set.
    currency: "USD",
    pointsRedeemed: 0,
    discountCents: 0,
    pointsEarned,
  };
});

// -------------------------------------------------------------- reviews
// [listingId, bookingId|null, rating, text, createdOffsetDays]
const reviewDefs = [
  ["lst_h07", "bkg_04", 5, "The private pool villa was a dream — waking up to the jungle and rice fields was unforgettable. Staff went above and beyond.", -50],
  ["lst_a09", "bkg_05", 5, "Our guide made the Louvre come alive. We'd have been lost without her and skipping the line saved us hours.", -62],
  ["lst_a11", "bkg_06", 4, "Incredible access to the arena floor. Slightly rushed at the end but genuinely a highlight of Rome.", -60],
  ["lst_a12", "bkg_10", 5, "Early access to the Sistine Chapel with barely anyone there was magical. Highly recommend booking the first slot.", -48],
  ["lst_h01", null, 5, "Best skyline views in Tokyo. Spotless rooms and the location by Shinjuku station is unbeatable.", -30],
  ["lst_h05", null, 5, "Marina Bay lived up to the hype — the rooftop infinity pool alone is worth the stay.", -40],
  ["lst_a01", null, 5, "The Tsukiji food tour was the tastiest morning of our trip. So much variety and history.", -35],
  ["lst_a07", null, 4, "Beautiful cycling route through the terraces. Bring sunscreen — it gets hot fast!", -45],
  ["lst_h03", null, 4, "Gorgeous riverside property. Breakfast spread was enormous. Rooms could use a small refresh.", -22],
  ["lst_a08", null, 5, "Snorkeling with manta rays off Nusa Penida was surreal. The crew were fantastic and safe.", -18],
  ["lst_h09", null, 5, "Impeccable little hotel in the Marais. Perfect base for wandering Paris on foot.", -55],
  ["lst_a02", null, 4, "Long but rewarding day trip to Fuji. The lake cruise views were stunning on a clear day.", -28],
  ["lst_h11", null, 4, "Charming Trastevere hideaway. The rooftop terrace at sunset is not to be missed.", -33],
  ["lst_a04", null, 5, "Learned to cook four dishes I've since made at home. The chef was hilarious and patient.", -26],
  ["lst_h07", null, 5, "Came back a second time — still the most peaceful place we've ever stayed in Bali.", -12],
];

const reviews = reviewDefs.map((d, i) => {
  const [listingId, bookingId, rating, text, offset] = d;
  return {
    id: `rev_${String(i + 1).padStart(2, "0")}`,
    listingId,
    userId: "usr_demo001",
    bookingId: bookingId ?? "",
    rating,
    text,
    status: "visible",
    createdAt: addDays("2026-07-16", offset),
  };
});

// --------------------------------------------------------------- points
// Ledger for the demo user: an 'earn' entry per completed booking (matching
// each booking's pointsEarned), plus a welcome bonus, so the balance is
// meaningful. Balance = sum of deltas.
const points = [];
let ptsSeq = 0;
function addPoints(entry) {
  ptsSeq += 1;
  points.push({ id: `pts_${String(ptsSeq).padStart(2, "0")}`, ...entry });
}

// Welcome bonus.
addPoints({
  userId: "usr_demo001",
  delta: 500,
  reason: "admin-adjust",
  note: "Welcome bonus",
  createdAt: addDays("2026-07-16", -100),
});

// Earn entries for completed bookings.
bookings
  .filter((b) => b.status === "completed" && b.pointsEarned > 0)
  .forEach((b) => {
    addPoints({
      userId: b.userId,
      bookingId: b.id,
      delta: b.pointsEarned,
      reason: "earn",
      note: `Earned ${b.pointsEarned} points for booking ${b.id}`,
      createdAt: addDays(b.checkOut ?? b.checkIn, 1),
    });
  });

const pointsBalance = points.reduce((s, p) => s + p.delta, 0);

// ---------------------------------------------------------------- write
fs.mkdirSync(SEED_DIR, { recursive: true });
const write = (name, data) =>
  fs.writeFileSync(path.join(SEED_DIR, `${name}.json`), JSON.stringify(data, null, 2) + "\n");

write("users", users);
write("listings", listings);
write("bookings", bookings);
write("reviews", reviews);
write("points", points);

console.log(
  `Seed written: ${users.length} users, ${listings.length} listings, ${bookings.length} bookings, ${reviews.length} reviews, ${points.length} points entries (demo balance ${pointsBalance})`,
);
