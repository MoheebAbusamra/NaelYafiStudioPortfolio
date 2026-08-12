"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";

import { Carousel } from "@/components/Carousel";
import { ProjectCard } from "@/components/ProjectCard";
import { Lightbox, type LightboxItem } from "@/components/Lightbox";
import {
  FILTERS,
  SECONDARY_PROJECTS,
  type FilterId,
  type GalleryImage,
} from "@/lib/projects";

export function WorkCategorySlider() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [allFramesOpen, setAllFramesOpen] = useState(false);

  const visibleProjects = useMemo(
    () =>
      filter === "all"
        ? SECONDARY_PROJECTS
        : SECONDARY_PROJECTS.filter((p) => p.category === filter),
    [filter],
  );

  // Cards for the active filter category carousel
  const carouselCards = useMemo(
    () =>
      visibleProjects.flatMap((project) =>
        project.images.map((image) => ({
          image,
          title: project.title,
          key: `${project.slug}-${image.id}`,
        })),
      ),
    [visibleProjects],
  );

  // Interior + Exterior frames across the portfolio (excluding Oakville residence) for the full-screen modal
  const allPortfolioImages = useMemo(() => {
    return SECONDARY_PROJECTS.flatMap((project) =>
      project.images.map((image) => ({
        image,
        projectTitle: project.title,
        category: project.category,
      })),
    );
  }, []);

  return (
    <div className="relative py-12">
      {/* Category Filter Pills */}
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <div className="mb-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {FILTERS.map((option) => {
            const active = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                aria-pressed={active}
                className={`min-h-[44px] cursor-pointer rounded-full px-7 text-[0.65rem] font-medium tracking-[0.22em] uppercase transition-colors duration-300 sm:text-xs ${
                  active
                    ? "bg-gold text-navy-deep font-semibold shadow-[0_0_20px_rgba(235,199,29,0.35)]"
                    : "border border-ivory/25 text-ivory/70 hover:border-gold/60 hover:text-gold"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Carousel Reel */}
      {carouselCards.length === 0 ? (
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <div className="flex min-h-[280px] items-center justify-center rounded-[3px] border border-dashed border-ivory/20 bg-charcoal/40 px-6 text-center">
            <p className="text-sm tracking-[0.14em] text-ivory/45 uppercase">
              No projects in this category yet
            </p>
          </div>
        </div>
      ) : (
        <div className="pl-5 sm:pl-8 lg:pl-12">
          <Carousel
            key={filter}
            ariaLabel={`${FILTERS.find((f) => f.id === filter)?.label ?? "Projects"} carousel`}
            itemClassName="w-[78vw] sm:w-[46vw] lg:w-[32vw] xl:w-[25vw]"
            className="pr-5 sm:pr-8 lg:pr-12"
          >
            {carouselCards.map((card, index) => (
              <ProjectCard
                key={card.key}
                image={card.image}
                title={card.title}
                index={index}
                aspect={4 / 5}
                reveal={false}
                sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 25vw"
                onOpen={() => setLightboxIndex(index)}
              />
            ))}
          </Carousel>
        </div>
      )}

      {/* View All Frames Action Button */}
      <div className="mt-12 flex items-center justify-center px-5">
        <button
          type="button"
          onClick={() => setAllFramesOpen(true)}
          className="group relative inline-flex min-h-[50px] cursor-pointer items-center justify-center overflow-hidden rounded-full border border-gold bg-navy-deep/80 px-8 py-3.5 text-xs font-medium tracking-[0.24em] text-gold uppercase transition-all duration-300 hover:bg-gold hover:text-navy-deep hover:shadow-[0_0_25px_rgba(235,199,29,0.4)]"
        >
          <span className="relative z-10 flex items-center gap-2">
            View All Frames
          </span>
        </button>
      </div>

      {/* Lightbox for Carousel Items */}
      <Lightbox
        items={carouselCards}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />

      {/* Full-screen Modal Lightbox Gallery for All Frames */}
      <AllFramesModal
        open={allFramesOpen}
        onClose={() => setAllFramesOpen(false)}
        items={allPortfolioImages}
      />
    </div>
  );
}

/**
 * Full-screen magazine grid modal displaying all interior and exterior project images.
 */
function AllFramesModal({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: { image: GalleryImage; projectTitle: string; category: string }[];
}) {
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  const lightboxItems: LightboxItem[] = useMemo(
    () =>
      items.map((item) => ({
        image: item.image,
        title: item.projectTitle,
        meta: item.category.toUpperCase(),
      })),
    [items],
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && zoomIndex === null) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, zoomIndex]);

  useEffect(() => {
    if (!open) setZoomIndex(null);
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[85] overflow-y-auto overscroll-contain bg-navy-deep"
            role="dialog"
            aria-modal="true"
            aria-label="All Portfolio Frames"
          >
            {/* Sticky Masthead */}
            <div className="sticky top-0 z-10 border-b border-ivory/10 bg-navy-deep/92 backdrop-blur-md">
              <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
                <div className="min-w-0">
                  <p className="text-[0.58rem] tracking-[0.3em] text-gold uppercase">
                    Complete Archive
                  </p>
                  <h2 className="mt-1 truncate font-display text-xl text-ivory sm:text-2xl">
                    All Interior & Exterior Frames
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-gold hover:bg-gold hover:text-navy-deep"
                  aria-label="Close gallery"
                  autoFocus
                >
                  <X className="size-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Masonry Image Grid */}
            <div className="mx-auto max-w-[1700px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
              <div className="columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3 xl:columns-4">
                {items.map((item, index) => (
                  <motion.button
                    key={`${item.image.id}-${index}`}
                    type="button"
                    onClick={() => setZoomIndex(index)}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.55,
                      delay: Math.min(index * 0.025, 0.6),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group relative mb-4 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-[3px] bg-charcoal text-left sm:mb-5"
                    aria-label={`Open frame ${index + 1} of ${items.length}`}
                  >
                    <Image
                      src={item.image.card}
                      alt={`${item.projectTitle}, frame ${index + 1}`}
                      width={item.image.width}
                      height={item.image.height}
                      loading="lazy"
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, (max-width: 1280px) 31vw, 24vw"
                      placeholder="blur"
                      blurDataURL={item.image.blurDataURL}
                      draggable={false}
                      className="h-auto w-full object-cover transition-transform duration-[850ms] ease-[var(--ease-luxe)] select-none group-hover:scale-[1.03]"
                    />

                    {/* Gradient Overlay & Metadata on Hover */}
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy-deep/20 to-transparent opacity-0 transition-opacity duration-400 group-hover:opacity-100" />

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 opacity-0 transition-opacity duration-400 group-hover:opacity-100">
                      <p className="text-[0.55rem] tracking-[0.25em] text-gold uppercase">
                        {item.projectTitle}
                      </p>
                    </div>

                    <span className="pointer-events-none absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-gold/50 bg-navy-deep/70 text-gold opacity-0 transition-opacity duration-400 group-hover:opacity-100">
                      <Maximize2 className="size-4" strokeWidth={1.5} />
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Lightbox
        items={lightboxItems}
        index={zoomIndex}
        onClose={() => setZoomIndex(null)}
        onNavigate={setZoomIndex}
      />
    </>
  );
}
