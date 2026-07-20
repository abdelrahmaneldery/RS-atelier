"use client";

import { useActionState } from "react";
import Link from "next/link";

import { formatDate, formatMoney } from "@/lib/format";
import { DEPOSIT_PCT } from "@/lib/domain/constants";
import type { ApiBooking, ApiProductDetail } from "@/lib/api/contract";
import { Field, Input, RadioCards } from "@/components/ui/field";
import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/primitives";
import {
  confirmBookingAction,
  createBookingAction,
  type ConfirmState,
  type CreateState,
} from "@/app/(site)/book/actions";
import { useState } from "react";

/**
 * Flow B (§6): hold the dress, then confirm it.
 *
 * Step 1 creates a `pending` booking and reserves the gown. Step 2 records the
 * deposit and the ID and moves it to `confirmed`. The two are separate so an
 * abandoned flow leaves an honest `pending` hold that staff can see and chase.
 */
export function BookFlow({
  product,
  eventDate,
  handoverDate,
  takebackDate,
}: {
  product: ApiProductDetail;
  eventDate: string;
  handoverDate: string;
  takebackDate: string;
}) {
  const [createState, createAction, creating] = useActionState<CreateState, FormData>(
    createBookingAction,
    { status: "idle" },
  );

  if (createState.status === "held") {
    return <ConfirmStep booking={createState.booking} />;
  }

  return (
    <div>
      <Summary
        product={product}
        eventDate={eventDate}
        handoverDate={handoverDate}
        takebackDate={takebackDate}
      />

      {createState.status === "error" ? (
        <div className="mt-8">
          <ErrorState
            title={
              createState.recoverable
                ? "That date has just been taken"
                : "We could not hold this gown"
            }
            body={createState.error}
            action={
              createState.recoverable ? (
                <ButtonLink href={`/dresses/${product.slug}`}>
                  Choose Another Date
                </ButtonLink>
              ) : undefined
            }
          />
        </div>
      ) : null}

      <form action={createAction} className="mt-10 max-w-lg" noValidate>
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="branchId" value={product.branch.id} />
        <input type="hidden" name="eventDate" value={eventDate} />

        <h2 className="font-display text-2xl text-ink">Your Details</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone">
          We need these so the branch can reach you about your collection.
        </p>

        <div className="mt-7 flex flex-col gap-6">
          <Field label="Full Name" htmlFor="book-name" required>
            <Input id="book-name" name="name" autoComplete="name" required />
          </Field>

          <Field
            label="Mobile Number"
            htmlFor="book-phone"
            required
            hint="You will use this number to open your booking later."
          >
            <Input
              id="book-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="010 1234 5678"
              required
              aria-describedby="book-phone-hint"
            />
          </Field>
        </div>

        <Button type="submit" size="lg" className="mt-8" disabled={creating}>
          {creating ? "Holding your gown…" : "Hold This Gown"}
        </Button>

        <p className="mt-4 text-xs leading-relaxed text-mist">
          Holding is free and takes no payment. Your gown is held while you
          complete the deposit and ID on the next step.
        </p>
      </form>
    </div>
  );
}

function Summary({
  product,
  eventDate,
  handoverDate,
  takebackDate,
}: {
  product: ApiProductDetail;
  eventDate: string;
  handoverDate: string;
  takebackDate: string;
}) {
  return (
    <div className="border border-line bg-offwhite px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-ink">
            {`${product.colour ?? ""} ${product.silhouette ?? "Gown"}`.trim()}
          </h2>
          <p className="mt-1 text-sm text-stone">{product.branch.name}</p>
        </div>
        <Link
          href={`/dresses/${product.slug}`}
          className="link-underline font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink"
        >
          Change
        </Link>
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
        <div>
          <dt className="eyebrow">Collect</dt>
          <dd className="mt-1 text-sm text-charcoal">{formatDate(handoverDate)}</dd>
        </div>
        <div>
          <dt className="eyebrow">Your Event</dt>
          <dd className="mt-1 text-sm text-charcoal">{formatDate(eventDate)}</dd>
        </div>
        <div>
          <dt className="eyebrow">Return</dt>
          <dd className="mt-1 text-sm text-charcoal">{formatDate(takebackDate)}</dd>
        </div>
      </dl>

      {product.price !== null ? (
        <dl className="mt-6 border-t border-line pt-5 text-sm">
          <div className="flex justify-between py-1">
            <dt className="text-stone">Rental</dt>
            <dd className="text-charcoal">
              {formatMoney(product.price, product.currency)}
            </dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-stone">
              Deposit today ({Math.round(DEPOSIT_PCT * 100)}%)
            </dt>
            <dd className="text-ink">
              {formatMoney(product.deposit ?? 0, product.currency)}
            </dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-stone">Balance on collection</dt>
            <dd className="text-charcoal">
              {formatMoney(product.balance ?? 0, product.currency)}
            </dd>
          </div>
          {product.insuranceAmount ? (
            <div className="flex justify-between py-1">
              <dt className="text-stone">Refundable insurance in branch</dt>
              <dd className="text-charcoal">
                {formatMoney(product.insuranceAmount, product.currency)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}

/** Step 2 — deposit + ID. */
function ConfirmStep({ booking }: { booking: ApiBooking }) {
  const [state, formAction, pending] = useActionState<ConfirmState, FormData>(
    confirmBookingAction,
    { status: "idle" },
  );
  const [method, setMethod] = useState("card");

  if (state.status === "confirmed") {
    return <Confirmed booking={state.booking} />;
  }

  return (
    <div>
      <div className="border border-gold/40 bg-sand/50 px-6 py-5">
        <p className="eyebrow">Held for you</p>
        <p className="mt-2 font-display text-3xl tracking-wide text-ink">
          {booking.reference}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-graphite">
          The {`${booking.product.colour ?? ""} ${booking.product.silhouette ?? "Gown"}`.trim()}{" "}
          is held for {formatDate(booking.eventDate)}. Complete the deposit and ID
          below to confirm it.
        </p>
      </div>

      {state.status === "error" ? (
        <div className="mt-8">
          <ErrorState title="We could not confirm your booking" body={state.error} />
        </div>
      ) : null}

      <form action={formAction} className="mt-10 max-w-lg" noValidate>
        <input type="hidden" name="reference" value={booking.reference} />
        <input type="hidden" name="depositAmount" value={booking.deposit} />

        <h2 className="font-display text-2xl text-ink">Confirm Your Booking</h2>

        <dl className="mt-6 border-y border-line py-4 text-sm">
          <div className="flex justify-between py-1">
            <dt className="text-stone">Deposit due now</dt>
            <dd className="font-medium text-ink">
              {formatMoney(booking.deposit, booking.currency)}
            </dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-stone">Balance on collection</dt>
            <dd className="text-charcoal">
              {formatMoney(booking.balance, booking.currency)}
            </dd>
          </div>
          {booking.insuranceAmount ? (
            <div className="flex justify-between py-1">
              <dt className="text-stone">Insurance in branch</dt>
              <dd className="text-charcoal">
                {formatMoney(booking.insuranceAmount, booking.currency)}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-8 flex flex-col gap-6">
          <Field
            label="Mobile Number"
            htmlFor="confirm-phone"
            required
            hint="The number you used to hold this gown."
          >
            <Input
              id="confirm-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              aria-describedby="confirm-phone-hint"
            />
          </Field>

          <RadioCards
            legend="Deposit Method"
            name="depositMethod"
            value={method}
            onChange={setMethod}
            options={[
              { value: "card", label: "Card", description: "Pay online now" },
              {
                value: "transfer",
                label: "Bank Transfer",
                description: "Recorded on receipt",
              },
            ]}
          />

          <Field
            label="Identity Document"
            htmlFor="confirm-id"
            required
            hint="A photo of your national ID or passport. Held until you return the gown, then released."
          >
            <Input
              id="confirm-id"
              name="idFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              required
              className="file:mr-4 file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.12em] file:text-ivory"
              aria-describedby="confirm-id-hint"
            />
          </Field>
        </div>

        <Button type="submit" size="lg" className="mt-8" disabled={pending}>
          {pending ? "Confirming…" : "Pay Deposit & Confirm"}
        </Button>

        <p className="mt-4 text-xs leading-relaxed text-mist">
          The balance and the refundable insurance are settled in branch when you
          collect. Cancelling after confirmation forfeits the deposit.
        </p>
      </form>
    </div>
  );
}

function Confirmed({ booking }: { booking: ApiBooking }) {
  return (
    <div>
      <div className="border border-success/30 bg-success-soft px-6 py-6">
        <p className="eyebrow">Confirmed</p>
        <h2 className="mt-3 font-display text-3xl text-ink">
          Your gown is reserved.
        </h2>
        <p className="mt-3 max-w-[54ch] text-sm leading-relaxed text-graphite">
          We have recorded your deposit and your ID. The{" "}
          {`${booking.product.colour ?? ""} ${booking.product.silhouette ?? "Gown"}`.trim()}{" "}
          is yours for {formatDate(booking.eventDate)}.
        </p>
      </div>

      <div className="mt-8 border border-line bg-offwhite px-6 py-5">
        <p className="eyebrow">Your Reference</p>
        <p className="mt-2 font-display text-3xl tracking-wide text-ink">
          {booking.reference}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-graphite">
          Keep this. You can open your booking any time with this reference and
          your mobile number.
        </p>
      </div>

      <dl className="mt-10 grid gap-x-8 gap-y-4 border-y border-line py-5 sm:grid-cols-3">
        <div>
          <dt className="eyebrow">Collect</dt>
          <dd className="mt-1 text-sm text-charcoal">
            {formatDate(booking.handoverDate)}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Your Event</dt>
          <dd className="mt-1 text-sm text-charcoal">
            {formatDate(booking.eventDate)}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Return</dt>
          <dd className="mt-1 text-sm text-charcoal">
            {formatDate(booking.takebackDate)}
          </dd>
        </div>
      </dl>

      <div className="mt-8 border-l-2 border-gold/50 bg-sand/50 px-5 py-4">
        <p className="text-sm leading-relaxed text-graphite">
          <strong className="font-medium text-ink">Still to pay in branch:</strong>{" "}
          {formatMoney(booking.balance, booking.currency)} balance
          {booking.insuranceAmount
            ? ` and ${formatMoney(booking.insuranceAmount, booking.currency)} refundable insurance`
            : ""}
          , when you collect on {formatDate(booking.handoverDate)}.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/booking">View My Booking</ButtonLink>
        <ButtonLink href="/branches" variant="secondary">
          Continue Browsing
        </ButtonLink>
      </div>
    </div>
  );
}
