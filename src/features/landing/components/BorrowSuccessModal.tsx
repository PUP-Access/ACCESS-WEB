"use client";

import { motion } from "framer-motion";

type BorrowSuccessModalProps = {
  onClose: () => void;
};

export default function BorrowSuccessModal({ onClose }: BorrowSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        role="dialog"
        aria-labelledby="borrow-success-title"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#141416]/95 p-6 sm:p-8 text-center text-white shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
      >
        {/* Title & Subtitle */}
        <motion.h3
          id="borrow-success-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
        >
          Request Submitted!
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-sm leading-relaxed text-white/60"
        >
          Your equipment borrowing request has been received and is now queued for officer review.
        </motion.p>

        {/* Structured Notice Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 rounded-2xl border border-orange-500/25 bg-gradient-to-b from-orange-500/10 to-orange-500/5 p-4 text-left shadow-inner"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFB89A]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Important Instructions</span>
          </div>

          <ul className="mt-3 space-y-2.5 text-xs sm:text-sm text-white/80">
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-[#FFB89A]">
                1
              </span>
              <span>
                <strong className="text-white">Valid ID Required:</strong> You are required to surrender a valid school/government ID upon claiming.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-[#FFB89A]">
                2
              </span>
              <span>
                <strong className="text-white">Pick-up Location:</strong> Room 424, College of Engineering and Architecture (CEA) Building.
              </span>
            </li>
          </ul>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-7"
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-w-[180px] rounded-xl px-8 py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_6px_20px_rgba(242,98,35,0.35)] hover:shadow-[0_8px_25px_rgba(242,98,35,0.5)]"
            style={{
              background: "linear-gradient(180deg, #F26223 0%, #C93A12 100%)",
            }}
          >
            Proceed
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
