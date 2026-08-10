/**
 * Single source of truth for studio copy, contact details, and services.
 * Edit this file rather than the components.
 *
 * House style: no hyphens anywhere in user facing text.
 */

export const SITE = {
  name: "Nael Yafi Studio",
  shortName: "NY Studio",
  tagline: "Designing Spaces That Speak",
  description:
    "Nael Yafi Studio is an award winning interior design practice creating residential and commercial spaces with warmth, restraint, and precision.",
  url: "https://naelyafistudio.ca",
} as const;

export const AWARD = {
  title: "Canadian Choice Award Winner",
  year: "2026",
  seal: "/award/seal-2026.png",
  poster: "/award/poster-2026.webp",
  blurb:
    "Recognized as a 2026 Canadian Choice Award Winner, an honour decided by the people we design for.",
} as const;

export const CONTACT = {
  email: "info@naelyafistudio.ca",
} as const;

export const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/naelyafistudio", handle: "naelyafistudio" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/naelyafistudio/", handle: "naelyafistudio" },
  { label: "YouTube", href: "https://youtube.com/@nystudioinc", handle: "nystudioinc" },
] as const;

export const SISTER_STUDIO = {
  name: "MNOY",
  role: "Rendering and visual assets",
  blurb:
    "Our sister studio produces photoreal renderings and visual assets for fellow interior designers, so your concepts arrive fully resolved before a single wall goes up.",
  instagram: "https://www.instagram.com/mnoystudioinc",
  handle: "mnoystudioinc",
} as const;

export const NAV_LINKS = [
  { label: "Work", href: "#work" },
  { label: "About & Services", href: "#about" },
] as const;

export const ABOUT_PARAGRAPHS = [
  "Nael Yafi Studio is an architectural and interior design practice built on a simple belief: a room should feel considered before it is ever described. We work in warm materials, generous light, and proportions that hold up over decades rather than seasons.",
  "Every project begins with the way a space will actually be lived in. We study circulation, sightlines, and daylight first, then let material and detail follow. The result is architecture that reads as calm because the difficult decisions were made early.",
  "Our craft is collaborative. We work alongside builders, millworkers, and fabricators from the first sketch, so what is drawn is what gets built. That discipline is what the 2026 Canadian Choice Award recognizes.",
] as const;

export const SERVICES = [
  {
    title: "Interior Architecture",
    summary: "Spatial planning, millwork, and material direction for full interiors.",
    detail:
      "We reshape how a space works before we style it: wall planning, ceiling treatments, custom millwork, lighting layouts, and complete material palettes documented to build standard.",
  },
  {
    title: "Residential Design",
    summary: "Private homes designed around how a family actually lives.",
    detail:
      "From principal suites to full home concepts, we design residences that balance warmth with restraint, coordinating finishes, furniture, and fixtures into one coherent language.",
  },
  {
    title: "Commercial & Hospitality",
    summary: "Offices, lounges, and guest facing spaces with a considered identity.",
    detail:
      "Commercial work carries a brand without shouting it. We design executive offices, reception areas, and hospitality interiors where the experience is legible the moment someone walks in.",
  },
  {
    title: "Exterior & Landscape",
    summary: "Facades, entry sequences, and landscape design as one gesture.",
    detail:
      "The approach to a building matters as much as the interior. We design facades, entry courts, pool terraces, and planting schemes so the exterior and interior read as a single idea.",
  },
  {
    title: "Concept Development",
    summary: "Early stage studies that test an idea before it is committed.",
    detail:
      "Massing studies, mood direction, and conceptual visualizations that let you evaluate a direction while it is still inexpensive to change.",
  },
] as const;
