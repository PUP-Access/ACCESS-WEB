"use client";

import { motion } from "framer-motion";

type BorrowSuccessModalProps = {
  onClose: () => void;
};

export default function BorrowSuccessModal({ onClose }: BorrowSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        role="dialog"
        aria-labelledby="borrow-success-title"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl px-8 py-8 text-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        style={{
          background: "linear-gradient(180deg, #F26223 0%, #E04E12 100%)",
        }}
      >
        <h3
          id="borrow-success-title"
          className="text-2xl font-extrabold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        >
          Form Submitted!
        </h3>
        <div className="mt-4 text-sm leading-relaxed text-white/95 space-y-3">
          <p>
            Your borrowing request has been successfully submitted.
          </p>
          <p className="font-medium bg-white/10 p-3 rounded-lg border border-white/20">
            <strong>Important Notice:</strong> You are required to surrender a valid ID upon visiting the ACCESS Office in order to claim your requested item/s. Our office is located at Room 424, College of Engineering and Architecture Building.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 rounded-xl px-10 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
          style={{
            background: "rgba(255, 255, 255, 0.25)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        >
          Okay
        </button>
      </motion.div>
    </div>
  );
}
