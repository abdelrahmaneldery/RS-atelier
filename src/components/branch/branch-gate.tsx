"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";

import { fadeUp, overlayFade } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { branchImage } from "@/config/media";
import type { ApiBranch } from "@/lib/api/contract";
import { dismissBranchGate, selectBranch } from "@/app/(site)/branch-actions";

/**
 * First-visit branch chooser.
 *
 * Every gown belongs to exactly one branch, so the site cannot show a coherent
 * catalogue until one is chosen. This is rendered only when no branch cookie is
 * present, so a returning customer never sees it — and because that decision is
 * made on the server, it never flashes.
 *
 * It can be dismissed for the session, but the catalogue stays gated: pages
 * that need a branch ask for one inline rather than merging every branch's
 * stock into a single misleading list.
 */
export function BranchGate({ branches }: { branches: ApiBranch[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choosing, setChoosing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // The server only renders this component when a choice is still needed, so it
  // starts open and closes on interaction.
  const [closed, setClosed] = useState(false);
  const open = !closed && !chosen && branches.length > 0;

  const dismiss = useCallback(() => {
    setClosed(true);
    // Remembered for the session so it is not asked again on every page.
    void dismissBranchGate();
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  function choose(slug: string) {
    setChoosing(slug);
    setError(null);
    startTransition(async () => {
      const result = await selectBranch(slug);
      if (!result.ok) {
        setError(result.error);
        setChoosing(null);
        return;
      }
      setChosen(true);
      router.push(`/branches/${result.slug}`);
      router.refresh();
    });
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="branch-gate"
          variants={overlayFade}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-[90] overflow-y-auto bg-ink/92 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="branch-gate-title"
        >
          <motion.div
            variants={fadeUp}
            ref={panelRef}
            tabIndex={-1}
            className="mx-auto flex min-h-full w-full max-w-[1200px] flex-col justify-center px-5 py-14 focus:outline-none sm:px-8 lg:py-20"
          >
        <header className="text-center">
          <p className="eyebrow text-gold-soft">Rawan Samir Atelier</p>
          <h2
            id="branch-gate-title"
            className="mt-5 font-display text-[2rem] font-light leading-tight text-ivory sm:text-[2.75rem]"
          >
            Which RS branch would you like to explore?
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-sm leading-relaxed text-ivory/65">
            Every gown is a single piece held at one branch and collected there.
            Choose where you would like to visit, and we will show you its
            wardrobe.
          </p>
        </header>

        {error ? (
          <p
            role="alert"
            className="mx-auto mt-8 max-w-md border-l-2 border-danger bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}

        <ul
          className={cn(
            "mt-12 grid gap-6",
            branches.length === 1
              ? "mx-auto max-w-sm"
              : branches.length === 2
                ? "mx-auto max-w-3xl sm:grid-cols-2"
                : "sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {branches.map((branch, index) => {
            const isChoosing = choosing === branch.slug;
            return (
              <li key={branch.id}>
                <article className="group flex h-full flex-col border border-ivory/15 bg-ink/40 transition-colors duration-300 hover:border-gold/50">
                  <div className="relative aspect-[4/3] overflow-hidden bg-charcoal">
                    <Image
                      src={branchImage(index)}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                      className="object-cover opacity-80 transition-[opacity,transform] duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-2xl text-ivory">
                      {branch.name}
                    </h3>

                    {branch.location ? (
                      <p className="mt-2 text-sm leading-relaxed text-ivory/60">
                        {branch.location}
                        {branch.country ? `, ${branch.country}` : ""}
                      </p>
                    ) : branch.country ? (
                      <p className="mt-2 text-sm text-ivory/60">{branch.country}</p>
                    ) : (
                      /* Location is a real business fact and is not invented. */
                      <p className="mt-2 text-sm italic text-ivory/35">
                        Location to be published
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => choose(branch.slug)}
                      disabled={pending}
                      className={cn(
                        "mt-7 inline-flex min-h-12 w-full items-center justify-center border px-6 py-3",
                        "font-sans text-xs font-medium uppercase tracking-[0.14em] transition-colors duration-200",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                        isChoosing
                          ? "border-gold bg-gold text-white"
                          : "border-ivory/40 text-ivory hover:border-gold hover:bg-gold hover:text-white",
                      )}
                    >
                      {isChoosing ? "Opening…" : "Explore This Branch"}
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={dismiss}
            className="min-h-11 px-4 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ivory/50 transition-colors hover:text-ivory/80"
          >
            I&rsquo;ll choose later
          </button>
        </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
