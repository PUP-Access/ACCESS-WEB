"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { AboutContent } from "@/features/cms";
import { Reveal } from "./Reveal";



const fadeVariants = {
  enter: {
    opacity: 0,
  },
  center: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeInOut" as const,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: "easeInOut" as const,
    },
  },
};

type AboutSectionProps = {
  content: AboutContent;
};

export default function AboutSection({ content }: AboutSectionProps) {
  const carouselImages = content.carouselImages || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (carouselImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    if (carouselImages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const handlePrev = () => {
    if (carouselImages.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section id="about" className="landing-section relative overflow-hidden w-full bg-[#0d0d0d] flex flex-col scroll-mt-24">
      {/* ── IMAGE CAROUSEL CONTAINER (TOP HALF) ── */}
      <Reveal className="relative w-full h-[280px] sm:h-[380px] md:h-[480px] lg:h-[560px] overflow-hidden bg-black flex items-center justify-center" y={16}>
        <AnimatePresence initial={false}>
          <motion.div
            key={currentIndex}
            variants={fadeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            {carouselImages.length > 0 && (
              <Image
                src={carouselImages[currentIndex]}
                alt={`About us slide ${currentIndex + 1}`}
                fill
                priority
                className="object-cover object-center"
              />
            )}
          </motion.div>
        </AnimatePresence>


        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          aria-label="Previous slide"
          className="absolute left-4 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all focus:outline-none hover:scale-105 active:scale-95 hidden sm:flex"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 19L8 12L15 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          onClick={handleNext}
          aria-label="Next slide"
          className="absolute right-4 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all focus:outline-none hover:scale-105 active:scale-95 hidden sm:flex"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5L16 12L9 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Centered Indicator Dots */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-2.5">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className="w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none"
              style={{
                background: index === currentIndex ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                boxShadow: index === currentIndex ? "0 0 8px rgba(255, 255, 255, 0.8)" : "none",
                transform: index === currentIndex ? "scale(1.25)" : "scale(1)",
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Reveal>

      {/* ── TEXT CONTENT SECTION (BOTTOM HALF) ── */}
      <div
        className="relative z-10 px-6 py-16 md:py-24 text-center"
        style={{
          background: "linear-gradient(to bottom, #2a0a00ff 0%, #b83007 2git%, #731202 100%)",
        }}
      >
        {/* Subtle decorative glow to enhance depth */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square z-0"
          style={{
            background: "radial-gradient(circle, rgba(255, 140, 20, 0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <Reveal className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="mb-10 text-center text-6xl font-extrabold tracking-widest title-header">
            {content.title}
          </h2>

          <p
            className="text-zinc-200 text-sm sm:text-base md:text-lg leading-relaxed max-w-4xl px-4 font-normal tracking-wide whitespace-pre-wrap"
            style={{ textAlign: content.textAlign || "center" }}
          >
            {content.body}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
