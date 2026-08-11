"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

import { InstagramIcon } from "@/components/icons/SocialIcons";
import { CornerFrame, CrestRule } from "@/components/icons/Ornaments";
import { SectionHeading } from "@/components/ScatteredGrid";
import { ABOUT_BLOCKS, AWARD, SERVICES, SISTER_STUDIO } from "@/lib/site";

/**
 * About and Services as a single editorial split.
 *
 * Three bands: the narrative and the services accordion sit side by side, then the
 * two feature cards run beneath them in their own two column row.
 *
 * The cards are deliberately not nested inside the columns above. The narrative and
 * the accordion are different heights, so a card anchored to the bottom of each
 * column could never line up with its neighbour. Giving them their own grid row is
 * what actually guarantees they sit level.
 */
export function AboutServices() {
  return (
    <section id="about" className="relative bg-navy-soft py-(--spacing-section)">
      {/* Soft tonal break above and below the section. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="About &amp; Services"
          title="A studio built on restraint"
          copy="We design in warm materials and clear proportion, then stay close to the build so what is drawn is what gets made."
        />

        <div className="mt-16 grid gap-14 lg:mt-20 lg:grid-cols-2 lg:gap-20">
          <AboutColumn />
          <ServicesColumn />
        </div>

        <div className="mt-14 grid gap-6 sm:gap-8 md:grid-cols-2 lg:mt-20">
          <AwardCard />
          <SisterStudioCard />
        </div>
      </div>
    </section>
  );
}

function AboutColumn() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-[0.62rem] font-medium tracking-[0.28em] text-gold uppercase">Our Story</p>

      <div className="mt-6 space-y-5">
        {ABOUT_BLOCKS.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h3
                key={index}
                className="pt-5 font-display text-xl text-ivory sm:text-2xl"
              >
                {block.text}
              </h3>
            );
          }

          return (
            <p
              key={index}
              className={`leading-relaxed text-ivory/75 ${
                block.type === "lead" ? "text-lg sm:text-xl sm:leading-relaxed" : "text-base"
              }`}
            >
              {block.text}
            </p>
          );
        })}
      </div>
    </motion.div>
  );
}

function ServicesColumn() {
  // First panel opens by default so the column never reads as an empty list.
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-[0.62rem] font-medium tracking-[0.28em] text-gold uppercase">What We Do</p>

      <div className="mt-6 border-t border-ivory/12">
        {SERVICES.map((service, index) => {
          const open = openIndex === index;
          const panelId = `service-panel-${index}`;
          const buttonId = `service-button-${index}`;

          return (
            <div key={service.title} className="border-b border-ivory/12">
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
                className="group flex w-full cursor-pointer items-start justify-between gap-5 py-5 text-left"
              >
                <span className="min-w-0">
                  <span className="block font-display text-lg leading-snug text-ivory transition-colors group-hover:text-gold sm:text-xl">
                    {service.title}
                  </span>
                  <span className="mt-1.5 block text-sm text-ivory/55">{service.summary}</span>
                </span>

                <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors group-hover:border-gold">
                  {open ? (
                    <Minus className="size-3.5" strokeWidth={1.5} />
                  ) : (
                    <Plus className="size-3.5" strokeWidth={1.5} />
                  )}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-sm leading-relaxed text-ivory/70 sm:text-base">
                      {service.detail}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/**
 * Award Winner card.
 *
 * The corner flourishes are inset 10px and 56px square, so their strokes occupy
 * roughly the outer 60px of each corner. The card carries extra padding on the
 * diagonal the ornaments sit on, which keeps the poster and copy clear of the
 * artwork rather than relying on stacking order to hide a collision.
 */
function AwardCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-full flex-col overflow-hidden rounded-[3px] border border-gold/25 bg-charcoal p-6 pt-14 pb-14 sm:p-8 sm:pt-16 sm:pb-16"
    >
      <CornerFrame opacity="opacity-45" size="size-14" inset={10} />

      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-[2px] sm:w-40">
          <Image
            src={AWARD.poster}
            alt={`${AWARD.title} ${AWARD.year} announcement`}
            fill
            loading="lazy"
            sizes="(max-width: 640px) 90vw, 160px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0">
          <div className="relative mb-4 size-14">
            <Image src={AWARD.seal} alt="" fill sizes="56px" className="object-contain" />
          </div>
          <p className="font-display text-xl text-ivory sm:text-2xl">
            {AWARD.title} {AWARD.year}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ivory/65">{AWARD.blurb}</p>
        </div>
      </div>
    </motion.div>
  );
}

/** Featured callout for the sister rendering studio, with a gold crest divider. */
function SisterStudioCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-full flex-col overflow-hidden rounded-[3px] border border-gold/25 bg-navy p-7 pt-16 pb-14 sm:p-9 sm:pt-20 sm:pb-16"
    >
      <CornerFrame opacity="opacity-45" size="size-14" inset={10} />

      <div className="relative z-10 flex flex-1 flex-col">
        <p className="text-[0.6rem] font-medium tracking-[0.28em] text-gold uppercase">Sister Studio</p>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="font-display text-3xl text-ivory sm:text-4xl">{SISTER_STUDIO.name}</h3>
          <p className="text-[0.65rem] tracking-[0.2em] text-gold/70 uppercase">{SISTER_STUDIO.role}</p>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ivory/75 sm:text-base">{SISTER_STUDIO.blurb}</p>

        <a
          href={SISTER_STUDIO.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex min-h-[48px] w-fit cursor-pointer items-center gap-3 rounded-full border border-gold/40 px-6 text-[0.65rem] font-medium tracking-[0.2em] text-gold uppercase transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-navy-deep"
        >
          <InstagramIcon className="size-4" />
          {SISTER_STUDIO.handle}
        </a>
      </div>

      {/* Centred crest on the bottom border completes the engraved treatment. */}
      <CrestRule className="pointer-events-none absolute inset-x-0 bottom-3 z-0 mx-auto h-[26px] w-[180px] text-gold opacity-30" />
    </motion.div>
  );
}
