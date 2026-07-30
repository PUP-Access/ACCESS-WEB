"use client";

import Image from "next/image";
import Link from "next/link";
import type { OfficersSectionContent } from "@/features/cms";
import { Reveal, RevealStagger } from "./Reveal";

type MeetTheOfficersSectionProps = {
  content: OfficersSectionContent;
};

export default function MeetTheOfficersSection({ content }: MeetTheOfficersSectionProps) {
  const parts = content.parts || [];

  return (
    <section id="officers" className="landing-section scroll-mt-24 relative overflow-hidden py-16 px-5 sm:px-8 md:px-16 lg:px-24">
      <div
        className="absolute left-0 right-0 pointer-events-none overflow-hidden top-[46%] sm:top-[44%] md:top-[42%] lg:top-[40%] -translate-y-1/2 h-[240px] sm:h-[260px] md:h-[300px] z-[1]"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)",
        }}
      >
        <Image
          src={content.templateImageUrl}
          alt=""
          fill
          unoptimized={content.templateImageUrl.startsWith("http")}
          className="object-cover object-center"
          style={{
            opacity: 0.8,
            filter: "blur(2px) saturate(1.4)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 35%, black 65%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 35%, black 65%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(180,50,10,0.30) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-20 mx-auto max-w-5xl w-full">
        <Reveal>
          <h2 className="mb-10 text-center text-6xl font-extrabold tracking-widest title-header">
            {content.title}
          </h2>
          <p
            className="mb-12 text-center text-sm sm:text-base max-w-lg mx-auto leading-relaxed"
            style={{ color: "rgb(255, 255, 255)" }}
          >
            {content.subtitle}
          </p>
        </Reveal>

        {parts.length > 0 ? (
          <RevealStagger
            className="mx-auto flex max-w-4xl flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6"
            itemClassName="w-full sm:w-auto"
          >
            {parts.map((part) => (
              <Link
                key={part.id}
                href={part.link}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-8 py-5 text-sm sm:text-base font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F26223]/60 hover:bg-[#F26223]/20 hover:shadow-[0_16px_48px_rgba(242,98,35,0.35)] text-center"
              >
                {part.label}
              </Link>
            ))}
          </RevealStagger>
        ) : (
          <div className="text-center text-white/60">No buttons configured.</div>
        )}
      </div>
    </section>
  );
}
