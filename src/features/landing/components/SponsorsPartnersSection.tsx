"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SponsorsPartnersContent, SponsorPartnerItem } from "@/features/cms";
import { Reveal } from "./Reveal";

type SponsorsPartnersSectionProps = {
  content: SponsorsPartnersContent;
};

function SponsorIconPlaceholder({ index }: { index: number }) {
  const icons = [
    // 0: Atom / Science
    (
      <svg key="0" className="w-5 h-5 sm:w-6 sm:h-6 text-[#F26223]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="2" />
        <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(30 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-30 12 12)" />
      </svg>
    ),
    // 1: Triangle / Apex
    (
      <svg key="1" className="w-5 h-5 sm:w-6 sm:h-6 text-[#F26223]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l9 16H3z" />
      </svg>
    ),
    // 2: Gear / AI
    (
      <svg key="2" className="w-5 h-5 sm:w-6 sm:h-6 text-[#F26223]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    // 3: Synapse / Circuit
    (
      <svg key="3" className="w-5 h-5 sm:w-6 sm:h-6 text-[#F26223]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="5" cy="6" r="3" />
        <circle cx="19" cy="18" r="3" />
        <path d="M5 9v3a6 6 0 0 0 6 6h2" />
        <circle cx="19" cy="6" r="3" />
      </svg>
    ),
    // 4: Vector arrow
    (
      <svg key="4" className="w-5 h-5 sm:w-6 sm:h-6 text-[#F26223]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    ),
    // 5: Orion Star
    (
      <svg key="5" className="w-5 h-5 sm:w-6 sm:h-6 text-[#F26223]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    // 6: Kinetic Wave
    (
      <svg key="6" className="w-5 h-5 sm:w-6 sm:h-6 text-[#F26223]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12h3l3-7 4 14 3-7h7" />
      </svg>
    ),
  ];

  return icons[index % icons.length];
}

function DynamicPerspectiveMarquee({ items }: { items: SponsorPartnerItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startPointerXRef = useRef(0);
  const lastPointerXRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const cardWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const offsetRef = useRef(0);
  const animFrameIdRef = useRef<number | null>(null);

  // 5x duplicate guarantees complete seamless coverage across all screen widths
  const displayList = [...items, ...items, ...items, ...items, ...items];

  useEffect(() => {
    let lastTime = performance.now();
    const autoSpeed = 46; // pixels per second panning from left to right

    const update = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Handle interactive dragging & inertia physics
      if (isDraggingRef.current) {
        // Dragging is updating offset directly via pointer events
      } else {
        if (Math.abs(dragVelocityRef.current) > 0.4) {
          offsetRef.current += dragVelocityRef.current;
          dragVelocityRef.current *= 0.92; // smooth inertia damping
        } else if (!isHoveredRef.current) {
          offsetRef.current += autoSpeed * delta;
        }
      }

      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth || window.innerWidth || 1400;
        const centerX = containerWidth / 2;
        const cardSpacing = 245; // generous spacing between cards
        const totalTrackWidth = displayList.length * cardSpacing;

        cardWrapperRefs.current.forEach((el, index) => {
          if (!el) return;

          let x = (index * cardSpacing + offsetRef.current) % totalTrackWidth;
          if (x < -cardSpacing) x += totalTrackWidth;

          // Normalized distance from horizontal center (-1 to 1)
          const itemCenterX = x + cardSpacing / 2;
          const distNorm = (itemCenterX - centerX) / (containerWidth / 2);
          const absDist = Math.min(1.2, Math.abs(distNorm));

          // ── Small to Big Perspective Curve ──
          // Cards start small at ends (scale: ~0.50) and grow large in center (scale: 1.0)
          const scale = Math.max(0.48, 1 - 0.48 * Math.pow(Math.min(1, absDist), 1.5));
          // Fade opacity near the screen edges
          const opacity = Math.max(0.06, 1 - 0.90 * Math.pow(Math.min(1, absDist), 2.2));

          el.style.transform = `translate3d(${x}px, -50%, 0) scale(${scale})`;
          el.style.opacity = `${opacity}`;
        });
      }

      animFrameIdRef.current = requestAnimationFrame(update);
    };

    animFrameIdRef.current = requestAnimationFrame(update);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [displayList.length]);

  // Touch / Pointer Drag Scrubbing Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startPointerXRef.current = e.clientX;
    lastPointerXRef.current = e.clientX;
    dragVelocityRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - lastPointerXRef.current;
    lastPointerXRef.current = e.clientX;
    dragVelocityRef.current = delta;
    offsetRef.current += delta;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => (isHoveredRef.current = true)}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        isDraggingRef.current = false;
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-[145px] sm:h-[160px] overflow-hidden select-none cursor-grab active:cursor-grabbing touch-pan-y"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      {/* Ambient Shimmer Horizon Line */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-[40px] opacity-35 z-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(242,98,35,0.3) 0%, rgba(134,37,32,0.12) 55%, transparent 75%)",
          filter: "blur(20px)",
        }}
      />

      {/* Conveyor Track */}
      <div className="absolute inset-0 w-full h-full z-10">
        {displayList.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            ref={(el) => {
              cardWrapperRefs.current[index] = el;
            }}
            className="absolute top-1/2 left-0 will-change-transform"
            style={{
              transformOrigin: "center center",
            }}
          >
            <Link
              href="/partners"
              className="group/card relative flex w-[175px] sm:w-[205px] h-[98px] sm:h-[112px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-1 hover:border-[#F26223]/70 hover:bg-[#F26223]/15 hover:shadow-[0_0_35px_rgba(242,98,35,0.45),0_12px_28px_rgba(0,0,0,0.5)] select-none"
              style={{
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
              }}
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-all duration-300 group-hover/card:scale-110 group-hover/card:border-[#F26223]/50 group-hover/card:bg-[#F26223]/20 overflow-hidden">
                {item.logoUrl ? (
                  <Image
                    src={item.logoUrl}
                    alt={item.name}
                    width={40}
                    height={40}
                    className="h-full w-full object-contain p-1"
                    unoptimized={item.logoUrl.startsWith("http")}
                  />
                ) : (
                  <SponsorIconPlaceholder index={index} />
                )}
              </div>

              <p className="mt-2 text-center text-xs sm:text-[13px] font-bold tracking-wider text-white/90 uppercase truncate w-full px-2 transition-colors duration-200 group-hover/card:text-white">
                {item.name}
              </p>

              {item.category && (
                <span className="text-[10px] text-[#FFB89A]/75 font-semibold tracking-wider truncate max-w-full leading-none mt-0.5 group-hover/card:text-[#FFB89A]">
                  {item.category}
                </span>
              )}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SponsorsPartnersSection({ content }: SponsorsPartnersSectionProps) {
  const visibleItems = (content.items || []).filter((i) => i.isVisible !== false);
  const displayItems: SponsorPartnerItem[] =
    visibleItems.length > 0
      ? visibleItems
      : [
          { id: "1", name: "Nexus Labs", logoUrl: "", websiteUrl: "", category: "Co-Presenter", isVisible: true, type: "sponsor", tier: "featured", orderIndex: 1 },
          { id: "2", name: "Apex Global", logoUrl: "", websiteUrl: "", category: "Gold Sponsor", isVisible: true, type: "sponsor", tier: "standard", orderIndex: 2 },
          { id: "3", name: "Cognitive AI", logoUrl: "", websiteUrl: "", category: "Gold Sponsor", isVisible: true, type: "sponsor", tier: "standard", orderIndex: 3 },
          { id: "4", name: "Synapse Corp", logoUrl: "", websiteUrl: "", category: "Silver Sponsor", isVisible: true, type: "sponsor", tier: "standard", orderIndex: 4 },
          { id: "5", name: "Vector Ventures", logoUrl: "", websiteUrl: "", category: "Industry Partner", isVisible: true, type: "partner", tier: "featured", orderIndex: 5 },
          { id: "6", name: "Orion Systems", logoUrl: "", websiteUrl: "", category: "Academic Partner", isVisible: true, type: "partner", tier: "standard", orderIndex: 6 },
          { id: "7", name: "Kinetic Dynamics", logoUrl: "", websiteUrl: "", category: "Media Partner", isVisible: true, type: "partner", tier: "standard", orderIndex: 7 },
        ];

  return (
    <section
      id="partners"
      className="landing-section scroll-mt-24 relative overflow-hidden w-full bg-[#0d0706] py-12 sm:py-16 md:py-20 flex flex-col items-center"
      style={{
        background: "linear-gradient(180deg, #0d0706 0%, #150908 50%, #0e0505 100%)",
      }}
    >
      {/* Ambient Crystals & Glow Layers */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Floating Ambient Crystal 1 (Left) */}
        <div
          className="absolute -left-10 top-1/4 w-44 h-44 opacity-20"
          style={{
            background: "radial-gradient(circle, #f26223 0%, transparent 70%)",
            filter: "blur(45px)",
          }}
        />
        {/* Floating Ambient Crystal 2 (Right) */}
        <div
          className="absolute -right-10 bottom-1/4 w-52 h-52 opacity-20"
          style={{
            background: "radial-gradient(circle, #ff8c00 0%, transparent 70%)",
            filter: "blur(55px)",
          }}
        />
        {/* Center Ambient Horizon Glow */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[350px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(ellipse at center, rgba(242,98,35,0.22) 0%, rgba(134,37,32,0.1) 50%, transparent 75%)",
            filter: "blur(90px)",
          }}
        />
        {/* Geometric Wireframe Grid Texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Header Container */}
      <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 text-center flex flex-col items-center">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-widest title-header">
            {content.landingTitle || "OUR SPONSORS & PARTNERS"}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-white/70 max-w-xl mx-auto leading-relaxed font-normal">
            {content.landingSubtitle ||
              "Proudly supported by organizations that share our vision for service, innovation, and technical excellence."}
          </p>
        </Reveal>
      </div>

      {/* ── Extended Full-Width Dynamic Perspective Marquee (Small to Big + Isolated Hover Glow) ── */}
      <div className="relative z-10 mt-7 sm:mt-9 w-full overflow-hidden">
        <DynamicPerspectiveMarquee items={displayItems} />
      </div>
    </section>
  );
}
