import type { Metadata } from "next";

import { SITE, WHY_RS } from "@/config/site";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
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
  const story = await getSetting(SETTING_KEYS.storyBody);
  const paragraphs = toParagraphs(story.value);

  return (
    <>
      <Container size="narrow" className="py-14 lg:py-20">
        <Eyebrow gold>Established {SITE.establishedYear}</Eyebrow>
        <SectionHeading
          headingLevel="h1"
          title="Our Story"
          lede={`${SITE.name} is an Egyptian atelier renting occasion wear from its own branches.`}
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
              RS began in {SITE.establishedYear} with a simple conviction: that
              the right dress for an important evening should not have to be
              bought, kept, and worn once.
            </p>
            <p className="max-w-[68ch] leading-relaxed">
              Every piece in the wardrobe is a single garment. Nothing is
              duplicated, nothing is mass-ordered, and each gown carries its own
              reference and its own history of wear and repair. When a dress is
              yours for a night, it is yours alone.
            </p>
            <p className="max-w-[68ch] leading-relaxed">
              That is also why we are honest about condition. Each gown shows
              its condition band openly, because a piece that has been loved
              several times is not the same as one that has never left the rail
              — and you deserve to know which you are collecting.
            </p>
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
            <h2 className="font-display text-3xl text-ink">How we work</h2>
            <dl className="mt-8 space-y-6">
              {WHY_RS.map((item) => (
                <div key={item.title}>
                  <dt className="font-display text-xl text-ink">{item.title}</dt>
                  <dd className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-stone">
                    {item.body}
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
