"use client";

import { useState } from "react";
import { Reveal, RevealStagger } from "./Reveal";

interface FAQItem {
  question: string;
  answer: string;
}

type FAQSectionProps = {
  items: FAQItem[];
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: "transform 0.3s ease",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function FAQSection({ items }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <section id="faq" className="landing-section scroll-mt-24 faq-section">
      <Reveal>
        <h2 className="mb-10 text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-widest title-header md:whitespace-nowrap">
          Frequently Ask Questions
        </h2>
      </Reveal>

      <div className="faq-container">
        <RevealStagger className="faq-list" itemClassName="faq-item">
          {items.map((item, i) => (
            <div key={`${item.question}-${i}`}>
              <button
                className="faq-question"
                onClick={() => toggle(i)}
                aria-expanded={openIndex === i}
              >
                <span className="faq-question-text">{item.question}</span>
                <span
                  className="faq-chevron"
                  style={{ color: openIndex === i ? "#F26223" : "#ffffff" }}
                >
                  <ChevronIcon open={openIndex === i} />
                </span>
              </button>

              <div
                className="faq-answer-wrapper"
                style={{
                  maxHeight: openIndex === i ? "300px" : "0px",
                  opacity: openIndex === i ? 1 : 0,
                }}
              >
                <p className="faq-answer">{item.answer}</p>
              </div>
            </div>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
