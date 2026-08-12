/**
 * Single source of truth for studio copy, contact details, and services.
 * Edit this file rather than the components.
 *
 * House style: no hyphens anywhere in user facing text.
 */

export const SITE = {
  name: "Nael Yafi Studio",
  shortName: "NY Studio",
  tagline: "Designing Spaces that speak",
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
  { label: "View our work", href: "/view-our-work" },
  { label: "About & Services", href: "/about" },
] as const;

/**
 * Studio narrative.
 *
 * `heading` entries render as a subheading rather than body copy, which is how the
 * Creative Director bio is separated from the practice introduction.
 */
export const ABOUT_BLOCKS = [
  {
    type: "lead",
    text: "Nael Yafi Studio is an interior design practice focused on thoughtful design, natural materials, and practical expertise. We create calm, timeless spaces that reflect the way people live, with a strong focus on both design and execution.",
  },
  {
    type: "body",
    text: "From the early stages of each project, we work closely with builders, trades, millworkers, and fabricators. This close collaboration allows us to develop designs that are carefully considered, practical, and achievable, while maintaining the original vision throughout the construction process.",
  },
  { type: "heading", text: "Nael Yafi, Creative Director" },
  {
    type: "body",
    text: "Nael Yafi is the founder and Creative Director of Nael Yafi Studio. He holds a Bachelor\u2019s degree in Interior Design and has more than 12 years of professional experience working across nine countries, including seven years in the North American market. His international experience brings a broad perspective to each project and informs his approach to design.",
  },
  {
    type: "body",
    text: "In addition to his design background, Nael holds a Construction Project Management Certificate and has 20 years of experience in the construction industry. His hands on experience has given him a strong understanding of building materials, construction methods, site coordination, scheduling, and project budgets.",
  },
  {
    type: "body",
    text: "This combination of interior design and construction experience allows Nael to approach each project with a clear understanding of both the creative and practical aspects of the work, from the initial concept through to completion.",
  },
] as const;

export type AboutBlock = (typeof ABOUT_BLOCKS)[number];

export const SERVICES = [
  {
    title: "Interior Design",
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
    summary: "Connecting the interior with everything around it.",
    detail:
      "We connect the interior with the exterior, sharing our design vision and collaborating with architects and landscape specialists to create a cohesive, seamless experience from inside out",
  },
  {
    title: "Concept Development",
    summary: "Early stage studies that test an idea before it is committed.",
    detail:
      "Massing studies, mood direction, and conceptual visualizations that let you evaluate a direction while it is still inexpensive to change.",
  },
] as const;
