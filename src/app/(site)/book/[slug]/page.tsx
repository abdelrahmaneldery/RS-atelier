import { redirect } from "next/navigation";

/**
 * Online reservation has been removed from the customer website — gowns are not
 * booked or held through the site. Any old link into the booking flow sends the
 * customer back to the dress, where they can check availability and contact the
 * branch to arrange the rental.
 */
export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/dresses/${slug}`);
}
