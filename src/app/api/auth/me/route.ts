import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}
