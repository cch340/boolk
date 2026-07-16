"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <IconGrid /> },
  { href: "/admin/listings", label: "Listings", icon: <IconTag /> },
  { href: "/admin/bookings", label: "Bookings", icon: <IconTicket /> },
  { href: "/admin/users", label: "Users", icon: <IconUsers /> },
  { href: "/admin/reviews", label: "Reviews", icon: <IconStar /> },
];

export function AdminShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string): boolean {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(item.href)
              ? "bg-brand-50 text-brand-700"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          <span className="text-slate-400">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-auto space-y-3 border-t border-slate-100 pt-4">
      <Link
        href="/"
        onClick={() => setDrawerOpen(false)}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <span className="text-slate-400">
          <IconExternal />
        </span>
        View site
      </Link>
      <div className="px-3">
        <p className="truncate text-sm font-medium text-slate-900">
          {user.name}
        </p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </div>
      <Button variant="outline" size="sm" fullWidth onClick={logout}>
        Log out
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <Brand />
        <div className="mt-6 flex flex-1 flex-col">
          {nav}
          {footer}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <svg viewBox="0 0 20 20" className="h-6 w-6" fill="currentColor">
            <path d="M3 5.5A.75.75 0 013.75 4.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 5.5zm0 4.5a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10zm.75 3.75a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H3.75z" />
          </svg>
        </button>
        <Brand />
        <div className="w-10" />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-slate-200 bg-white px-4 py-5">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
            <div className="mt-6 flex flex-1 flex-col">
              {nav}
              {footer}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        B
      </span>
      <span className="text-lg font-semibold text-slate-900">
        Boolk
        <span className="ml-1 text-xs font-medium text-slate-400">admin</span>
      </span>
    </Link>
  );
}

/* --- inline icons (no external deps) --- */
function IconGrid() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
      <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" />
    </svg>
  );
}
function IconTag() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
      <path d="M2 6a2 2 0 012-2h5.17a2 2 0 011.42.59l6 6a2 2 0 010 2.82l-4.59 4.59a2 2 0 01-2.82 0l-6-6A2 2 0 012 9.17V6zm4 1.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    </svg>
  );
}
function IconTicket() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v1a2 2 0 000 4v1a2 2 0 01-2 2H4a2 2 0 01-2-2v-1a2 2 0 000-4V6zm6 0v8h1V6H8z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
      <path d="M7 9a3 3 0 100-6 3 3 0 000 6zm5.5 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1 16a6 6 0 0112 0v.5H1V16zm13-.5a7.5 7.5 0 00-1.2-4A5 5 0 0119 16v.5h-5V16z" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
      <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.75 1.68-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.79.56-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 00-.36-1.12L1.1 9.6c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69z" />
    </svg>
  );
}
function IconExternal() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
      <path d="M11 3a1 1 0 100 2h2.59l-6.3 6.29a1 1 0 101.42 1.42L15 6.4V9a1 1 0 102 0V4a1 1 0 00-1-1h-5zM5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
  );
}
