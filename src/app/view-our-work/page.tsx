"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { ContactCardModal } from "@/components/ContactCardModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WorkCategorySlider } from "@/components/WorkCategorySlider";
import { PanoramaViewer } from "@/components/PanoramaViewer";

export default function ViewOurWorkPage() {
  const [contactOpen, setContactOpen] = useState(false);
  const openContact = () => setContactOpen(true);

  return (
    <>
      <Header onContact={openContact} />

      <main className="relative bg-navy pt-28 sm:pt-36 lg:pt-40">
        {/* Header Section */}
        <section className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <p className="text-[0.62rem] font-medium tracking-[0.3em] text-gold uppercase sm:text-[0.68rem]">
              Curated Portfolio & Archives
            </p>
            <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,5rem)] leading-none tracking-tight text-ivory">
              Selected Works & Spatial Experience
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ivory/65 sm:text-lg">
              Explore our architectural and interior design projects across Canada and internationally.
              Each space is crafted with natural materials, warmth, and precision.
            </p>
          </motion.div>

          {/* Signature Thin Gold Accent Line */}
          <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" />
        </section>

        {/* Category Slider & View All Frames Section */}
        <section className="mt-8 sm:mt-12">
          <WorkCategorySlider />
        </section>

        {/* Interactive 360 Panorama Viewer Section */}
        <section className="mt-16 border-t border-ivory/10 pt-8 sm:mt-24 sm:pt-16">
          <PanoramaViewer />
        </section>
      </main>

      <Footer />

      <ContactCardModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
