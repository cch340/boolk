"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PublicUser } from "@/lib/types";
import type { CurrencyCode } from "@/lib/currency";
import { getDictionary, t, type Locale, type MessageKey } from "@/lib/i18n";
import { PrefPicker } from "./PrefPicker";

const NAV: { key: MessageKey; href: string }[] = [
  { key: "nav.hotels", href: "/search?type=hotel" },
  { key: "nav.activities", href: "/search?type=activity" },
  { key: "nav.transport", href: "/search?type=transport" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
        B
      </span>
      <span className="text-xl font-bold tracking-tight text-slate-900">
        Boolk
      </span>
    </Link>
  );
}

export function HeaderClient({
  user,
  locale,
  currency,
}: {
  user: PublicUser | null;
  locale: Locale;
  currency: CurrencyCode;
}) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUserOpen(false);
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {t(dict, item.key)}
            </Link>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden items-center gap-2 md:flex">
          <PrefPicker locale={locale} currency={currency} />
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                aria-haspopup="menu"
                aria-expanded={userOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[8rem] truncate">{user.name}</span>
              </button>
              {userOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-card-hover"
                >
                  <Link
                    href="/bookings"
                    role="menuitem"
                    onClick={() => setUserOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {t(dict, "nav.myBookings")}
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={() => setUserOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {t(dict, "nav.adminPortal")}
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={logout}
                    disabled={loggingOut}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {t(dict, "nav.signOut")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t(dict, "nav.logIn")}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{t(dict, "nav.register")}</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label={t(dict, "nav.menu")}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "border-t border-slate-200 bg-white md:hidden",
          menuOpen ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {t(dict, item.key)}
            </Link>
          ))}
          <div className="my-2 border-t border-slate-100" />
          {user ? (
            <>
              <div className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                {user.name}
              </div>
              <Link
                href="/bookings"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {t(dict, "nav.myBookings")}
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {t(dict, "nav.adminPortal")}
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {t(dict, "nav.signOut")}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 px-1 pt-1">
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" fullWidth>
                  {t(dict, "nav.logIn")}
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                <Button fullWidth>{t(dict, "nav.register")}</Button>
              </Link>
            </div>
          )}
          <div className="my-2 border-t border-slate-100" />
          <PrefPicker locale={locale} currency={currency} variant="menu" />
        </nav>
      </div>
    </header>
  );
}
