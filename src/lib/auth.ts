// Authentication: scrypt password hashing + HMAC-signed session cookies.

import "server-only";
import {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { cookies } from "next/headers";
import { users } from "@/lib/db";
import type { PublicUser, User } from "@/lib/types";

const SESSION_COOKIE = "boolk_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const SCRYPT_KEYLEN = 64;

function sessionSecret(): string {
  return (
    process.env.SESSION_SECRET ?? "boolk-dev-secret-do-not-use-in-production"
  );
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt)
// ---------------------------------------------------------------------------

/** Hash a plaintext password -> "salt:hash" (both hex). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${derived}`;
}

/** Verify a plaintext password against a stored "salt:hash". */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

// ---------------------------------------------------------------------------
// Session token: userId.expiry.signature
// ---------------------------------------------------------------------------

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export function createSessionToken(
  userId: string,
  ttlMs: number = SESSION_TTL_MS,
): string {
  const expiry = Date.now() + ttlMs;
  const payload = `${userId}.${expiry}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): { userId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiryStr, signature] = parts;
  const payload = `${userId}.${expiryStr}`;
  const expected = sign(payload);

  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return null;

  return { userId };
}

// ---------------------------------------------------------------------------
// Cookie helpers (Next.js async cookies())
// ---------------------------------------------------------------------------

export async function setSessionCookie(userId: string): Promise<void> {
  const token = createSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// ---------------------------------------------------------------------------
// Session accessors for server components / route handlers
// ---------------------------------------------------------------------------

export function toPublicUser(user: User): PublicUser {
  // Strip the password hash before returning to callers.
  const { passwordHash: _passwordHash, ...pub } = user;
  void _passwordHash;
  return pub;
}

/** Returns the signed-in user (public shape) or null. */
export async function getSessionUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const verified = verifySessionToken(token);
  if (!verified) return null;

  const user = users.get(verified.userId);
  if (!user || !user.active) return null;

  return toPublicUser(user);
}

/** Throws if not authenticated. */
export async function requireUser(): Promise<PublicUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Authentication required", 401);
  return user;
}

/** Throws if not an active admin. */
export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError("Admin access required", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
