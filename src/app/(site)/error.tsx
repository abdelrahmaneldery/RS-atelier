"use client";

import { useEffect } from "react";

import { Container } from "@/components/ui/primitives";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Route-level error boundary.
 *
 * The atelier system being unreachable is a real possibility, so it gets a
 * composed page rather than a stack trace. The underlying error is logged, and
 * never shown — it may contain internals.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site] unhandled error", error);
  }, [error]);

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center py-24 text-center">
      <p className="eyebrow eyebrow-gold">Something Went Wrong</p>
      <h1 className="mt-6 text-[2.25rem] leading-tight sm:text-[2.75rem]">
        We could not load this page
      </h1>
      <p className="mx-auto mt-6 max-w-[48ch] leading-relaxed text-graphite">
        This is on our side, not yours. Please try again — and if it keeps
        happening, the branch team can help you directly.
      </p>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Button type="button" onClick={reset}>
          Try Again
        </Button>
        <ButtonLink href="/branches" variant="secondary">
          Browse the Wardrobe
        </ButtonLink>
        <ButtonLink href="/contact" variant="ghost">
          Contact Us
        </ButtonLink>
      </div>

      {error.digest ? (
        <p className="mt-10 text-xs text-mist">Reference: {error.digest}</p>
      ) : null}
    </Container>
  );
}
