/**
 * Build-time asset pipeline.
 *
 * Source photography in /Assets is full resolution (up to ~20 MB per file), which is
 * not shippable to a browser. This script derives web sized WebP variants plus an
 * inline blur placeholder, copies the brand and award artwork that the UI needs, and
 * emits a typed manifest consumed by the gallery components.
 *
 * Run: npm run gallery
 *
 * Output:
 *   public/gallery/<project-slug>/<image-id>-{card,full}.webp
 *   public/brand/*.png
 *   public/award/*
 *   src/lib/generated/gallery.ts
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = path.join(ROOT, "Assets");
const PUBLIC = path.join(ROOT, "public");
const MANIFEST = path.join(ROOT, "src", "lib", "generated", "gallery.ts");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

/** Cards render at roughly a third of the viewport, so 1400px covers 2x on most screens. */
const CARD_WIDTH = 1400;
/** Lightbox target: enough for a full bleed 2x view without absurd payloads. */
const FULL_WIDTH = 2400;
const BLUR_WIDTH = 20;

/**
 * Source folders mapped to portfolio categories. "Oakville project" is the award
 * winning work and stays a single project with every photo. The Interiors and
 * Exterior folders hold several distinct projects each, split by filename below.
 */
const COLLECTIONS = [
  { dir: "Oakville project", category: "award", split: false, title: "Oakville Residence" },
  { dir: "Interiors", category: "interiors", split: true },
  { dir: "Exterior", category: "exteriors", split: true },
];

/** Brand and award artwork copied verbatim; these are already small and need alpha. */
const STATIC_COPIES = [
  ["Logos/LANDSCAPE-COLORED LOGO-BLACK TEXT.png", "brand/logo-landscape-dark.png"],
  ["Logos/LANDSCAPE-COLORED LOGO-WHITE TEXT.png", "brand/logo-landscape-light.png"],
  ["Logos/PORTRAIT LOGO.png", "brand/logo-portrait-dark.png"],
  ["Logos/PORTRAIT-ALL WHITE.png", "brand/logo-portrait-light.png"],
  ["Logos/COLORED LOGO ONLY.png", "brand/monogram.png"],
  ["Canadian Choice Award/Winner-2026.png", "award/seal-2026.png"],
];

/**
 * Hero illustration.
 *
 * `FinalHome.png` already ships with a real alpha channel, so it only needs the
 * empty margin trimmed. `NewHouseHome.jpeg` is kept as a fallback: it is a JPEG
 * with a solid black backdrop, which `keyBlackBackground` converts to alpha.
 */
const HERO_SOURCES = [
  { file: "FinalHome.png", key: false },
  { file: "NewHouseHome.jpeg", key: true },
];
const HERO_OUT = "brand/home-house.webp";

/** Award poster shown in the About section; resized since it is a full 1080x1350 render. */
const AWARD_POSTER = "Canadian Choice Award/Winner-Social-Media-Poster-2026-2.png";

/** Display names for filename stems that are not presentable as written. */
const TITLE_OVERRIDES = {
  misc: "Detail Studies",
  living: "Living Room",
  guest: "Guest Suite",
  "the gate": "The Gate",
  "80 fh": "80 Forest Hill",
  bedroom: "Principal Bedroom",
  cottage: "Lakeside Cottage",
  dining: "Dining Room",
  foyer: "Grand Foyer",
  kitchen: "Kitchen",
  montreal: "Montreal Residence",
  office: "Executive Office",
  arizona: "Arizona Residence",
  conceptual: "Conceptual Studies",
  landscape: "Landscape Design",
  "villa bey": "Villa Bey",
};

const slugify = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");

/**
 * Files are named like "guest (1).jpg", "Dining 2.jpg", "living.jpg". Stripping a
 * trailing index yields the project each photo belongs to.
 */
const projectStem = (fileName) =>
  path
    .parse(fileName)
    .name.replace(/[\s_]*\(\s*\d+\s*\)\s*$/, "")
    .replace(/[\s_]+\d+\s*$/, "")
    .replace(/[\s_]+/g, " ")
    .trim()
    .toLowerCase();

const titleize = (value) =>
  TITLE_OVERRIDES[value] ??
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Average hash over a 16x16 grayscale reduction. Catches the same photo saved in two
 * formats (Assets/Exterior holds both a JPG and a PNG of "Villa Bey (1)").
 */
async function perceptualHash(pipeline) {
  const { data } = await pipeline
    .clone()
    .greyscale()
    .resize(16, 16, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mean = data.reduce((sum, v) => sum + v, 0) / data.length;
  let bits = "";
  for (const v of data) bits += v > mean ? "1" : "0";
  return bits;
}

async function derive(srcPath, destBase) {
  // rotate() with no argument bakes in EXIF orientation. Metadata is not copied
  // forward, so camera and GPS data never reach the public folder.
  const pipeline = sharp(srcPath, { limitInputPixels: false }).rotate();
  const meta = await pipeline.metadata();

  const oriented = meta.autoOrient ?? {};
  const width = oriented.width ?? meta.width ?? 0;
  const height = oriented.height ?? meta.height ?? 0;
  if (!width || !height) throw new Error(`Unable to read dimensions for ${path.basename(srcPath)}`);

  await pipeline
    .clone()
    .resize({ width: Math.min(CARD_WIDTH, width), withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(`${destBase}-card.webp`);

  await pipeline
    .clone()
    .resize({ width: Math.min(FULL_WIDTH, width), withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toFile(`${destBase}-full.webp`);

  const blur = await pipeline
    .clone()
    .resize({ width: BLUR_WIDTH })
    .webp({ quality: 30, smartSubsample: true })
    .toBuffer();

  return {
    width,
    height,
    orientation: width / height > 1.15 ? "landscape" : width / height < 0.85 ? "portrait" : "square",
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

/**
 * Removes a solid black studio backdrop and returns a trimmed PNG buffer with alpha.
 *
 * A plain luminance threshold is not usable here: the subject contains genuinely
 * black pixels (roof tiles, window frames, shadow under the eaves) and thresholding
 * would punch holes straight through them. Instead the background is found by flood
 * filling inward from the border, so only black that is actually connected to the
 * outside is removed and enclosed dark detail is preserved.
 *
 * Edges are then feathered and un premultiplied. The source was composited against
 * black, so a partially covered edge pixel arrives darkened; dividing by its own
 * coverage restores the true colour and avoids the grey halo that a hard cut leaves.
 */
async function keyBlackBackground(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = width * height;

  const luma = new Uint8Array(pixels);
  for (let p = 0; p < pixels; p += 1) {
    const i = p * channels;
    // Rec. 601 luma is close enough for a coverage estimate and is cheap.
    luma[p] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
  }

  // Anything at or below this is treated as backdrop when reachable from an edge.
  const BACKGROUND_MAX_LUMA = 26;
  // Above this a pixel is fully opaque; between the two it is a soft edge.
  const OPAQUE_MIN_LUMA = 68;

  const isBackground = new Uint8Array(pixels);
  const queue = new Int32Array(pixels);
  let head = 0;
  let tail = 0;

  const push = (p) => {
    if (isBackground[p] || luma[p] > BACKGROUND_MAX_LUMA) return;
    isBackground[p] = 1;
    queue[tail++] = p;
  };

  for (let x = 0; x < width; x += 1) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    const y = (p / width) | 0;

    if (x > 0) push(p - 1);
    if (x < width - 1) push(p + 1);
    if (y > 0) push(p - width);
    if (y < height - 1) push(p + width);
  }

  for (let p = 0; p < pixels; p += 1) {
    const i = p * channels;

    if (!isBackground[p]) {
      data[i + 3] = 255;
      continue;
    }

    // Coverage ramp across the antialiased boundary of the cut out.
    const value = luma[p];
    if (value <= BACKGROUND_MAX_LUMA) {
      data[i + 3] = 0;
      continue;
    }

    const coverage = Math.min(1, (value - BACKGROUND_MAX_LUMA) / (OPAQUE_MIN_LUMA - BACKGROUND_MAX_LUMA));
    data[i + 3] = Math.round(coverage * 255);

    // Un premultiply so the edge keeps its real colour instead of a dark rim.
    data[i] = Math.min(255, Math.round(data[i] / coverage));
    data[i + 1] = Math.min(255, Math.round(data[i + 1] / coverage));
    data[i + 2] = Math.min(255, Math.round(data[i + 2] / coverage));
  }

  return sharp(data, { raw: { width, height, channels } })
    // Drop the empty margin so the subject fills its box and can be sized predictably.
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
}

async function readSourceDir(dir) {
  const full = path.join(ASSETS, dir);
  if (!existsSync(full)) {
    console.warn(`[assets] Missing source folder: Assets/${dir}`);
    return [];
  }
  const entries = await readdir(full, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && IMAGE_EXT.has(path.extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/** Groups a folder's files into projects, dropping duplicate photos. */
async function planProjects(collection) {
  const files = await readSourceDir(collection.dir);
  if (files.length === 0) return [];

  const seen = new Map();
  const groups = new Map();

  for (const file of files) {
    const srcPath = path.join(ASSETS, collection.dir, file);

    let hash;
    let pixels;
    try {
      const pipeline = sharp(srcPath, { limitInputPixels: false }).rotate();
      const meta = await pipeline.metadata();
      const oriented = meta.autoOrient ?? {};
      pixels = (oriented.width ?? meta.width ?? 0) * (oriented.height ?? meta.height ?? 0);
      hash = await perceptualHash(pipeline);
    } catch (error) {
      console.warn(`[assets] Unreadable, skipping ${collection.dir}/${file}: ${error.message}`);
      continue;
    }

    const previous = seen.get(hash);
    if (previous) {
      // Same photo in two formats: keep whichever has more pixels.
      if (pixels <= previous.pixels) {
        console.log(`[assets] Duplicate skipped: ${collection.dir}/${file}`);
        continue;
      }
      const bucket = groups.get(previous.stem);
      const at = bucket.indexOf(previous.file);
      if (at !== -1) bucket.splice(at, 1);
      console.log(`[assets] Duplicate replaced: ${collection.dir}/${previous.file}`);
    }

    const stem = collection.split ? projectStem(file) : slugify(collection.dir);
    seen.set(hash, { file, pixels, stem });
    if (!groups.has(stem)) groups.set(stem, []);
    groups.get(stem).push(file);
  }

  return [...groups.entries()]
    .filter(([, files]) => files.length > 0)
    .map(([stem, files]) => ({
      slug: slugify(collection.split ? `${collection.category} ${stem}` : collection.dir),
      title: collection.split ? titleize(stem) : (collection.title ?? titleize(stem)),
      category: collection.category,
      dir: collection.dir,
      files,
    }));
}

async function main() {
  const galleryOut = path.join(PUBLIC, "gallery");
  await rm(galleryOut, { recursive: true, force: true });
  await mkdir(galleryOut, { recursive: true });
  await mkdir(path.dirname(MANIFEST), { recursive: true });

  const manifest = [];
  let totalSource = 0;
  let totalOutput = 0;

  for (const collection of COLLECTIONS) {
    for (const project of await planProjects(collection)) {
      const destDir = path.join(galleryOut, project.slug);
      await mkdir(destDir, { recursive: true });

      const images = [];
      const usedIds = new Set();

      for (const file of project.files) {
        const srcPath = path.join(ASSETS, project.dir, file);

        // Ids come from the filename, so guard against two names colliding once slugified.
        let id = slugify(path.parse(file).name) || createHash("sha1").update(file).digest("hex").slice(0, 8);
        if (usedIds.has(id)) {
          let n = 2;
          while (usedIds.has(`${id}-${n}`)) n += 1;
          id = `${id}-${n}`;
        }
        usedIds.add(id);

        const destBase = path.join(destDir, id);

        try {
          const info = await derive(srcPath, destBase);

          totalSource += (await stat(srcPath)).size;
          for (const variant of ["card", "full"]) {
            totalOutput += (await stat(`${destBase}-${variant}.webp`)).size;
          }

          images.push({
            id,
            card: `/gallery/${project.slug}/${id}-card.webp`,
            full: `/gallery/${project.slug}/${id}-full.webp`,
            ...info,
          });
        } catch (error) {
          // One bad file must not fail the build; the UI falls back to a placeholder
          // container for any project that ends up empty.
          console.warn(`[assets] Skipped ${project.dir}/${file}: ${error.message}`);
        }
      }

      if (images.length > 0) {
        manifest.push({
          slug: project.slug,
          title: project.title,
          category: project.category,
          images,
        });
        console.log(`[assets] ${project.slug.padEnd(30)} ${images.length} image(s)`);
      }
    }
  }

  // Brand and award artwork.
  for (const [from, to] of STATIC_COPIES) {
    const src = path.join(ASSETS, from);
    const dest = path.join(PUBLIC, to);
    if (!existsSync(src)) {
      console.warn(`[assets] Missing brand asset: Assets/${from}`);
      continue;
    }
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(src, dest);
  }

  const posterSrc = path.join(ASSETS, AWARD_POSTER);
  if (existsSync(posterSrc)) {
    const dest = path.join(PUBLIC, "award", "poster-2026.webp");
    await mkdir(path.dirname(dest), { recursive: true });
    await sharp(posterSrc).resize({ width: 1080, withoutEnlargement: true }).webp({ quality: 84 }).toFile(dest);
  } else {
    console.warn(`[assets] Missing award poster: Assets/${AWARD_POSTER}`);
  }

  // Hero cut out. First source that exists wins, so dropping a new FinalHome.png
  // into /Assets is all it takes to swap the hero.
  const hero = HERO_SOURCES.find((candidate) => existsSync(path.join(ASSETS, candidate.file)));
  if (hero) {
    const heroSrc = path.join(ASSETS, hero.file);
    const dest = path.join(PUBLIC, HERO_OUT);
    await mkdir(path.dirname(dest), { recursive: true });

    // Already has alpha: just trim the empty margin so the subject fills its box
    // and can be sized predictably in CSS.
    const prepared = hero.key
      ? await keyBlackBackground(heroSrc)
      : await sharp(heroSrc).ensureAlpha().trim({ threshold: 1 }).png().toBuffer();

    const info = await sharp(prepared)
      .resize({ width: 1800, withoutEnlargement: true })
      .webp({ quality: 88, alphaQuality: 90, effort: 5 })
      .toFile(dest);

    console.log(
      `[assets] hero ${hero.file} -> ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`,
    );
  } else {
    console.warn(`[assets] Missing hero image, tried: ${HERO_SOURCES.map((c) => c.file).join(", ")}`);
  }

  const body = `// Generated by scripts/build-gallery.mjs. Do not edit by hand.
// Run \`npm run gallery\` after changing anything in /Assets.

export type GalleryCategory = "award" | "interiors" | "exteriors";

export type GalleryImage = {
  id: string;
  card: string;
  full: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait" | "square";
  blurDataURL: string;
};

export type GalleryProject = {
  slug: string;
  title: string;
  category: GalleryCategory;
  images: GalleryImage[];
};

export const GALLERY: GalleryProject[] = ${JSON.stringify(manifest, null, 2)};
`;

  await writeFile(MANIFEST, body, "utf8");

  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
  const count = manifest.reduce((n, p) => n + p.images.length, 0);
  console.log(`\n[assets] ${manifest.length} project(s), ${count} image(s)`);
  console.log(`[assets] source ${mb(totalSource)} MB  ->  web ${mb(totalOutput)} MB`);
}

main().catch((error) => {
  console.error("[assets] Build failed:", error);
  process.exitCode = 1;
});
