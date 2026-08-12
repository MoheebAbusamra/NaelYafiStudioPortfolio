"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { SectionHeading } from "@/components/ScatteredGrid";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SECONDARY_PROJECTS, type Project } from "@/lib/projects";

/**
 * Dual swipeable portfolio decks: "Interiors" fanning left, "Exteriors" fanning
 * right. Side by side on desktop, stacked into a single column on mobile.
 *
 * Each deck renders its project covers as a physical stack of cards. The top card
 * is flat and draggable; the cards behind tilt angularly toward the deck's outer
 * edge with scale decay and opacity falloff. Tossing the top card off screen
 * springs it away and promotes the next card, while the tossed card re-enters at
 * the back of the fan. Arrow buttons below each deck offer the same navigation
 * without a gesture, which keeps the decks usable with a keyboard.
 */

type DeckCard = {
  key: string;
  title: string;
  meta: string;
  image: Project["cover"];
};

/** How many cards of the fan are rendered behind the top card. */
const VISIBLE = 4;

/** Horizontal drag distance (px) past which a release counts as a toss. */
const SWIPE_DISTANCE = 90;

/** Fling velocity (px/s) past which a release counts as a toss regardless of distance. */
const SWIPE_VELOCITY = 500;

const projectToCard = (project: Project): DeckCard => ({
  key: project.slug,
  title: project.title,
  meta: [project.meta.discipline, project.meta.location].filter(Boolean).join("  |  "),
  image: project.cover,
});

export function DualPortfolioDecks() {
  const interiors = useMemo(
    () => SECONDARY_PROJECTS.filter((p) => p.category === "interiors").map(projectToCard),
    [],
  );
  const exteriors = useMemo(
    () => SECONDARY_PROJECTS.filter((p) => p.category === "exteriors").map(projectToCard),
    [],
  );

  if (interiors.length === 0 && exteriors.length === 0) return null;

  return (
    <section id="decks" className="relative bg-navy py-(--spacing-section)">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <SectionHeading eyebrow="The Collection" title="Two decks, one studio" />

        <div className="mt-10 h-px w-full gold-line-animated" />

        {/*
          Two columns from `md:` up, a single stacked column below. Generous gap on
          mobile so the fans of the two decks can never visually collide.
        */}
        <div className="mt-14 grid gap-20 sm:mt-16 md:grid-cols-2 md:gap-10 lg:gap-16">
          {interiors.length > 0 && <Deck label="Interiors" cards={interiors} dir={-1} />}
          {exteriors.length > 0 && <Deck label="Exteriors" cards={exteriors} dir={1} />}
        </div>
      </div>
    </section>
  );
}

/**
 * One self-contained deck.
 *
 * `dir` is the fan direction: -1 fans the behind cards toward the left edge,
 * +1 toward the right. State is just the display order of card indices; a swipe
 * or "next" moves the front card to the back, "previous" pulls the back card
 * forward. Cards are never removed, so the deck loops endlessly.
 */
function Deck({ label, cards, dir }: { label: string; cards: DeckCard[]; dir: 1 | -1 }) {
  const reducedMotion = useReducedMotion();
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  // Non-null while the top card is flying off screen; holds the fling direction.
  const [flying, setFlying] = useState<1 | -1 | null>(null);

  const advance = useCallback(() => {
    setOrder(([first, ...rest]) => [...rest, first]);
    setFlying(null);
  }, []);

  const retreat = useCallback(() => {
    // Ignore while a toss is mid flight, so the order cannot double shift.
    setFlying((current) => {
      if (current === null) {
        setOrder((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
      }
      return current;
    });
  }, []);

  const fling = useCallback(
    (direction: 1 | -1) => {
      if (reducedMotion) {
        // Skip the flight entirely; the stack re-fans in place.
        setOrder(([first, ...rest]) => [...rest, first]);
        return;
      }
      setFlying((current) => current ?? direction);
    },
    [reducedMotion],
  );

  const visible = order.slice(0, Math.min(VISIBLE, cards.length));
  const topIndex = order[0];

  return (
    <div>
      <div className="mb-8 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl text-ivory sm:text-3xl">{label}</h3>
        <p className="text-[0.6rem] tracking-[0.24em] text-gold/80 uppercase" aria-live="polite">
          {topIndex + 1} / {cards.length}
        </p>
      </div>

      {/*
        The stage. `touch-action: pan-y` lets the browser keep vertical page
        scrolling while the horizontal axis belongs to the drag gesture, so the
        deck never traps a visitor mid scroll on iOS or Android.

        Horizontal padding gives the fan room to spread without clipping, and
        `perspective-card` matches the 3D context the rest of the site's cards use.
      */}
      <div
        className="perspective-card relative mx-auto w-full max-w-[420px] px-6 sm:px-8"
        style={{ touchAction: "pan-y" }}
      >
        <div className="relative aspect-[4/5]">
          {visible.map((cardIndex, depth) => (
            <StackCard
              key={cards[cardIndex].key}
              card={cards[cardIndex]}
              depth={depth}
              dir={dir}
              isTop={depth === 0}
              flyDir={depth === 0 ? flying : null}
              onFling={fling}
              onFlyComplete={advance}
              deckLabel={label}
              position={cardIndex + 1}
              total={cards.length}
            />
          ))}
        </div>
      </div>

      {/* Manual fallback for visitors who cannot, or would rather not, swipe. */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={retreat}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-ivory/25 text-ivory/80 transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-navy-deep"
          aria-label={`Previous ${label.toLowerCase()} project`}
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
        </button>

        <button
          type="button"
          onClick={() => fling(dir)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-ivory/25 text-ivory/80 transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-navy-deep"
          aria-label={`Next ${label.toLowerCase()} project`}
        >
          <ArrowRight className="size-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

/** Fan geometry for a card at a given depth behind the top. */
const fanPose = (depth: number, dir: 1 | -1) => ({
  x: dir * depth * 22,
  y: depth * -6,
  rotate: dir * depth * 5.5,
  scale: 1 - depth * 0.055,
  // The deepest visible card fades toward nothing so new arrivals resolve in
  // rather than popping into existence at full strength.
  opacity: Math.max(0, 1 - depth * 0.2),
});

function StackCard({
  card,
  depth,
  dir,
  isTop,
  flyDir,
  onFling,
  onFlyComplete,
  deckLabel,
  position,
  total,
}: {
  card: DeckCard;
  depth: number;
  dir: 1 | -1;
  isTop: boolean;
  flyDir: 1 | -1 | null;
  onFling: (direction: 1 | -1) => void;
  onFlyComplete: () => void;
  deckLabel: string;
  position: number;
  total: number;
}) {
  const reducedMotion = useReducedMotion();

  /*
    The drag writes into this motion value; the tilt while dragging derives from
    it. The fan / fly `animate` targets drive the same value, so drag offset and
    the resting pose can never fight over the card's transform.
  */
  const x = useMotionValue(0);
  const dragTilt = useTransform(x, [-240, 240], [-12, 12]);

  const onDragEnd = useCallback(
    (_event: PointerEvent, info: PanInfo) => {
      const distance = info.offset.x;
      const velocity = info.velocity.x;
      if (Math.abs(distance) > SWIPE_DISTANCE || Math.abs(velocity) > SWIPE_VELOCITY) {
        onFling((Math.sign(distance || velocity) || dir) as 1 | -1);
      }
      // Below threshold, `dragSnapToOrigin` springs the card home on its own.
    },
    [onFling, dir],
  );

  const pose =
    flyDir !== null
      ? {
          x: flyDir * 620,
          y: -40,
          rotate: flyDir * 24,
          scale: 1,
          opacity: 0,
        }
      : fanPose(depth, dir);

  return (
    <motion.div
      // New cards mount as if arriving from the very back of the fan.
      initial={reducedMotion ? false : { ...fanPose(VISIBLE, dir), opacity: 0 }}
      animate={pose}
      transition={
        flyDir !== null
          ? { type: "spring", stiffness: 240, damping: 26 }
          : { type: "spring", stiffness: 300, damping: 30 }
      }
      onAnimationComplete={() => {
        if (flyDir !== null && isTop) onFlyComplete();
      }}
      drag={isTop && flyDir === null ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.65}
      onDragEnd={onDragEnd}
      style={{ x, zIndex: VISIBLE + 1 - depth, touchAction: "pan-y" }}
      className={`absolute inset-0 ${isTop && flyDir === null ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}
      aria-hidden={!isTop}
    >
      {/* Drag tilt lives one level in so it composes with, rather than
          overwrites, the fan rotation on the outer wrapper. */}
      <motion.div
        style={{ rotate: isTop ? dragTilt : 0 }}
        className="relative size-full overflow-hidden rounded-[4px] bg-charcoal shadow-[0_28px_60px_rgba(0,0,0,0.55)] ring-1 ring-gold/25"
      >
        <Image
          src={card.image.card}
          alt={isTop ? `${card.title}, ${deckLabel} project ${position} of ${total}` : ""}
          fill
          sizes="(max-width: 640px) 88vw, 420px"
          placeholder="blur"
          blurDataURL={card.image.blurDataURL}
          draggable={false}
          className="object-cover select-none"
        />

        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy-deep/10 to-transparent" />

        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5">
          <span className="truncate font-display text-lg text-ivory sm:text-xl">{card.title}</span>
          <span className="truncate text-[0.55rem] tracking-[0.2em] text-gold/85 uppercase sm:text-[0.62rem]">
            {card.meta}
          </span>
        </span>
      </motion.div>
    </motion.div>
  );
}
