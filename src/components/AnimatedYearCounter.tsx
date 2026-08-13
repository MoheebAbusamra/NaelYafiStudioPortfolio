"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView, animate } from "framer-motion"

const START_YEAR = 2016
const END_YEAR = 2026
const DIGIT_HEIGHT_EM = 1.1

const YEARS: number[] = []
for (let y = END_YEAR; y >= START_YEAR; y--) YEARS.push(y)

export default function AnimatedYearCounter() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.4 })

  const [offset, setOffset] = useState(0)
  const [landed, setLanded] = useState(false)

  useEffect(() => {
    if (!isInView) return

    const controls = animate(0, YEARS.length - 1, {
      duration: 3.2,
      ease: [0.16, 1, 0.3, 1], // ease-out expo-like cubic for natural deceleration
      onUpdate: (latest) => setOffset(latest),
      onComplete: () => setLanded(true),
    })

    return () => controls.stop()
  }, [isInView])

  return (
    <section
      ref={containerRef}
      aria-label={`Established ${START_YEAR}, celebrating ${END_YEAR}`}
      className="w-full bg-[#002B49] min-h-[60vh] flex flex-col items-center justify-center gap-6 py-24 px-6 overflow-hidden"
    >
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 0.7, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-[#F3F3F9] text-sm md:text-base tracking-[0.35em] uppercase font-sans"
      >
        {"Since"}
      </motion.p>

      {/* Digit viewport with odometer masking */}
      <div
        aria-hidden="true"
        className="relative select-none overflow-hidden"
        style={{
          height: `${DIGIT_HEIGHT_EM}em`,
          fontSize: "clamp(5rem, 18vw, 14rem)",
          lineHeight: 1,
          paddingInline: "1.8em",
          minWidth: "8rem",
        }}
      >
        {/* Rolling reel */}
        <div
          className="flex flex-col items-center will-change-transform"
          style={{
            transform: `translateY(${-offset * DIGIT_HEIGHT_EM}em)`,
          }}
        >
          {YEARS.map((year) => {
            const isFinal = year === START_YEAR
            return (
              <motion.span
                key={year}
                animate={
                  isFinal && landed
                    ? {
                      color: "#EBC71D",
                      textShadow:
                        "0 0 24px rgba(235, 199, 29, 0.45), 0 0 64px rgba(235, 199, 29, 0.2)",
                      scale: 1.04,
                    }
                    : {
                      color: "#F3F3F9",
                      textShadow: "0 0 0px rgba(235, 199, 29, 0)",
                      scale: 1,
                    }
                }
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="block font-sans font-bold tabular-nums tracking-[0.18em]"
                style={{ height: `${DIGIT_HEIGHT_EM}em` }}
              >
                {year}
              </motion.span>
            )
          })}
        </div>

        {/* Top depth mask */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[35%]"
          style={{
            background:
              "linear-gradient(to bottom, #002B49 0%, rgba(0,43,73,0) 100%)",
          }}
        />
        {/* Bottom depth mask */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[35%]"
          style={{
            background:
              "linear-gradient(to top, #002B49 0%, rgba(0,43,73,0) 100%)",
          }}
        />
      </div>

      {/* Screen-reader accessible final value */}
      <span className="sr-only">{START_YEAR}</span>

      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={landed ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="h-px w-24 origin-center"
        style={{ backgroundColor: "#EBC71D" }}
      />

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={landed ? { opacity: 0.75, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="text-[#F3F3F9] text-base md:text-lg font-sans text-balance text-center max-w-md"
      >
        {"Over a decade of crafting spaces that endure."}
      </motion.p>
    </section>
  )
}
