"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Site wide smooth scrolling.
 *
 * Lenis is driven from the GSAP ticker rather than its own requestAnimationFrame
 * loop so scroll interpolation and ScrollTrigger updates happen on the same frame.
 * Running two independent loops causes pinned sections to lag behind the content.
 *
 * Renders nothing. Mounted once in the root layout.
 */
export function SmoothScroll() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Respect the user's setting: native scrolling, no interpolation, no ticker.
    if (reducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.05,
      // Gentle exponential ease out; long tail without feeling detached from input.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch devices already have momentum scrolling; layering Lenis on top of it
      // makes the page feel heavy and breaks native overscroll behavior.
      syncTouch: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      // GSAP reports seconds, Lenis expects milliseconds.
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links must go through Lenis, otherwise the browser jumps and Lenis
    // immediately interpolates back, producing a visible double scroll.
    const onAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;

      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;

      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: 0, duration: 1.2 });
    };

    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, [reducedMotion]);

  // Mobile browser chrome makes 100vh taller than the visible area, which pushes
  // hero content under the URL bar. Publish the real unit as a CSS variable.
  useEffect(() => {
    const setViewportUnit = () => {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    };

    setViewportUnit();
    window.addEventListener("resize", setViewportUnit);
    window.addEventListener("orientationchange", setViewportUnit);

    return () => {
      window.removeEventListener("resize", setViewportUnit);
      window.removeEventListener("orientationchange", setViewportUnit);
    };
  }, []);

  return null;
}
