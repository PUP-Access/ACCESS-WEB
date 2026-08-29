"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { SponsorsPartnersContent, SponsorPartnerItem } from "@/features/cms";
import PartnerInquiryModal from "@/features/landing/components/PartnerInquiryModal";

type PartnersPageClientProps = {
  content: SponsorsPartnersContent;
};

function CircularLogoBadge({
  logoUrl,
  name,
  size = "md",
}: {
  logoUrl?: string;
  name: string;
  size?: "lg" | "md";
}) {
  const sizeClasses =
    size === "lg"
      ? "w-24 h-24 sm:w-28 sm:h-28"
      : "w-20 h-20 sm:w-24 sm:h-24";

  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-white shadow-[0_8px_25px_rgba(0,0,0,0.45)] border-2 border-white/80 overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${sizeClasses}`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          fill
          className="object-contain p-3"
          unoptimized={logoUrl.startsWith("http")}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center px-2">
          <span className="text-black font-black text-xs sm:text-sm tracking-tighter uppercase leading-none">
            {name.split(" ")[0] || "PARTNER"}
          </span>
          {name.split(" ")[1] && (
            <span className="text-[#f26223] font-bold text-[9px] sm:text-[10px] tracking-widest uppercase">
              {name.split(" ")[1]}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SponsorCard({
  item,
  isFeatured = false,
}: {
  item: SponsorPartnerItem;
  isFeatured?: boolean;
}) {
  const CardContent = (
    <div
      className={`group relative flex flex-col items-center justify-center text-center transition-all duration-300 rounded-[28px] border backdrop-blur-xl ${
        isFeatured
          ? "w-full max-w-[280px] sm:max-w-[320px] h-[230px] sm:h-[260px] p-6 border-white/20 bg-gradient-to-b from-white/10 to-white/[0.04] shadow-[0_0_40px_rgba(242,98,35,0.25)] hover:shadow-[0_0_55px_rgba(242,98,35,0.45)] hover:border-[#F26223]/70 hover:-translate-y-1.5"
          : "w-full h-[210px] sm:h-[240px] p-5 border-white/10 bg-white/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_40px_rgba(242,98,35,0.25)] hover:border-[#F26223]/50 hover:bg-[#F26223]/10 hover:-translate-y-1.5"
      }`}
    >
      {/* Featured Tier Badge */}
      {isFeatured && (
        <div className="absolute -top-3 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#F26223] to-[#ff8c00] text-[10px] font-extrabold uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(242,98,35,0.4)]">
          {item.category || "Principal Sponsor"}
        </div>
      )}

      {/* Circular Badge */}
      <CircularLogoBadge
        logoUrl={item.logoUrl}
        name={item.name}
        size={isFeatured ? "lg" : "md"}
      />

      {/* Partner / Sponsor Name */}
      <h3 className="mt-4 text-sm sm:text-base font-extrabold uppercase tracking-widest text-white group-hover:text-[#FFD4BC] transition-colors duration-200 truncate w-full px-2">
        {item.name}
      </h3>

      {/* Subcategory or Tag */}
      {item.category && !isFeatured && (
        <p className="mt-1 text-[11px] font-semibold text-white/50 tracking-wider uppercase truncate max-w-full">
          {item.category}
        </p>
      )}

      {item.websiteUrl && (
        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#FFB89A]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Visit Facebook Page ↗
        </span>
      )}
    </div>
  );

  if (item.websiteUrl) {
    return (
      <a
        href={item.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {CardContent}
      </a>
    );
  }

  return CardContent;
}

export default function PartnersPageClient({ content }: PartnersPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const allItems = content.items || [];
  const visibleItems = allItems.filter((i) => i.isVisible !== false);

  const sponsors = visibleItems.filter((i) => i.type === "sponsor");
  const partners = visibleItems.filter((i) => i.type === "partner");

  const featuredSponsor = sponsors.find((s) => s.tier === "featured") || sponsors[0];
  const standardSponsors = sponsors.filter((s) => s.id !== featuredSponsor?.id);

  return (
    <div className="flex flex-col items-center gap-20 sm:gap-28">
      {/* ── 1. ACCESS SPONSORS SECTION ── */}
      {!content.hideSponsors && (
        <section className="w-full flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-widest title-header">
              {content.sponsorsTitle || "ACCESS Sponsors"}
            </h1>
            <p className="mt-3.5 text-sm sm:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
              {content.sponsorsSubtitle ||
                "Empowering computer engineering students through state-of-the-art technological resources and event support."}
            </p>
          </motion.div>

          {/* Featured / Principal Sponsor (Centered on top) */}
          {featuredSponsor && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-12 flex justify-center w-full"
            >
              <SponsorCard item={featuredSponsor} isFeatured={true} />
            </motion.div>
          )}

          {/* Standard Sponsors Grid */}
          {standardSponsors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-10 grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl"
            >
              {standardSponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} item={sponsor} />
              ))}
            </motion.div>
          )}

          {sponsors.length === 0 && (
            <p className="mt-8 text-white/40 text-sm italic">
              No sponsors listed at the moment.
            </p>
          )}
        </section>
      )}

      {/* ── 2. ACCESS PARTNERS SECTION ── */}
      {!content.hidePartners && (
        <section className="w-full flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-widest title-header">
              {content.partnersTitle || "ACCESS Partners"}
            </h2>
            <p className="mt-3.5 text-sm sm:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
              {content.partnersSubtitle ||
                "Collaborating with industry leaders, student organizations, and academic institutions."}
            </p>
          </motion.div>

          {/* Partners 3-Column Responsive Grid */}
          {partners.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-12 grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl"
            >
              {partners.map((partner) => (
                <SponsorCard key={partner.id} item={partner} />
              ))}
            </motion.div>
          ) : (
            <p className="mt-8 text-white/40 text-sm italic">
              No partners listed at the moment.
            </p>
          )}
        </section>
      )}

      {/* ── 3. BOTTOM CALL TO ACTION ── */}
      {/*
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 p-8 sm:p-12 text-center backdrop-blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(242,98,35,0.15) 0%, rgba(134,37,32,0.25) 50%, rgba(20,10,10,0.85) 100%)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(242,98,35,0.15)",
        }}
      >
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#FFB89A]">
            Empower Future Engineers
          </span>
          <h3 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide title-header">
            Want to be our partner?
          </h3>
          <p className="mt-3 text-xs sm:text-sm md:text-base text-white/80 max-w-lg leading-relaxed">
            Collaborate with the PUP Association of Concerned Computer Engineering Students for Service. Sponsor an event, host a workshop, or co-create student programs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-8 py-3.5 rounded-2xl font-bold text-white text-sm sm:text-base transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_30px_rgba(242,98,35,0.6)] shadow-[0_4px_20px_rgba(242,98,35,0.4)]"
              style={{ background: "#F26223" }}
            >
              Submit Partnership Inquiry ↗
            </button>

            <Link
              href="/#contact"
              className="px-6 py-3.5 rounded-2xl font-semibold text-white/80 text-sm sm:text-base border border-white/15 bg-white/5 transition-all duration-300 hover:text-white hover:border-white/30 hover:bg-white/10"
            >
              Contact Us Directly
            </Link>
          </div>
        </div>
      </motion.section>
      */}

      {/* Inquiry Modal */}
      {/* <PartnerInquiryModal isOpen={modalOpen} onClose={() => setModalOpen(false)} /> */}
    </div>
  );
}
