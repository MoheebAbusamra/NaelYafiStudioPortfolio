"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, RotateCcw, X } from "lucide-react";

import { CornerFrame } from "@/components/icons/Ornaments";
import { SOCIAL_ICONS } from "@/components/icons/SocialIcons";
import { useHasHover, useReducedMotion } from "@/hooks/use-reduced-motion";
import { CONTACT, SITE, SOCIALS } from "@/lib/site";

/**
 * Contact presented as a floating business card.
 *
 * The backdrop blurs the page, the card tilts toward the pointer in 3D, and the
 * details live on the reverse. Flipping is an explicit click rather than a hover,
 * because a hover flip is unreachable on touch and makes the copy button on the
 * back impossible to hit with a mouse without the card flipping away.
 */
export function ContactCardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const reducedMotion = useReducedMotion();
  const hasHover = useHasHover();

  const shellRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const tilt = useRef({ rx: 0, ry: 0 });
  const closeRef = useRef<HTMLButtonElement>(null);

  // Reset to the front face whenever the modal is dismissed, so reopening is
  // always a predictable starting state.
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setFlipped(false);
        setCopied(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const applyTilt = useCallback(() => {
    frame.current = null;
    const node = shellRef.current;
    if (!node) return;
    const { rx, ry } = tilt.current;
    node.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!hasHover || reducedMotion) return;

      // Tilt is driven by pointer position across the whole overlay, not just the
      // card, so the card reacts before the cursor reaches it.
      const px = event.clientX / window.innerWidth - 0.5;
      const py = event.clientY / window.innerHeight - 0.5;
      tilt.current = { rx: -py * 16, ry: px * 20 };

      if (frame.current === null) frame.current = requestAnimationFrame(applyTilt);
    },
    [hasHover, reducedMotion, applyTilt],
  );

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
    } catch {
      // Clipboard API is unavailable over plain HTTP and in some embedded views.
      // Fall back to a selection based copy so the action still succeeds.
      const field = document.createElement("textarea");
      field.value = CONTACT.email;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand("copy");
      } catch {
        return;
      } finally {
        document.body.removeChild(field);
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, []);

  useEffect(() => {
    if (frame.current !== null) return;
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onPointerMove={onPointerMove}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-navy-deep/60 px-4 py-10 backdrop-blur-[16px]"
          role="dialog"
          aria-modal="true"
          aria-label="Contact Nael Yafi Studio"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="fixed top-5 right-5 z-10 flex size-11 cursor-pointer items-center justify-center rounded-full border border-ivory/30 bg-navy-deep/40 text-ivory transition-colors hover:border-gold hover:bg-gold hover:text-navy-deep"
            aria-label="Close contact"
            autoFocus
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            // Stop clicks inside the card from reaching the dismiss handler.
            onClick={(event) => event.stopPropagation()}
            className="my-auto w-full max-w-[420px]"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              animate={reducedMotion ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Pointer tilt lives on this shell; the flip lives on the child so the
                  two transforms never overwrite one another. */}
              <div
                ref={shellRef}
                className="transition-transform duration-300 ease-out will-change-transform"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/*
                  A real business card is roughly 1.66:1, but at 375px that leaves
                  about 207px of height while the reverse needs roughly 232px for the
                  logo row, the email control, and a row of 44px social targets. The
                  card therefore relaxes its ratio on phones and carries a floor via
                  `min-h`, so the back can never crush its own content. The desktop
                  card keeps the true card proportion.
                */}
                <div
                  className="preserve-3d relative aspect-[1.42/1] min-h-[288px] w-full transition-transform duration-[750ms] ease-[var(--ease-luxe)] sm:aspect-[1.66/1] sm:min-h-0"
                  style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                >
                  <CardFront onFlip={() => setFlipped(true)} active={!flipped} />
                  <CardBack
                    copied={copied}
                    onCopy={copyEmail}
                    onFlip={() => setFlipped(false)}
                    active={flipped}
                  />
                </div>
              </div>
            </motion.div>

            <p className="mt-8 text-center text-[0.62rem] tracking-[0.24em] text-ivory/70 uppercase">
              {flipped ? "Tap the arrow to return" : "Tap the card to see details"}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CardFront({ onFlip, active }: { onFlip: () => void; active: boolean }) {
  return (
    <button
      type="button"
      onClick={onFlip}
      // `pointer-events-none` when flipped away is a belt and braces guard beside
      // `inert`: some mobile WebKit builds ignore backface for hit testing, which
      // let the hidden front's labels intercept taps meant for the email field.
      className={`backface-hidden absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-5 rounded-[10px] border border-gold/30 bg-gradient-to-br from-navy-soft via-navy to-navy-deep p-8 shadow-[0_35px_70px_-18px_rgba(0,0,0,0.7)] transition-opacity duration-300 ${
        active ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      }`}
      aria-label="Show contact details"
      tabIndex={active ? 0 : -1}
      aria-hidden={!active}
      // React 19 supports `inert` as a true boolean; the old empty-string hack
      // logged a console error and was treated as false, leaving the hidden face
      // focusable behind the visible one.
      inert={!active}
    >
      {/* Sheen, so the card reads as printed stock rather than a flat rectangle. */}
      <span className="pointer-events-none absolute inset-0 rounded-[10px] bg-[linear-gradient(115deg,transparent_38%,rgba(243,243,249,0.09)_50%,transparent_62%)]" />
      <span className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-gold/15 ring-inset" />

      {/* Filigree stays small and tight to the corners; the face is only ~250px
          tall, so a larger flourish would reach the logo. */}
      <CornerFrame opacity="opacity-45" size="size-11" inset={8} />

      <span className="backface-hidden relative z-10 block h-16 w-40 sm:h-20 sm:w-48">
        <Image
          src="/brand/logo-portrait-light.png"
          alt={SITE.name}
          fill
          sizes="192px"
          className="object-contain"
        />
      </span>

      <span className="backface-hidden relative z-10 h-px w-14 bg-gold/50" />

      <span className="backface-hidden relative z-10 text-[0.6rem] tracking-[0.3em] text-ivory/60 uppercase">
        Interior Design
      </span>

      <span className="backface-hidden relative z-10 mt-1 text-[0.58rem] tracking-[0.22em] text-gold uppercase">
        Click to flip
      </span>
    </button>
  );
}

function CardBack({
  copied,
  onCopy,
  onFlip,
  active,
}: {
  copied: boolean;
  onCopy: () => void;
  onFlip: () => void;
  active: boolean;
}) {
  return (
    <div
      // `isolate` pins a local stacking context so the decorative corner frames
      // and ring overlays can never climb above the email row on mobile Safari.
      className={`backface-hidden isolate absolute inset-0 flex flex-col justify-between gap-3 overflow-hidden rounded-[10px] border border-gold/30 bg-gradient-to-br from-charcoal to-navy-deep p-4 shadow-[0_35px_70px_-18px_rgba(0,0,0,0.7)] transition-opacity duration-300 sm:gap-2 sm:p-7 ${
        active ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      }`}
      style={{ transform: "rotateY(180deg)" }}
      // The back is behind the front until flipped; hide it from AT and tab order.
      aria-hidden={!active}
      // React 19 supports `inert` as a true boolean; the old empty-string hack
      // logged a console error and was treated as false, leaving the hidden face
      // focusable behind the visible one.
      inert={!active}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-gold/12 ring-inset" />
      <CornerFrame opacity="opacity-35" size="size-10" inset={7} />

      <div className="relative z-10 flex items-start justify-between gap-4 -mt-1 sm:mt-0">
        <div className="relative -mt-1.5 h-7 w-20 sm:mt-0 sm:h-9 sm:w-28">
          <Image
            src="/brand/logo-landscape-light.png"
            alt={SITE.name}
            fill
            sizes="80px"
            className="object-contain object-left"
          />
        </div>

        <button
          type="button"
          onClick={onFlip}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gold/35 text-gold transition-colors hover:border-gold hover:bg-gold hover:text-navy-deep"
          aria-label="Flip card back"
          tabIndex={active ? 0 : -1}
        >
          <RotateCcw className="size-3.5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="relative z-10">
        <p className="text-[0.55rem] tracking-[0.28em] text-gold/70 uppercase">Email</p>

        {/*
          Two distinct actions share one row: the address itself is a mailto link
          that opens the visitor's mail client, and the trailing button copies it
          to the clipboard. They are separate controls rather than a link wrapping
          a button, which would be invalid markup and ambiguous to activate.
        */}
        <div className="mt-2 flex min-h-[44px] items-stretch overflow-hidden rounded-[4px] border border-ivory/15 bg-ivory/5 transition-colors focus-within:border-gold/50 hover:border-gold/40">
          <a
            href={`mailto:${CONTACT.email}`}
            className="flex min-w-0 flex-1 items-center px-3 text-[0.8rem] text-ivory transition-colors hover:text-gold sm:px-3.5 sm:text-sm"
            aria-label={`Send an email to ${CONTACT.email}`}
            tabIndex={active ? 0 : -1}
          >
            <span className="truncate">{CONTACT.email}</span>
          </a>

          <button
            type="button"
            onClick={onCopy}
            className="flex w-11 shrink-0 cursor-pointer items-center justify-center border-l border-ivory/12 text-ivory transition-colors hover:bg-gold hover:text-navy-deep"
            aria-label={`Copy email address ${CONTACT.email}`}
            tabIndex={active ? 0 : -1}
          >
            {copied ? (
              <Check className="size-4 text-gold" strokeWidth={2} />
            ) : (
              <Copy className="size-3.5" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Announced politely so the confirmation is not silent for screen readers. */}
        <span aria-live="polite" className="sr-only">
          {copied ? "Email address copied to clipboard" : ""}
        </span>
        <span
          className={`mt-1.5 block text-[0.58rem] tracking-[0.2em] text-gold uppercase transition-opacity duration-300 ${
            copied ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        >
          Copied
        </span>
      </div>

      <div className="relative z-10">
        <p className="text-[0.55rem] tracking-[0.28em] text-gold/70 uppercase">Follow</p>

        <div className="mt-2.5 flex items-center gap-2.5">
          {SOCIALS.map((social) => {
            const Icon = SOCIAL_ICONS[social.label as keyof typeof SOCIAL_ICONS];
            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-11 items-center justify-center rounded-full border border-ivory/20 text-ivory/85 transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-navy-deep"
                aria-label={`${SITE.name} on ${social.label}`}
                tabIndex={active ? 0 : -1}
              >
                <Icon className="size-4" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
