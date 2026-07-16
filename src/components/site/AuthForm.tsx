"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const body = isRegister
        ? { name, email, password }
        : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const nextQuery =
    next && next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2"
            aria-label="Boolk home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
              B
            </span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isRegister
              ? "Sign up to book stays and experiences."
              : "Log in to manage your bookings."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isRegister && (
            <Input
              label="Full name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          )}
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting
              ? "Please wait…"
              : isRegister
                ? "Create account"
                : "Log in"}
          </Button>
        </form>

        {!isRegister && (
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <p className="font-medium text-slate-600">Demo accounts</p>
            <p className="mt-1">Traveller: demo@boolk.dev / demo123</p>
            <p>Admin: admin@boolk.dev / admin123</p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <Link
                href={`/login${nextQuery}`}
                className="font-medium text-brand-700 hover:text-brand-800"
              >
                Log in
              </Link>
            </>
          ) : (
            <>
              New to Boolk?{" "}
              <Link
                href={`/register${nextQuery}`}
                className="font-medium text-brand-700 hover:text-brand-800"
              >
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
