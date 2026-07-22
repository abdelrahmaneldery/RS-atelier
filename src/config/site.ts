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
} as const;

export type NavLink = {
  label: string;
  href: string;
};

/**
 * Primary navigation. The journey is branch-first, so "Branches" is the entry
 * point to the catalogue rather than a footnote. No cart — this platform has
 * no cart, no shipping and no multi-dress checkout.
 */
export const PRIMARY_NAV: NavLink[] = [
  { label: "Branches", href: "/branches" },
  { label: "Our Story", href: "/our-story" },
  { label: "Contact", href: "/contact" },
];

// Reserving is not done online, so there is no "My Booking" lookup.
export const UTILITY_NAV: NavLink[] = [];

export const FOOTER_NAV: Array<{ heading: string; links: NavLink[] }> = [
  {
    heading: "Explore",
    links: [
      { label: "Branches", href: "/branches" },
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
    title: "Choose Your Branch",
    body: "Each dress belongs to one branch. Start by choosing where you would like to collect from.",
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
    title: "Contact the Branch",
    body: "Once your date is free, contact the branch to reserve your gown. Nothing is paid, held or confirmed online.",
    owner: "branch" as const,
  },
  {
    number: "04",
    title: "Collect the Day Before",
    body: "Come to the branch the day before your event. The balance and the insurance are settled there.",
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
    href: "/branches",
  },
  {
    icon: "reserve",
    title: "Check Availability",
    body: "See the real available dates for each gown, then contact the branch team to continue.",
    href: "/branches",
  },
  {
    icon: "condition",
    title: "Honest Condition",
    body: "Each dress carries its condition openly, so you know exactly what you are collecting.",
    href: "/branches",
  },
  {
    icon: "fitting",
    title: "Personal Fitting",
    body: "Collect in branch, where the team can see the dress on you before you leave.",
    href: "/branches",
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
