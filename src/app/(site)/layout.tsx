import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileCta } from "@/components/layout/mobile-cta";
import { BranchGate } from "@/components/branch/branch-gate";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { api } from "@/lib/api/client";
import { getSelectedBranch, isGateDismissed } from "@/lib/branch-selection";

/**
 * Public site shell.
 *
 * The branch selection is resolved here so the header switcher and the
 * first-visit gate both render from the server — a returning customer never
 * sees the modal flash before it is dismissed.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [announcement, branches, selectedBranch, gateDismissed] =
    await Promise.all([
      getSetting(SETTING_KEYS.announcementText),
      api.branches().catch(() => []),
      getSelectedBranch(),
      isGateDismissed(),
    ]);

  // Rendered on the server only when a choice is genuinely still needed, so the
  // modal never flashes for a returning customer and the page never flashes
  // before the modal appears for a new one.
  const showGate = !selectedBranch && !gateDismissed && branches.length > 0;

  return (
    <>
      <Header
        announcement={announcement.value}
        branches={branches}
        selectedBranch={selectedBranch}
      />
      {/* Bottom padding clears the sticky mobile CTA. */}
      <main id="main" className="flex-1 pb-24 sm:pb-0">
        {children}
      </main>
      <Footer />
      <MobileCta />

      {showGate ? <BranchGate branches={branches} /> : null}
    </>
  );
}
