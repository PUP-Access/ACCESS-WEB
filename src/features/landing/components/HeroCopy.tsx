"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { HeroContent } from "@/features/cms";

type HeroCopyProps = Pick<
  HeroContent,
  "titleLines" | "subtitle" | "primaryCtaLabel" | "secondaryCtaLabel"
>;

const ease = [0.22, 1, 0.36, 1] as const;

export default function HeroCopy({
  titleLines,
  subtitle,
  primaryCtaLabel,
  secondaryCtaLabel,
}: HeroCopyProps) {
  const reduce = useReducedMotion();

  const titleStyle = {
    background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(242,98,35,1) 100%)",
    WebkitBackgroundClip: "text" as const,
    WebkitTextFillColor: "transparent",
    backgroundClip: "text" as const,
  };

  if (reduce) {
    return (
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-4 text-center sm:px-8 sm:pb-12 md:px-16 lg:px-24">
        <h1
          className="max-w-xs text-3xl font-extrabold leading-tight tracking-tight sm:max-w-lg sm:text-4xl md:max-w-2xl md:text-5xl lg:max-w-4xl lg:text-6xl"
          style={titleStyle}
        >
          {titleLines.map((line, index) => (
            <span key={`${line}-${index}`}>
              {line}
              {index < titleLines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-zinc-300 sm:max-w-md sm:text-base md:max-w-lg">
          {subtitle}
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Link
            href="/#about"
            className="rounded-lg py-3 text-sm font-semibold text-white text-center transition-opacity hover:opacity-90 px-8 sm:px-9 md:px-10 md:py-3.5 md:text-base"
            style={{ background: "#F26223" }}
          >
            {primaryCtaLabel}
          </Link>
          <Link
            href="/#contact"
            className="rounded-lg border border-white/30 bg-white/10 py-3 text-sm font-semibold text-white text-center backdrop-blur-sm transition-colors hover:bg-white/20 px-8 sm:px-9 md:px-10 md:py-3.5 md:text-base"
          >
            {secondaryCtaLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-4 text-center sm:px-8 sm:pb-12 md:px-16 lg:px-24">
      <motion.h1
        className="max-w-xs text-3xl font-extrabold leading-tight tracking-tight sm:max-w-lg sm:text-4xl md:max-w-2xl md:text-5xl lg:max-w-4xl lg:text-6xl"
        style={titleStyle}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
      >
        {titleLines.map((line, index) => (
          <motion.span
            key={`${line}-${index}`}
            className="block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.08 + index * 0.1 }}
          >
            {line}
          </motion.span>
        ))}
      </motion.h1>

      <motion.p
        className="mt-5 max-w-sm text-sm leading-relaxed text-zinc-300 sm:max-w-md sm:text-base md:max-w-lg"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.35 }}
      >
        {subtitle}
      </motion.p>

      <motion.div
        className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.5 }}
      >
        <Link
          href="/#about"
          className="rounded-lg py-3 text-sm font-semibold text-white text-center transition-opacity hover:opacity-90 px-8 sm:px-9 md:px-10 md:py-3.5 md:text-base"
          style={{ background: "#F26223" }}
        >
          {primaryCtaLabel}
        </Link>
        <Link
          href="/#contact"
          className="rounded-lg border border-white/30 bg-white/10 py-3 text-sm font-semibold text-white text-center backdrop-blur-sm transition-colors hover:bg-white/20 px-8 sm:px-9 md:px-10 md:py-3.5 md:text-base"
        >
          {secondaryCtaLabel}
        </Link>
      </motion.div>
    </div>
  );
}
