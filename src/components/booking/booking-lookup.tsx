"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { formatDate, formatMoney } from "@/lib/format";
import {
  BOOKING_STATUS_DESCRIPTIONS,
  BOOKING_STATUS_LABELS,
  CANCELLABLE_STATUSES,
  type BookingStatus,
} from "@/lib/domain/constants";

import { Badge, DetailRow, ErrorState } from "@/components/ui/primitives";
import { Field, Input } from "@/components/ui/field";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  cancelAction,
  findBookingAction,
  type BookingState,
} from "@/app/(site)/booking/actions";

const STATUS_TONE: Record<
  BookingStatus,
  "neutral" | "gold" | "success" | "warning" | "danger" | "info"
> = {
  pending: "warning",
  confirmed: "success",
  handed_over: "info",
  completed: "neutral",
  cancelled: "neutral",
};

export function BookingLookup({ initialReference }: { initialReference?: string }) {
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    findBookingAction,
    { status: "idle" },
  );

  if (state.status === "found" || state.status === "cancelled") {
    return <BookingDetail state={state} />;
  }

  return (
    <form action={formAction} className="mt-10 max-w-lg" noValidate>
      {state.status === "error" ? (
        <div className="mb-8">
          <ErrorState title="We could not find that booking" body={state.error} />
        </div>
      ) : null}

      <div className="flex flex-col gap-6">
        <Field
          label="Booking Reference"
          htmlFor="reference"
          required
          hint="Shown when you reserved, e.g. RS-7F3K2Q."
        >
          <Input
            id="reference"
            name="reference"
            defaultValue={initialReference}
            placeholder="RS-XXXXXX"
            autoComplete="off"
            autoCapitalize="characters"
            required
            aria-describedby="reference-hint"
          />
        </Field>

        <Field
          label="Mobile Number"
          htmlFor="phone"
          required
          hint="The number you booked with."
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="010 1234 5678"
            required
            aria-describedby="phone-hint"
          />
        </Field>
      </div>

      <Button type="submit" size="lg" className="mt-8" disabled={pending}>
        {pending ? "Searching…" : "Open My Booking"}
      </Button>
    </form>
  );
}

function BookingDetail({
  state,
}: {
  state: Extract<BookingState, { status: "found" | "cancelled" }>;
}) {
  const [cancelState, cancelFormAction, cancelling] = useActionState<
    BookingState,
    FormData
  >(cancelAction, state);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const booking =
    cancelState.status === "cancelled" || cancelState.status === "found"
      ? cancelState.booking
      : state.booking;

  const phone = state.status === "found" ? state.phone : "";
  const status = booking.status as BookingStatus;
  const canCancel = CANCELLABLE_STATUSES.includes(status);
  const cancelError = cancelState.status === "error" ? cancelState.error : null;

  return (
    <div className="mt-10">
      {cancelState.status === "cancelled" ? (
        <p
          role="status"
          className="border-l-2 border-stone bg-ivory-deep px-4 py-3 text-sm text-graphite"
        >
          This booking has been cancelled and the gown has returned to the
          wardrobe.
        </p>
      ) : null}

      {cancelError ? (
        <div className="mb-6">
          <ErrorState title="We could not cancel this booking" body={cancelError} />
        </div>
      ) : null}

      <div className="mt-6 border border-line bg-offwhite px-6 py-5">
        <p className="eyebrow">Booking Reference</p>
        <p className="mt-2 font-display text-3xl tracking-wide text-ink">
          {booking.reference}
        </p>
      </div>

      <div className="mt-8 border-l-2 border-gold/50 bg-sand/50 px-5 py-4">
        <Badge tone={STATUS_TONE[status]}>{BOOKING_STATUS_LABELS[status]}</Badge>
        <p className="mt-3 text-sm leading-relaxed text-graphite">
          {BOOKING_STATUS_DESCRIPTIONS[status]}
        </p>
      </div>

      <dl className="mt-10">
        <DetailRow label="Gown">
          <Link
            href={`/dresses/${booking.product.slug}`}
            className="link-underline"
          >
            {`${booking.product.colour ?? ""} ${booking.product.silhouette ?? "Gown"}`.trim()}
          </Link>
        </DetailRow>
        <DetailRow label="Branch">{booking.product.branch.name}</DetailRow>
        <DetailRow label="Name">{booking.customerName}</DetailRow>
        <DetailRow label="Collect">{formatDate(booking.handoverDate)}</DetailRow>
        <DetailRow label="Your Event">{formatDate(booking.eventDate)}</DetailRow>
        <DetailRow label="Return">{formatDate(booking.takebackDate)}</DetailRow>
        <DetailRow label="Rental">
          {formatMoney(booking.price, booking.currency)}
        </DetailRow>
        <DetailRow label="Deposit">
          {formatMoney(booking.deposit, booking.currency)}{" "}
          <span className="text-mist">
            {booking.depositPaid ? "· paid" : "· not yet paid"}
          </span>
        </DetailRow>
        <DetailRow label="Balance in Branch">
          {formatMoney(booking.balance, booking.currency)}
        </DetailRow>
        {booking.insuranceAmount ? (
          <DetailRow label="Insurance in Branch">
            {formatMoney(booking.insuranceAmount, booking.currency)}{" "}
            <span className="text-mist">· refundable</span>
          </DetailRow>
        ) : null}
        <DetailRow label="Identity Document">
          {booking.idSubmitted ? "Received" : "Not yet received"}
        </DetailRow>
      </dl>

      {status === "pending" ? (
        <div className="mt-10 border border-warning/30 bg-warning-soft px-5 py-5">
          <p className="text-sm leading-relaxed text-warning">
            This gown is held but not yet confirmed. Complete your deposit and
            ID to secure it — holds are released if left incomplete.
          </p>
        </div>
      ) : null}

      {canCancel ? (
        <section className="mt-12 border-t border-line pt-8">
          <h2 className="font-display text-2xl text-ink">Cancel This Booking</h2>

          {confirmingCancel ? (
            <form action={cancelFormAction} className="mt-6 max-w-lg">
              <input type="hidden" name="reference" value={booking.reference} />
              <Field
                label="Mobile Number"
                htmlFor="cancel-phone"
                required
                hint="Confirm the number this booking was made with."
              >
                <Input
                  id="cancel-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  defaultValue={phone}
                  required
                  aria-describedby="cancel-phone-hint"
                />
              </Field>

              {booking.depositPaid ? (
                <p className="mt-5 border-l-2 border-danger/40 bg-danger-soft px-4 py-3 text-sm leading-relaxed text-danger">
                  Your deposit of {formatMoney(booking.deposit, booking.currency)}{" "}
                  is non-refundable once a booking is confirmed. Cancelling will
                  forfeit it.
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button type="submit" variant="danger" disabled={cancelling}>
                  {cancelling ? "Cancelling…" : "Confirm Cancellation"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmingCancel(false)}
                >
                  Keep My Booking
                </Button>
              </div>
            </form>
          ) : (
            <>
              <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-stone">
                You can cancel any time before you collect the gown.
                {booking.depositPaid
                  ? " Your deposit is non-refundable."
                  : " No payment has been taken yet."}
              </p>
              <Button
                type="button"
                variant="danger"
                className="mt-6"
                onClick={() => setConfirmingCancel(true)}
              >
                Cancel This Booking
              </Button>
            </>
          )}
        </section>
      ) : null}

      <div className="mt-12">
        <ButtonLink href="/branches" variant="secondary">
          Browse the Wardrobe
        </ButtonLink>
      </div>
    </div>
  );
}
