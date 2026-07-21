/**
 * Centralised image configuration (§8).
 *
 * Every image path in the platform resolves through here so real photography
 * can replace demo content by editing data — never components.
 *
 * Honest placeholders
 * -------------------
 * No stock photography is bundled. Until the atelier's own photography is
 * uploaded, image slots render an elegant tonal panel tinted from the dress's
 * colour rather than an unrelated stock image. That keeps the layout truthful:
 * the site never implies a photograph is of a garment the atelier holds.
 */

export const IMAGE_ROOT = "/media";

/**
 * Named editorial slots. Replace the files in public/media/editorial/ with the
 * atelier's own photography — no code changes needed.
 *
 * The images currently in place are STAND-INS, not the atelier's own work.
 */
/**
 * Filenames are versioned by subject, not generic ("hero.jpg").
 *
 * Next's image optimiser caches by URL + width + quality, so replacing an image
 * while keeping its filename serves the OLD picture from cache indefinitely.
 * When you swap one of these, give the new file a new name and update the path
 * here — that is the only reliable way to bust every layer of caching at once.
 */
export const EDITORIAL_IMAGES = {
  /** Landscape frame for the full-bleed homepage hero. */
  hero: `${IMAGE_ROOT}/editorial/hero-noir-v3-wide.png`,
  /** Tall crop, used on narrow screens where a wide frame loses the subject. */
  heroPortrait: `${IMAGE_ROOT}/editorial/hero-noir-v2-portrait.jpg`,
  story: `${IMAGE_ROOT}/editorial/story.jpg`,
} as const;

export type EditorialSlot = keyof typeof EDITORIAL_IMAGES;

/**
 * Homepage hero slides. Add, remove or reorder images here — the hero slider
 * reads this array, so nothing else needs to change. `position` sets the CSS
 * object-position so the subject stays framed across screen sizes.
 *
 * The first entry is the current hero. The others are stand-ins from existing
 * editorial photography — swap them for the atelier's own wide hero images.
 */
export type HeroSlide = { src: string; alt: string; position?: string };

export const HERO_SLIDES: HeroSlide[] = [
  {
    src: `${IMAGE_ROOT}/editorial/hero-noir-v3-wide.png`,
    alt: "A model in a satin evening gown on a waterfront terrace at night",
    position: "60% center",
  },
  {
    src: `${IMAGE_ROOT}/editorial/branch-3.jpg`,
    alt: "Inside an RS Atelier boutique",
    position: "center",
  },
  {
    src: `${IMAGE_ROOT}/editorial/branch-1.jpg`,
    alt: "The RS Atelier showroom",
    position: "center",
  },
];

/** Stand-in branch interiors, cycled so each branch card differs. */
const BRANCH_IMAGES = [
  `${IMAGE_ROOT}/editorial/branch-1.jpg`,
  `${IMAGE_ROOT}/editorial/branch-2.jpg`,
  `${IMAGE_ROOT}/editorial/branch-3.jpg`,
];

export function branchImage(index: number): string {
  return BRANCH_IMAGES[index % BRANCH_IMAGES.length];
}

/**
 * Editorial image per occasion, keyed by the occasion label. These are the
 * large cards in "Shop by Occasion". Drop the atelier's own photography into
 * public/media/occasions/ (one modest-soirée, hijabi-model image per file) to
 * replace the stand-ins — no code change needed.
 */
export const OCCASION_IMAGES: Record<string, string> = {
  "Wedding Guest": `${IMAGE_ROOT}/occasions/wedding-guest-v1.jpg`,
  Engagement: `${IMAGE_ROOT}/occasions/engagement.jpg`,
  "Soirée": `${IMAGE_ROOT}/occasions/soiree-v1.jpg`,
  "Evening & Gala": `${IMAGE_ROOT}/occasions/evening-gala.jpg`,
  Graduation: `${IMAGE_ROOT}/occasions/graduation-v1.jpg`,
  "Special Occasions": `${IMAGE_ROOT}/occasions/special-occasions.jpg`,
};

export function occasionImage(label: string): string | null {
  return OCCASION_IMAGES[label] ?? null;
}

/**
 * Tonal fallbacks keyed by colour name, used to tint placeholder panels.
 * Extend by adding a hex to the ColourOption record in the database — this map
 * is only the last resort when a colour has no configured swatch.
 */
export const COLOUR_TINTS: Record<string, string> = {
  black: "#1f1c19",
  charcoal: "#3a3733",
  navy: "#232f45",
  emerald: "#1f4a3c",
  teal: "#20504f",
  burgundy: "#4d1f28",
  red: "#7a2029",
  blush: "#e2c4bd",
  pink: "#d9a8b2",
  champagne: "#ddcdb4",
  gold: "#b08e4f",
  silver: "#b9bcc0",
  ivory: "#f2ece2",
  white: "#f7f5f1",
  nude: "#dcc4ae",
  lilac: "#b6aac6",
  sage: "#9aa891",
};

const NEUTRAL_TINT = "#e5dcd0";

export function tintForColour(colour: string | null | undefined): string {
  if (!colour) return NEUTRAL_TINT;
  return COLOUR_TINTS[colour.trim().toLowerCase()] ?? NEUTRAL_TINT;
}

/**
 * Aspect ratios used across the catalogue. Fashion imagery is portrait; keeping
 * these centralised stops individual pages inventing their own crops.
 */
export const ASPECT = {
  product: "3 / 4",
  productWide: "4 / 5",
  editorial: "4 / 5",
  hero: "3 / 4",
  banner: "16 / 9",
  branch: "4 / 3",
  /** Tall, immersive crop for the "Shop by Occasion" cards. */
  occasion: "3 / 4",
} as const;

/**
 * Responsive `sizes` hints, so the browser never downloads a desktop-width
 * image for a phone.
 */
export const IMAGE_SIZES = {
  productCard: "(min-width: 1024px) 31vw, (min-width: 640px) 47vw, 90vw",
  productDetail: "(min-width: 1024px) 55vw, 92vw",
  hero: "(min-width: 1024px) 48vw, 100vw",
  card: "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw",
  occasion: "(min-width: 1024px) 24vw, (min-width: 640px) 40vw, 64vw",
  full: "100vw",
} as const;
