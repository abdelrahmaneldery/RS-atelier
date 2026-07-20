import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Demo data for the local mock backend.
 *
 * This stands in for the Atelier RS backend until it is live. It is NOT
 * production data.
 *
 * What this deliberately does not invent (§8, and the brief's "never invent
 * business information" rule):
 *   - Branch addresses, phone numbers and opening hours are left empty.
 *   - Policy text, FAQ and size guide are left unpublished.
 *
 * What it DOES set, because the site cannot be exercised without it:
 *   - Rental prices and insurance amounts. These are clearly demo figures so
 *     the self-book flow (deposit = 50%) can be tested end to end. They must be
 *     replaced with the atelier's real prices before launch.
 *
 * Dresses are one-of-one: each Product below is a single physical garment with
 * its own code, and can be booked by exactly one customer at a time.
 */

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// --- Branches ---------------------------------------------------------------

const BRANCHES = [
  {
    name: "RS Atelier — Branch One",
    slug: "branch-one",
    country: "Egypt",
    location: null,
    prefix: "B1",
  },
  {
    name: "RS Atelier — Branch Two",
    slug: "branch-two",
    country: "Egypt",
    location: null,
    prefix: "B2",
  },
];

const COLLECTIONS = [
  {
    slug: "atelier-edit",
    name: "The Atelier Edit",
    description:
      "The house signature: sculpted silhouettes, considered fabrics, and quiet detail.",
  },
  {
    slug: "nocturne",
    name: "Nocturne",
    description:
      "Evening wear in deep, saturated colour — built for low light and long nights.",
  },
  {
    slug: "cairo-nights",
    name: "Cairo Nights",
    description:
      "Beaded and embroidered pieces drawing on Egyptian craft and celebration.",
  },
];

// --- Dresses ----------------------------------------------------------------

type SeedDress = {
  name: string;
  description: string;
  fabric: string;
  colour: string;
  silhouette: string;
  collection: string;
  /** Demo rental price in EGP (major units). Replace before launch. */
  priceEgp: number;
  insuranceEgp: number;
  fixCount: number;
};

const DRESSES: SeedDress[] = [
  {
    name: "Serene Column Gown",
    description:
      "A floor-length column in weighted crêpe, cut close through the body and released at the hem. The neckline is left clean so the shoulders carry the line.",
    fabric: "Weighted crêpe",
    colour: "Black",
    silhouette: "Column",
    collection: "atelier-edit",
    priceEgp: 4500,
    insuranceEgp: 6000,
    fixCount: 0,
  },
  {
    name: "Amara Beaded Gown",
    description:
      "Hand-beaded across the bodice in a graduated pattern that settles as it descends. Fully lined, with a concealed back zip.",
    fabric: "Beaded tulle over silk lining",
    colour: "Champagne",
    silhouette: "Mermaid",
    collection: "cairo-nights",
    priceEgp: 7800,
    insuranceEgp: 12000,
    fixCount: 1,
  },
  {
    name: "Noor One-Shoulder",
    description:
      "A single shoulder drape falling into a soft asymmetric skirt. Designed to move.",
    fabric: "Silk-blend satin",
    colour: "Burgundy",
    silhouette: "One-Shoulder",
    collection: "nocturne",
    priceEgp: 5200,
    insuranceEgp: 7000,
    fixCount: 3,
  },
  {
    name: "Layla Corset Gown",
    description:
      "A boned corset bodice above a full skirt with interior structure. Substantial, and built to hold its shape through a long evening.",
    fabric: "Duchess satin",
    colour: "Ivory",
    silhouette: "Corset",
    collection: "atelier-edit",
    priceEgp: 9500,
    insuranceEgp: 15000,
    fixCount: 0,
  },
  {
    name: "Dalia Draped Midi",
    description:
      "Gathered at one hip and draped across the front, finishing below the knee. An easier register for daytime celebrations.",
    fabric: "Matte jersey",
    colour: "Teal",
    silhouette: "Draped",
    collection: "atelier-edit",
    priceEgp: 3200,
    insuranceEgp: 4500,
    fixCount: 6,
  },
  {
    name: "Yasmin Cape Gown",
    description:
      "A slim underdress with a detachable chiffon cape falling from the shoulder to the floor.",
    fabric: "Crêpe with silk chiffon cape",
    colour: "Navy",
    silhouette: "Cape",
    collection: "nocturne",
    priceEgp: 6100,
    insuranceEgp: 8500,
    fixCount: 2,
  },
  {
    name: "Farida Embroidered Gown",
    description:
      "Metallic thread embroidery worked across the bodice and trailing into the skirt, on a base of fine tulle.",
    fabric: "Embroidered tulle",
    colour: "Gold",
    silhouette: "Ball Gown",
    collection: "cairo-nights",
    priceEgp: 8900,
    insuranceEgp: 13000,
    fixCount: 4,
  },
  {
    name: "Malak Off-Shoulder",
    description:
      "A structured off-shoulder neckline over a softly flared skirt. Clean, and deliberately undecorated.",
    fabric: "Mikado",
    colour: "Red",
    silhouette: "A-Line",
    collection: "atelier-edit",
    priceEgp: 4800,
    insuranceEgp: 6500,
    fixCount: 1,
  },
  {
    name: "Hana Slip Gown",
    description:
      "A bias-cut slip in heavy satin, finished with a fine strap and a low back.",
    fabric: "Bias-cut satin",
    colour: "Silver",
    silhouette: "Slip",
    collection: "nocturne",
    priceEgp: 3900,
    insuranceEgp: 5000,
    fixCount: 5,
  },
  {
    name: "Nadia Mermaid Gown",
    description:
      "Fitted to below the knee before releasing into a full flare. Interior boning throughout the bodice.",
    fabric: "Stretch crêpe with tulle underskirt",
    colour: "Emerald",
    silhouette: "Mermaid",
    collection: "atelier-edit",
    priceEgp: 5600,
    insuranceEgp: 7500,
    fixCount: 2,
  },
  {
    name: "Salma Tiered Gown",
    description:
      "Horizontal tiers of soft organza from a fitted waist, each one weighted to fall cleanly.",
    fabric: "Silk organza",
    colour: "Blush",
    silhouette: "Ball Gown",
    collection: "cairo-nights",
    priceEgp: 6700,
    insuranceEgp: 9000,
    fixCount: 0,
  },
  {
    name: "Rana Velvet Column",
    description:
      "Silk velvet cut in a long column with a high neck and open back. Winter weight.",
    fabric: "Silk velvet",
    colour: "Emerald",
    silhouette: "Column",
    collection: "nocturne",
    priceEgp: 7200,
    insuranceEgp: 10000,
    fixCount: 3,
  },
  {
    name: "Jana Feather-Hem Gown",
    description:
      "A clean crêpe body finished with a feather-trimmed hem that moves with each step.",
    fabric: "Crêpe with feather trim",
    colour: "Pink",
    silhouette: "Column",
    collection: "nocturne",
    priceEgp: 5900,
    insuranceEgp: 8000,
    fixCount: 7,
  },
  {
    name: "Aya Sequin Gown",
    description:
      "Fully sequinned on a stretch base, cut long and lean with a modest front and open back.",
    fabric: "Stretch sequin",
    colour: "Gold",
    silhouette: "Column",
    collection: "cairo-nights",
    priceEgp: 5400,
    insuranceEgp: 7000,
    fixCount: 2,
  },
  {
    name: "Mariam Bow-Back Gown",
    description:
      "A restrained front and a sculptural oversized bow at the back — the detail is saved for the exit.",
    fabric: "Duchess satin",
    colour: "Ivory",
    silhouette: "A-Line",
    collection: "atelier-edit",
    priceEgp: 8200,
    insuranceEgp: 11000,
    fixCount: 1,
  },
  {
    name: "Leen Wrap Gown",
    description:
      "A true wrap with a deep V and a tie waist, cut in fluid satin. Adjustable through the body.",
    fabric: "Fluid satin",
    colour: "Burgundy",
    silhouette: "Draped",
    collection: "atelier-edit",
    priceEgp: 4100,
    insuranceEgp: 5500,
    fixCount: 4,
  },
  {
    name: "Tala High-Slit Gown",
    description:
      "A long column with a high front slit and a softly gathered shoulder.",
    fabric: "Matte satin",
    colour: "Black",
    silhouette: "Column",
    collection: "nocturne",
    priceEgp: 4700,
    insuranceEgp: 6000,
    fixCount: 0,
  },
  {
    name: "Zeina Illusion Gown",
    description:
      "Beaded illusion panelling across the shoulders and back over a fitted crêpe underdress.",
    fabric: "Beaded illusion tulle over crêpe",
    colour: "Champagne",
    silhouette: "Mermaid",
    collection: "cairo-nights",
    priceEgp: 9800,
    insuranceEgp: 14000,
    fixCount: 2,
  },
];

/**
 * Stand-in photography, downloaded to public/media/dresses.
 *
 * These are NOT photographs of the atelier's garments. Every record is written
 * with `isDemo: true` so the interface can label it, and so a query can find
 * every image still needing replacement:
 *
 *   SELECT * FROM ProductImage WHERE isDemo = 1;
 *
 * Source: Pexels (free to use, no attribution required).
 */
const DEMO_PHOTOS = [
  "36707016", "18457620", "28115171", "1655841", "6234213",
  "13252124", "31604282", "32335610", "32328387", "6235477",
  "36747258", "15752106", "12163542", "38507962", "17244526",
  "24194328", "17559253", "29248624", "35140329", "6639599",
];

function demoPhotosFor(index: number): string[] {
  // Two images per gown, offset so neighbouring pieces do not share a pair.
  const a = DEMO_PHOTOS[index % DEMO_PHOTOS.length];
  const b = DEMO_PHOTOS[(index * 7 + 3) % DEMO_PHOTOS.length];
  const unique = a === b ? [a] : [a, b];
  return unique.map((id) => `/media/dresses/${id}.jpg`);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.info("Seeding branches…");
  const branches: Array<{ id: string; prefix: string }> = [];
  for (const [i, b] of BRANCHES.entries()) {
    const branch = await prisma.branch.upsert({
      where: { slug: b.slug },
      create: {
        name: b.name,
        slug: b.slug,
        country: b.country,
        // Street address and contact details are real business facts and are
        // not invented here.
        location: b.location,
        active: true,
        published: true,
        sortOrder: i,
      },
      update: { active: true, published: true, sortOrder: i },
      select: { id: true },
    });
    branches.push({ id: branch.id, prefix: b.prefix });
  }

  console.info("Seeding collections…");
  // Each branch keeps its own collections, since a collection belongs to a
  // branch in this model.
  const collectionIds = new Map<string, string>();
  for (const branch of branches) {
    for (const [i, c] of COLLECTIONS.entries()) {
      const collection = await prisma.collection.upsert({
        where: { branchId_slug: { branchId: branch.id, slug: c.slug } },
        create: {
          branchId: branch.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          published: true,
          sortOrder: i,
        },
        update: { published: true, sortOrder: i },
        select: { id: true },
      });
      collectionIds.set(`${branch.id}:${c.slug}`, collection.id);
    }
  }

  console.info("Seeding one-of-one dresses…");
  let created = 0;
  for (const [branchIndex, branch] of branches.entries()) {
    // Each branch holds its own distinct physical garments. The same design
    // appears in both branches only as two separate, individually bookable
    // dresses with different codes.
    for (const [i, dress] of DRESSES.entries()) {
      const code = `${branch.prefix}-${String(i + 1).padStart(4, "0")}`;
      const slug = `${slugify(dress.name)}-${code.toLowerCase()}`;

      const product = await prisma.product.upsert({
        where: { code },
        create: {
          branchId: branch.id,
          collectionId: collectionIds.get(`${branch.id}:${dress.collection}`) ?? null,
          code,
          slug,
          description: dress.description,
          fabric: dress.fabric,
          colour: dress.colour,
          silhouette: dress.silhouette,
          status: "Available",
          // Demo figures — replace with the atelier's real prices.
          price: dress.priceEgp * 100,
          insuranceAmount: dress.insuranceEgp * 100,
          fixCount: dress.fixCount,
          // Demo popularity so the Trending rail has a distinct order. Real
          // counts accrue from actual bookings.
          requestCount: (i * 7 + branchIndex * 3) % 19,
          published: true,
        },
        update: {
          description: dress.description,
          price: dress.priceEgp * 100,
          insuranceAmount: dress.insuranceEgp * 100,
          fixCount: dress.fixCount,
          requestCount: (i * 7 + branchIndex * 3) % 19,
          published: true,
        },
        select: { id: true },
      });

      // Visibility requires at least one image (§8). These are stand-ins, not
      // photographs of the actual garment — flagged isDemo so the interface
      // says so and so they can be found and replaced in one query.
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      const photos = demoPhotosFor(branchIndex * DRESSES.length + i);
      await prisma.productImage.createMany({
        data: photos.map((url, order) => ({
          productId: product.id,
          url,
          altText: `${dress.colour} ${dress.silhouette.toLowerCase()} occasion gown, reference ${code}`,
          isPrimary: order === 0,
          sortOrder: order,
          isDemo: true,
        })),
      });
      created += 1;
    }

  }

  console.info("Seeding site settings…");
  // Policy and contact content stays empty so the site renders an honest
  // "not yet published" state instead of invented copy.
  await prisma.setting.upsert({
    where: { key: "announcement.text" },
    create: {
      key: "announcement.text",
      value: "New Pieces Every Two Weeks — Reserve Yours Online",
      isPlaceholder: false,
    },
    update: {},
  });

  const [branchCount, productCount] = await Promise.all([
    prisma.branch.count(),
    prisma.product.count(),
  ]);

  console.info(
    `\nSeed complete: ${branchCount} branches, ${productCount} one-of-one dresses (${created} processed).`,
  );
  console.info(
    "\nStill to configure before launch:\n" +
      "  - Real rental prices and insurance amounts (current figures are demo)\n" +
      "  - Branch locations and contact details\n" +
      "  - Product photography (see src/config/media.ts)\n" +
      "  - Rental, cancellation, privacy and terms policies\n" +
      "  - Confirm the non-working days used by the cleaning buffer\n" +
      "    (src/lib/domain/constants.ts — currently assumes Fri/Sat)\n",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
