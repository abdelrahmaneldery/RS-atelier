import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:4111";
const OUT = "shots";
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const PAGES = [
  ["home", "/"],
  ["branches", "/branches"],
  ["wardrobe", "/branches/branch-one"],
  ["dress", "__DRESS__"],
  ["book", "__BOOK__"],
  ["booking", "/booking"],
  ["ourstory", "/our-story"],
  ["contact", "/contact"],
  ["faq", "/faq"],
  ["policy", "/rental-policy"],
];

const problems = [];

const browser = await chromium.launch();

// Resolve a real dress + booking URL from the API.
const api = await browser.newContext();
const apiPage = await api.newPage();
await apiPage.goto(BASE, { waitUntil: "domcontentloaded" });
const products = await apiPage.evaluate(async (base) => {
  const r = await fetch(`${base}/api/v1/public/branches/branch-one/products`);
  return (await r.json()).data;
}, BASE).catch(() => []);
const slug = products?.[0]?.slug;
const avail = slug
  ? await apiPage.evaluate(async ([base, s]) => {
      const r = await fetch(`${base}/api/v1/public/products/${s}/availability`);
      return (await r.json()).data;
    }, [BASE, slug]).catch(() => null)
  : null;
const date = avail?.dates?.[2];
await api.close();

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  // Pre-set the branch cookie so we see the real, selected-branch experience.
  await context.addCookies([
    { name: "rs_branch", value: "branch-one", url: BASE },
  ]);
  const page = await context.newPage();

  for (const [label, rawPath] of PAGES) {
    let path = rawPath;
    if (path === "__DRESS__") path = slug ? `/dresses/${slug}` : null;
    if (path === "__BOOK__") path = slug && date ? `/book/${slug}?date=${date}` : null;
    if (!path) continue;

    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(600);

      // --- Automated layout checks --------------------------------------
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const overflowX = doc.scrollWidth - doc.clientWidth;

        // Elements sticking out past the right edge of the viewport.
        const wide = [];
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.right > window.innerWidth + 2 || r.left < -2) {
            wide.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className?.toString?.() ?? "").slice(0, 70),
              left: Math.round(r.left),
              right: Math.round(r.right),
            });
          }
        }

        // Touch targets that are too small to hit reliably.
        const small = [];
        for (const el of document.querySelectorAll("a,button,input,select,textarea")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.height < 40) {
            small.push({
              tag: el.tagName.toLowerCase(),
              text: (el.textContent ?? "").trim().slice(0, 30),
              h: Math.round(r.height),
            });
          }
        }

        return {
          overflowX,
          wide: wide.slice(0, 6),
          small: small.slice(0, 6),
          scrollHeight: doc.scrollHeight,
        };
      });

      if (metrics.overflowX > 1) {
        problems.push(`[${vp.name}] ${label}: horizontal overflow ${metrics.overflowX}px`);
        for (const w of metrics.wide) {
          problems.push(`    overflowing: <${w.tag}> right=${w.right} "${w.cls}"`);
        }
      }
      if (vp.name === "mobile" && metrics.small.length) {
        for (const s of metrics.small) {
          problems.push(`[${vp.name}] ${label}: small target <${s.tag}> ${s.h}px "${s.text}"`);
        }
      }

      await page.screenshot({
        path: `${OUT}/${vp.name}-${label}.png`,
        fullPage: false,
      });
    } catch (error) {
      problems.push(`[${vp.name}] ${label}: FAILED — ${error.message.split("\n")[0]}`);
    }
  }
  await context.close();
}

await browser.close();

console.log("\n=== LAYOUT PROBLEMS ===");
console.log(problems.length ? problems.join("\n") : "none detected");
fs.writeFileSync(`${OUT}/report.txt`, problems.join("\n"));
