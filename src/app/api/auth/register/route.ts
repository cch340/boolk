import { NextResponse } from "next/server";
import { users } from "@/lib/db";
import { hashPassword, setSessionCookie, toPublicUser } from "@/lib/auth";
import type { User } from "@/lib/types";

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password, name } = (body ?? {}) as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "email, password and name are required" },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }
  if (users.findByEmail(email)) {
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 },
    );
  }

  const created = users.create({
    email: email.trim().toLowerCase(),
    name: name.trim(),
    passwordHash: hashPassword(password),
    role: "user",
    active: true,
  } as Omit<User, "id" | "createdAt">);

  await setSessionCookie(created.id);
  return NextResponse.json({ user: toPublicUser(created) }, { status: 201 });
}
