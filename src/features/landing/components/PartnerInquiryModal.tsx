"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitContactMessageAction } from "@/features/landing/services/contact.actions";
import { getClientActionErrorMessage } from "@/lib/client-action-errors";

type PartnerInquiryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function PartnerInquiryModal({ isOpen, onClose }: PartnerInquiryModalProps) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    organization: "",
    contactNumber: "",
    partnerType: "Corporate / Industry Sponsor",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.organization.trim()) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    const rawPhone = formData.contactNumber.trim().replace(/^\+?63\s?/, "").replace(/\D/g, "");
    const formattedPhone = rawPhone.length === 10 && rawPhone.startsWith("9")
      ? `+63 ${rawPhone}`
      : "+63 9000000000";

    const payload = new FormData();
    payload.append("fullName", formData.fullName.trim());
    payload.append("email", formData.email.trim());
    payload.append("organization", formData.organization.trim());
    payload.append(
      "courseYearSection",
      `Partner / Sponsor (${formData.partnerType})`
    );
    payload.append("contactNumber", formattedPhone);
    payload.append("purpose", `Partnership Inquiry: ${formData.partnerType}`);
    payload.append(
      "concern",
      formData.message.trim() || "Inquiring about partnership/sponsorship opportunities with PUP ACCESS."
    );

    startTransition(async () => {
      try {
        const res = await submitContactMessageAction({ status: "idle" }, payload);
        if (res.status === "error") {
          setErrorMessage(res.message);
        } else {
          setSubmitted(true);
        }
      } catch (err) {
        setErrorMessage(getClientActionErrorMessage(err, "Failed to submit inquiry."));
      }
    });
  };

  const handleReset = () => {
    setSubmitted(false);
    setErrorMessage(null);
    setFormData({
      fullName: "",
      email: "",
      organization: "",
      contactNumber: "",
      partnerType: "Corporate / Industry Sponsor",
      message: "",
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleReset}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 w-full max-w-xl rounded-3xl border border-white/15 p-6 sm:p-8 text-white shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            style={{
              background: "linear-gradient(145deg, rgba(30,12,10,0.95) 0%, rgba(15,8,8,0.98) 100%)",
              boxShadow: "0 0 50px rgba(242,98,35,0.15), 0 20px 60px rgba(0,0,0,0.8)",
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleReset}
              className="absolute right-5 top-5 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Close modal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F26223]/20 border border-[#F26223]/40 text-[#F26223]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white title-header">Inquiry Received!</h3>
                <p className="text-sm text-white/80 max-w-md mx-auto leading-relaxed">
                  Thank you for your interest in partnering with PUP ACCESS. Our External Affairs team will review your message and reach out shortly.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-8 py-3 rounded-xl font-bold text-white transition hover:opacity-90"
                    style={{ background: "#F26223" }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6 text-left">
                  <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FFB89A]">
                    Collaboration & Sponsorships
                  </span>
                  <h3 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-wide title-header">
                    Partner With ACCESS
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-white/70">
                    Join hands with PUP ACCESS for student workshops, hackathons, seminars, and organizational initiatives.
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Full Name <span className="text-[#F26223]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Juan Dela Cruz"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:border-[#F26223] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Work / Official Email <span className="text-[#F26223]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@company.com"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:border-[#F26223] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Company / Organization <span className="text-[#F26223]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="e.g. Nexus Labs Inc."
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:border-[#F26223] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Partnership Nature
                      </label>
                      <select
                        value={formData.partnerType}
                        onChange={(e) => setFormData({ ...formData, partnerType: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#1f0f0c] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-[#F26223] focus:outline-none"
                      >
                        <option value="Corporate / Industry Sponsor">Corporate / Industry Sponsor</option>
                        <option value="Academic / University Partner">Academic / University Partner</option>
                        <option value="Student Organization / Co-Presenter">Student Organization / Co-Presenter</option>
                        <option value="Media & Community Partner">Media & Community Partner</option>
                        <option value="Other">Other Inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Brief Message or Proposal Details
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Share details about the event, sponsorship package, or how you'd like to collaborate..."
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:border-[#F26223] focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-white/50 text-center sm:text-left">
                      Official email: <span className="text-[#FFB89A]">officialpupaccesssy2627@gmail.com</span>
                    </p>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full sm:w-auto px-7 py-2.5 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: "#F26223" }}
                    >
                      {isPending ? "Sending..." : "Submit Inquiry"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
