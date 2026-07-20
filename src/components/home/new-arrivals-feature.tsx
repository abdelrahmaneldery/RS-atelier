"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";

import { EDITORIAL_IMAGES, ASPECT, IMAGE_SIZES } from "@/config/media";
import { HORIZON_DAYS } from "@/lib/domain/constants";
import { addDays, toDateKey } from "@/lib/domain/dates";
import type { ApiCollection, ApiProductCard } from "@/lib/api/contract";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { Field, Input } from "@/components/ui/field";
import { Button, ButtonLink } from "@/components/ui/button";
import { AtelierImage } from "@/components/ui/atelier-image";
import { ProductGrid } from "@/components/catalogue/product-card";
import { fetchAvailableForDate } from "@/app/(site)/home-actions";

/**
 * Editorial storefront feature — a single framed block that pairs a tall
 * "New Arrivals" campaign panel with the "Available for Your Date" finder and a
 * compact row of featured collections. It replaces the old stacked New Arrivals
 * grid + date finder + collections sections with one premium split layout.
 *
 * Branch-scoped throughout: the finder is fixed to `branchId`, and every link
 * points back into this branch's wardrobe. Availability results render full
 * width beneath the block so the returned grid has room to breathe.
 */
export function NewArrivalsFeature({
  branchId,
  branchSlug,
  shopHref,
  collections,
}: {
  branchId: string;
  branchSlug: string;
  shopHref: string;
  collections: ApiCollection[];
}) {
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [result, setResult] = useState<
    | { date: string; handover: string; takeback: string; products: ApiProductCard[] }
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const min = toDateKey(today);
  const max = toDateKey(addDays(today, HORIZON_DAYS));

  const featured = collections.slice(0, 3);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setError(null);
    startTransition(async () => {
      const res = await fetchAvailableForDate(branchId, date);
      if (!res.ok) {
        setError(res.error);
        setResult(null);
        return;
      }
      setResult(res);
    });
  }

  return (
    <section className="border-t border-line py-10 lg:py-14">
      <Container>
        <div className="overflow-hidden border border-line">
          <div className="grid lg:grid-cols-2">
            {/* Left — tall New Arrivals campaign panel. */}
            <div className="relative min-h-[24rem] sm:min-h-[30rem] lg:min-h-[40rem]">
              <Image
                src={EDITORIAL_IMAGES.story}
                alt="New arrivals hanging in the RS Atelier showroom"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/25 to-transparent"
              />
              <div className="relative z-10 flex h-full flex-col items-start justify-center gap-5 p-8 sm:p-10 lg:p-14">
                <Eyebrow gold className="text-gold-soft">
                  New Arrivals
                </Eyebrow>
                <h2
                  className="max-w-[10ch] font-display text-[2.5rem] leading-[1.05] text-white sm:text-[3rem] lg:text-[3.5rem]"
                  style={{ textShadow: "0 2px 20px rgb(22 19 15 / 0.45)" }}
                >
                  Timeless Begins Here
                </h2>
                <p
                  className="max-w-[34ch] text-sm leading-relaxed text-white/85 sm:text-base"
                  style={{ textShadow: "0 1px 10px rgb(22 19 15 / 0.4)" }}
                >
                  Discover our latest occasion-wear creations — crafted for
                  unforgettable entrances.
                </p>
                <ButtonLink
                  href={`${shopHref}?sort=newest`}
                  size="lg"
                  className="mt-2 border-white bg-white text-ink hover:border-white/90 hover:bg-white/90"
                >
                  Explore New Arrivals
                </ButtonLink>
              </div>
            </div>

            {/* Right — date finder over featured collections. */}
            <div className="flex flex-col justify-center gap-8 bg-offwhite px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
              <div>
                <Eyebrow gold className="mb-3">
                  Available for Your Date
                </Eyebrow>
                <h2 className="font-display text-[1.75rem] leading-none text-ink lg:text-[2.25rem]">
                  Let&rsquo;s find your perfect fit
                </h2>
                <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-stone">
                  Tell us when your event is and we&rsquo;ll show the gowns free at
                  this branch that night. Bookings open up to {HORIZON_DAYS} days
                  ahead.
                </p>

                <form
                  onSubmit={submit}
                  className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                  <div className="sm:flex-1">
                    <Field label="Event Date" htmlFor="feature-event-date" required>
                      <Input
                        id="feature-event-date"
                        type="date"
                        min={min}
                        max={max}
                        value={date}
                        onChange={(e) => setDate(e.currentTarget.value)}
                        required
                      />
                    </Field>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    variant={date ? "primary" : "secondary"}
                    disabled={!date || pending}
                    className="disabled:opacity-100"
                  >
                    {pending ? "Checking…" : "Show Available"}
                  </Button>
                </form>

                {error ? (
                  <p className="mt-4 border-l-2 border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
                    {error}
                  </p>
                ) : null}
              </div>

              {featured.length > 0 ? (
                <div className="border-t border-line pt-8">
                  <div className="flex items-end justify-between gap-4">
                    <h3 className="font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink">
                      Featured Collections
                    </h3>
                    <Link
                      href={`/branches/${branchSlug}`}
                      className="link-underline inline-flex items-center gap-1.5 pb-0.5 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink"
                    >
                      View Wardrobe
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Link>
                  </div>

                  <ul className="mt-5 grid grid-cols-3 gap-4">
                    {featured.map((collection) => (
                      <li key={collection.id}>
                        <Link
                          href={`/branches/${branchSlug}?collection=${collection.slug}`}
                          className="group block"
                        >
                          <AtelierImage
                            src={collection.coverImage}
                            alt={`${collection.name} collection`}
                            aspect={ASPECT.product}
                            sizes={IMAGE_SIZES.card}
                            colour="beige"
                          />
                          <p className="mt-3 font-display text-sm text-ink">
                            <span className="link-underline">{collection.name}</span>
                          </p>
                          {collection.description ? (
                            <p className="mt-0.5 line-clamp-1 text-xs text-mist">
                              {collection.description}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs text-mist">
                              {collection.productCount}{" "}
                              {collection.productCount === 1 ? "gown" : "gowns"}
                            </p>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Availability results — full width beneath the block. */}
        {result ? (
          <div className="mt-12 border-t border-line pt-10">
            <p className="mb-6 text-sm text-stone">
              {result.products.length}{" "}
              {result.products.length === 1 ? "gown is" : "gowns are"} free —
              collect {result.handover}, return {result.takeback}.
            </p>
            {result.products.length > 0 ? (
              <>
                <ProductGrid products={result.products.slice(0, 8)} />
                <ButtonLink
                  href={`/branches/${branchSlug}/available?date=${date}`}
                  variant="secondary"
                  className="mt-8"
                >
                  See All Available Gowns
                </ButtonLink>
              </>
            ) : (
              <p className="border border-line bg-offwhite px-5 py-6 text-sm text-graphite">
                No gowns are free at this branch for that date. Try a nearby date.
              </p>
            )}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
