// Popular destinations shown on the home page. Images use the picsum
// seed convention already whitelisted in next.config.

export interface Destination {
  city: string;
  country: string;
  image: string;
}

export const DESTINATIONS: readonly Destination[] = [
  { city: "Tokyo", country: "Japan", image: "https://picsum.photos/seed/dest-tokyo/600/800" },
  { city: "Bangkok", country: "Thailand", image: "https://picsum.photos/seed/dest-bangkok/600/800" },
  { city: "Singapore", country: "Singapore", image: "https://picsum.photos/seed/dest-singapore/600/800" },
  { city: "Bali", country: "Indonesia", image: "https://picsum.photos/seed/dest-bali/600/800" },
  { city: "Paris", country: "France", image: "https://picsum.photos/seed/dest-paris/600/800" },
  { city: "Rome", country: "Italy", image: "https://picsum.photos/seed/dest-rome/600/800" },
];
