"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { useHasHover, useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Magnetic 3D tilt shared by every interactive image on the site.
 *
 * This was originally written inline in `ProjectCard` and is now shared so the hero
 * illustration and the portfolio cards move with identical physics rather than two
 * sets of hand tuned numbers that drift apart.
 *
 * The transform is written straight to the node inside a rAF callback rather than
 * through React state: routing pointermove through a setter would re-render on every
 * frame, for every card on screen. Only `hovered` is state, because it drives
 * className changes that React has to own.
 *
 * Disabled without a fine pointer or under reduced motion, where it would either
 * never fire or actively work against the user's stated preference.
 */

/** Rotation in degrees at the far edge of the element, and lift toward the viewer. */
const MAX_ROTATE_X = 11;
const MAX_ROTATE_Y = 13;
const LIFT_Z = 26;

export function useMagneticTilt<T extends HTMLElement = HTMLDivElement>({
  intensity = 1,
}: { intensity?: number } = {}) {
  const hasHover = useHasHover();
  const reducedMotion = useReducedMotion();
  const enabled = hasHover && !reducedMotion;

  const ref = useRef<T>(null);
  const frame = useRef<number | null>(null);
  const target = useRef({ rx: 0, ry: 0, tz: 0 });
  const [hovered, setHovered] = useState(false);

  const apply = useCallback(() => {
    frame.current = null;
    const node = ref.current;
    if (!node) return;

    const { rx, ry, tz } = target.current;
    node.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px)`;
  }, []);

  const schedule = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(apply);
  }, [apply]);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<T>) => {
      if (!enabled) return;

      const bounds = event.currentTarget.getBoundingClientRect();
      // Normalize pointer position within the element to -0.5..0.5 on both axes.
      const px = (event.clientX - bounds.left) / bounds.width - 0.5;
      const py = (event.clientY - bounds.top) / bounds.height - 0.5;

      // Y rotation follows horizontal travel, X rotation inverts vertical travel so
      // the surface leans toward the cursor rather than away from it.
      target.current = {
        rx: -py * MAX_ROTATE_X * intensity,
        ry: px * MAX_ROTATE_Y * intensity,
        tz: LIFT_Z * intensity,
      };
      schedule();
    },
    [enabled, intensity, schedule],
  );

  const onPointerEnter = useCallback(() => setHovered(true), []);

  const onPointerLeave = useCallback(() => {
    setHovered(false);
    if (!enabled) return;
    target.current = { rx: 0, ry: 0, tz: 0 };
    schedule();
  }, [enabled, schedule]);

  // A pending frame after unmount would write to a detached node.
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  return {
    ref,
    hovered,
    hasHover,
    reducedMotion,
    enabled,
    /** Spread onto the element that should tilt. */
    handlers: { onPointerMove, onPointerEnter, onPointerLeave },
    /** Matching transition so the surface eases back to rest on exit. */
    className: "preserve-3d transition-transform duration-[600ms] ease-[var(--ease-luxe)] will-change-transform",
  };
}
