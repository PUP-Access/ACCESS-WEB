"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { OfficerItem } from "../data/officers-hierarchy";

interface OfficerModalProps {
  officer: OfficerItem | null;
  onClose: () => void;
}

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

export default function OfficerModal({ officer, onClose }: OfficerModalProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [officer]);

  useEffect(() => {
    if (!officer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [officer, onClose]);

  if (!officer) return null;

  const displayName =
    officer.displayName ||
    officer.name
      .split(",")
      .reverse()
      .map((part) => part.trim())
      .join(" ");

  const initials =
    officer.name
      .split(",")
      .map((part) => part.trim().charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AC";

  // Check which links are actually provided
  const hasFacebook = Boolean(officer.facebookUrl?.trim());
  const hasEmail = Boolean(officer.email?.trim());
  const hasLinkedIn = Boolean(officer.linkedinUrl?.trim());
  const hasGitHub = Boolean(officer.githubUrl?.trim());
  const hasAnySocial = hasFacebook || hasEmail || hasLinkedIn || hasGitHub;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-200">
      {/* ── Backdrop ───────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* ── Modal Card ─────────────────────────────────────────────── */}
      <div
        className="relative w-full max-w-[470px] max-h-[90vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-[28px] border-[1.5px] border-white/60 bg-[#160603] text-white shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(242,98,35,0.25)] z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Lava Swirl / Custom Banner ──────────────────────── */}
        <div
          className="relative w-full h-32 sm:h-36 overflow-hidden"
          style={{ background: LAVA_BANNER_BG }}
        >
          {officer.bannerUrl ? (
            <Image
              src={officer.bannerUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : null}

          {/* Close Button (X) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3.5 right-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 border border-white/30 text-white/90 hover:text-white hover:bg-black/75 transition-all shadow-md"
          >
            <svg
              className="h-4 w-4 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ── Profile Headshot & Details Row ──────────────────────── */}
        <div className="relative flex items-end px-5 sm:px-6">
          {/* Avatar (Overlapping Lava Banner) */}
          <div className="relative -mt-14 sm:-mt-16 flex-shrink-0 z-10">
            <div
              className="relative h-26 w-26 sm:h-28 sm:w-28 rounded-full overflow-hidden flex items-center justify-center bg-[#180603]"
              style={{
                border: "3.5px solid #dfc3b4",
                boxShadow:
                  "0 0 16px 2px rgba(223, 195, 180, 0.35), 0 8px 24px rgba(0, 0, 0, 0.85)",
              }}
            >
              {officer.imageUrl && !imageError ? (
                <Image
                  src={officer.imageUrl}
                  alt={officer.name}
                  fill
                  sizes="(max-width: 640px) 104px, 112px"
                  className="object-cover"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f26223] via-[#a33515] to-[#501308] text-white font-extrabold text-2xl tracking-wider">
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* Name, Role & Course Info (Right of Avatar) */}
          <div className="flex flex-col justify-center pl-4 pb-1 min-w-0 flex-1">
            <h2
              className="font-extrabold text-white text-[1.2rem] sm:text-[1.35rem] leading-tight tracking-tight drop-shadow-md line-clamp-2"
              title={displayName}
            >
              {displayName}
            </h2>
            <p
              className="font-extrabold text-[#e85e1e] text-[0.8rem] sm:text-[0.875rem] uppercase tracking-wider mt-1 drop-shadow-sm"
              title={officer.role}
            >
              {officer.role}
            </p>
            {officer.courseYear && (
              <p className="font-semibold text-zinc-300 text-xs sm:text-[0.8125rem] mt-0.5">
                {officer.courseYear}
              </p>
            )}
          </div>
        </div>

        {/* ── Divider Line ─── */}
        {(hasAnySocial || (Boolean(officer.bio?.trim()) && !officer.hideBio)) && (
          <div className="border-t border-white/20 mx-5 sm:mx-6 mt-5 mb-4" />
        )}

        {/* ── Social Media Icons Row (Only shows links that exist) ─── */}
        {hasAnySocial && (
          <div
            className={`flex items-center gap-4 px-5 sm:px-6 text-white/90 ${
              officer.bio?.trim() && !officer.hideBio ? "" : "pb-6 sm:pb-7"
            }`}
          >
            {/* Facebook */}
            {hasFacebook && (
              <a
                href={officer.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook profile"
                className="flex h-7 w-7 items-center justify-center transition-colors hover:text-[#f26223]"
              >
                <svg
                  className="h-6 w-6 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}

            {/* Email */}
            {hasEmail && (
              <a
                href={officer.email!.startsWith("mailto:") ? officer.email : `mailto:${officer.email}`}
                aria-label="Email officer"
                className="flex h-7 w-7 items-center justify-center transition-colors hover:text-[#f26223]"
              >
                <svg
                  className="h-6 w-6 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </a>
            )}

            {/* LinkedIn */}
            {hasLinkedIn && (
              <a
                href={officer.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
                className="flex h-7 w-7 items-center justify-center transition-colors hover:text-[#f26223]"
              >
                <svg
                  className="h-5 w-5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            )}

            {/* GitHub */}
            {hasGitHub && (
              <a
                href={officer.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
                className="flex h-7 w-7 items-center justify-center transition-colors hover:text-[#f26223]"
              >
                <svg
                  className="h-6 w-6 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* ── Bio / Description Paragraph (Only render if bio exists and is not hidden) ─── */}
        {officer.bio?.trim() && !officer.hideBio && (
          <p className="text-zinc-200 text-xs sm:text-[0.875rem] leading-relaxed px-5 sm:px-6 pt-3 pb-6 sm:pb-7">
            {officer.bio}
          </p>
        )}

        {!hasAnySocial && (!officer.bio?.trim() || officer.hideBio) && (
          <div className="pb-4" />
        )}
      </div>
    </div>
  );
}
