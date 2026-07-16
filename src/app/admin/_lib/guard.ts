import { NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth";
import type { PublicUser } from "@/lib/types";

/**
 * Wraps an admin route handler: enforces requireAdmin, maps AuthError to the
 * correct JSON status response. All /api/admin handlers go through this.
 */
export async function withAdmin(
  fn: (admin: PublicUser) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    return await fn(admin);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Parse a JSON body, returning null on failure. */
export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
