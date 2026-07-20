import type { Metadata } from "next";
import Link from "next/link";

import { api } from "@/lib/api/client";
import { ASPECT, IMAGE_SIZES, branchImage } from "@/config/media";
import { getSelectedBranch } from "@/lib/branch-selection";
import { AtelierImage } from "@/components/ui/atelier-image";
import { Container, Eyebrow, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Choose Your Branch",
  description:
    "Each RS Atelier gown belongs to one branch. Choose where you would like to collect from to see its wardrobe.",
};

/**
 * Step 1 of every journey (§6). A dress belongs to exactly one branch, so the
 * branch choice scopes everything that follows.
 */
export default async function BranchesPage() {
  const [branches, selectedBranch] = await Promise.all([
    api.branches(),
    getSelectedBranch(),
  ]);

  return (
    <Container className="py-14 lg:py-20">
      <Eyebrow gold>Step One</Eyebrow>
      <SectionHeading
        headingLevel="h1"
        title="Choose Your Branch"
        lede="Every gown is a single piece held at one branch. Choose where you would like to collect from, and we will show you what is in its wardrobe."
        className="mt-5"
      />

      {branches.length === 0 ? (
        <div className="mt-14">
          <EmptyState
            title="No branches are open for online booking yet"
            body="Please check back shortly, or get in touch and our team will help you directly."
            action={<ButtonLink href="/contact">Contact Us</ButtonLink>}
          />
        </div>
      ) : (
        <Reveal>
          <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch, index) => (
              <li key={branch.id} className="flex flex-col">
                <Link href={`/branches/${branch.slug}`} className="group block">
                  <AtelierImage
                    src={branchImage(index)}
                    alt={`${branch.name} atelier interior`}
                    aspect={ASPECT.branch}
                    sizes={IMAGE_SIZES.card}
                    colour="champagne"
                  />
                </Link>
                <div className="flex flex-1 flex-col pt-5">
                  {selectedBranch?.slug === branch.slug ? (
                    <p className="mb-2 inline-flex w-fit border border-gold/45 px-2 py-0.5 text-[0.5625rem] uppercase tracking-[0.14em] text-gold-deep">
                      Currently Exploring
                    </p>
                  ) : null}
                  <h2 className="font-display text-2xl text-ink">
                    <Link href={`/branches/${branch.slug}`} className="link-underline">
                      {branch.name}
                    </Link>
                  </h2>

                  {/* Location is a real business fact — shown only once set. */}
                  {branch.location ? (
                    <p className="mt-2 text-sm leading-relaxed text-stone">
                      {branch.location}
                      {branch.country ? `, ${branch.country}` : ""}
                    </p>
                  ) : branch.country ? (
                    <p className="mt-2 text-sm text-stone">{branch.country}</p>
                  ) : null}

                  <div className="mt-5 pt-1">
                    <Link
                      href={`/branches/${branch.slug}`}
                      className="link-underline font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink"
                    >
                      View the Wardrobe
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </Container>
  );
}

/**
 * Rendered per request: this page reads live availability, and the API is
 * reached over HTTP (the local mock is same-origin, so there is nothing to
 * prerender against at build time).
 */
export const dynamic = "force-dynamic";
