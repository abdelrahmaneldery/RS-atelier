# RS Atelier — Customer Website

The customer-facing website for **Rawan Samir Atelier (RS)**, an Egyptian
occasion-wear rental atelier established in 2019.

RS rents **one-of-one dresses** from physical branches. This is a **branch-first
rental storefront**, not a classic ecommerce catalogue of interchangeable SKUs.
There is no cart, no shipping, and no multi-dress checkout.

**One booking = one dress + one customer + one event window.**

```
Choose branch → Browse that branch's wardrobe → Check free dates
→ Hold the dress (pending) → Pay 50% deposit + upload ID (confirmed)
→ Collect in branch → Return in branch
```

Source of truth for all behaviour: **`Atelier RS - Ecommerce Website Logic.md`**.
Section references throughout the code (§4, §5, §8…) point at it.

---

## Repository scope

This repository is **only** the customer website. The staff/ops dashboard is a
separate future repository that shares the **same backend and database**.

**The website may** browse published branches/collections/dresses, check
availability both ways, create a lead, create a booking to `pending`, confirm it
to `confirmed`, and cancel before handover.

**The website may not** run handover, takeback, cleaning or retire; collect the
balance or insurance; touch money-out; or mutate anything else. From handover
onward, only branch staff act.

Nothing here builds admin pages, staff auth, or dashboard UI.

---

## Two status tracks

Every rental moves along two linked tracks. Confusing them is the easiest way to
break this system.

| Track | Field | Values |
|---|---|---|
| **Commercial** | `Booking.status` | `pending` → `confirmed` → `handed_over` → `completed`, or `cancelled` |
| **Physical** | `Product.status` | `Available` → `Reserved` → `HandedToClient` → `Cleaning` → `Available`, or `Retired` |

The website moves the booking track, and holds the dress at create. Staff move
both tracks after confirmation. **Nothing advances by calendar date alone** —
every transition is an explicit action.

---

## Rules that are load-bearing

- **No accounts.** No login, password or OTP. A booking is opened with its
  reference *and* the phone number it was made with — neither alone works.
- **Dresses are one-of-one.** A `Product` *is* a physical garment with its own
  code (`B1-0042`). There are no variants, sizes or stock counts.
- **Availability is advisory until create succeeds.** Between "looks free" and
  "Book", the floor or another customer can take the dress. Create re-checks
  inside a transaction and returns `409`.
- **The occupied window includes the buffer:**
  `[handover_date … takeback_date + 2 working days]`. Overlap = clash.
- **Money online is the deposit only.** Balance and insurance are branch money
  moments, collected at handover.
- **Deposit is server-computed.** A client cannot negotiate it down.
- **`fix_count` is never public** — only the derived `health_band`.
- **Cancelling forfeits a paid deposit.** No refund is issued online; money-out
  belongs to staff and the ledger.

### Constants (`src/lib/domain/constants.ts`)

| Constant | Value |
|---|---|
| `DEPOSIT_PCT` | 0.50 |
| `BUFFER_WORKING_DAYS` | 2 |
| `HORIZON_DAYS` | 15 |
| `WINDOW_MAX_DAYS` | 7 |
| `REFUND_POLICY` | deposit forfeit |

The server is authoritative; the client mirrors these for UX only.

> **Open question:** `WEEKEND_DAYS` currently assumes a Friday–Saturday weekend
> for the working-day buffer. This is an assumption and shifts every
> availability calculation — please confirm the atelier's real non-working days.

---

## The backend

The site is a **client of the Atelier RS API** (`/api/v1/public`). It never
queries a database from a page or component.

Because that backend is not built yet, this repo ships a **local mock** at
`src/app/api/v1/**` that implements the documented contract on top of a JSON
data file (`src/data/db.json`). The site really does speak HTTP to it, so
nothing about the integration is faked.

**To switch to the real backend:** set `API_BASE_URL` (and `API_SITE_KEY`), then
delete `src/app/api/v1/**` and `src/data/`. No page or component changes.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/public/branches` | Branch list — step 1 |
| `GET` | `/public/branches/{slug}` | Branch detail |
| `GET` | `/public/branches/{slug}/collections` | Lookbook groups |
| `GET` | `/public/branches/{slug}/products` | Cards |
| `GET` | `/public/products/{slug}` | Detail + images |
| `GET` | `/public/products/{slug}/availability` | Dress → free dates |
| `GET` | `/public/availability` | Date → free dresses |
| `POST` | `/public/leads` | Lead capture (Flow A) |
| `POST` | `/bookings` | Create → `pending`, dress `Reserved` |
| `GET` | `/bookings/{reference}?phone=` | Retrieve |
| `POST` | `/bookings/{reference}/confirm` | Deposit + ID → `confirmed` |
| `POST` | `/bookings/{reference}/cancel` | Before handover only |

Responses are validated against Zod schemas in `src/lib/api/contract.ts`, so a
backend change surfaces as a clear error rather than `undefined` in a component.

---

## Getting started

```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# paste into SESSION_SECRET

npm install
npm run dev
```

The catalogue lives in `src/data/db.json` — 2 branches, 3 collections each, and
**36 one-of-one dresses**. Edit that file to change the data; runtime writes
(bookings, customers, leads) are persisted back into it.

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

> **Dependency versions are pinned deliberately.** Do not run
> `npm audit fix --force` — it downgraded Next.js from 16 to 9 during
> development and broke the entire App Router.

---

## Architecture

**Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · JSON data store**

```
src/
  app/(site)/       public pages
  app/api/v1/       LOCAL MOCK of the backend — delete when the real API lands
  components/       ui/ · layout/ · catalogue/ · booking/ · content/
  lib/domain/       business rules — constants, dates, availability, booking
  lib/api/          typed client + response contract
  config/           site structure and media configuration
```

`src/lib/domain/` holds the rules and is deliberately free of UI. It is the part
the dashboard repository will mirror or share.

| Module | Responsibility |
|---|---|
| `constants.ts` | Statuses, health bands, money maths, business constants |
| `dates.ts` | Window derivation, working-day buffer, guards |
| `availability.ts` | Clash detection, both availability modes, visibility rules |
| `booking.ts` | Create / confirm / cancel with transactional guards |

Catalogue visibility (§8) is enforced by `visibleProductWhere()`, composed into
every public read so it cannot be forgotten: published · not `Retired` · at
least one image · branch active **and** published · collection published.

---

## What is still demo data

- **Rental prices and insurance amounts are demo figures.** They exist so the
  deposit flow is testable end to end, and must be replaced with real prices.
- **Photography is stand-in, not the atelier's own.** 20 demo gown photos and
  5 editorial shots live in `public/media/` (sourced from Pexels, free to use).
  Every `ProductImage` row is flagged `isDemo: true`, the dress page says
  "Photography shown is representative", and every image needing replacement is
  one query away:  `SELECT * FROM ProductImage WHERE isDemo = 1;`
  Replace the files in `public/media/` and clear the flag — no code changes.
- **Branch locations and contact details are empty**, and render as such.
- **Policies, FAQ and size guide are unpublished**, and render an "awaiting
  publication" state rather than invented text.
- **ID upload is not wired to storage.** `confirmBookingAction` sends a
  placeholder `idFileRef`; the document itself is never persisted by this site.
  See the `TODO` in `src/app/(site)/book/actions.ts`.

---

## Verification

Last full pass:

- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm run build` — 30 routes
- **20 domain checks** — hold reserves the dress, deposit is 50%, payment and
  status logs carry `member_id = null` for customer actions, ID hold recorded
  and released on cancel, clash rejected with `409`, cleaning buffer enforced,
  cancel returns the dress to the pool, leads hold nothing, customers
  deduplicated by phone
- **14 API checks** — guards for past dates, horizon, window, branch mismatch,
  invalid phone; `fix_count` absent from payloads; lookup requires reference
  *and* phone with identical failures either way
- **26 route checks** — every page 200, unknown slugs 404, guard states render
  rather than crash, no cart/checkout/shipping language anywhere

---

## Before launch

- [ ] Point `API_BASE_URL` at the real backend and delete the mock
- [ ] Wire ID upload to real file storage
- [ ] Replace demo prices with real rental and insurance amounts
- [ ] Upload product photography
- [ ] Publish branch locations and contact details
- [ ] Publish rental, cancellation, privacy and terms policies
- [ ] Confirm the non-working days used by the cleaning buffer
- [ ] Decide how the deposit is actually charged (currently recorded, not processed)
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production domain
