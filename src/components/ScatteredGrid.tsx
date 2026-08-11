"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { Carousel } from "@/components/Carousel";
import { ProjectCard } from "@/components/ProjectCard";
import { FramesModal, ProjectShowcase } from "@/components/ProjectShowcase";
import { Lightbox } from "@/components/Lightbox";
import { FEATURED_PROJECT, FILTERS, SECONDARY_PROJECTS, type FilterId } from "@/lib/projects";
import { AWARD } from "@/lib/site";

export function ScatteredGrid() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visibleProjects = useMemo(
    () =>
      filter === "all" ? SECONDARY_PROJECTS : SECONDARY_PROJECTS.filter((p) => p.category === filter),
    [filter],
  );

  // One entry per image, so the viewer can page through everything currently
  // shown, in display order.
  const cards = useMemo(
    () =>
      visibleProjects.flatMap((project) =>
        project.images.map((image) => ({
          image,
          title: project.title,
          meta: [project.meta.discipline, project.meta.location].filter(Boolean).join("  |  "),
          key: `${project.slug}-${image.id}`,
        })),
      ),
    [visibleProjects],
  );

  // The featured project now owns its own viewer through `FramesModal`, so this
  // component's lightbox only ever paginates the carousel set.
  return (
    <section id="work" className="relative bg-navy py-(--spacing-section)">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Selected Work"
          title="Spaces we have shaped"
        />

        <div className="mt-10 h-px w-full gold-line-animated" />

        <div className="mt-6 sm:mt-8">
          {FEATURED_PROJECT ? (
            <FeaturedProject />
          ) : (
            <PlaceholderPanel label="Featured project imagery is not available yet" />
          )}
        </div>
      </div>

      {/* The carousel bleeds to the right edge so slides run off screen rather than
          stopping at the container, which reads as a continuous reel. */}
      <div className="mt-24 sm:mt-32">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-wrap items-center gap-2 sm:gap-3">
            {FILTERS.map((option) => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  aria-pressed={active}
                  className={`min-h-[44px] cursor-pointer rounded-full px-6 text-[0.65rem] font-medium tracking-[0.2em] uppercase transition-colors duration-300 sm:text-xs ${
                    active
                      ? "bg-gold text-navy-deep"
                      : "border border-ivory/25 text-ivory/70 hover:border-gold/60 hover:text-gold"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
            <PlaceholderPanel label="No projects in this category yet" />
          </div>
        ) : (
          <div className="pl-5 sm:pl-8 lg:pl-12">
            <Carousel
              // Remounts on filter change so measurement and offset reset cleanly
              // instead of inheriting the previous set's width.
              key={filter}
              ariaLabel={`${FILTERS.find((f) => f.id === filter)?.label ?? "Projects"} carousel`}
              itemClassName="w-[78vw] sm:w-[46vw] lg:w-[32vw] xl:w-[25vw]"
              className="pr-5 sm:pr-8 lg:pr-12"
            >
              {cards.map((card, index) => (
                <ProjectCard
                  key={card.key}
                  image={card.image}
                  title={card.title}
                  meta={card.meta}
                  index={index}
                  // Uniform 4:5 keeps the reel's baseline steady; mixed portrait and
                  // landscape ratios would make the track height jump on every wrap.
                  aspect={4 / 5}
                  reveal={false}
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 25vw"
                  onOpen={() => setLightboxIndex(index)}
                />
              ))}
            </Carousel>
          </div>
        )}
      </div>

      <Lightbox
        items={cards}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </section>
  );
}

function FeaturedProject() {
  const project = FEATURED_PROJECT;
  const [framesOpen, setFramesOpen] = useState(false);

  if (!project) return null;

  const meta = [project.meta.discipline, project.meta.location, project.meta.year]
    .filter(Boolean)
    .join("  |  ");

  return (
    <div className="mt-16 sm:mt-20">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16"
      >
        <div>
          <h3 className="mt-5 font-display text-[clamp(1.9rem,5vw,3.5rem)] leading-tight text-ivory">
            {project.title}
          </h3>
          <p className="mt-2 text-[0.65rem] tracking-[0.22em] text-gold/80 uppercase">{meta}</p>
        </div>

        {project.meta.narrative && (
          <div className="flex max-w-md flex-col items-start gap-5">
            {/* The award seal sits directly above the project narrative. */}
            <div className="relative size-[104px] shrink-0 sm:size-[124px]">
              <div className="absolute inset-0 -z-10 scale-125 rounded-full bg-[radial-gradient(circle,rgba(235,199,29,0.22),transparent_70%)] blur-lg" />
              <Image
                src={AWARD.seal}
                alt={`${AWARD.title} ${AWARD.year}`}
                fill
                sizes="124px"
                className="object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
              />
            </div>

            <p className="text-sm leading-relaxed text-ivory/70 sm:text-base">{project.meta.narrative}</p>
          </div>
        )}
      </motion.div>

      <ProjectShowcase
        images={project.images}
        title={project.title}
        meta={meta}
        onViewAll={() => setFramesOpen(true)}
      />

      <FramesModal
        open={framesOpen}
        onClose={() => setFramesOpen(false)}
        title={project.title}
        subtitle={meta}
        images={project.images}
      />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-3xl"
    >
      <p className="text-[0.62rem] font-medium tracking-[0.3em] text-gold uppercase sm:text-[0.68rem]">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-[clamp(2rem,6vw,4.25rem)] leading-[1.05] text-ivory whitespace-nowrap">
        {title}
      </h2>
      {copy && <p className="mt-5 text-base leading-relaxed text-ivory/65 sm:text-lg">{copy}</p>}
    </motion.div>
  );
}

/** Graceful fallback when an asset folder is empty or a path needs adjusting. */
function PlaceholderPanel({ label }: { label: string }) {
  return (
    <div className="mt-10 flex min-h-[280px] items-center justify-center rounded-[3px] border border-dashed border-ivory/20 bg-charcoal/40 px-6 text-center">
      <p className="text-sm tracking-[0.14em] text-ivory/45 uppercase">{label}</p>
    </div>
  );
}
