"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

import { useMagneticTilt } from "@/hooks/use-magnetic-tilt";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SITE } from "@/lib/site";

// The Three.js bundle is large and purely decorative, so it is never part of the
// initial payload and never runs during SSR.
const HeroCanvas = dynamic(() => import("@/components/HeroCanvas").then((m) => m.HeroCanvas), {
  ssr: false,
});

const HEADLINE = SITE.tagline;
const TYPE_SPEED_MS = 62;

/**
 * Types the headline one character at a time.
 *
 * The full string is always present in the DOM for assistive technology and for
 * layout reservation; only the visible slice changes, so the heading never reflows
 * as characters arrive. Reduced motion skips straight to the finished string.
 */
function useTypewriter(text: string, enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Reduced motion: the render below already falls back to the full string, so
    // there is nothing to schedule and no state to set.
    if (!enabled) return;

    let frame = 0;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      frame += 1;
      setCount(frame);
      if (frame < text.length) timer = setTimeout(step, TYPE_SPEED_MS);
    };

    // Small lead in so the section settles before the type starts.
    timer = setTimeout(step, 420);
    return () => clearTimeout(timer);
  }, [text, enabled]);

  const visible = enabled ? count : text.length;
  return { typed: text.slice(0, visible), done: visible >= text.length };
}

export function Hero({ onContact }: { onContact: () => void }) {
  const reducedMotion = useReducedMotion();
  const { typed, done } = useTypewriter(HEADLINE, !reducedMotion);

  return (
    <section
      id="top"
      className="relative flex min-h-dvh-safe flex-col justify-center overflow-hidden bg-navy pt-28 pb-20 sm:pt-32"
    >
      <HeroCanvas className="pointer-events-none absolute inset-0 z-0 opacity-70" />

      {/* Vignette so the canvas never fights the type for contrast. */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_35%,var(--color-navy)_88%)]" />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 text-[0.65rem] font-medium tracking-[0.3em] text-gold uppercase sm:text-xs sm:tracking-[0.36em]"
            >
              Architecture &amp; Interior Design
            </motion.p>

            <h1 className="font-display text-[clamp(2.5rem,8vw,6.5rem)] leading-[0.98] text-ivory">
              {/* Screen readers get the finished sentence, not a partial string. */}
              <span className="sr-only">{HEADLINE}</span>
              <span aria-hidden="true" className="break-words">
                {typed}
                <span
                  className={`ml-1 inline-block h-[0.78em] w-[3px] translate-y-[0.08em] bg-gold align-middle ${
                    done ? "animate-[blink_1.1s_steps(2,start)_infinite]" : ""
                  }`}
                  style={{ opacity: reducedMotion ? 0 : 1 }}
                />
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reducedMotion ? 0.1 : 1.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 max-w-xl text-base leading-relaxed text-ivory/70 sm:text-lg"
            >
              An award winning studio shaping residential and commercial spaces across Canada with warm
              materials, generous light, and proportions built to last.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reducedMotion ? 0.15 : 1.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <a
                href="#work"
                className="inline-flex min-h-[52px] cursor-pointer items-center justify-center rounded-full bg-gold px-9 text-[0.7rem] font-medium tracking-[0.22em] text-navy-deep uppercase transition-colors duration-300 hover:bg-gold-soft"
              >
                View Our Work
              </a>
              <button
                type="button"
                onClick={onContact}
                className="inline-flex min-h-[52px] cursor-pointer items-center justify-center rounded-full border border-ivory/30 px-9 text-[0.7rem] font-medium tracking-[0.22em] text-ivory uppercase transition-colors duration-300 hover:border-gold hover:text-gold"
              >
                Start a Project
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0.2 : 0.9, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <HeroHouse floating={!reducedMotion} />
          </motion.div>
        </div>
      </div>

      <motion.a
        href="#work"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reducedMotion ? 0.25 : 2, duration: 0.8 }}
        className="relative z-10 mx-auto mt-14 hidden cursor-pointer flex-col items-center gap-3 text-ivory/45 transition-colors hover:text-gold sm:flex"
        aria-label="Scroll to work"
      >
        <span className="text-[0.6rem] tracking-[0.3em] uppercase">Scroll</span>
        <ArrowDown className="size-4 animate-bounce" strokeWidth={1.5} />
      </motion.a>

      <style jsx>{`
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}

/**
 * Hero illustration.
 *
 * Reuses the exact interaction model of the portfolio cards: the same
 * `useMagneticTilt` physics and the same grayscale to colour transition, so the
 * main image behaves identically to everything in the work section.
 *
 * One deliberate difference: without a hover capable pointer the render stays in
 * full colour. On a portfolio card grayscale is a rest state the visitor can
 * resolve by tapping, but this is the first thing on the page and on a phone there
 * is nothing to hover, so leaving it desaturated would simply look broken.
 */
function HeroHouse({ floating }: { floating: boolean }) {
  const tilt = useMagneticTilt<HTMLDivElement>();
  const showColour = tilt.hovered || !tilt.hasHover;

  return (
    <motion.div
      animate={floating ? { y: [0, -14, 0] } : undefined}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      className="perspective-card relative w-full max-w-[560px] lg:max-w-[760px] xl:max-w-[860px]"
    >
      {/* Warm pool of light so the cut out sits in the scene rather than on top of it. */}
      <div className="pointer-events-none absolute inset-x-[6%] bottom-[4%] -z-10 h-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(235,199,29,0.2),transparent_70%)] blur-2xl" />

      <div ref={tilt.ref} {...tilt.handlers} className={tilt.className}>
        <Image
          src="/brand/home-house.webp"
          alt="Residential architecture rendering by Nael Yafi Studio"
          width={1525}
          height={728}
          priority
          draggable={false}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 80vw, (max-width: 1280px) 760px, 860px"
          className={`h-auto w-full object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.5)] transition-[filter,transform] duration-[850ms] ease-[var(--ease-luxe)] select-none ${
            showColour ? "grayscale-0 scale-[1.02]" : "grayscale"
          }`}
        />
      </div>
    </motion.div>
  );
}
