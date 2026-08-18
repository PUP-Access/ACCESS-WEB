"use client";

import { motion } from "framer-motion";

type ContactSuccessModalProps = {
  onClose: () => void;
};

export default function ContactSuccessModal({ onClose }: ContactSuccessModalProps) {
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
        aria-labelledby="contact-success-title"
        aria-modal="true"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#141416]/95 p-6 sm:p-8 text-center text-white shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
      >
        {/* Title & Message */}
        <motion.h3
          id="contact-success-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
        >
          Message Sent!
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-sm leading-relaxed text-white/70"
        >
          Thank you for reaching out. The ACCESS team has received your message and will respond to your email as soon as possible.
        </motion.p>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-7"
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-w-[160px] rounded-xl px-8 py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_6px_20px_rgba(242,98,35,0.35)] hover:shadow-[0_8px_25px_rgba(242,98,35,0.5)]"
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
