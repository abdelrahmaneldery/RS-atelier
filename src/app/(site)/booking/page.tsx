import type { Metadata } from "next";

import { Container, Eyebrow } from "@/components/ui/primitives";
import { BookingLookup } from "@/components/booking/booking-lookup";

export const metadata: Metadata = {
  title: "My Booking",
  description:
    "Open your RS Atelier booking with your reference and mobile number.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ref = params.ref;
  const initialReference = Array.isArray(ref) ? ref[0] : ref;

  return (
    <Container size="narrow" className="py-14 lg:py-20">
      <Eyebrow gold>Bookings</Eyebrow>
      <h1 className="mt-5 text-[2.25rem] leading-tight sm:text-[3rem]">
        My Booking
      </h1>
      <p className="mt-6 max-w-[58ch] leading-relaxed text-graphite">
        Enter your booking reference and the mobile number you booked with. No
        account is needed.
      </p>

      <BookingLookup initialReference={initialReference} />
    </Container>
  );
}
