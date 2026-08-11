"use client";

import Image from "next/image";

import { InstagramIcon, SOCIAL_ICONS } from "@/components/icons/SocialIcons";
import { CONTACT, SISTER_STUDIO, SITE, SOCIALS } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative bg-navy-deep text-ivory">
      {/* Gold hairline marking the transition out of the page body. */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/35 to-transparent" />

      <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <div className="relative h-14 w-52 sm:h-16 sm:w-60">
              <Image
                src="/brand/logo-landscape-light.png"
                alt={SITE.name}
                fill
                loading="lazy"
                sizes="240px"
                className="object-contain object-left"
              />
            </div>

            <p className="mt-7 max-w-md text-base leading-relaxed text-ivory/60">{SITE.description}</p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <p className="text-[0.58rem] tracking-[0.28em] text-gold/70 uppercase">Contact</p>
              <a
                href={`mailto:${CONTACT.email}`}
                className="mt-4 inline-block text-sm break-all text-ivory/85 transition-colors hover:text-gold"
              >
                {CONTACT.email}
              </a>

              <p className="mt-9 text-[0.58rem] tracking-[0.28em] text-gold/70 uppercase">Follow</p>
              <div className="mt-4 flex items-center gap-2.5">
                {SOCIALS.map((social) => {
                  const Icon = SOCIAL_ICONS[social.label as keyof typeof SOCIAL_ICONS];
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-11 items-center justify-center rounded-full border border-ivory/20 text-ivory/80 transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-navy-deep"
                      aria-label={`${SITE.name} on ${social.label}`}
                    >
                      <Icon className="size-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[0.58rem] tracking-[0.28em] text-gold/70 uppercase">Sister Studio</p>
              <p className="mt-4 font-display text-2xl text-ivory">{SISTER_STUDIO.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-ivory/55">{SISTER_STUDIO.role}</p>
              <a
                href={SISTER_STUDIO.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm text-ivory/80 transition-colors hover:text-gold"
              >
                <InstagramIcon className="size-4" />
                {SISTER_STUDIO.handle}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-2.5 border-t border-ivory/10 pt-7 text-center text-[0.62rem] tracking-[0.18em] text-ivory/40 uppercase">
          <p>
            &copy; {new Date().getFullYear()} {SITE.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
