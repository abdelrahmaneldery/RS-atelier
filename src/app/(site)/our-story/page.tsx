import type { Metadata } from "next";

import { SITE, WHY_RS } from "@/config/site";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { getT } from "@/lib/i18n/server";
import { toParagraphs } from "@/components/content/policy-page";
import { ASPECT, EDITORIAL_IMAGES, IMAGE_SIZES } from "@/config/media";
import { AtelierImage } from "@/components/ui/atelier-image";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Our Story",
  description: `${SITE.name} — an Egyptian occasion-wear rental atelier established in ${SITE.establishedYear}.`,
  alternates: { canonical: "/our-story" },
};

/**
 * Deliberately restrained. No founder biography, awards, press mentions or
 * client statistics are invented — only what is verifiably true of the brand
 * plus whatever the atelier chooses to publish in settings.
 */
export default async function OurStoryPage() {
  const [story, t] = await Promise.all([
    getSetting(SETTING_KEYS.storyBody),
    getT(),
  ]);
  const paragraphs = toParagraphs(story.value);

  return (
    <>
      <Container size="narrow" className="py-14 lg:py-20">
        <Eyebrow gold>{t("story.established", { year: SITE.establishedYear })}</Eyebrow>
        <SectionHeading
          headingLevel="h1"
          title={t("story.title")}
          lede={t("story.lede", { name: SITE.name })}
          className="mt-5"
        />

        {paragraphs.length > 0 ? (
          <div className="mt-10 space-y-5">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="max-w-[68ch] leading-relaxed text-charcoal">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <div className="mt-10 space-y-5 text-charcoal">
            <p className="max-w-[68ch] leading-relaxed">
              {t("story.para1", { year: SITE.establishedYear })}
            </p>
            <p className="max-w-[68ch] leading-relaxed">{t("story.para2")}</p>
            <p className="max-w-[68ch] leading-relaxed">{t("story.para3")}</p>
          </div>
        )}
      </Container>

      <section className="border-y border-line bg-ivory-deep py-14 lg:py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <AtelierImage
              src={EDITORIAL_IMAGES.story}
              alt="The RS atelier interior"
              aspect={ASPECT.editorial}
              sizes={IMAGE_SIZES.hero}
              colour="champagne"
              zoomOnHover={false}
            />
          </Reveal>
          <Reveal delay={80}>
            <h2 className="font-display text-3xl text-ink">{t("story.howWeWork")}</h2>
            <dl className="mt-8 space-y-6">
              {WHY_RS.map((item) => (
                <div key={item.icon}>
                  <dt className="font-display text-xl text-ink">
                    {t(`whyRs.${item.icon}.title`)}
                  </dt>
                  <dd className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-stone">
                    {t(`whyRs.${item.icon}.body`)}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
