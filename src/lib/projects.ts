import { GALLERY, type GalleryImage, type GalleryProject } from "@/lib/generated/gallery";

/**
 * Presentation layer over the generated asset manifest.
 *
 * The manifest only knows what is on disk. Editorial metadata (location, year,
 * discipline) lives here so re-running the asset pipeline never overwrites copy.
 */

export type ProjectMeta = {
  location: string;
  year: string;
  discipline: string;
  /** Optional narrative shown on the featured project only. */
  narrative?: string;
};

const META: Record<string, ProjectMeta> = {
  "oakville-project": {
    location: "Oakville, Ontario",
    year: "2025",
    discipline: "Interior design renovation",
    narrative:
      "A full residential interior in Oakville, resolved around a central stair and a restrained palette of white oak, warm stone, and brushed metal. This is the project behind our 2026 Canadian Choice Award.",
  },
  "interiors-foyer": { location: "Private Residence", year: "2025", discipline: "Interior Design" },
  "interiors-living": { location: "Private Residence", year: "2025", discipline: "Interior Design" },
  "interiors-dining": { location: "Private Residence", year: "2025", discipline: "Interior Design" },
  "interiors-kitchen": { location: "Private Residence", year: "2025", discipline: "Interior Design" },
  "interiors-bedroom": { location: "Private Residence", year: "2025", discipline: "Interior Design" },
  "interiors-guest": { location: "Private Residence", year: "2024", discipline: "Interior Design" },
  "interiors-office": { location: "Commercial", year: "2025", discipline: "Workplace Design" },
  "interiors-montreal": { location: "Montreal, Quebec", year: "2024", discipline: "Interior Design" },
  "interiors-cottage": { location: "Lakeside, Ontario", year: "2024", discipline: "Interior Design" },
  "interiors-the-gate": { location: "Private Residence", year: "2025", discipline: "Interior Design" },
  "interiors-misc": { location: "Studio Archive", year: "2024", discipline: "Detail Study" },
  "exteriors-villa-bey": { location: "Private Villa", year: "2025", discipline: "Interior Design" },
  "exteriors-arizona": { location: "Arizona, United States", year: "2025", discipline: "Interior Design" },
  "exteriors-80-fh": { location: "Forest Hill, Toronto", year: "2024", discipline: "Interior Design" },
  "exteriors-landscape": { location: "Private Residence", year: "2024", discipline: "Landscape Design" },
  "exteriors-conceptual": { location: "Concept", year: "2025", discipline: "Conceptual Study" },
};

const FALLBACK_META: ProjectMeta = {
  location: "Nael Yafi Studio",
  year: "",
  discipline: "Design",
};

/**
 * Cover overrides, keyed by project slug and holding an image id.
 *
 * The generated manifest orders images by filename, which is an accident of the
 * camera, not an editorial decision. This promotes a chosen frame to the hero slot.
 */
const COVER_OVERRIDES: Record<string, string> = {
  "oakville-project": "dsc2670-hdr",
};

/**
 * Frames pushed to the end of a project's sequence.
 *
 * They stay fully available inside the viewer, but fall outside the handful of
 * support tiles rendered on the page, so a shot can be kept in the set without
 * being given prominent placement.
 */
const DEFERRED_IMAGES: Record<string, string[]> = {
  "oakville-project": ["dsc2600-hdr"],
};

export type Project = GalleryProject & {
  meta: ProjectMeta;
  cover: GalleryImage;
  isFeatured: boolean;
};

const withMeta = (project: GalleryProject): Project => {
  const coverId = COVER_OVERRIDES[project.slug];
  const deferredIds = new Set(DEFERRED_IMAGES[project.slug] ?? []);

  const cover = coverId ? project.images.find((image) => image.id === coverId) : undefined;
  const deferred = project.images.filter((image) => deferredIds.has(image.id));

  // Order: chosen cover, then the remaining frames, then anything deferred. The
  // viewer walks this same array, so every image stays reachable.
  const middle = project.images.filter(
    (image) => image.id !== cover?.id && !deferredIds.has(image.id),
  );

  const images = [...(cover ? [cover] : []), ...middle, ...deferred];

  return {
    ...project,
    images,
    meta: META[project.slug] ?? FALLBACK_META,
    cover: images[0],
    isFeatured: project.category === "award",
  };
};

/** Projects that actually resolved to at least one usable image. */
const ALL: Project[] = GALLERY.filter((p) => p.images.length > 0).map(withMeta);

export const FEATURED_PROJECT: Project | undefined = ALL.find((p) => p.isFeatured);

export const SECONDARY_PROJECTS: Project[] = ALL.filter((p) => !p.isFeatured);

export const ALL_PROJECTS: Project[] = ALL;

/** Flat list used by the lightbox so it can page through every image on the site. */
export const ALL_IMAGES: { image: GalleryImage; project: Project }[] = ALL.flatMap((project) =>
  project.images.map((image) => ({ image, project })),
);

export const FILTERS = [
  { id: "all", label: "All Work" },
  { id: "interiors", label: "Interiors" },
  { id: "exteriors", label: "Exteriors" },
] as const;

export type FilterId = (typeof FILTERS)[number]["id"];

export type { GalleryImage, GalleryProject };
