"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import ContactUsForm from "./ContactUsForm";
import { Reveal } from "./Reveal";

export default function CTASection() {
  const [showForm, setShowForm] = useState(false);

  return (
    <section id="contact" className="landing-section scroll-mt-24 relative overflow-hidden py-16 px-5 sm:px-8 md:px-16 lg:px-24 text-center">
      <div className="relative z-20 mx-auto max-w-7xl w-full flex flex-col items-center gap-4">
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex justify-center"
          >
            <ContactUsForm onBack={() => setShowForm(false)} />
          </motion.div>
        ) : (
          <Reveal className="flex flex-col items-center gap-4">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-widest title-header"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Need help or have questions?
            </h2>

            <p className="text-sm sm:text-base text-white/70 max-w-xl leading-relaxed">
              Reach out to ACCESS anytime for inquiries, assistance, and concerns.
            </p>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-3 inline-block px-10 py-3 rounded-lg font-semibold text-white text-sm sm:text-base transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "#F26223" }}
            >
              Contact Us
            </button>
          </Reveal>
        )}
      </div>
    </section>
  );
}
