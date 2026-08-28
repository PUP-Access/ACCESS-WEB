"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import OfficerModal from "./OfficerModal";
import type { OfficerItem } from "../data/officers-hierarchy";
import type { BatchRepsContent } from "../schemas";
import { DEFAULT_BATCH_REPRESENTATIVES } from "../data/batch-representatives";

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

interface BatchRepresentativesViewProps {
  initialBatches?: BatchRepsContent;
}

export default function BatchRepresentativesView({
  initialBatches = DEFAULT_BATCH_REPRESENTATIVES,
}: BatchRepresentativesViewProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerItem | null>(null);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    const anchor = document.getElementById("batch-reps-top");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "instant", block: "start" });
    }
  };

  useEffect(() => {
    scrollToTop();
    const timer = setTimeout(scrollToTop, 50);
    return () => clearTimeout(timer);
  }, [selectedBatchId]);

  const batches = initialBatches || DEFAULT_BATCH_REPRESENTATIVES;
  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  // ─────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 1: Specific Year Level Batch Officers Hierarchy View
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedBatch) {
    const reps = selectedBatch.representatives || [];

    // Categorize roles for hierarchical layout
    const president = reps.find(
      (r) => r.role.toLowerCase().includes("president") && !r.role.toLowerCase().includes("vice")
    );
    const vpsAndSecs = reps.filter((r) => {
      const role = r.role.toLowerCase();
      return (
        role.includes("vice president") ||
        role.includes("secretary") ||
        role.includes("asst") ||
        role.includes("assistant")
      );
    });
    const treasAndAud = reps.filter((r) => {
      const role = r.role.toLowerCase();
      return role.includes("treasurer") || role.includes("auditor");
    });
    const pioAndLogistics = reps.filter((r) => {
      const role = r.role.toLowerCase();
      return role.includes("pio") || role.includes("public information") || role.includes("logistic");
    });

    // Other representatives that don't fit above standard roles
    const usedIds = new Set([
      ...(president ? [president.id] : []),
      ...vpsAndSecs.map((r) => r.id),
      ...treasAndAud.map((r) => r.id),
      ...pioAndLogistics.map((r) => r.id),
    ]);
    const others = reps.filter((r) => !usedIds.has(r.id));

    return (
      <div className="w-full flex flex-col items-center py-4 select-none animate-in fade-in duration-200">
        <div id="batch-reps-top" className="h-0 w-0 opacity-0 pointer-events-none" />

        {/* Back Button */}
        <div className="w-full max-w-5xl flex justify-start mb-6 px-4">
          <button
            type="button"
            onClick={() => {
              setSelectedBatchId(null);
              scrollToTop();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-[#F26223] hover:border-[#F26223] transition-all duration-200 shadow-md"
          >
            <span>←</span>
            <span>Back to All Years</span>
          </button>
        </div>

        {/* Section Header */}
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
            Batch Officers
          </h1>
          <p className="mt-3 text-xs sm:text-sm md:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            We are a community of student leaders and innovators committed to advancing technology, collaboration, and excellence within PUP.
          </p>
        </div>

        {/* ── Hierarchy Tree Layout (Matching Screenshot 1) ───────────── */}
        <div className="w-full max-w-[1000px] mx-auto flex flex-col items-center gap-8 sm:gap-10 relative z-10 px-2 sm:px-4">
          {/* Row 1: President (1 card centered) */}
          {president && (
            <div className="w-full flex justify-center">
              <BatchOfficerHierarchyCard
                rep={president}
                onClick={() => setSelectedOfficer(president as unknown as OfficerItem)}
              />
            </div>
          )}

          {/* Row 2: Vice President, Secretary, Assistant Secretary (3 cards) */}
          {vpsAndSecs.length > 0 && (
            <div className="w-full flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10">
              {vpsAndSecs.map((rep) => (
                <BatchOfficerHierarchyCard
                  key={rep.id}
                  rep={rep}
                  onClick={() => setSelectedOfficer(rep as unknown as OfficerItem)}
                />
              ))}
            </div>
          )}

          {/* Row 3: Treasurer, Auditor (2 cards centered) */}
          {treasAndAud.length > 0 && (
            <div className="w-full flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14">
              {treasAndAud.map((rep) => (
                <BatchOfficerHierarchyCard
                  key={rep.id}
                  rep={rep}
                  onClick={() => setSelectedOfficer(rep as unknown as OfficerItem)}
                />
              ))}
            </div>
          )}

          {/* Row 4: PIO, Logistic Head (2 cards centered) */}
          {pioAndLogistics.length > 0 && (
            <div className="w-full flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14">
              {pioAndLogistics.map((rep) => (
                <BatchOfficerHierarchyCard
                  key={rep.id}
                  rep={rep}
                  onClick={() => setSelectedOfficer(rep as unknown as OfficerItem)}
                />
              ))}
            </div>
          )}

          {/* Fallback Row: Any extra officers */}
          {others.length > 0 && (
            <div className="w-full flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              {others.map((rep) => (
                <BatchOfficerHierarchyCard
                  key={rep.id}
                  rep={rep}
                  onClick={() => setSelectedOfficer(rep as unknown as OfficerItem)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Interactive Modal */}
        <OfficerModal
          officer={selectedOfficer}
          onClose={() => setSelectedOfficer(null)}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 2: Year Overview View (3 top / 2 bottom centered)
  // ─────────────────────────────────────────────────────────────────────────
  const topRow = batches.slice(0, 3);
  const bottomRow = batches.slice(3, 5);

  return (
    <div className="w-full flex flex-col items-center py-4 select-none animate-in fade-in duration-200">
      {/* Header */}
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
          Batch Representative
        </h1>
        <p className="mt-3 text-xs sm:text-sm md:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
          We are a community of student leaders and innovators committed to advancing technology, collaboration, and excellence within PUP.
        </p>
      </div>

      {/* Year Level Overview Cards (3-top / 2-bottom) */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 sm:gap-8 px-4 relative z-10">
        {/* Top Row: 1st, 2nd, 3rd Years */}
        <div className="w-full flex flex-wrap justify-center gap-6 sm:gap-8">
          {topRow.map((batch) => (
            <YearOverviewCard
              key={batch.id}
              batch={batch}
              onClick={() => setSelectedBatchId(batch.id)}
            />
          ))}
        </div>

        {/* Bottom Row: 4th, P Years (Centered) */}
        {bottomRow.length > 0 && (
          <div className="w-full flex flex-wrap justify-center gap-6 sm:gap-8">
            {bottomRow.map((batch) => (
              <YearOverviewCard
                key={batch.id}
                batch={batch}
                onClick={() => setSelectedBatchId(batch.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Year Overview Card (Screenshot 2) ──────────────────────────────────────
function YearOverviewCard({
  batch,
  onClick,
}: {
  batch: {
    id: string;
    label: string;
    description: string;
    sealUrl?: string;
  };
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="relative w-[240px] sm:w-[260px] md:w-[280px] rounded-[26px] border-[1.5px] border-white/60 bg-[#160603] text-white shadow-[0_18px_45px_rgba(0,0,0,0.85)] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F26223] hover:shadow-[0_20px_50px_rgba(242,98,35,0.35)] group"
    >
      <div
        className="relative w-full h-24 sm:h-28 overflow-hidden"
        style={{ background: LAVA_BANNER_BG }}
      />

      <div className="relative -mt-12 flex justify-center z-10">
        <div
          className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full overflow-hidden flex items-center justify-center bg-[#180603]"
          style={{
            border: "3.5px solid #dfc3b4",
            boxShadow: "0 0 16px 2px rgba(223, 195, 180, 0.35), 0 6px 18px rgba(0,0,0,0.85)",
          }}
        >
          <Image
            src={batch.sealUrl || "/circle-access-logo.webp"}
            alt={batch.label}
            fill
            sizes="96px"
            className="object-cover p-1 transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        </div>
      </div>

      <div className="p-4 sm:p-5 text-center flex flex-col items-center">
        <h3 className="font-extrabold text-white text-base sm:text-lg leading-tight">
          {batch.label}
        </h3>
        <span className="font-bold text-[#e85e1e] text-xs uppercase tracking-wider mt-1 group-hover:underline">
          See More
        </span>
        <p className="text-zinc-300 text-xs leading-relaxed mt-2.5 line-clamp-3">
          {batch.description}
        </p>
      </div>
    </div>
  );
}

// ── Hierarchy Officer Card (Screenshot 1) ──────────────────────────────────
function BatchOfficerHierarchyCard({
  rep,
  onClick,
}: {
  rep: {
    id: string;
    name: string;
    displayName?: string;
    role: string;
    bio?: string;
    hideBio?: boolean;
    imageUrl?: string;
    bannerUrl?: string;
  };
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="relative w-[230px] sm:w-[250px] md:w-[270px] rounded-[24px] border-[1.5px] border-white/60 bg-[#160603] text-white shadow-[0_15px_40px_rgba(0,0,0,0.85)] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F26223] hover:shadow-[0_20px_50px_rgba(242,98,35,0.35)] group"
    >
      <div
        className="relative w-full h-22 sm:h-26 overflow-hidden"
        style={{ background: LAVA_BANNER_BG }}
      />

      <div className="relative -mt-11 flex justify-center z-10">
        <div
          className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden flex items-center justify-center bg-[#180603]"
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
              sizes="88px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f26223] via-[#a33515] to-[#501308] text-white font-extrabold text-lg">
              {rep.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 text-center flex flex-col items-center">
        <h4
          className="font-extrabold text-white text-sm sm:text-base leading-tight truncate w-full"
          title={rep.displayName || rep.name}
        >
          {rep.displayName || rep.name}
        </h4>
        <p className="font-extrabold text-[#e85e1e] text-xs uppercase tracking-wider mt-1 truncate w-full">
          {rep.role}
        </p>
        {rep.bio?.trim() && !rep.hideBio && (
          <p className="text-zinc-300 text-xs leading-relaxed mt-2 line-clamp-3">
            {rep.bio}
          </p>
        )}
      </div>
    </div>
  );
}
