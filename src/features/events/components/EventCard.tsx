"use client";

import Image from "next/image"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface EventCardProps {
  title: string
  description: string
  date: string
  image: string
  href?: string
  logos?: string[]
}

export default function EventCard({
  title,
  description,
  date,
  image,
}: EventCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="mx-auto flex flex-col overflow-hidden shrink-0 transition-all hover:-translate-y-0.5 duration-200 cursor-pointer"
        style={{
          width: "100%",
          maxWidth: 376,
          minHeight: 471,
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          background: "rgba(255, 255, 255, 0.09)",
          backdropFilter: "blur(24px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 32px rgba(0,0,0,0.35)",
        }}
      >

        {/* ── Image ──────────────────────────────────────────── */}
        <div className="relative h-52 w-full shrink-0">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
          />
          {/* Bottom gradient fade into card body */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Date pill — white bg, dark text */}
          <span className="absolute top-5.5 left-5.5 rounded-lg bg-white px-3 py-1 text-xs font-semibold text-gray-900 shadow-md">
            {date}
          </span>
        </div>
        {/* ── Body ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 px-8 pb-5 pt-8">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            className="group flex items-start gap-2 text-lg font-bold text-white leading-snug hover:text-orange-400 transition-colors text-left"
          >
            <span>{title}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="mt-0.5 h-5 w-5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
            >
              <path
                fillRule="evenodd"
                d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5ZM10 2.75a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0V4.56l-5.47 5.47a.75.75 0 0 1-1.06-1.06L15.44 3.5h-4.69a.75.75 0 0 1-.75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="h-px w-full bg-white/10" />

          <p className="text-sm leading-relaxed text-zinc-300 line-clamp-6">{description}</p>
        </div>
      </div>

      {/* ── Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col bg-[#f26223] border border-white/10 z-10"
            >
              {/* Image Header */}
              <div className="relative w-full h-[240px] sm:h-[320px] md:h-[360px] shrink-0 bg-zinc-950">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Floating Buttons */}
                <div className="absolute top-5 right-5 flex items-center gap-3">
                  {/* Share button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.share) {
                        navigator.share({ title, text: description, url: window.location.href });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Link copied to clipboard!");
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-black/45 backdrop-blur-md text-white hover:bg-black/60 active:scale-95 transition-all border border-white/10 cursor-pointer"
                    title="Share event"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0-6 6v3" />
                    </svg>
                  </button>

                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-black/45 backdrop-blur-md text-white hover:bg-black/60 active:scale-95 transition-all border border-white/10 cursor-pointer"
                    title="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Bottom Orange Section */}
              <div className="px-6 py-6 sm:px-8 sm:py-8 flex flex-col text-left text-white bg-[#f26223]">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide drop-shadow-sm leading-snug">
                  {title}
                </h3>
                <p className="mt-2 text-zinc-100/90 text-xs sm:text-sm font-semibold tracking-wide">
                  {date}
                </p>
                
                {/* Scrollable description */}
                <div className="mt-5 text-white/95 text-[14px] sm:text-[15px] leading-relaxed overflow-y-auto max-h-[160px] sm:max-h-[220px] pr-2 font-normal scrollbar-thin scrollbar-thumb-white/30">
                  <p className="whitespace-pre-line">{description}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
