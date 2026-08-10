import type { CSSProperties } from "react";

/**
 * Decorative gold filigree used to frame the studio's feature cards.
 *
 * These are inline SVG hairlines rather than raster art: they scale cleanly, tint
 * from `currentColor`, and add no network requests. Everything here is presentational,
 * so each element is marked `aria-hidden` and `pointer-events-none` and is absolutely
 * positioned inside a `relative` card, which keeps the flourishes clear of the text
 * flow and preserves legibility.
 */

/** A single baroque corner volute, drawn for the top left and rotated for reuse. */
export function CornerFlourish({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      {/* Outer bracket */}
      <path d="M2 24V7a5 5 0 0 1 5-5h17" />
      {/* Inner hairline, offset to read as an engraved double rule */}
      <path d="M9 27V12a3 3 0 0 1 3-3h15" />
      {/* Volute curling in from the corner */}
      <path d="M13 33c0-9 6.5-16 15.5-16 6 0 8.5 4.5 5.5 7.6-2.9 3-7.2.2-5.2-3.6" />
      {/* Leaf sprigs */}
      <path d="M31 10c5.5-.4 9.2-3.4 10-8" />
      <path d="M10 31c-.4 5.5-3.4 9.2-8 10" />
      <path d="M38 20c3.6 1.4 7.4.7 10.6-2" />
      <circle cx="40.5" cy="9.5" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="40.5" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Diagonal pair of corner flourishes, top left and bottom right.
 *
 * `inset` is applied as an inline offset rather than a Tailwind class because
 * Tailwind resolves utilities by scanning source text, so an interpolated
 * `top-${inset}` would never be generated.
 *
 * The SVG is drawn inside a 64 unit viewBox, and its visible strokes begin roughly
 * a third of the way in from the bounding box edge. To stop the flourishes from
 * colliding with card content, pass the same value to `contentPadding`: it adds
 * matching padding around the card's content, so the artwork gets its breathing
 * room without any element needing a magic z-index shuffle.
 */
export function CornerFrame({
  size = "size-16",
  opacity = "opacity-40",
  inset = 12,
  className = "",
}: {
  /** Tailwind size utility for each flourish. */
  size?: string;
  /** Tailwind opacity utility, kept low so type stays dominant. */
  opacity?: string;
  /** Distance from the card edge, in pixels. */
  inset?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 text-gold ${opacity} ${className}`}
    >
      <CornerFlourish className={`absolute ${size}`} style={{ top: inset, left: inset }} />
      <CornerFlourish
        className={`absolute rotate-180 ${size}`}
        style={{ bottom: inset, right: inset }}
      />
    </span>
  );
}

/** Symmetrical crest on a rule, for centring on a card border. */
export function CrestRule({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M2 13h62" />
      <path d="M156 13h62" />
      {/* Mirrored scrolls flanking the centre */}
      <path d="M64 13c8 0 12-4 12-8s-6-6-8-2 2 9 10 9 12-5 14-9" />
      <path d="M156 13c-8 0-12-4-12-8s6-6 8-2-2 9-10 9-12-5-14-9" />
      {/* Lozenge at the centre */}
      <path d="M110 3l9 10-9 10-9-10z" />
      <path d="M110 8l4.5 5-4.5 5-4.5-5z" fill="currentColor" fillOpacity="0.35" stroke="none" />
      <circle cx="94" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="126" cy="13" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
