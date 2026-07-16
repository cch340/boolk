import { NextResponse } from "next/server";
import { users } from "@/lib/db";
import { withAdmin, readJson } from "@/app/admin/_lib/guard";
import { adminAdjust, getBalance } from "@/lib/points";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Manually adjust a user's points balance. Body: { delta, note }.
 * `delta` must be a non-zero integer; `note` is required for auditability.
 * Returns 400 if the adjustment would drive the balance negative.
 */
export async function POST(req: Request, ctx: Ctx): Promise<NextResponse> {
  return withAdmin(async () => {
    const { id } = await ctx.params;
    const user = users.get(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await readJson<{ delta?: unknown; note?: unknown }>(req);
    const rawDelta =
      typeof body?.delta === "number" ? body.delta : Number(body?.delta);
    if (!Number.isInteger(rawDelta) || rawDelta === 0) {
      return NextResponse.json(
        { error: "Delta must be a non-zero integer" },
        { status: 400 },
      );
    }
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!note) {
      return NextResponse.json(
        { error: "A note is required for a points adjustment" },
        { status: 400 },
      );
    }

    try {
      const tx = adminAdjust(id, rawDelta, note);
      return NextResponse.json({
        transaction: tx,
        balance: getBalance(id),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to adjust points";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  });
}
