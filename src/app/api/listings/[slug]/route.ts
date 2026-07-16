import { NextResponse } from "next/server";
import { listings, reviews } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  const listing = listings.findBySlug(slug);
  if (!listing || !listing.active) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  const listingReviews = reviews.byListing(listing.id, { visibleOnly: true });
  return NextResponse.json({ listing, reviews: listingReviews });
}
