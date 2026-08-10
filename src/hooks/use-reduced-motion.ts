"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Media query state backed by `useSyncExternalStore`.
 *
 * A `useEffect` + `setState` pairing would work but trips the React Compiler's
 * `set-state-in-effect` rule and causes an extra render pass on mount. Subscribing
 * to the MediaQueryList directly is the intended primitive for external state and
 * gives a stable server snapshot for hydration.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // Server snapshot: assume no preference so markup matches the first client paint.
    () => false,
  );
}

/**
 * Tracks `prefers-reduced-motion`.
 *
 * Motion heavy components check this directly rather than relying on the CSS
 * override alone, which cannot stop JS driven loops such as GSAP tickers, the
 * Three.js render loop, or the carousel's requestAnimationFrame ticker.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True when the device reports a precise pointer, meaning hover is meaningful. */
export function useHasHover(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}
