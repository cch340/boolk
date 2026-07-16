import { NextResponse } from "next/server";
import { reviews } from "@/lib/db";
import type { ReviewStatus } from "@/lib/types";
import { withAdmin, readJson } from "@/app/admin/_lib/guard";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx): Promise<NextResponse> {
  return withAdmin(async () => {
    const { id } = await ctx.params;
    const existing = reviews.get(id);
    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const body = await readJson<{ status?: string }>(req);
    if (body?.status !== "visible" && body?.status !== "hidden") {
      return NextResponse.json(
        { error: "status must be 'visible' or 'hidden'" },
        { status: 400 },
      );
    }

    const updated = reviews.update(id, { status: body.status as ReviewStatus });
    return NextResponse.json({ review: updated });
  });
}
