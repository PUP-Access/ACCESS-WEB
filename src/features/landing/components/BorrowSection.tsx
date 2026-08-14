"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BorrowRequestForm from "./BorrowRequestForm";
import TrackRequestView from "./TrackRequestView";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Reveal } from "./Reveal";

type BorrowSectionProps = {
  equipments?: { group: string; items: { name: string; available: number; unit?: string | null }[] }[];
};

export default function BorrowSection({ equipments = [] }: BorrowSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [showTrackForm, setShowTrackForm] = useState(false);
  const router = useRouter();

  const handleOpenForm = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login?next=/");
        return;
      }

      setShowForm(true);
    } catch {
      router.push("/auth/login?next=/");
    }
  };

  const handleOpenTrackForm = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login?next=/");
        return;
      }

      setShowTrackForm(true);
    } catch {
      router.push("/auth/login?next=/");
    }
  };

  const glassCardStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    borderRadius: "1.5rem",
  };

  return (
    <section id="borrow" className="landing-section scroll-mt-24 relative overflow-hidden py-24 px-5 sm:px-8 md:px-16 flex flex-col items-center">
      {/* Background gradient to match the vibrant warm vibe, slightly transparent for seamless integration */}
      <div
        className="absolute inset-0 pointer-events-none z-[0]"
      />


      <div className="relative z-10 flex flex-col items-center max-w-5xl w-full text-center">
        {!showForm && !showTrackForm && (
          <Reveal>
            <h2
              className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold pb-2 tracking-wide title-header"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #ffdfc4 40%, #f26223 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0px 8px 12px rgba(0,0,0,0.5))",
                letterSpacing: "0.05em",
              }}
            >
              Want to Borrow?
            </h2>
            <p className="mt-4 text-white/95 text-[15px] sm:text-base max-w-2xl leading-relaxed">
              Submit your request easily and track your borrowing anytime, anywhere.
            </p>
          </Reveal>
        )}

        {showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-10 w-full flex justify-center"
          >
            <BorrowRequestForm onBackToLanding={() => setShowForm(false)} equipments={equipments} />
          </motion.div>
        ) : showTrackForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-10 w-full flex justify-center"
          >
            <TrackRequestView onBackToLanding={() => setShowTrackForm(false)} />
          </motion.div>
        ) : (
          <>
            <Reveal className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-5 w-full" delay={0.14}>
              <button
                type="button"
                onClick={handleOpenForm}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_25px_rgba(242,98,35,0.6)] hover:opacity-95 min-w-[220px]"
                style={{
                  background: "#F26223",
                  boxShadow: "0 6px 20px rgba(242,98,35,0.4)",
                }}
              >
                Submit a Request
              </button>
              <button
                type="button"
                onClick={handleOpenTrackForm}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] min-w-[220px]"
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                Track my Request
              </button>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}
