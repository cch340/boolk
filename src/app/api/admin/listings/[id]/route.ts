import { NextResponse } from "next/server";
import { bookings, listings } from "@/lib/db";
import { withAdmin, readJson } from "@/app/admin/_lib/guard";
import { parseListingInput } from "@/app/admin/_lib/listing-input";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse> {
  return withAdmin(async () => {
    const { id } = await ctx.params;
    const listing = listings.get(id);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return NextResponse.json({ listing });
  });
}

export async function PATCH(req: Request, ctx: Ctx): Promise<NextResponse> {
  return withAdmin(async () => {
    const { id } = await ctx.params;
    const existing = listings.get(id);
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const body = await readJson<Record<string, unknown>>(req);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    // Fast path: activate/deactivate toggle only.
    const keys = Object.keys(body);
    if (keys.length === 1 && keys[0] === "active") {
      const updated = listings.update(id, { active: Boolean(body.active) });
      return NextResponse.json({ listing: updated });
    }

    // Full edit: merge onto existing so partial submissions stay valid.
    const parsed = parseListingInput({ ...existing, ...body });
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    // Guard slug uniqueness against *other* listings.
    const clash = listings.findBySlug(parsed.data.slug);
    if (clash && clash.id !== id) {
      return NextResponse.json(
        { error: "A listing with this slug already exists" },
        { status: 409 },
      );
    }
    const updated = listings.update(id, parsed.data);
    return NextResponse.json({ listing: updated });
  });
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<NextResponse> {
  return withAdmin(async () => {
    const { id } = await ctx.params;
    const existing = listings.get(id);
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (bookings.byListing(id).length > 0) {
      return NextResponse.json(
        {
          error:
            "This listing has bookings and cannot be deleted. Deactivate it instead.",
        },
        { status: 409 },
      );
    }
    listings.remove(id);
    return NextResponse.json({ ok: true });
  });
}
