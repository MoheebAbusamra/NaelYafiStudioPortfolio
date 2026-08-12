"use client";

import { useState } from "react";

import { ContactCardModal } from "@/components/ContactCardModal";
import { DualPortfolioDecks } from "@/components/DualPortfolioDecks";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ScatteredGrid } from "@/components/ScatteredGrid";

/**
 * Single page composition.
 *
 * Contact modal state lives here because the header, hero, and footer all open it,
 * and the modal itself must render outside any transformed ancestor to stay fixed
 * to the viewport.
 */
export default function Page() {
  const [contactOpen, setContactOpen] = useState(false);
  const openContact = () => setContactOpen(true);

  return (
    <>
      <Header onContact={openContact} />

      <main>
        <Hero />
        <ScatteredGrid />
        <DualPortfolioDecks />
      </main>

      <Footer />

      <ContactCardModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
