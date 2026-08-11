"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";

import { Lightbox, type LightboxItem } from "@/components/Lightbox";
import { useMagneticTilt } from "@/hooks/use-magnetic-tilt";
import type { GalleryImage } from "@/lib/projects";

/**
 * Full screen "magazine spread" view of every frame in a project.
 *
 * Replaces the single image arrow slider that used to sit behind "View all frames".
 * A visitor evaluating an interior wants to compare details side by side, which a
 * one at a time viewer actively prevents.
 *
 * Layout is a masonry style multi column grid built with CSS columns. Columns are
 * used rather than a grid because the frames mix portrait and landscape, and CSS
 * columns pack mixed heights without leaving the ragged gaps a fixed row grid
 * produces. Clicking any frame opens the existing `Lightbox` at full resolution,
 * so the zoomed view keeps its keyboard and swipe handling instead of a second
 * implementation.
 */
export function FramesModal({
  open,
  onClose,
  title,
  subtitle,
  images,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  images: GalleryImage[];
}) {
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  const items: LightboxItem[] = useMemo(
    () => images.map((image) => ({ image, title, meta: subtitle })),
    [images, title, subtitle],
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
      // While the zoom viewer is open it owns Escape, so the grid only closes once
      // the visitor has stepped back out of the zoom.
      if (event.key === "Escape" && zoomIndex === null) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, zoomIndex]);

  // Reset the zoom when the overlay itself is dismissed.
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
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[85] overflow-y-auto overscroll-contain bg-navy-deep"
            role="dialog"
            aria-modal="true"
            aria-label={`All frames, ${title}`}
          >
            {/* Sticky masthead so the close control is always reachable. */}
            <div className="sticky top-0 z-10 border-b border-ivory/10 bg-navy-deep/92 backdrop-blur-md">
              <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
                <div className="min-w-0">
                  <p className="text-[0.58rem] tracking-[0.3em] text-gold uppercase">
                    {images.length} Frames
                  </p>
                  <h2 className="mt-1 truncate font-display text-xl text-ivory sm:text-2xl">{title}</h2>
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

            <div className="mx-auto max-w-[1700px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
              <div className="columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3 xl:columns-4">
                {images.map((image, index) => (
                  <motion.button
                    key={image.id}
                    type="button"
                    onClick={() => setZoomIndex(index)}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.55,
                      delay: Math.min(index * 0.035, 0.5),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    // `break-inside-avoid` stops a frame being split across columns.
                    className="group relative mb-4 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-[3px] bg-charcoal sm:mb-5"
                    aria-label={`Open frame ${index + 1} of ${images.length}`}
                  >
                    <Image
                      src={image.card}
                      alt={`${title}, frame ${index + 1}`}
                      width={image.width}
                      height={image.height}
                      loading="lazy"
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, (max-width: 1280px) 31vw, 24vw"
                      placeholder="blur"
                      blurDataURL={image.blurDataURL}
                      draggable={false}
                      className="h-auto w-full object-cover transition-transform duration-[850ms] ease-[var(--ease-luxe)] select-none group-hover:scale-[1.03]"
                    />

                    <span className="pointer-events-none absolute inset-0 bg-navy-deep/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <span className="pointer-events-none absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full border border-gold/50 bg-navy-deep/70 text-gold opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <Maximize2 className="size-4" strokeWidth={1.5} />
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reuses the site viewer, so zoom keeps arrow keys, swipe, and Escape. */}
      <Lightbox
        items={items}
        index={zoomIndex}
        onClose={() => setZoomIndex(null)}
        onNavigate={setZoomIndex}
      />
    </>
  );
}

/** How many frames ride the ring. Enough to read as an orbit, few enough to breathe. */
const ORBIT_COUNT = 8;

/**
 * Featured project showcase: a 3D focal frame ringed by an orbiting preview set.
 *
 * Replaces the static image plus horizontal thumbnail strip. The strip presented
 * every frame with equal weight in a row that read as a filmstrip; this puts the
 * chosen frame at the centre of its own small stage and lets the rest of the set
 * circle it, which is the arrangement the award project deserves on the page.
 *
 * The focal frame reuses `useMagneticTilt`, so it leans toward the pointer with the
 * exact physics of the Interior and Exterior cards, and keeps the shared grayscale
 * to colour hover. A slow float underneath the tilt keeps it alive at rest.
 *
 * The orbit itself is CSS: a raked, perspective projected ring whose previews counter
 * rotate to stay upright. No rAF loop and no measurement in JS, so the whole
 * composition runs on the compositor and scales through container queries rather
 * than breakpoints. Geometry and timing live in `globals.css` under `.orbit-stage`.
 *
 * Selecting a preview promotes it to the centre. The ring holds still while the
 * pointer is over the stage or focus is inside it, so nothing has to be chased.
 */
export function ProjectShowcase({
  images,
  title,
  meta,
  onViewAll,
}: {
  images: GalleryImage[];
  title: string;
  meta: string;
  onViewAll: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tilt = useMagneticTilt<HTMLDivElement>();

  /*
    Full colour whenever there is no hover capable pointer. Grayscale is a rest state
    the visitor resolves by hovering, and on a phone there is nothing to hover, so
    leaving the featured frame desaturated would read as a broken image.
  */
  const showColour = tilt.hovered || !tilt.hasHover;

  // Guard against the active index dangling if the image set ever changes.
  const safeIndex = Math.min(activeIndex, images.length - 1);
  const active = images[safeIndex];

  const select = useCallback((index: number) => setActiveIndex(index), []);

  /*
    A fixed slice rides the ring, and the active frame is never removed from it.
    Dropping the promoted frame would change the count, re-space every angle, and
    make the whole orbit jump on each selection.
  */
  const orbit = useMemo(() => images.slice(0, Math.min(ORBIT_COUNT, images.length)), [images]);

  if (!active) return null;

  return (
    <div>
      <div className="orbit-stage relative mx-auto aspect-square w-full max-w-[880px]">
        {/* Gold pool behind the stage so the ring reads as lit from the centre. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(235,199,29,0.14),transparent_68%)] blur-2xl"
        />

        <div className="orbit-plane">
          <div className="orbit-rake">
            <div className="orbit-ring">
              {orbit.map((image, index) => (
                // The angle is set once and inherits down to `.orbit-upright`, which
                // needs the same value to cancel the placement rotation.
                <div
                  key={image.id}
                  className="orbit-slot"
                  style={{ "--orbit-angle": `${(360 / orbit.length) * index}deg` } as CSSProperties}
                >
                  <div className="orbit-counter">
                    <div className="orbit-upright flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => select(index)}
                        aria-pressed={index === safeIndex}
                        aria-label={`Show frame ${index + 1} of ${images.length}`}
                        className={`orbit-thumb group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-[2px] bg-charcoal shadow-[0_18px_36px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-500 ease-[var(--ease-luxe)] hover:scale-[1.06] ${
                          index === safeIndex
                            ? "opacity-100"
                            : "opacity-55 hover:opacity-90"
                        }`}
                      >
                        <Image
                          src={image.card}
                          alt=""
                          fill
                          loading="lazy"
                          sizes="(max-width: 640px) 20vw, 150px"
                          placeholder="blur"
                          blurDataURL={image.blurDataURL}
                          draggable={false}
                          className="object-cover grayscale transition-[filter] duration-500 select-none group-hover:grayscale-0"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Focal frame. Above the ring, so a preview crossing the top tucks behind it. */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="perspective-card pointer-events-auto w-[var(--orbit-hero)]">
            <div ref={tilt.ref} {...tilt.handlers} className={tilt.className}>
              <div className="float-frame">
                <button
                  type="button"
                  onClick={onViewAll}
                  className="group relative block w-full cursor-pointer overflow-hidden rounded-[3px] bg-charcoal text-left shadow-[0_30px_70px_rgba(0,0,0,0.6)] ring-2 ring-gold/50 transition-[ring-color] duration-500"
                  style={{ aspectRatio: "4 / 3" }}
                  aria-label={`View all ${images.length} frames of ${title}`}
                >
                  {/* Cross fade on promotion, so a selection resolves rather than cuts. */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active.id}
                      initial={{ opacity: 0, scale: 1.03 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.99 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={active.full}
                        alt={`${title}, selected frame`}
                        fill
                        priority
                        sizes="(max-width: 640px) 60vw, 520px"
                        placeholder="blur"
                        blurDataURL={active.blurDataURL}
                        draggable={false}
                        className={`object-cover transition-[filter,transform] duration-[850ms] ease-[var(--ease-luxe)] select-none ${
                          showColour ? "grayscale-0" : "grayscale"
                        } ${tilt.hovered ? "scale-[1.04]" : ""}`}
                      />
                    </motion.div>
                  </AnimatePresence>

                  <span
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy-deep/10 to-transparent transition-opacity duration-500 ${
                      tilt.hovered ? "opacity-95" : "opacity-60"
                    }`}
                  />

                  {/* Gold hairline that draws in on hover, matching the portfolio cards. */}
                  <span
                    className={`pointer-events-none absolute inset-0 rounded-[3px] ring-1 transition-[--tw-ring-color] duration-500 ${
                      tilt.hovered ? "ring-gold/45" : "ring-gold/0"
                    }`}
                  />

                  <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
                    <span className="min-w-0">
                      <span className="block truncate font-display text-base text-ivory sm:text-xl">
                        {title}
                      </span>
                      <span className="mt-1 block text-[0.55rem] tracking-[0.2em] text-gold/85 uppercase sm:text-[0.62rem]">
                        Frame {safeIndex + 1} of {images.length}
                      </span>
                    </span>

                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-navy-deep/70 text-gold transition-opacity duration-500 ${
                        tilt.hovered ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <Maximize2 className="size-4" strokeWidth={1.5} />
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 sm:mt-8">
        <p className="text-[0.6rem] tracking-[0.2em] text-gold/80 uppercase sm:text-[0.65rem]">
          {meta}
        </p>

        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-gold/50 bg-navy-deep/60 px-6 text-[0.6rem] font-medium tracking-[0.2em] text-gold uppercase transition-colors duration-300 hover:bg-gold hover:text-navy-deep"
        >
          View all {images.length} frames
        </button>
      </div>
    </div>
  );
}
