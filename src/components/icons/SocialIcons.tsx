/**
 * Minimal social marks.
 *
 * lucide-react removed its brand icons in v1, so these are drawn locally in the
 * same 24x24, currentColor, stroke based idiom as the rest of the icon set. That
 * keeps weight and optical size consistent when they sit beside lucide glyphs.
 */

type IconProps = {
  className?: string;
  strokeWidth?: number;
};

const base = (strokeWidth: number) => ({
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false as const,
});

export function InstagramIcon({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function LinkedInIcon({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function YouTubeIcon({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

/** Keyed by the `label` values used in SOCIALS. */
export const SOCIAL_ICONS = {
  Instagram: InstagramIcon,
  LinkedIn: LinkedInIcon,
  YouTube: YouTubeIcon,
} as const;
