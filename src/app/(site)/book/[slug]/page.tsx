import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApiError, api } from "@/lib/api/client";
import { checkWindowGuards, deriveWindow, fromDateKey, toDateKey } from "@/lib/domain/dates";
import { Container, ErrorState, Eyebrow } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { BookFlow } from "@/components/booking/book-flow";
import { getHeldReference } from "../actions";
import { getSelectedBranch } from "@/lib/branch-selection";
import { CrossBranchNotice } from "@/components/branch/cross-branch-notice";

export const metadata: Metadata = {
  title: "Reserve Your Gown",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Flow B (§6). Arrives here from the availability calendar with a chosen event
 * date. Every guard is re-checked server-side before the form is even shown,
 * and again inside create.
 */
export default async function BookPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const dateParam = Array.isArray(query.date) ? query.date[0] : query.date;

  let product;
  try {
    product = await api.product(slug);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  const eventDate = dateParam ? fromDateKey(dateParam) : null;

  if (!eventDate) {
    return (
      <Container size="narrow" className="py-14 lg:py-20">
        <ErrorState
          title="Choose your event date first"
          body="We need to know when your event is before we can hold this gown."
          action={
            <ButtonLink href={`/dresses/${slug}`}>Back to This Gown</ButtonLink>
          }
        />
      </Container>
    );
  }

  const window = deriveWindow(eventDate);
  const guard = checkWindowGuards(window);

  if (guard) {
    return (
      <Container size="narrow" className="py-14 lg:py-20">
        <ErrorState title="That date cannot be booked" body={guard.message} />
        <div className="mt-8">
          <ButtonLink href={`/dresses/${slug}`} variant="secondary">
            Choose Another Date
          </ButtonLink>
        </div>
      </Container>
    );
  }

  if (product.price === null) {
    return (
      <Container size="narrow" className="py-14 lg:py-20">
        <ErrorState
          title="This gown cannot be reserved online"
          body="No online price has been published for this piece yet. The branch team can arrange it for you directly."
          action={<ButtonLink href={`/dresses/${slug}`}>Back to This Gown</ButtonLink>}
        />
      </Container>
    );
  }

  // Confirm the date is still genuinely free before showing the form. It can
  // still be taken before submit — create is the authority (§5).
  const availability = await api.productAvailability(slug);
  if (!availability.dates.includes(toDateKey(window.eventDate))) {
    return (
      <Container size="narrow" className="py-14 lg:py-20">
        <ErrorState
          title="That date has just been taken"
          body="This gown is one of a kind, and someone has reserved it for dates that overlap yours."
          action={
            <ButtonLink href={`/dresses/${slug}`}>See Free Dates</ButtonLink>
          }
        />
      </Container>
    );
  }

  // §11: a customer who refreshes after creating a hold must be able to resume
  // it, not silently create a second hold on the same intent.
  const [heldReference, selectedBranch] = await Promise.all([
    getHeldReference(),
    getSelectedBranch(),
  ]);

  const isCrossBranch =
    selectedBranch !== null && selectedBranch.slug !== product.branch.slug;

  return (
    <Container size="narrow" className="py-14 lg:py-20">
      <Eyebrow gold>Reserve</Eyebrow>
      <h1 className="mt-5 text-[2.25rem] leading-tight sm:text-[2.75rem]">
        Reserve Your Gown
      </h1>

      {isCrossBranch && selectedBranch ? (
        <div className="mt-8">
          <CrossBranchNotice
            productBranchName={product.branch.name}
            productBranchSlug={product.branch.slug}
            selectedBranchName={selectedBranch.name}
            selectedBranchSlug={selectedBranch.slug}
          />
        </div>
      ) : null}

      {heldReference ? (
        <div className="mt-8 border border-warning/35 bg-warning-soft px-5 py-5">
          <p className="text-sm leading-relaxed text-warning">
            You already have a gown held under reference{" "}
            <strong className="font-medium">{heldReference}</strong>. Complete
            that booking rather than starting a new one — an unconfirmed hold is
            released after a while.
          </p>
          <ButtonLink
            href={`/booking?ref=${encodeURIComponent(heldReference)}`}
            variant="secondary"
            size="sm"
            className="mt-4"
          >
            Resume That Booking
          </ButtonLink>
        </div>
      ) : null}

      <div className="mt-10">
        <BookFlow
          product={product}
          eventDate={toDateKey(window.eventDate)}
          handoverDate={toDateKey(window.handoverDate)}
          takebackDate={toDateKey(window.takebackDate)}
        />
      </div>
    </Container>
  );
}

/**
 * Rendered per request: this page reads live availability, and the API is
 * reached over HTTP (the local mock is same-origin, so there is nothing to
 * prerender against at build time).
 */
export const dynamic = "force-dynamic";
