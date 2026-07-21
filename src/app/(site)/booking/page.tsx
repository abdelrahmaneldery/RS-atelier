import { redirect } from "next/navigation";

/**
 * Online booking (and booking-reference lookup) has been removed from the
 * customer website. Rentals are arranged with the branch team, so this route
 * now sends the customer to Contact.
 */
export default function BookingPage() {
  redirect("/contact");
}
