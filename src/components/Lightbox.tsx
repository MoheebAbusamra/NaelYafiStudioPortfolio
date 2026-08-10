"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { GalleryImage } from "@/lib/projects";

export type LightboxItem = {
  image: GalleryImage;
  title: string;
  meta?: string;
};

/**
 * Full screen image viewer.
 *
 * Renders the `full` derivative rather than the card variant, keyboard navigable,
 * and traps scroll while open. Rendered from the page root so it is never clipped
 * by a transformed ancestor: any parent with a transform would make `position:
 * fixed` resolve against that parent instead of the viewport, and the cards are
 * transformed constantly.
 */
export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const open = index !== null;
  const current = open ? items[index] : undefined;

  const goPrev = useCallback(() => {
    if (index === null || items.length === 0) return;
    onNavigate((index - 1 + items.length) % items.length);
  }, [index, items.length, onNavigate]);

  const goNext = useCallback(() => {
    if (index === null || items.length === 0) return;
    onNavigate((index + 1) % items.length);
  }, [index, items.length, onNavigate]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, goPrev, goNext]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Horizontal swipe on touch devices, where the arrow buttons are the only
  // other affordance and sit far from the thumbs.
  const [touchStart, setTouchStart] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] flex flex-col bg-navy-deep/97 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          onTouchStart={(e) => setTouchStart(e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            if (touchStart === null) return;
            const delta = (e.changedTouches[0]?.clientX ?? touchStart) - touchStart;
            if (Math.abs(delta) > 60) (delta > 0 ? goPrev : goNext)();
            setTouchStart(null);
          }}
        >
          <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="min-w-0">
              <p className="truncate font-display text-base text-ivory sm:text-lg">{current.title}</p>
              {current.meta && (
                <p className="mt-0.5 truncate text-[0.62rem] tracking-[0.2em] text-gold/70 uppercase">
                  {current.meta}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-gold hover:bg-gold hover:text-navy-deep"
              aria-label="Close viewer"
              autoFocus
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-3 sm:px-16 sm:pb-6">
            {/* Keyed so a new image cross fades instead of popping. */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.image.id}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-full w-full"
              >
                <Image
                  src={current.image.full}
                  alt={current.title}
                  fill
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL={current.image.blurDataURL}
                  className="object-contain"
                />
              </motion.div>
            </AnimatePresence>

            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-1 flex size-11 cursor-pointer items-center justify-center rounded-full border border-ivory/20 bg-navy-deep/60 text-ivory transition-colors hover:border-gold hover:text-gold sm:left-4 sm:size-12"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-1 flex size-11 cursor-pointer items-center justify-center rounded-full border border-ivory/20 bg-navy-deep/60 text-ivory transition-colors hover:border-gold hover:text-gold sm:right-4 sm:size-12"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5" strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>

          {items.length > 1 && (
            <p className="pb-5 text-center text-[0.62rem] tracking-[0.25em] text-ivory/45 uppercase">
              {index + 1} of {items.length}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
