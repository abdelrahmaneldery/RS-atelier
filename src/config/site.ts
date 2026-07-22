/**
 * Structural site configuration — navigation and product copy.
 *
 * Business facts (branch details, prices, policies) never live here. They come
 * from the backend, or from Settings, and render an honest "not yet published"
 * state when unset.
 */

export const SITE = {
  name: "Rawan Samir Atelier",
  shortName: "RS Atelier",
  initials: "RS",
  tagline: "Atelier",
  establishedYear: 2019,
  description:
    "One-of-one occasion gowns, rented by the night. Choose your branch, check availability for your date, and contact the branch team to continue.",
  address:
    "47 Mohammed Hussein Haykal, Al Mintaqah as Sādisah, Nasr City, Cairo Governorate 4450320",
} as const;

/** Opens the address in the user's maps app. */
export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  SITE.address,
)}`;

/** Builds a maps link for any address. */
export function locationMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** The store's physical locations, shown on the Contact page. */
export const STORE_LOCATIONS = [
  {
    label: "El Nozha Branch",
    phone: "0100 639 1471",
    phoneHref: "tel:+201006391471",
    address:
      "5 Gesr El Suez St., near El Nozha Metro Station, in front of El Nakheel Club Gate, Building 5 (First Floor, next to Etisalat).",
    offDay: "Monday & Friday off",
  },
  {
    label: "Abbas El-Akkad Branch",
    phone: "0110 506 9202",
    phoneHref: "tel:+201105069202",
    address:
      "49 Hassanein Heikal St. (parallel to Abbas El Akkad, beside Senyorita).",
    offDay: "Monday & Friday off",
  },
] as const;

/** Embeddable Google map preview for an address. */
export function mapEmbedUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;
}

/**
 * Maps a backend branch slug to its public branch identity (name + phone).
 * Every gown design is physically held at each branch as a separate garment, so
 * availability is checked per branch — this is how the availability modal names
 * the branch(es) that hold the piece on the chosen date.
 */
export const BRANCH_DIRECTORY: Record<
  string,
  { name: string; phone: string; phoneHref: string }
> = {
  "branch-one": {
    name: "El Nozha Branch",
    phone: "0100 639 1471",
    phoneHref: "tel:+201006391471",
  },
  "branch-two": {
    name: "Abbas El-Akkad Branch",
    phone: "0110 506 9202",
    phoneHref: "tel:+201105069202",
  },
};

/**
 * Public social profiles. `icon` maps to a lucide icon in the SocialLinks
 * component; each opens in a new tab.
 */
export const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/irawansamirr/?hl=en",
    icon: "instagram" as const,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/p/Irawansamir-100084751451593/",
    icon: "facebook" as const,
  },
] as const;

export type NavLink = {
  label: string;
  href: string;
};

/**
 * Primary navigation for the single store. No cart — this platform has no cart,
 * no shipping and no multi-dress checkout.
 */
export const PRIMARY_NAV: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Our Story", href: "/our-story" },
  { label: "Contact", href: "/contact" },
];

// Reserving is not done online, so there is no "My Booking" lookup.
export const UTILITY_NAV: NavLink[] = [];

export const FOOTER_NAV: Array<{ heading: string; links: NavLink[] }> = [
  {
    heading: "Explore",
    links: [
      { label: "Shop", href: "/shop" },
      { label: "Our Story", href: "/our-story" },
    ],
  },
  {
    heading: "Policies",
    links: [
      { label: "Rental Policy", href: "/rental-policy" },
      { label: "Cancellation Policy", href: "/cancellation-policy" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Frequently Asked Questions", href: "/faq" },
      { label: "Size Guide", href: "/size-guide" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

/**
 * The five stages of a rental (§4). The website owns stages 1–2; stages 3–5
 * happen in branch and are explained here but never actioned online.
 */
export const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    title: "Find Your Piece",
    body: "Browse the collection and choose the gown you would like to wear.",
    owner: "online" as const,
  },
  {
    number: "02",
    title: "Find Your Date",
    body: "Every gown is one of a kind, so it can only be worn by one person at a time. Check which dates are free.",
    owner: "online" as const,
  },
  {
    number: "03",
    title: "Contact the Store",
    body: "Once your date is free, contact the store to reserve your gown. Nothing is paid, held or confirmed online.",
    owner: "branch" as const,
  },
  {
    number: "04",
    title: "Collect the Day Before",
    body: "Come to the store the day before your event. The balance and the insurance are settled there.",
    owner: "branch" as const,
  },
  {
    number: "05",
    title: "Return the Day After",
    body: "Bring the dress back the day after. Your ID and insurance are released once it is checked in.",
    owner: "branch" as const,
  },
] as const;

/** Why RS. */
export const WHY_RS = [
  {
    icon: "one-of-one",
    title: "One of One",
    body: "Every gown is a single piece. When it is yours for the night, it is yours alone.",
    href: "/shop",
  },
  {
    icon: "reserve",
    title: "Check Availability",
    body: "See the real available dates for each gown, then contact the store team to continue.",
    href: "/shop",
  },
  {
    icon: "condition",
    title: "Honest Condition",
    body: "Each dress carries its condition openly, so you know exactly what you are collecting.",
    href: "/shop",
  },
  {
    icon: "fitting",
    title: "Personal Fitting",
    body: "Collect in store, where the team can see the dress on you before you leave.",
    href: "/shop",
  },
  {
    icon: "trusted",
    title: "Trusted Since 2019",
    body: "An established Egyptian occasion-wear atelier.",
    href: "/our-story",
  },
] as const;

export type WhyRsIcon = (typeof WHY_RS)[number]["icon"];

/**
 * Occasion categories for the storefront tiles. Occasion filtering is not yet
 * in the catalogue data model, so each tile links to the branch wardrobe; the
 * label communicates the register the customer is shopping for.
 */
export const OCCASION_CATEGORIES = [
  { label: "Wedding Guest", colour: "champagne" },
  { label: "Engagement", colour: "blush" },
  { label: "Soirée", colour: "burgundy" },
  { label: "Evening & Gala", colour: "black" },
  { label: "Graduation", colour: "teal" },
  { label: "Special Occasions", colour: "gold" },
] as const;

/** Compact reassurance strip on the storefront. */
export const SERVICE_POINTS = [
  { title: "One of One", body: "Every gown is a single piece." },
  { title: "Real Availability", body: "Live dates you can check any time." },
  { title: "Reserve In Branch", body: "Reserve your gown with the branch team." },
  { title: "Personal Fitting", body: "Collect and fit in branch." },
  { title: "Trusted Since 2019", body: "An established Egyptian atelier." },
] as const;

/** Catalogue sort options. */
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Rental Price: Low to High" },
  { value: "price_desc", label: "Rental Price: High to Low" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
export const DEFAULT_SORT: SortOption = "newest";
