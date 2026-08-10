"use client";

import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Horizontal carousel with autoplay, pointer dragging, and arrow controls.
 *
 * Implementation notes:
 *
 * Position is held in a ref and written straight to `transform` inside a single
 * rAF loop. Driving continuous autoplay through React state would re-render the
 * entire track on every frame.
 *
 * The track renders its items three times and wraps position within the width of
 * one copy, which gives a seamless loop in both directions without ever reordering
 * the DOM. Reordering would restart CSS transitions and make `next/image` re-request
 * the swapped nodes.
 *
 * Copy width is measured from the real layout (the offset delta between the first
 * item of copy 0 and copy 1) rather than derived from `scrollWidth / 3`, which is
 * off by a fraction of the flex gap and produces a visible seam on each wrap.
 *
 * Autoplay pauses on hover, on focus within, while dragging, and whenever the
 * carousel is offscreen, so it never burns frames in a background tab.
 */

const AUTOPLAY_PX_PER_SECOND = 34;
const DRAG_THRESHOLD_PX = 6;
const COPIES = 3;

// useLayoutEffect warns during SSR; client components are still server rendered.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Carousel({
  children,
  ariaLabel,
  itemClassName = "",
  className = "",
}: {
  children: React.ReactNode;
  ariaLabel: string;
  /** Width utilities for each slide, e.g. "w-[78vw] sm:w-[46vw]". */
  itemClassName?: string;
  className?: string;
}) {
  const items = useMemo(() => Children.toArray(children), [children]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const offset = useRef(0);
  const copyWidth = useRef(0);
  const rafId = useRef<number | null>(null);
  const lastTime = useRef(0);

  const paused = useRef(false);
  const dragging = useRef(false);
  const dragMoved = useRef(false);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);
  const velocity = useRef(0);

  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [canScroll, setCanScroll] = useState(false);

  /** Wraps the offset into [-copyWidth, 0) so the loop is continuous. */
  const normalize = useCallback((value: number) => {
    const width = copyWidth.current;
    if (width <= 0) return value;
    let next = value % width;
    if (next > 0) next -= width;
    return next;
  }, []);

  const draw = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transform = `translate3d(${offset.current}px, 0, 0)`;
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport || items.length === 0) return;

    const first = track.querySelector<HTMLElement>('[data-slide="0-0"]');
    const secondCopy = track.querySelector<HTMLElement>('[data-slide="1-0"]');

    if (first && secondCopy) {
      copyWidth.current = secondCopy.offsetLeft - first.offsetLeft;
    }

    setCanScroll(copyWidth.current > viewport.clientWidth + 1);

    offset.current = normalize(offset.current);
    draw();
  }, [items.length, normalize, draw]);

  useIsomorphicLayoutEffect(() => {
    measure();

    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    // Images settle asynchronously, so remeasure on resize rather than guessing
    // with a timeout.
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);

    return () => observer.disconnect();
  }, [measure]);

  // Only run the loop while the carousel is actually on screen.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? true),
      { rootMargin: "120px" },
    );

    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion || !visible || !canScroll) return;

    const tick = (time: number) => {
      const previous = lastTime.current || time;
      // Cap the delta so returning to a background tab does not jump the track.
      const delta = Math.min((time - previous) / 1000, 0.05);
      lastTime.current = time;

      if (dragging.current) {
        // Position is driven by the pointer handler while a drag is active.
      } else if (Math.abs(velocity.current) > 1) {
        // Momentum after a flick, decaying toward rest.
        offset.current = normalize(offset.current + velocity.current * delta);
        velocity.current *= 0.94;
        draw();
      } else if (!paused.current) {
        offset.current = normalize(offset.current - AUTOPLAY_PX_PER_SECOND * delta);
        draw();
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      rafId.current = null;
      lastTime.current = 0;
    };
  }, [reducedMotion, visible, canScroll, normalize, draw]);

  /** Steps roughly one card, used by the arrow controls. */
  const step = useCallback(
    (direction: 1 | -1) => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;

      const slide = track.querySelector<HTMLElement>('[data-slide="0-0"]');
      const distance = slide ? slide.getBoundingClientRect().width + 24 : viewport.clientWidth * 0.6;

      velocity.current = 0;

      // A CSS transition handles this single move, then control returns to the rAF
      // loop. Leaving the transition attached would fight the autoplay writes.
      track.style.transition = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
      offset.current = normalize(offset.current - direction * distance);
      draw();

      window.setTimeout(() => {
        if (trackRef.current) trackRef.current.style.transition = "";
      }, 620);
    },
    [normalize, draw],
  );

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    // Ignore secondary buttons so a right click never starts a drag.
    if (event.pointerType === "mouse" && event.button !== 0) return;

    dragging.current = true;
    dragMoved.current = false;
    dragStartX.current = event.clientX;
    dragStartOffset.current = offset.current;
    velocity.current = 0;

    if (trackRef.current) trackRef.current.style.transition = "";
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;

      const delta = event.clientX - dragStartX.current;

      if (!dragMoved.current) {
        if (Math.abs(delta) <= DRAG_THRESHOLD_PX) return;
        dragMoved.current = true;
        // Capture only once the gesture is clearly a drag, so a simple tap still
        // reaches the card underneath and opens the viewer.
        event.currentTarget.setPointerCapture(event.pointerId);
      }

      const next = normalize(dragStartOffset.current + delta);
      // Track instantaneous speed for the release flick.
      velocity.current = (next - offset.current) * 12;
      offset.current = next;
      draw();
    },
    [normalize, draw],
  );

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    // Swallow the click that follows a drag, so releasing over a card does not
    // open the lightbox.
    if (dragMoved.current) {
      const suppress = (click: MouseEvent) => {
        click.stopPropagation();
        click.preventDefault();
      };
      window.addEventListener("click", suppress, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener("click", suppress, true), 50);
    }

    dragMoved.current = false;
  }, []);

  return (
    <div
      className={`relative ${className}`}
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
    >
      <div
        ref={viewportRef}
        className="overflow-hidden"
        onPointerEnter={() => {
          paused.current = true;
        }}
        onPointerLeave={(event) => {
          paused.current = false;
          endDrag(event);
        }}
        // Keyboard users tabbing into a card must not have it slide away.
        onFocusCapture={() => {
          paused.current = true;
        }}
        onBlurCapture={() => {
          paused.current = false;
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        // pan-y keeps vertical page scrolling native while we own horizontal drags.
        style={{ touchAction: "pan-y", cursor: canScroll ? "grab" : "default" }}
      >
        <div ref={trackRef} className="flex w-max gap-5 will-change-transform sm:gap-6">
          {Array.from({ length: COPIES }).flatMap((_, copy) =>
            items.map((item, index) => (
              <div
                key={`${copy}-${index}`}
                data-slide={`${copy}-${index}`}
                className={`shrink-0 ${itemClassName}`}
                // Only the first copy is real content; the clones exist purely to
                // fill the wrap and must not be announced or focusable.
                aria-hidden={copy > 0 ? true : undefined}
                {...(copy > 0 ? { inert: "" as unknown as boolean } : {})}
              >
                {item}
              </div>
            )),
          )}
        </div>
      </div>

      {canScroll && (
        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => step(-1)}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-navy-deep"
            aria-label="Previous projects"
          >
            <ChevronLeft className="size-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-navy-deep"
            aria-label="Next projects"
          >
            <ChevronRight className="size-5" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
