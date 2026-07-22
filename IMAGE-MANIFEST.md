# RS Atelier — Image Replacement Manifest

Drop your new images into `public/media/…` using the **exact filenames** below and the
site picks them up with no layout change. Nothing here is deleted until you confirm the
replacements are uploaded.

**Brief for every image:** modest hijabi women in elegant soirée dresses (hero / occasion /
editorial) **or** clean dress-focused product photography (cards / product pages / related).
No casual clothes, bridal gowns, western/revealing dresses, or unrelated lifestyle shots.

> ⚠️ **Caching rule:** Next.js caches optimised images by URL. If you reuse an existing
> filename, also clear the cache (`rm -rf .next` then restart) so the new picture shows.
> The cleanest option is a **new versioned filename** (e.g. `hero-hijabi-01-wide.jpg`) — tell
> me the new names and I'll update the references in one pass.

---

## 1 · Homepage hero slider  ·  editorial (hijabi model)
Full-bleed, `object-cover`, spans the whole viewport. Landscape framing.
Config: `src/config/media.ts → HERO_SLIDES`.

| Filename | Where it appears | Aspect ratio | Recommended dimensions |
|---|---|---|---|
| `editorial/hero-noir-v3-wide.png` | Hero slide 1 | Landscape (fills screen) | 2400 × 1350 (min 1920 × 1080) |
| `editorial/branch-3.jpg` → *replace* | Hero slide 2 | Landscape | 2400 × 1350 |
| `editorial/branch-1.jpg` → *replace* | Hero slide 3 | Landscape | 2400 × 1350 |

*Slide 1 is already on-brief (hijabi, satin gown) — keep or replace as you like.*
You can add more slides; each just needs a `src`, `alt`, and optional `position`.

## 2 · Shop by Occasion  ·  editorial (hijabi model, one per occasion)
Portrait cards on the homepage. Config: `src/config/media.ts → OCCASION_IMAGES`.

| Filename | Where it appears | Aspect ratio | Recommended dimensions |
|---|---|---|---|
| `occasions/wedding-guest-v1.jpg` | "Wedding Guest" card | 3 : 4 | 1200 × 1600 |
| `occasions/engagement.jpg` | "Engagement" card | 3 : 4 | 1200 × 1600 |
| `occasions/soiree-v1.jpg` | "Soirée" card | 3 : 4 | 1200 × 1600 |
| `occasions/evening-gala.jpg` | "Evening & Gala" card | 3 : 4 | 1200 × 1600 |
| `occasions/graduation-v1.jpg` | "Graduation" card | 3 : 4 | 1200 × 1600 |
| `occasions/special-occasions.jpg` | "Special Occasions" card | 3 : 4 | 1200 × 1600 |

## 3 · Our Story editorial  ·  editorial (hijabi / atelier)
One portrait image on the Our Story page. Config: `src/config/media.ts → EDITORIAL_IMAGES.story`.

| Filename | Where it appears | Aspect ratio | Recommended dimensions |
|---|---|---|---|
| `editorial/story.jpg` | Our Story page image | 4 : 5 | 1200 × 1500 |

## 4 · Product photography  ·  dress-focused (dress-only or modest model)
Portrait product shots used on **product cards, product detail, quick view, related,
trending, recently-viewed, and gallery thumbnails**. These are seeded into the database
from the files below (`prisma/seed.ts → DEMO_PHOTOS`); each gown uses two of them.

- **Aspect ratio:** 2 : 3 (portrait)
- **Recommended dimensions:** 1200 × 1800 (min 1000 × 1500)
- **Folder:** `public/media/dresses/`
- **Count:** 20 images (below). Provide at least this many distinct dress photos for variety.

```
12163542.jpg   13252124.jpg   15752106.jpg   1655841.jpg    17244526.jpg
17559253.jpg   18457620.jpg   24194328.jpg   28115171.jpg   29248624.jpg
31604282.jpg   32328387.jpg   32335610.jpg   35140329.jpg   36707016.jpg
36747258.jpg   38507962.jpg   6234213.jpg    6235477.jpg    6639599.jpg
```

**Two ways to replace product photos:**
- **(a) In place** — overwrite these 20 filenames with your dress photos, then
  `rm -rf .next` and restart. No code/DB change. (The DB already points at these paths.)
- **(b) New filenames** — give me the new names; I update `DEMO_PHOTOS` and re-run the
  seed. Best for guaranteed cache-busting.

---

## Keep as-is (not photography)
| File | Purpose |
|---|---|
| `brand/rs-logo-v2-dark.png` | Logo (dark surfaces) |
| `brand/rs-logo-v2-light.png` | Logo (light surfaces) |

## Currently unused — safe to retire *after* you upload replacements
These are no longer referenced anywhere (leftover from the multi-branch design):

- `editorial/branch-2.jpg`
- `editorial/hero-noir-v2-wide.png`
- `editorial/hero-noir-v2-portrait.jpg`
- `occasions/graduation.jpg`
- `occasions/soiree.jpg`
- `occasions/wedding-guest.jpg`

(`editorial/branch-1.jpg` and `branch-3.jpg` are still used as hero slides 2 & 3 — retire
them only once you replace those slides.)

---

### When your images are in place
Tell me and I'll: update `HERO_SLIDES` / `OCCASION_IMAGES` / `EDITORIAL_IMAGES` (and the
seed if you used new product filenames), refresh the `alt` text to match the new photos,
delete the retired files, and run lint + build. Layout, aspect ratios, overlays, `sizes`
hints and responsive behaviour all stay exactly as they are.
