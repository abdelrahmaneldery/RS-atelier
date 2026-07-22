import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileCta } from "@/components/layout/mobile-cta";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { MotionProvider } from "@/components/ui/motion-provider";
import { SITE } from "@/config/site";
import { SETTING_KEYS, getSetting } from "@/lib/settings";

/**
 * Public site shell for the single RS Atelier store.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [announcement, whatsapp] = await Promise.all([
    getSetting(SETTING_KEYS.announcementText),
    getSetting(SETTING_KEYS.contactWhatsapp),
  ]);

  return (
    <MotionProvider>
      <Header announcement={announcement.value} />
      {/* Bottom padding clears the sticky mobile CTA. */}
      <main id="main" className="flex-1 pb-24 sm:pb-0">
        {children}
      </main>
      <Footer />
      <MobileCta />
      <FloatingWhatsApp
        number={whatsapp.isUnset ? null : whatsapp.value}
        storeName={SITE.shortName}
      />
    </MotionProvider>
  );
}
