"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { useHasHover, useReducedMotion } from "@/hooks/use-reduced-motion";
import { SITE } from "@/lib/site";

// The Three.js bundle is large and purely decorative, so it is never part of the
// initial payload and never runs during SSR.
const HeroCanvas = dynamic(() => import("@/components/HeroCanvas").then((m) => m.HeroCanvas), {
  ssr: false,
});

const HEADLINE = SITE.tagline;
const TYPE_SPEED_MS = 62;

/** Scale the render reaches by the time the pin releases. */
const MAX_ZOOM = 1.42;
/**
 * Pin length as a fraction of the viewport height.
 *
 * This is how far the visitor scrolls while the hero is held. Long enough that the
 * zoom reads as a deliberate push in, short enough that it never feels like the
 * scrollbar has stopped responding.
 */
const PIN_DISTANCE = 1.05;

/**
 * Track when the video loader overlay finishes so hero animations sync cleanly.
 */
function useLoaderFinished() {
  const [finished, setFinished] = useState(() => {
    if (typeof window === "undefined") return true;
    return Boolean(sessionStorage.getItem("nysi_video_loader_played"));
  });

  useEffect(() => {
    if (finished) return;

    const onFinished = () => setFinished(true);
    window.addEventListener("nysi:loaderFinished", onFinished);
    return () => window.removeEventListener("nysi:loaderFinished", onFinished);
  }, [finished]);

  return finished;
}

/**
 * Types the headline one character at a time.
 *
 * The full string is always present in the DOM for assistive technology and for
 * layout reservation; only the visible slice changes, so the heading never reflows
 * as characters arrive. Reduced motion skips straight to the finished string.
 */
function useTypewriter(text: string, enabled: boolean, start: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Reduced motion or waiting for video loader to finish: return early
    if (!enabled || !start) return;

    let frame = 0;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      frame += 1;
      setCount(frame);
      if (frame < text.length) timer = setTimeout(step, TYPE_SPEED_MS);
    };

    // Small lead in so the section settles before the type starts.
    timer = setTimeout(step, 300);
    return () => clearTimeout(timer);
  }, [text, enabled, start]);

  const visible = enabled ? count : text.length;
  return { typed: text.slice(0, visible), done: visible >= text.length };
}

export function Hero() {
  const reducedMotion = useReducedMotion();
  const loaderFinished = useLoaderFinished();
  const { typed, done } = useTypewriter(HEADLINE, !reducedMotion, loaderFinished);
  const sectionRef = useRef<HTMLElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const houseRef = useRef<HTMLDivElement>(null);
  const [houseHovered, setHouseHovered] = useState(false);

  /*
    Hover target for the grayscale to colour transition.

    Hit testing against the render's own box, from a listener on the section, rather
    than `pointerenter` on the image itself. The copy column and the two gradient
    washes are stacked above the render and span its middle, so an enter/leave pair
    bound to the image only fired along the edges that nothing else covered: moving
    toward the centre entered the copy layer, the image saw a leave, and the colour
    dropped out. Pointer events bubble to the section no matter which layer is on
    top, so this reads the same everywhere over the render, centre included.

    Testing the live rect also means the scaled box during the pin is what gets
    measured, so the target keeps matching what the visitor can actually see.
  */
  const onSectionPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    // A touch drag would otherwise latch the colour state on and never clear it.
    if (event.pointerType === "touch") return;

    const node = houseRef.current;
    if (!node) return;

    const bounds = node.getBoundingClientRect();
    const inside =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;

    // Only commit real transitions; pointermove fires far too often to re-render on.
    setHouseHovered((current) => (current === inside ? current : inside));
  }, []);

  const onSectionPointerLeave = useCallback(() => setHouseHovered(false), []);

  /*
    Pinned scroll zoom.

    The section is held at the top of the viewport while the visitor scrolls one
    viewport height, and that scroll distance is spent driving the render from rest
    to `MAX_ZOOM` instead of moving the page. Once the timeline completes the pin
    releases and the rest of the document scrolls up normally.

    ScrollTrigger owns this rather than a `useScroll` transform because only a pin
    can convert scroll distance into animation progress; the previous version
    animated on scroll but never held the section, so the zoom was always cut short
    by the next section arriving.

    `pinSpacing` keeps the trigger's padding in the flow, so nothing underneath jumps
    when the pin engages or releases. `scrub` ties progress to scroll position with a
    short catch up, which is what makes the zoom track the wheel instead of playing
    on its own clock. Lenis already drives `ScrollTrigger.update` from the GSAP
    ticker in `SmoothScroll`, so the pin stays in step with the smoothed scroll.
  */
  useEffect(() => {
    // Reduced motion: no pin and no zoom. Holding the viewport hostage is exactly
    // the kind of motion the preference is asking us not to do.
    if (reducedMotion) return;

    const section = sectionRef.current;
    const zoom = zoomRef.current;
    const copy = copyRef.current;
    if (!section || !zoom || !copy) return;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // Measured in a function so a resize or an orientation change recomputes
          // the distance rather than keeping the height captured at mount.
          end: () => `+=${window.innerHeight * PIN_DISTANCE}`,
          pin: true,
          pinSpacing: true,
          // Pre-empts the one frame jump that a pin can otherwise show on fast wheels.
          anticipatePin: 1,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to(zoom, { scale: MAX_ZOOM, xPercent: 4, ease: "none", duration: 1 }, 0)
        // The copy clears well before the pin releases, so the last stretch of the
        // hold is the render alone rather than type sitting on a magnified image.
        .to(copy, { opacity: 0, yPercent: -16, ease: "none", duration: 0.55 }, 0);
    }, section);

    return () => context.revert();
  }, [reducedMotion]);

  return (
    <section
      id="top"
      ref={sectionRef}
      onPointerMove={onSectionPointerMove}
      onPointerLeave={onSectionPointerLeave}
      className="relative flex min-h-dvh-safe flex-col justify-center overflow-hidden bg-navy pt-28 pb-20 sm:pt-32 lg:pt-24 lg:pb-0"
    >
      <HeroCanvas className="pointer-events-none absolute inset-0 z-0 opacity-50" />

      {/*
        The reference layout runs the render off the right edge of the viewport at
        full bleed, with the copy sitting over the left third. Below `lg` it becomes
        a stacked layout instead, because a bleeding image behind text is unreadable
        at phone widths.
      */}
      <div
        ref={zoomRef}
        className="pointer-events-none relative z-[1] mx-auto w-full max-w-[1800px] origin-[70%_center] will-change-transform lg:absolute lg:inset-y-0 lg:right-0 lg:left-auto lg:mx-0 lg:flex lg:w-[72%] lg:max-w-none lg:items-center xl:w-[68%]"
      >
        <HeroHouse frameRef={houseRef} hovered={houseHovered} />
      </div>

      {/* Navy wash on the left so the headline always has a clean ground to sit on. */}
      <div className="pointer-events-none absolute inset-0 z-[2] hidden bg-[linear-gradient(100deg,var(--color-navy)_18%,rgba(0,43,73,0.82)_38%,rgba(0,43,73,0.25)_58%,transparent_78%)] lg:block" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(to_top,var(--color-navy)_2%,transparent_38%)]" />

      <div
        ref={copyRef}
        className="relative z-10 mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12"
      >
        <div className="max-w-2xl lg:max-w-[46%]">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={loaderFinished ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 text-[0.65rem] font-medium tracking-[0.3em] text-gold uppercase sm:text-xs sm:tracking-[0.36em]"
          >
            Interior Design Studio
          </motion.p>

          <h1 className="font-display text-[clamp(2.5rem,7vw,5.75rem)] leading-[1.02] text-ivory">
            {/* Screen readers get the finished sentence, not a partial string. */}
            <span className="sr-only">{HEADLINE}</span>
            <span aria-hidden="true" className="break-words">
              {typed}
              <span
                className={`ml-1 inline-block h-[0.78em] w-[3px] translate-y-[0.08em] bg-gold align-middle ${done ? "animate-[blink_1.1s_steps(2,start)_infinite]" : ""
                  }`}
                style={{ opacity: reducedMotion ? 0 : 1 }}
              />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={loaderFinished ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ delay: reducedMotion ? 0.1 : 1.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 max-w-xl text-base leading-relaxed text-ivory/70 sm:text-lg"
          >
            An award winning studio shaping residential and commercial spaces across Canada with warm
            materials, generous light, and proportions built to last.
          </motion.p>
        </div>
      </div>

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
 * Deliberately static: no magnetic tilt, no float, no pointer response. It is the
 * anchor of the page and the scroll zoom already gives it movement, so layering
 * pointer physics on top made it feel unsettled. The only interaction it keeps is
 * the grayscale to colour transition shared with the portfolio cards.
 *
 * Without a hover capable pointer it renders in full colour: grayscale is a rest
 * state a visitor resolves by hovering, and on a phone there is nothing to hover,
 * so leaving it desaturated would just look broken.
 *
 * Hover state is owned by `Hero`, which hit tests the pointer against `frameRef`.
 * This subtree stays `pointer-events-none` throughout so the zoom layer never
 * intercepts a click or a text selection in the copy column beneath it.
 */
function HeroHouse({
  frameRef,
  hovered,
}: {
  frameRef: Ref<HTMLDivElement>;
  hovered: boolean;
}) {
  const hasHover = useHasHover();

  const showColour = hovered || !hasHover;

  return (
    <div ref={frameRef} className="relative w-full">
      {/* Warm pool of light so the cut out sits in the scene rather than on top of it. */}
      <div className="pointer-events-none absolute inset-x-[10%] bottom-[6%] -z-10 h-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(235,199,29,0.18),transparent_70%)] blur-2xl" />

      <Image
        src="/brand/ActualFinalHome2.png"
        alt="Residential interior design project by Nael Yafi Studio"
        width={1526}
        height={736}
        priority
        draggable={false}
        sizes="(max-width: 1024px) 100vw, 72vw"
        className={`h-auto w-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)] transition-[filter] duration-[850ms] ease-[var(--ease-luxe)] select-none ${showColour ? "grayscale-0" : "grayscale"
          }`}
      />
    </div>
  );
}
