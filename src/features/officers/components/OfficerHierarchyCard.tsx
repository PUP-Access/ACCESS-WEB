"use client";

import Image from "next/image";
import { useState } from "react";
import type { OfficerItem } from "../data/officers-hierarchy";

interface OfficerHierarchyCardProps {
  officer: OfficerItem;
  className?: string;
  onClick?: () => void;
}

export default function OfficerHierarchyCard({
  officer,
  className = "",
  onClick,
}: OfficerHierarchyCardProps) {
  const [imageError, setImageError] = useState(false);

  // Generate initials for avatar fallback
  const initials =
    officer.name
      .split(",")
      .map((part) => part.trim().charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AC";

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`relative flex flex-col items-center select-none pt-11 group ${
        onClick ? "cursor-pointer focus:outline-none" : ""
      } ${className}`}
    >
      {/* ── Outer Translucent Glass Card ───────────────────────────── */}
      <div
        className="relative flex flex-col items-center justify-center w-[225px] sm:w-[240px] md:w-[250px] pt-13 pb-4 px-3 rounded-[22px] sm:rounded-[26px] border-2 border-white/95 backdrop-blur-md transition-all duration-300 group-hover:scale-[1.04] group-hover:border-white group-hover:shadow-[0_0_35px_6px_rgba(242,98,35,0.85)] group-focus-visible:ring-2 group-focus-visible:ring-[#F26223]"
        style={{
          background:
            "linear-gradient(180deg, rgba(38, 12, 6, 0.72) 0%, rgba(24, 7, 3, 0.78) 60%, rgba(16, 4, 2, 0.84) 100%)",
          boxShadow:
            "0 0 26px 4px rgba(235, 75, 15, 0.68), 0 0 60px 10px rgba(200, 45, 10, 0.35), inset 0 0 14px rgba(242, 98, 35, 0.06)",
        }}
      >
        {/* ── Top Circular Avatar (Centered Exactly on Top Border) ─── */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div
            className="relative w-20 h-20 sm:w-21 sm:h-21 rounded-full overflow-hidden flex items-center justify-center bg-[#180603] transition-all duration-300 group-hover:scale-105"
            style={{
              border: "3px solid #dfc3b4",
              boxShadow:
                "0 0 16px 2px rgba(223, 195, 180, 0.35), 0 8px 22px rgba(0, 0, 0, 0.85)",
            }}
          >
            {officer.imageUrl && !imageError ? (
              <Image
                src={officer.imageUrl}
                alt={officer.name}
                fill
                sizes="(max-width: 640px) 80px, 84px"
                className="object-cover"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f26223] via-[#a33515] to-[#501308] text-white font-extrabold text-lg tracking-wider">
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* ── Officer Name (Clear Vertical Spacing Below Headshot) ─── */}
        <h3
          className="font-extrabold text-white text-[0.875rem] sm:text-[0.95rem] tracking-tight leading-snug w-full text-center px-1 mt-0.5"
          style={{
            textShadow: "0 2px 6px rgba(0, 0, 0, 0.95), 0 1px 2px rgba(0, 0, 0, 0.9)",
          }}
          title={officer.name}
        >
          {officer.name}
        </h3>

        {/* ── Role / Position ──────────────────────────────────────── */}
        <p
          className="font-extrabold text-[#e85e1e] text-[10px] sm:text-[11px] uppercase tracking-wider mt-1 leading-snug w-full text-center px-1"
          style={{
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.95), 0 0 8px rgba(232, 94, 30, 0.25)",
            letterSpacing: "0.04em",
          }}
          title={officer.role}
        >
          {officer.role}
        </p>
      </div>
    </div>
  );
}
