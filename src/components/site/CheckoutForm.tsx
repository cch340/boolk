"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { getDictionary, t, type Locale } from "@/lib/i18n";

// Mirrors src/lib/points.ts (server-only): 100 points = 100 cents (USD), and
// redemption happens in multiples of REDEEM_UNIT.
const REDEEM_UNIT = 100;
const CENTS_PER_POINT = 1;

export interface CheckoutFormProps {
  listingId: string;
  checkIn: string;
  checkOut?: string;
  guests: number;
  totalCents: number; // gross, USD cents
  defaultName: string;
  defaultEmail: string;
  currency: CurrencyCode;
  locale: Locale;
  pointsBalance: number;
  maxRedeemablePoints: number;
}

interface Errors {
  guestName?: string;
  guestEmail?: string;
  card?: string;
  expiry?: string;
  cvc?: string;
}

export function CheckoutForm(props: CheckoutFormProps) {
  const dict = getDictionary(props.locale);
  const [guestName, setGuestName] = useState(props.defaultName);
  const [guestEmail, setGuestEmail] = useState(props.defaultEmail);
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const effectivePoints = usePoints ? pointsRedeemed : 0;
  const discountCents = effectivePoints * CENTS_PER_POINT;
  const netCents = Math.max(0, props.totalCents - discountCents);
  const remaining = props.pointsBalance - effectivePoints;
  const canRedeem = props.maxRedeemablePoints >= REDEEM_UNIT;

  const money = useMemo(
    () => (cents: number) => formatMoney(cents, props.currency),
    [props.currency],
  );

  function validate(): boolean {
    const next: Errors = {};
    if (!guestName.trim()) next.guestName = t(dict, "checkout.err.name");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guestEmail.trim()))
      next.guestEmail = t(dict, "checkout.err.email");
    const digits = card.replace(/\s+/g, "");
    if (!/^\d{15,16}$/.test(digits)) next.card = t(dict, "checkout.err.card");
    if (!/^\d{2}\s*\/\s*\d{2}$/.test(expiry))
      next.expiry = t(dict, "checkout.err.expiry");
    if (!/^\d{3,4}$/.test(cvc)) next.cvc = t(dict, "checkout.err.cvc");
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
          currency: props.currency,
          pointsRedeemed: effectivePoints,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        booking?: { id: string };
        error?: string;
      };
      if (!res.ok || !data.booking) {
        setApiError(data.error ?? t(dict, "common.error"));
        return;
      }
      setConfirmedId(data.booking.id);
    } catch {
      setApiError(t(dict, "common.networkError"));
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
          {t(dict, "checkout.success.title")}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {t(dict, "checkout.success.desc", { email: guestEmail })}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/bookings">
            <Button fullWidth>{t(dict, "checkout.viewBookings")}</Button>
          </Link>
          <Link href="/search">
            <Button variant="outline" fullWidth>
              {t(dict, "checkout.keepExploring")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900">
          {t(dict, "checkout.guestDetails")}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label={t(dict, "checkout.guestName")}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            error={errors.guestName}
          />
          <Input
            label={t(dict, "checkout.guestEmail")}
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            error={errors.guestEmail}
          />
        </div>
      </section>

      {/* Points redemption */}
      {props.pointsBalance > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {t(dict, "checkout.points.title")}
            </h2>
            <span className="text-sm text-slate-500">
              {t(dict, "checkout.points.balance", {
                balance: props.pointsBalance,
              })}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t(dict, "checkout.points.maxNote")}
          </p>

          {canRedeem ? (
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(e) => {
                    setUsePoints(e.target.checked);
                    if (e.target.checked && pointsRedeemed === 0) {
                      setPointsRedeemed(props.maxRedeemablePoints);
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {t(dict, "checkout.points.use")}
              </label>

              {usePoints && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {t(dict, "checkout.points.redeemLabel")}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {pointsRedeemed}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={props.maxRedeemablePoints}
                    step={REDEEM_UNIT}
                    value={pointsRedeemed}
                    onChange={(e) => setPointsRedeemed(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-700">
                      {t(dict, "checkout.points.applied", {
                        points: pointsRedeemed,
                        amount: money(discountCents),
                      })}
                    </span>
                    <span className="text-slate-400">
                      {t(dict, "checkout.points.remaining", {
                        points: remaining,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {t(dict, "checkout.payment")}
          </h2>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            {t(dict, "checkout.demoBadge")}
          </span>
        </div>
        <div className="mt-4 space-y-4">
          <Input
            label={t(dict, "checkout.cardNumber")}
            inputMode="numeric"
            placeholder={t(dict, "checkout.cardNumberPh")}
            value={card}
            onChange={(e) => setCard(e.target.value)}
            error={errors.card}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t(dict, "checkout.cardExpiryFull")}
              placeholder="12/28"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              error={errors.expiry}
            />
            <Input
              label={t(dict, "checkout.cardCvc")}
              inputMode="numeric"
              placeholder="123"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              error={errors.cvc}
            />
          </div>
        </div>
      </section>

      {/* Totals */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>{t(dict, "checkout.gross")}</dt>
            <dd>{money(props.totalCents)}</dd>
          </div>
          {discountCents > 0 && (
            <div className="flex justify-between text-brand-700">
              <dt>{t(dict, "checkout.points.discount")}</dt>
              <dd>−{money(discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
            <dt>{t(dict, "checkout.total")}</dt>
            <dd>{money(netCents)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-400">
          {t(dict, "checkout.chargedInUsd", {
            amount: formatMoney(netCents, "USD"),
          })}
        </p>
      </section>

      {apiError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiError}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={submitting}>
        {submitting
          ? t(dict, "checkout.processing")
          : t(dict, "checkout.confirmAndPay", { amount: money(netCents) })}
      </Button>
      <p className="text-center text-xs text-slate-400">
        {t(dict, "checkout.mockNotice")}
      </p>
    </form>
  );
}
