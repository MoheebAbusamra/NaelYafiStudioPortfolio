"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { NAV_LINKS, SITE } from "@/lib/site";

/**
 * Fixed header.
 *
 * Transparent over the hero, then adopts a translucent navy backdrop once the page
 * scrolls so links stay legible against photography. On small screens the links
 * collapse into a full screen sheet, since three items plus a contact action do not
 * fit at 375px without shrinking targets below the 44px minimum.
 */
export function Header({ onContact }: { onContact: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page while the mobile sheet is open, otherwise the body scrolls
  // underneath the overlay on iOS.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled
            ? "bg-navy/85 backdrop-blur-md shadow-[0_1px_0_rgba(235,199,29,0.14)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <a
            href="#top"
            className="relative block h-12 w-[184px] shrink-0 transition-opacity duration-300 hover:opacity-85 sm:h-16 sm:w-[248px] lg:h-[72px] lg:w-[288px]"
            aria-label={`${SITE.name} home`}
          >
            <Image
              src="/brand/logo-landscape-light.png"
              alt={SITE.name}
              fill
              priority
              sizes="(max-width: 640px) 184px, (max-width: 1024px) 248px, 288px"
              className="object-contain object-left"
            />
          </a>

          {/*
            Hairline gold rule framing the links, with a thin vertical divider before
            the contact action. Reads as an engraved plate rather than a plain row.
          */}
          <nav
            className="hidden items-center gap-9 rounded-full border border-ivory/12 bg-navy-deep/25 px-8 py-2.5 backdrop-blur-sm md:flex lg:gap-11"
            aria-label="Primary"
          >
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}

            <span aria-hidden="true" className="h-5 w-px bg-ivory/15" />

            <NavLink label="Contact" onClick={onContact} />
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-gold hover:text-gold md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] flex flex-col bg-navy md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="relative h-9 w-[132px]">
                <Image
                  src="/brand/logo-landscape-light.png"
                  alt={SITE.name}
                  fill
                  sizes="132px"
                  className="object-contain object-left"
                />
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-ivory/25 text-ivory"
                aria-label="Close menu"
                autoFocus
              >
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center gap-2 px-6 pb-24" aria-label="Mobile">
              {NAV_LINKS.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index + 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="border-b border-ivory/12 py-5 font-display text-3xl text-ivory"
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onContact();
                }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * NAV_LINKS.length + 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 cursor-pointer rounded-full bg-gold px-8 py-4 text-sm tracking-[0.2em] text-navy-deep uppercase"
              >
                Contact
              </motion.button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Primary navigation item.
 *
 * The hover effect is a masked slide: the label is duplicated, the pair is stacked
 * inside a fixed height clip, and the stack translates up by exactly one line on
 * hover. The incoming copy is gold, so the label appears to roll over and change
 * colour in one motion.
 *
 * The travel is `-translate-y-1/2`, not `-translate-y-full`. Percentage translations
 * resolve against the moving element, which here is the two line stack: a full
 * translation lifts both copies clear of the clip and the item reads as empty, while
 * half the stack is exactly one line and lands the duplicate in the slot the
 * original just left.
 *
 * Every box in the stack is pinned to the same `1.2em`, so the clip, each copy, and
 * the travel distance stay locked together and track the font size rather than a
 * hard coded pixel value. The extra `0.2em` over the cap height keeps the uppercase
 * letters off the edges of the mask.
 *
 * Renders an anchor when given `href` and a button otherwise, so the contact action
 * shares the exact same treatment without pretending to be a link.
 */
function NavLink({
  label,
  href,
  onClick,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="block h-[1.2em] overflow-hidden">
        <span className="block transition-transform duration-[420ms] ease-[var(--ease-luxe)] group-hover:-translate-y-1/2">
          <span className="flex h-[1.2em] items-center leading-none">{label}</span>
          <span aria-hidden="true" className="flex h-[1.2em] items-center leading-none text-gold">
            {label}
          </span>
        </span>
      </span>

      {/* Rule that draws in from the left as the label rolls. */}
      <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold transition-[width] duration-[420ms] ease-[var(--ease-luxe)] group-hover:w-full" />
    </>
  );

  const className =
    "group relative cursor-pointer text-[0.7rem] font-medium tracking-[0.22em] text-ivory uppercase";

  if (href) {
    return (
      <a href={href} className={className}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}
