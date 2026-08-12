"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { useMagneticTilt } from "@/hooks/use-magnetic-tilt";
import type { GalleryImage } from "@/lib/projects";

/**
 * A single portfolio card.
 *
 * Two effects combine here:
 *  - Grayscale at rest, full colour on hover, so a set of cards reads as one
 *    composition until the visitor commits attention to a single image.
 *  - Magnetic 3D tilt following the pointer, shared with the hero illustration
 *    through `useMagneticTilt` so both surfaces move with the same physics.
 */
export function ProjectCard({
  image,
  title,
  priority = false,
  sizes,
  className = "",
  onOpen,
  index,
  aspect,
  reveal = true,
}: {
  image: GalleryImage;
  title: string;
  priority?: boolean;
  sizes: string;
  className?: string;
  onOpen: () => void;
  index: number;
  /** Forces a uniform ratio. Without it the card follows the image's own ratio. */
  aspect?: number;
  /**
   * Scroll reveal on first entry. Disabled inside the carousel, where slides are
   * translated horizontally and an intersection based reveal would leave the
   * offscreen copies stuck at zero opacity.
   */
  reveal?: boolean;
}) {
  const tilt = useMagneticTilt<HTMLDivElement>();
  const hovered = tilt.hovered;

  const ratio = aspect ?? image.width / image.height;

  const revealProps = reveal
    ? {
        initial: { opacity: 0, y: 48 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: {
          duration: 0.85,
          // Stagger within a row, but cap it so late cards do not feel stalled.
          delay: Math.min(index * 0.06, 0.4),
          ease: [0.22, 1, 0.36, 1] as const,
        },
      }
    : {};

  return (
    <motion.div {...revealProps} className={`perspective-card ${className}`}>
      <div ref={tilt.ref} {...tilt.handlers} className={tilt.className}>
        <button
          type="button"
          onClick={onOpen}
          className="group relative block w-full cursor-pointer overflow-hidden rounded-[3px] bg-charcoal text-left"
          style={{ aspectRatio: `${ratio}` }}
          aria-label={`View ${title}`}
        >
          <Image
            src={image.card}
            alt={title}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes={sizes}
            placeholder="blur"
            blurDataURL={image.blurDataURL}
            // Draggable images hijack pointer gestures inside the carousel.
            draggable={false}
            className={`object-cover transition-[filter,transform] duration-[850ms] ease-[var(--ease-luxe)] select-none ${
              hovered ? "grayscale-0 scale-[1.04]" : "grayscale"
            }`}
          />

          {/* Navy wash that deepens on hover, so the caption stays readable. */}
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy-deep/15 to-transparent transition-opacity duration-500 ${
              hovered ? "opacity-95" : "opacity-55"
            }`}
          />

          {/* Gold hairline that draws in on hover. */}
          <div
            className={`pointer-events-none absolute inset-0 rounded-[3px] ring-1 ring-gold/0 transition-[box-shadow,--tw-ring-color] duration-500 ${
              hovered ? "ring-gold/40" : ""
            }`}
          />
        </button>
      </div>
    </motion.div>
  );
}
