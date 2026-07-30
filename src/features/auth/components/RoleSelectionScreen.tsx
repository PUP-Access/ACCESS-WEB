"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const SLIDES = [
  { src: "/LogInBG/BG1.webp", alt: "Campus outdoor area" },
  { src: "/LogInBG/BG2.webp", alt: "ACCESS event presentation" },
  { src: "/LogInBG/BG3.webp", alt: "ACCESS stage event" },
] as const;

const AUTO_INTERVAL_MS = 6000;

export default function RoleSelectionScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = useCallback((index: number) => {
    setActiveIndex((index + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, AUTO_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background slideshow */}
      {SLIDES.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={index === 0}
          className={`object-cover transition-opacity duration-1000 ease-in-out ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Overlays */}
      <div className="pointer-events-none absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

      {/* Logo */}
      <Link href="/" className="absolute left-5 top-5 z-20 sm:left-8 sm:top-8">
        <Image
          src="/AccessLogo.webp"
          alt="ACCESS"
          width={120}
          height={36}
          className="h-8 w-auto object-contain sm:h-9"
          priority
        />
      </Link>

      {/* Hero content */}
      <div className="relative z-10 flex min-h-screen flex-col justify-center px-5 pb-32 pt-24 sm:px-10 md:px-16 lg:px-24">
        <div className="max-w-xl">
          <h1
            className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,200,160,0.95) 45%, rgba(242,98,35,1) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Association of Concerned
            <br />
            Computer Engineering
            <br />
            for Service
          </h1>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-300 sm:text-base">
            Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur
            Lorem ipsum dolor sit amet consectetur Lorem ipsum
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/auth/login"
              className="inline-flex min-w-[140px] items-center justify-center rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-95 sm:text-base"
              style={{ background: "#F26223" }}
            >
              Log In
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex min-w-[140px] items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-black transition-all hover:bg-white/90 sm:text-base"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Thumbnail carousel */}
      <div className="absolute bottom-16 right-5 z-20 hidden gap-3 sm:flex sm:right-8 md:right-12 lg:bottom-20 lg:gap-4">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => goToSlide(index)}
            aria-label={`Show slide ${index + 1}`}
            aria-current={index === activeIndex}
            className={`relative h-[120px] w-[72px] overflow-hidden rounded-2xl transition-all duration-300 md:h-[150px] md:w-[88px] lg:h-[170px] lg:w-[96px] ${
              index === activeIndex
                ? "scale-105 ring-[3px] ring-[#F26223] ring-offset-2 ring-offset-black/40"
                : "opacity-80 hover:opacity-100"
            }`}
          >
            <Image src={slide.src} alt="" fill className="object-cover" sizes="96px" />
          </button>
        ))}
      </div>

      {/* Pagination dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              index === activeIndex ? "scale-110 bg-white" : "bg-white/35 hover:bg-white/55"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
