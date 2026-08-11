"use client";

import { useEffect, useRef } from "react";

import { useHasHover, useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Golden cursor trail.
 *
 * A tapering gold ribbon that follows the pointer, drawn on a full viewport canvas
 * that sits above the page and ignores pointer events.
 *
 * Canvas rather than DOM: a trail needs on the order of thirty segments redrawn
 * every frame, and animating that many elements would thrash layout and style
 * recalculation. One canvas is a single composited layer.
 *
 * The head chases the raw pointer with exponential smoothing rather than snapping to
 * it, which is what gives the ribbon its lag and curve. Each frame the eased head is
 * pushed onto a fixed length history, and the history is stroked from tail to head
 * with rising width and alpha so the line appears to taper.
 *
 * The ribbon is drawn as a bloom pass under a core pass, plus a haloed head, so it
 * holds up against the navy surfaces it spends most of its time on. Both passes walk
 * the same point history, so the cost stays two strokes per segment on one layer.
 *
 * Disabled entirely on touch devices, where there is no cursor to decorate, and
 * under reduced motion.
 */

/** Number of retained points. Longer looks liquid, shorter looks precise. */
const TRAIL_LENGTH = 28;
/** Head easing per frame, normalized to 60fps below. */
const FOLLOW = 0.28;
/** Width of the crisp core stroke at the head, in CSS pixels. */
const CORE_WIDTH = 5.5;
/** The bloom pass is drawn underneath the core at this multiple of its width. */
const GLOW_SCALE = 3.4;
/** Solid dot at the pointer, and the radius of the soft halo around it. */
const HEAD_RADIUS = 4.6;
const HALO_RADIUS = 26;

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasHover = useHasHover();
  const reducedMotion = useReducedMotion();
  const enabled = hasHover && !reducedMotion;

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Draw in CSS pixels; the transform handles the device pixel ratio.
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const pointer = { x: -100, y: -100 };
    const head = { x: -100, y: -100 };
    const trail: { x: number; y: number }[] = [];
    let seeded = false;
    let visible = false;

    const onPointerMove = (event: PointerEvent) => {
      // Ignore coarse pointers even if the media query matched, which happens on
      // hybrid laptops with a touchscreen.
      if (event.pointerType === "touch") return;

      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (!seeded) {
        // First sighting: drop the whole trail on the cursor so it does not whip
        // across the screen from the origin.
        head.x = pointer.x;
        head.y = pointer.y;
        trail.length = 0;
        for (let i = 0; i < TRAIL_LENGTH; i += 1) trail.push({ x: head.x, y: head.y });
        seeded = true;
      }

      visible = true;
    };

    const onPointerLeave = () => {
      visible = false;
    };

    let frame = 0;
    let last = performance.now();

    const render = (now: number) => {
      // Normalize easing to 60fps so the trail feels identical on a 144Hz display.
      const delta = Math.min((now - last) / 16.667, 3);
      last = now;

      const ease = 1 - Math.pow(1 - FOLLOW, delta);
      head.x += (pointer.x - head.x) * ease;
      head.y += (pointer.y - head.y) * ease;

      if (seeded) {
        trail.push({ x: head.x, y: head.y });
        while (trail.length > TRAIL_LENGTH) trail.shift();
      }

      context.clearRect(0, 0, width, height);

      if (visible && trail.length > 1) {
        context.lineCap = "round";
        context.lineJoin = "round";

        /*
          Two passes over the same path. The first is a wide, low alpha bloom drawn
          with additive compositing, which is what makes the gold read as emitted
          light against the navy rather than a painted line; the second is a narrow,
          near opaque core that keeps the edge of the ribbon crisp.

          Additive is used only inside the canvas, so it brightens where the ribbon
          overlaps itself on a tight flick and leaves the page underneath alone.
        */
        for (let pass = 0; pass < 2; pass += 1) {
          const bloom = pass === 0;
          context.globalCompositeOperation = bloom ? "lighter" : "source-over";

          for (let i = 1; i < trail.length; i += 1) {
            const previous = trail[i - 1];
            const point = trail[i];
            // 0 at the tail, 1 at the head.
            const t = i / (trail.length - 1);
            // Smoothstep the taper so the tail thins out early and the head keeps
            // its weight, instead of the flat linear ramp the old trail used.
            const weight = t * t * (3 - 2 * t);

            context.beginPath();
            context.moveTo(previous.x, previous.y);
            context.lineTo(point.x, point.y);
            context.strokeStyle = bloom
              ? `rgba(235, 199, 29, ${(weight * 0.14).toFixed(3)})`
              : `rgba(242, 218, 107, ${(0.22 + weight * 0.74).toFixed(3)})`;
            context.lineWidth = Math.max(0.4, weight * CORE_WIDTH * (bloom ? GLOW_SCALE : 1));
            context.stroke();
          }
        }

        const tip = trail[trail.length - 1];

        // Halo, then a solid dot, so the pointer itself reads as a point of light
        // and stays findable on the darkest sections of the page.
        context.globalCompositeOperation = "lighter";
        const halo = context.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, HALO_RADIUS);
        halo.addColorStop(0, "rgba(235, 199, 29, 0.5)");
        halo.addColorStop(0.4, "rgba(235, 199, 29, 0.14)");
        halo.addColorStop(1, "rgba(235, 199, 29, 0)");
        context.fillStyle = halo;
        context.beginPath();
        context.arc(tip.x, tip.y, HALO_RADIUS, 0, Math.PI * 2);
        context.fill();

        context.globalCompositeOperation = "source-over";
        context.beginPath();
        context.arc(tip.x, tip.y, HEAD_RADIUS, 0, Math.PI * 2);
        context.fillStyle = "rgba(246, 232, 156, 0.95)";
        context.fill();
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      // Above the page but below modals, and never interactive.
      className="pointer-events-none fixed inset-0 z-[100] hidden md:block"
    />
  );
}
