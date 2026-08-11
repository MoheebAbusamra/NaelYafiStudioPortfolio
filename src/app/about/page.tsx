"use client";

import { useState } from "react";

import { ContactCardModal } from "@/components/ContactCardModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { AboutServices } from "@/components/AboutServices";

export default function AboutPage() {
  const [contactOpen, setContactOpen] = useState(false);
  const openContact = () => setContactOpen(true);

  return (
    <>
      <Header onContact={openContact} />

      <main className="relative bg-navy">
        <div className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
          <AboutServices />
        </div>
      </main>

      <Footer />

      <ContactCardModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
