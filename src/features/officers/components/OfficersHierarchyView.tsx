"use client";

import { useState } from "react";
import {
  type OfficerItem,
  DEFAULT_OFFICERS_HIERARCHY_CONTENT,
} from "../data/officers-hierarchy";
import type { OfficersHierarchyContent } from "../schemas";
import OfficerHierarchyCard from "./OfficerHierarchyCard";
import OfficerModal from "./OfficerModal";

interface OfficersHierarchyViewProps {
  content?: OfficersHierarchyContent;
}

export default function OfficersHierarchyView({
  content = DEFAULT_OFFICERS_HIERARCHY_CONTENT,
}: OfficersHierarchyViewProps) {
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerItem | null>(null);

  const tiers = content?.tiers || DEFAULT_OFFICERS_HIERARCHY_CONTENT.tiers;
  const advisers = content?.advisers || DEFAULT_OFFICERS_HIERARCHY_CONTENT.advisers;

  const presidentTier = tiers.find((t) => t.id === "tier-president");
  const evpTier = tiers.find((t) => t.id === "tier-evp");
  const vpsTier = tiers.find((t) => t.id === "tier-vps");
  const coreTier = tiers.find((t) => t.id === "tier-core-officers");
  const headsTier = tiers.find((t) => t.id === "tier-heads");
  const headGovTier = tiers.find((t) => t.id === "tier-head-governor");
  const upperGovTier = tiers.find((t) => t.id === "tier-upper-governors");
  const lowerGovTier = tiers.find((t) => t.id === "tier-lower-governors");

  return (
    <div className="w-full flex flex-col items-center py-6 select-none">
      {/* ── SECTION 1: ACCESS OFFICERS ────────────────────────────────────── */}
      <section className="w-full flex flex-col items-center">
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
            ACCESS Officers
          </h1>
          <p className="mt-3 text-xs sm:text-sm md:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            We are a community of student leaders and innovators committed to advancing technology, collaboration, and excellence within PUP.
          </p>
        </div>

        {/* ── Hierarchy Tree Layout ────────────────────────────────────── */}
        <div className="w-full max-w-[1140px] mx-auto flex flex-col items-center gap-7 sm:gap-9 md:gap-11 relative z-10 px-2 sm:px-4">
          {/* Row 1: President (1 card centered) */}
          {presidentTier && presidentTier.officers.length > 0 && (
            <div className="w-full flex justify-center">
              {presidentTier.officers.map((officer) => (
                <OfficerHierarchyCard
                  key={officer.id}
                  officer={officer}
                  onClick={() => setSelectedOfficer(officer)}
                />
              ))}
            </div>
          )}

          {/* Row 2: Executive Vice President (1 card centered) */}
          {evpTier && evpTier.officers.length > 0 && (
            <div className="w-full flex justify-center">
              {evpTier.officers.map((officer) => (
                <OfficerHierarchyCard
                  key={officer.id}
                  officer={officer}
                  onClick={() => setSelectedOfficer(officer)}
                />
              ))}
            </div>
          )}

          {/* Row 3: 4 Vice Presidents (4 columns aligned) */}
          {vpsTier && vpsTier.officers.length > 0 && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 justify-items-center">
              {vpsTier.officers.map((officer) => (
                <OfficerHierarchyCard
                  key={officer.id}
                  officer={officer}
                  onClick={() => setSelectedOfficer(officer)}
                />
              ))}
            </div>
          )}

          {/* Row 4: 3 Core Officers (Secretary General, Auditor, Control Officer) */}
          {coreTier && coreTier.officers.length > 0 && (
            <div className="w-full flex flex-wrap items-center justify-center gap-5 sm:gap-8 md:gap-12 lg:gap-14">
              {coreTier.officers.map((officer) => (
                <OfficerHierarchyCard
                  key={officer.id}
                  officer={officer}
                  onClick={() => setSelectedOfficer(officer)}
                />
              ))}
            </div>
          )}

          {/* Row 5: 4 Head Officers (Treasurer, Business Manager, Tech Head, Multimedia Head) */}
          {headsTier && headsTier.officers.length > 0 && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 justify-items-center">
              {headsTier.officers.map((officer) => (
                <OfficerHierarchyCard
                  key={officer.id}
                  officer={officer}
                  onClick={() => setSelectedOfficer(officer)}
                />
              ))}
            </div>
          )}

          {/* Row 6: Head Governor (1 card centered) */}
          {headGovTier && headGovTier.officers.length > 0 && (
            <div className="w-full flex justify-center">
              {headGovTier.officers.map((officer) => (
                <OfficerHierarchyCard
                  key={officer.id}
                  officer={officer}
                  onClick={() => setSelectedOfficer(officer)}
                />
              ))}
            </div>
          )}

          {/* Row 7: Year Governors (3 cards: 4th, 3rd, 2nd Year) */}
          {upperGovTier && upperGovTier.officers.length > 0 && (
            <div className="w-full flex flex-wrap items-center justify-center gap-5 sm:gap-8 md:gap-12 lg:gap-14">
              {upperGovTier.officers.map((officer) => (
                <OfficerHierarchyCard
                  key={officer.id}
                  officer={officer}
                  onClick={() => setSelectedOfficer(officer)}
                />
              ))}
            </div>
          )}

          {/* Row 8: Lower Year Governors (2 cards: 1st Year, P Year) */}
          {lowerGovTier && lowerGovTier.officers.length > 0 && (
            <div className="w-full flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-16">
              {lowerGovTier.officers.map((officer) => (
                <OfficerHierarchyCard
                  key={officer.id}
                  officer={officer}
                  onClick={() => setSelectedOfficer(officer)}
                />
              ))}
            </div>
          )}

          {/* ── SECTION 2: ACCESS ADVISERS ──────────────────────────────── */}
          {advisers && advisers.length > 0 && (
            <section id="advisers" className="w-full flex flex-col items-center mt-16 sm:mt-20 scroll-mt-28">
              <div className="text-center max-w-3xl mx-auto mb-10 px-4">
                <h2
                  className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-widest title-header pb-2"
                  style={{
                    background: "linear-gradient(180deg, #ffffff 0%, #ffdfc4 40%, #f26223 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.6))",
                  }}
                >
                  ACCESS Advisers
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto drop-shadow-md">
                  Guiding and mentoring the organization toward technical leadership and excellence.
                </p>
              </div>

              <div className="w-full flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14">
                {advisers.map((adviser) => (
                  <OfficerHierarchyCard
                    key={adviser.id}
                    officer={adviser}
                    onClick={() => setSelectedOfficer(adviser)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Interactive Officer Modal Popup */}
        <OfficerModal
          officer={selectedOfficer}
          onClose={() => setSelectedOfficer(null)}
        />
      </section>
    </div>
  );
}
