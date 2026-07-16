import { NextResponse } from "next/server";
import { users } from "@/lib/db";
import { toPublicUser } from "@/lib/auth";
import { withAdmin, readJson } from "@/app/admin/_lib/guard";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx): Promise<NextResponse> {
  return withAdmin(async (admin) => {
    const { id } = await ctx.params;
    const existing = users.get(id);
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await readJson<{ active?: boolean }>(req);
    if (!body || typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "A boolean 'active' field is required" },
        { status: 400 },
      );
    }

    if (id === admin.id && body.active === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 },
      );
    }

    const updated = users.update(id, { active: body.active });
    return NextResponse.json({
      user: updated ? toPublicUser(updated) : null,
    });
  });
}
