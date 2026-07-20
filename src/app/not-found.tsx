import Link from "next/link";

import { Container } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

export const metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center py-24 text-center">
      <p className="eyebrow eyebrow-gold">Error 404</p>
      <h1 className="mt-6 text-[2.5rem] leading-tight sm:text-[3rem]">
        This Page Is No Longer Here
      </h1>
      <p className="mx-auto mt-6 max-w-[46ch] leading-relaxed text-graphite">
        The piece or page you are looking for may have been moved, or is no
        longer part of the collection.
      </p>
      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/dresses">Browse the Collection</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Return Home
        </ButtonLink>
      </div>
      <p className="mt-10 text-sm text-stone">
        Looking for an existing request?{" "}
        <Link href="/booking-lookup" className="link-underline text-ink">
          Check your booking
        </Link>
        .
      </p>
    </Container>
  );
}
