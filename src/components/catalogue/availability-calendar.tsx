"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, MessageCircle, Phone, Check } from "lucide-react";

import { modalPanel, overlayFade } from "@/lib/motion";
import { HORIZON_DAYS } from "@/lib/domain/constants";
import { addDays, toDateKey } from "@/lib/domain/dates";
import { whatsappLink } from "@/lib/phone";
import { Button, ButtonLink } from "@/components/ui/button";
import { DatePicker, displayDate } from "@/components/ui/date-picker";
import { AtelierImage } from "@/components/ui/atelier-image";
import { LeadForm } from "@/components/booking/lead-form";
import { recheckProductDates } from "@/app/(site)/dresses/actions";

/**
 * Dress → availability check (guidance only), with a custom RS Atelier calendar.
 *
 * The customer picks an available event date and checks whether this gown is
 * free at the selected branch for it. This is READ-ONLY: it never changes the
 * dress status, holds the gown, or creates any booking or customer record.
 * Only available dates can be selected; on "Check Availability" the site
 * re-reads live availability, so a date that has since been taken is caught and
 * disabled. When the gown is free the result opens in a premium modal;
 * reserving itself is always arranged with the branch team.
 */
const GUIDANCE_NOTE =
  "Availability is shown for guidance only and is confirmed by the branch team.";

export function AvailabilityCalendar({
  productSlug,
  productId,
  productName,
  productImage,
  productColour,
  branchId,
  branchName,
  freeDates,
  similarHref,
  whatsappNumber = null,
  rentalPolicyHref = "/rental-policy",
}: {
  productSlug: string;
  productId: string;
  productName: string;
  productImage: { url: string | null; alt: string };
  productColour: string | null;
  branchId: string;
  branchName: string;
  freeDates: string[];
  /** Where "View Similar Dresses" leads (this dress's branch wardrobe). */
  similarHref: string;
  /** Selected-branch WhatsApp number (normalised); null when not published. */
  whatsappNumber?: string | null;
  rentalPolicyHref?: string;
}) {
  const [available, setAvailable] = useState<Set<string>>(() => new Set(freeDates));
  const [date, setDate] = useState<string | null>(null);
  const [result, setResult] = useState<
    { available: true; date: string } | { available: false; changed?: boolean } | null
  >(null);
  const [pending, startTransition] = useTransition();

  const today = new Date();
  const min = toDateKey(today);
  const max = toDateKey(addDays(today, HORIZON_DAYS));

  if (freeDates.length === 0) {
    return (
      <div className="mt-6 border border-line bg-offwhite px-5 py-6">
        <p className="text-sm leading-relaxed text-graphite">
          This gown has no available dates in the next {HORIZON_DAYS} days. It may
          be reserved, or being prepared between rentals.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Leave your details below and the branch will let you know when it is
          available again.
        </p>
        <p className="mt-4 text-xs leading-relaxed text-mist">{GUIDANCE_NOTE}</p>
      </div>
    );
  }

  function check(event: React.FormEvent) {
    event.preventDefault();
    if (!date) return;
    const chosen = date;
    startTransition(async () => {
      const fresh = await recheckProductDates(productSlug);
      if (fresh) {
        const freshSet = new Set(fresh);
        setAvailable(freshSet);
        if (!freshSet.has(chosen)) {
          // Availability changed since the page loaded — disable that date.
          setResult({ available: false, changed: true });
          return;
        }
      }
      setResult({ available: true, date: chosen });
    });
  }

  return (
    <div className="mt-6">
      <form onSubmit={check} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="check-date"
            className="mb-2 block font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-graphite"
          >
            Event Date
          </label>
          <DatePicker
            id="check-date"
            value={date}
            onChange={(key) => {
              setDate(key);
              setResult(null);
            }}
            availableDates={available}
            min={min}
            max={max}
            ariaLabel="Event date"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={!date || pending}
          className="h-14 disabled:opacity-100"
        >
          {pending ? "Checking…" : "Check Availability"}
        </Button>
      </form>

      {/* Unavailable stays inline; available opens the modal below. */}
      {result && !result.available ? (
        <div className="mt-6 border border-line bg-offwhite px-6 py-6">
          <h3 className="font-display text-2xl text-ink">Not Available on This Date</h3>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-stone">
            {result.changed
              ? "This date is no longer available — it was taken while you were deciding. Please choose another date."
              : "This gown is already unavailable for your selected event date."}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setResult(null);
                setDate(null);
              }}
            >
              Choose Another Date
            </Button>
            <ButtonLink href={similarHref} variant="secondary">
              View Similar Dresses Available on This Date
            </ButtonLink>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-stone">
          Choose your event date to check availability.
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-mist">{GUIDANCE_NOTE}</p>

      <AnimatePresence>
        {result && result.available ? (
        <AvailabilityModal
          key="availability-modal"
          productName={productName}
          productImage={productImage}
          productColour={productColour}
          branchId={branchId}
          branchName={branchName}
          productId={productId}
          date={result.date}
          whatsappNumber={whatsappNumber}
          rentalPolicyHref={rentalPolicyHref}
          onClose={() => setResult(null)}
          onChooseAnother={() => {
            setResult(null);
            setDate(null);
          }}
        />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// --- Availability modal -----------------------------------------------------

function AvailabilityModal({
  productName,
  productImage,
  productColour,
  branchId,
  branchName,
  productId,
  date,
  whatsappNumber,
  rentalPolicyHref,
  onClose,
  onChooseAnother,
}: {
  productName: string;
  productImage: { url: string | null; alt: string };
  productColour: string | null;
  branchId: string;
  branchName: string;
  productId: string;
  date: string;
  whatsappNumber: string | null;
  rentalPolicyHref: string;
  onClose: () => void;
  onChooseAnother: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"summary" | "call">("summary");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const prettyDate = displayDate(date);
  const waMessage =
    `Hello ${branchName}, I would like to confirm availability for the ` +
    `"${productName}" on ${prettyDate}. Could you please confirm if it is ` +
    `still available? (Sent from the RS Atelier website)`;
  const waHref = whatsappNumber ? whatsappLink(whatsappNumber, waMessage) : null;

  return (
    <motion.div
      variants={overlayFade}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-ink/50 p-3 sm:p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 h-full w-full cursor-default"
      />
      <motion.div
        ref={panelRef}
        variants={modalPanel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${productName} availability`}
        className="relative z-10 my-auto flex w-full max-w-md flex-col bg-offwhite shadow-raised focus:outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center bg-ivory/85 text-ink backdrop-blur-sm hover:text-gold-deep"
        >
          <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <div className="p-[clamp(1.15rem,4vw,1.75rem)]">
          {mode === "summary" ? (
            <>
              {/* Top: dress image + name / date / status */}
              <div className="flex gap-3 pr-9 sm:gap-4">
                <div className="w-[clamp(4rem,15vw,5rem)] shrink-0">
                  <AtelierImage
                    src={productImage.url}
                    alt={productImage.alt}
                    colour={productColour}
                    aspect="3 / 4"
                    sizes="80px"
                    zoomOnHover={false}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-[clamp(1.1rem,3.6vw,1.5rem)] leading-tight text-ink">
                    {productName}
                  </h2>
                  <p className="mt-1 text-sm text-graphite">{prettyDate}</p>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 font-sans text-[0.625rem] font-medium uppercase tracking-[0.1em] text-success">
                    <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                    Available at {branchName}
                  </p>
                </div>
              </div>

              <p className="mt-[clamp(0.75rem,2vh,1rem)] text-[clamp(0.8125rem,2.4vw,0.9375rem)] leading-relaxed text-graphite">
                This gown is currently available for your selected date.
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-mist">
                Availability is for guidance only. The gown is not held until
                confirmed by the branch.
              </p>

              {/* Middle: concise rental summary (a plain divided list, no heavy box) */}
              <div className="mt-[clamp(0.75rem,2vh,1rem)] border-t border-line pt-[clamp(0.75rem,2vh,1rem)]">
                <h3 className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-charcoal">
                  Rental &amp; Return
                </h3>
                <ul className="mt-2 flex flex-col gap-1">
                  {[
                    "Collection arranged with the selected branch",
                    "Return within 3 calendar days after the event",
                    "Return to the same branch",
                    "Cleaning & alterations handled by RS Atelier",
                  ].map((item) => (
                    <li key={item} className="flex gap-2 text-[0.8125rem] leading-snug text-graphite">
                      <span
                        aria-hidden="true"
                        className="mt-[0.4rem] h-1 w-1 shrink-0 rounded-full bg-gold-deep"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={rentalPolicyHref}
                  className="link-underline mt-2.5 inline-block font-sans text-xs font-medium text-ink"
                >
                  View Full Rental Policy
                </a>
              </div>

              {/* Bottom: actions */}
              <div className="mt-[clamp(0.9rem,2.4vh,1.25rem)] flex flex-col gap-2.5">
                {waHref ? (
                  <ButtonLink
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="gold"
                    size="md"
                    fullWidth
                    className="py-2.5"
                  >
                    <MessageCircle aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                    Send WhatsApp Message
                  </ButtonLink>
                ) : null}
                <Button
                  type="button"
                  variant={waHref ? "secondary" : "primary"}
                  size="md"
                  fullWidth
                  className="py-2.5"
                  onClick={() => setMode("call")}
                >
                  <Phone aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                  Request a Call
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  fullWidth
                  className="py-2.5"
                  onClick={onChooseAnother}
                >
                  Choose Another Date
                </Button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMode("summary")}
                className="link-underline mb-4 font-sans text-xs font-medium uppercase tracking-[0.12em] text-stone hover:text-ink"
              >
                Back
              </button>
              <h2 className="font-display text-[clamp(1.1rem,3.6vw,1.5rem)] leading-tight text-ink">
                Request a Call
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone">
                Leave your details and the {branchName} team will call you to
                confirm the {productName} for {prettyDate}. This does not hold the
                gown.
              </p>
              <div className="mt-5">
                <LeadForm
                  branchId={branchId}
                  productId={productId}
                  defaultNote={`Please confirm availability of the ${productName} on ${prettyDate} at ${branchName}.`}
                />
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
