"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { formatPrice } from "@/lib/format";

export interface CheckoutFormProps {
  listingId: string;
  checkIn: string;
  checkOut?: string;
  guests: number;
  totalCents: number;
  defaultName: string;
  defaultEmail: string;
}

interface Errors {
  guestName?: string;
  guestEmail?: string;
  card?: string;
  expiry?: string;
  cvc?: string;
}

export function CheckoutForm(props: CheckoutFormProps) {
  const [guestName, setGuestName] = useState(props.defaultName);
  const [guestEmail, setGuestEmail] = useState(props.defaultEmail);
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  function validate(): boolean {
    const next: Errors = {};
    if (!guestName.trim()) next.guestName = "Name is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guestEmail.trim()))
      next.guestEmail = "Enter a valid email";
    const digits = card.replace(/\s+/g, "");
    if (!/^\d{15,16}$/.test(digits)) next.card = "Enter a 15–16 digit card number";
    if (!/^\d{2}\s*\/\s*\d{2}$/.test(expiry)) next.expiry = "Use MM/YY";
    if (!/^\d{3,4}$/.test(cvc)) next.cvc = "3–4 digits";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: props.listingId,
          checkIn: props.checkIn,
          checkOut: props.checkOut,
          guests: props.guests,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        booking?: { id: string };
        error?: string;
      };
      if (!res.ok || !data.booking) {
        setApiError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setConfirmedId(data.booking.id);
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2 className="mt-4 text-xl font-bold text-slate-900">
          Booking confirmed!
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Your reservation is confirmed. A confirmation was sent to{" "}
          {guestEmail}. This is a demo — no real charge was made.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/bookings">
            <Button fullWidth>View my bookings</Button>
          </Link>
          <Link href="/search">
            <Button variant="outline" fullWidth>
              Keep exploring
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900">Guest details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            error={errors.guestName}
          />
          <Input
            label="Email"
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            error={errors.guestEmail}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Payment</h2>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            Demo — no real charge
          </span>
        </div>
        <div className="mt-4 space-y-4">
          <Input
            label="Card number"
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            value={card}
            onChange={(e) => setCard(e.target.value)}
            error={errors.card}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry (MM/YY)"
              placeholder="12/28"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              error={errors.expiry}
            />
            <Input
              label="CVC"
              inputMode="numeric"
              placeholder="123"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              error={errors.cvc}
            />
          </div>
        </div>
      </section>

      {apiError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiError}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={submitting}>
        {submitting
          ? "Confirming…"
          : `Confirm & pay ${formatPrice(props.totalCents)}`}
      </Button>
      <p className="text-center text-xs text-slate-400">
        This is a demo checkout. No payment is processed and no card is stored.
      </p>
    </form>
  );
}
