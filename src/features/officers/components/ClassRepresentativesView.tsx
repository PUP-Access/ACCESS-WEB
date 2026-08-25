"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  DEFAULT_CLASS_REPRESENTATIVES,
  type YearLevelReps,
  type ClassRepSectionItem,
} from "../data/class-representatives";
import OfficerModal from "./OfficerModal";
import type { OfficerItem } from "../data/officers-hierarchy";

const LAVA_BANNER_BG = `
  linear-gradient(38deg,
    transparent 27%, rgba(255,175,10,0.95) 29.5%, rgba(255,225,65,1) 30.5%,
    rgba(255,175,10,0.95) 31.5%, transparent 34%),
  linear-gradient(56deg,
    transparent 44%, rgba(230,95,0,0.85) 46%, rgba(255,148,0,0.95) 47%,
    rgba(230,95,0,0.85) 48%, transparent 50%),
  linear-gradient(130deg,
    transparent 54%, rgba(255,130,0,0.75) 56%, rgba(255,185,30,0.85) 57%,
    rgba(255,130,0,0.75) 58%, transparent 60%),
  linear-gradient(170deg,
    transparent 34%, rgba(200,55,0,0.60) 36%, rgba(240,110,10,0.70) 37%,
    transparent 39%),
  linear-gradient(-15deg,
    transparent 58%, rgba(195,50,0,0.65) 60%, rgba(245,115,5,0.75) 61%,
    transparent 63%),
  radial-gradient(ellipse at 22% 52%, rgba(255,110,0,0.80) 0%, transparent 38%),
  radial-gradient(ellipse at 75% 22%, rgba(210,65,0,0.70) 0%, transparent 32%),
  radial-gradient(ellipse at 60% 82%, rgba(185,40,0,0.60) 0%, transparent 30%),
  radial-gradient(ellipse at 10% 78%, rgba(235,95,0,0.60) 0%, transparent 28%),
  radial-gradient(ellipse at 88% 65%, rgba(255,145,15,0.55) 0%, transparent 26%),
  linear-gradient(145deg, #100200 0%, #2a0501 35%, #140300 65%, #300803 100%)
`;

interface ClassRepresentativesViewProps {
  initialYearLevels?: YearLevelReps[];
}

export default function ClassRepresentativesView({
  initialYearLevels = DEFAULT_CLASS_REPRESENTATIVES,
}: ClassRepresentativesViewProps) {
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerItem | null>(null);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    const anchor = document.getElementById("class-reps-top");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "instant", block: "start" });
    }
  };

  useEffect(() => {
    scrollToTop();
    const timer = setTimeout(scrollToTop, 50);
    return () => clearTimeout(timer);
  }, [selectedYearId]);

  const yearLevels = initialYearLevels || DEFAULT_CLASS_REPRESENTATIVES;
  const selectedYear = yearLevels.find((y) => y.id === selectedYearId);

  // ─────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 2: Specific Year Level Section Representatives View
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedYear) {
    return (
      <div className="w-full flex flex-col items-center py-4 select-none animate-in fade-in duration-200">
        <div id="class-reps-top" className="h-0 w-0 opacity-0 pointer-events-none" />

        {/* Back Button */}
        <div className="w-full max-w-5xl flex justify-start mb-6 px-4">
          <button
            type="button"
            onClick={() => {
              setSelectedYearId(null);
              scrollToTop();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-[#F26223] hover:border-[#F26223] transition-all duration-200 shadow-md"
          >
            <span>←</span>
            <span>Back to All Year Levels</span>
          </button>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 relative z-10 px-4">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-widest title-header pb-2"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #ffdfc4 40%, #f26223 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.6))",
            }}
          >
            {selectedYear.label} Class Representatives
          </h1>
          <p className="mt-3 text-xs sm:text-sm md:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            We are a community of student leaders and innovators committed to advancing technology, collaboration, and excellence within PUP.
          </p>
        </div>

        {/* Grid of Section Representatives */}
        <div className="w-full max-w-5xl mx-auto flex flex-wrap justify-center gap-6 sm:gap-8 px-4 relative z-10">
          {selectedYear.representatives.map((rep) => (
            <div
              key={rep.id}
              onClick={() => setSelectedOfficer(rep)}
              className="relative w-[240px] sm:w-[260px] md:w-[280px] rounded-[24px] border-[1.5px] border-white/60 bg-[#160603] text-white shadow-[0_15px_40px_rgba(0,0,0,0.85)] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F26223] hover:shadow-[0_20px_50px_rgba(242,98,35,0.3)] group"
            >
              {/* Fiery Molten Lava Banner */}
              <div
                className="relative w-full h-24 sm:h-28 overflow-hidden"
                style={{ background: LAVA_BANNER_BG }}
              />

              {/* Avatar overlapping banner */}
              <div className="relative -mt-12 flex justify-center z-10">
                <div
                  className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full overflow-hidden flex items-center justify-center bg-[#180603]"
                  style={{
                    border: "3.5px solid #dfc3b4",
                    boxShadow: "0 0 14px 2px rgba(223, 195, 180, 0.35), 0 6px 18px rgba(0,0,0,0.85)",
                  }}
                >
                  {rep.imageUrl ? (
                    <Image
                      src={rep.imageUrl}
                      alt={rep.name}
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f26223] via-[#a33515] to-[#501308] text-white font-extrabold text-xl">
                      {rep.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-4 sm:p-5 text-center flex flex-col items-center">
                <h4
                  className="font-extrabold text-white text-sm sm:text-base leading-tight truncate w-full"
                  title={rep.displayName || rep.name}
                >
                  {rep.displayName || rep.name}
                </h4>
                <p className="font-extrabold text-[#e85e1e] text-xs uppercase tracking-wider mt-1">
                  {rep.section || rep.courseYear || "CLASS REPRESENTATIVE"}
                </p>
                <p className="text-zinc-300 text-xs leading-relaxed mt-2.5 line-clamp-3">
                  {rep.bio || "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Popup */}
        <OfficerModal
          officer={selectedOfficer}
          onClose={() => setSelectedOfficer(null)}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 1: Year Level Cards Overview (1st, 2nd, 3rd, 4th, P Years)
  // ─────────────────────────────────────────────────────────────────────────
  const topRowYears = yearLevels.slice(0, 3); // 1st, 2nd, 3rd Years
  const bottomRowYears = yearLevels.slice(3); // 4th, P Years

  return (
    <div className="w-full flex flex-col items-center py-4 select-none animate-in fade-in duration-200">
      <div id="class-reps-top" className="h-0 w-0 opacity-0 pointer-events-none" />

      {/* Main Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 relative z-10 px-4">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-widest title-header pb-2"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #ffdfc4 40%, #f26223 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.6))",
          }}
        >
          Class Representative
        </h1>
        <p className="mt-3 text-xs sm:text-sm md:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
          We are a community of student leaders and innovators committed to advancing technology, collaboration, and excellence within PUP.
        </p>
      </div>

      {/* ── Year Level Cards Grid ─────────────────────────────────── */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-7 sm:gap-9 relative z-10 px-4">
        {/* Row 1: 3 cards (1st, 2nd, 3rd Years) */}
        <div className="w-full flex flex-wrap justify-center gap-6 sm:gap-8">
          {topRowYears.map((year) => (
            <YearCard
              key={year.id}
              year={year}
              onClick={() => {
                setSelectedYearId(year.id);
                scrollToTop();
              }}
            />
          ))}
        </div>

        {/* Row 2: 2 cards centered (4th, P Years) */}
        {bottomRowYears.length > 0 && (
          <div className="w-full flex flex-wrap justify-center gap-6 sm:gap-8">
            {bottomRowYears.map((year) => (
              <YearCard
                key={year.id}
                year={year}
                onClick={() => {
                  setSelectedYearId(year.id);
                  scrollToTop();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function YearCard({
  year,
  onClick,
}: {
  year: YearLevelReps;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="relative w-[240px] sm:w-[260px] md:w-[280px] rounded-[26px] border-[1.5px] border-white/60 bg-[#160603] text-white shadow-[0_18px_45px_rgba(0,0,0,0.85)] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F26223] hover:shadow-[0_20px_50px_rgba(242,98,35,0.35)] group"
    >
      {/* Fiery Molten Lava Top Banner */}
      <div
        className="relative w-full h-24 sm:h-28 overflow-hidden"
        style={{ background: LAVA_BANNER_BG }}
      />

      {/* Circular Seal / Logo overlapping banner */}
      <div className="relative -mt-12 flex justify-center z-10">
        <div
          className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full overflow-hidden flex items-center justify-center bg-[#180603]"
          style={{
            border: "3.5px solid #dfc3b4",
            boxShadow: "0 0 16px 2px rgba(223, 195, 180, 0.35), 0 6px 18px rgba(0,0,0,0.85)",
          }}
        >
          {year.sealUrl ? (
            <Image
              src={year.sealUrl}
              alt={year.label}
              fill
              sizes="96px"
              className="object-cover p-1 transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f26223] via-[#a33515] to-[#501308] text-white font-extrabold text-xl">
              {year.yearNumber}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 sm:p-5 text-center flex flex-col items-center">
        <h3 className="font-extrabold text-white text-base sm:text-lg leading-tight">
          {year.label}
        </h3>
        <span className="font-bold text-[#e85e1e] text-xs uppercase tracking-wider mt-1 group-hover:underline">
          See More
        </span>
        <p className="text-zinc-300 text-xs leading-relaxed mt-2.5 line-clamp-3">
          {year.description}
        </p>
      </div>
    </div>
  );
}
