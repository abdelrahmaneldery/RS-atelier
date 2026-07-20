"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { selectBranch } from "@/app/(site)/branch-actions";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Shown when a customer opens a gown belonging to a branch other than the one
 * they are exploring — typically from a shared link or the browser's history.
 *
 * The gown is not hidden, because it is a real piece they asked to see. What is
 * refused is quietly folding it into the wrong branch's context: they either
 * move their selection across, or go back to their own wardrobe.
 */
export function CrossBranchNotice({
  productBranchName,
  productBranchSlug,
  selectedBranchName,
  selectedBranchSlug,
}: {
  productBranchName: string;
  productBranchSlug: string;
  selectedBranchName: string;
  selectedBranchSlug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchBranch() {
    startTransition(async () => {
      await selectBranch(productBranchSlug);
      router.refresh();
    });
  }

  return (
    <div className="mb-8 border border-warning/35 bg-warning-soft px-5 py-5">
      <p className="text-sm leading-relaxed text-warning">
        This gown is held at{" "}
        <strong className="font-medium">{productBranchName}</strong>, but you are
        exploring <strong className="font-medium">{selectedBranchName}</strong>.
        It can only be collected from {productBranchName}.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button type="button" size="sm" onClick={switchBranch} disabled={pending}>
          {pending ? "Switching…" : `Explore ${productBranchName} Instead`}
        </Button>
        <ButtonLink
          href={`/branches/${selectedBranchSlug}`}
          variant="secondary"
          size="sm"
        >
          Back to {selectedBranchName}
        </ButtonLink>
      </div>
    </div>
  );
}
