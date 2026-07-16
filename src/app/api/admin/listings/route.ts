import { NextResponse } from "next/server";
import { listings } from "@/lib/db";
import { withAdmin, readJson } from "@/app/admin/_lib/guard";
import { parseListingInput } from "@/app/admin/_lib/listing-input";

export async function GET(): Promise<NextResponse> {
  return withAdmin(async () => {
    // All listings including inactive, newest first.
    const rows = listings
      .list()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    return NextResponse.json({ listings: rows });
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  return withAdmin(async () => {
    const body = await readJson<unknown>(req);
    const parsed = parseListingInput(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    if (listings.findBySlug(parsed.data.slug)) {
      return NextResponse.json(
        { error: "A listing with this slug already exists" },
        { status: 409 },
      );
    }
    const created = listings.create(parsed.data);
    return NextResponse.json({ listing: created }, { status: 201 });
  });
}
