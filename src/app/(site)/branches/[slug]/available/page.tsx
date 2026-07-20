import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, api } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { fromDateKey } from "@/lib/domain/dates";
import { HORIZON_DAYS } from "@/lib/domain/constants";
import {
  Container,
  EmptyState,
  ErrorState,
  Eyebrow,
  SectionHeading,
} from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { ProductGrid } from "@/components/catalogue/product-card";

export const metadata: Metadata = {
  title: "Available Gowns",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Date → free dresses (§5 mode 2).
 *
 * Results are advisory: a gown listed here can still be taken before the
 * customer books, in which case create fails with a clash and they are sent
 * back here to choose again (§11).
 */
export default async function AvailablePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const dateParam = Array.isArray(query.date) ? query.date[0] : query.date;

  let branch;
  try {
    branch = await api.branch(slug);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  const eventDate = dateParam ? fromDateKey(dateParam) : null;

  if (!eventDate) {
    return (
      <Container size="narrow" className="py-14 lg:py-20">
        <ErrorState
          title="We need a valid event date"
          body="Choose the date of your event and we will show the gowns free that night."
          action={
            <ButtonLink href={`/branches/${slug}`}>
              Back to {branch.name}
            </ButtonLink>
          }
        />
      </Container>
    );
  }

  let availability;
  try {
    availability = await api.availability({
      branchId: branch.id,
      eventDate: dateParam!,
    });
  } catch (error) {
    if (error instanceof ApiError && error.isValidation) {
      return (
        <Container size="narrow" className="py-14 lg:py-20">
          <ErrorState title="That date cannot be booked" body={error.message} />
          <div className="mt-8">
            <ButtonLink href={`/branches/${slug}`} variant="secondary">
              Choose Another Date
            </ButtonLink>
          </div>
        </Container>
      );
    }
    throw error;
  }

  return (
    <Container className="py-12 lg:py-16">
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-stone">
          <li>
            <Link href="/branches" className="hover:text-ink">
              Branches
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/branches/${slug}`} className="hover:text-ink">
              {branch.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-charcoal" aria-current="page">
            Available
          </li>
        </ol>
      </nav>

      <Eyebrow gold>{branch.name}</Eyebrow>
      <SectionHeading
        headingLevel="h1"
        title={`Free for ${formatDate(availability.eventDate)}`}
        className="mt-5"
      />

      {/* The dates the customer is actually committing to (§4). */}
      <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 border-y border-line py-5 text-sm">
        <div>
          <dt className="eyebrow">Collect</dt>
          <dd className="mt-1 text-charcoal">
            {formatDate(availability.handoverDate)}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Your Event</dt>
          <dd className="mt-1 text-charcoal">{formatDate(availability.eventDate)}</dd>
        </div>
        <div>
          <dt className="eyebrow">Return</dt>
          <dd className="mt-1 text-charcoal">
            {formatDate(availability.takebackDate)}
          </dd>
        </div>
      </dl>

      <div className="mt-12">
        {availability.products.length === 0 ? (
          <EmptyState
            title="No gowns are free for that date"
            body={`Every piece at ${branch.name} is already booked across that window. Try a nearby date, or another branch.`}
            action={
              <ButtonLink href={`/branches/${slug}`}>Try Another Date</ButtonLink>
            }
          />
        ) : (
          <>
            <p className="mb-8 text-sm text-stone">
              {availability.products.length}{" "}
              {availability.products.length === 1 ? "gown is" : "gowns are"} free
              for this date. Availability is confirmed when you book.
            </p>
            <ProductGrid products={availability.products} priorityCount={4} />
          </>
        )}
      </div>

      <p className="mt-14 max-w-[62ch] text-xs leading-relaxed text-mist">
        Dates shown are subject to confirmation. Bookings open up to{" "}
        {HORIZON_DAYS} days ahead, and each gown is one of a kind — it can be
        taken by someone else until your booking is created.
      </p>
    </Container>
  );
}

/**
 * Rendered per request: this page reads live availability, and the API is
 * reached over HTTP (the local mock is same-origin, so there is nothing to
 * prerender against at build time).
 */
export const dynamic = "force-dynamic";
