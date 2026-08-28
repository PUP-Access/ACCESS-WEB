import { Navbar } from "@/components/ui";
import Image from "next/image";
import {
  AboutSection,
  BorrowSection,
  CTASection,
  EventsSection,
  FAQSection,
  FooterSection,
  HeroCopy,
  MeetTheOfficersSection,
  SponsorsPartnersSection,
} from "@/features/landing";
import {
  getAboutContent,
  getActiveFAQs,
  getHeroContent,
  getOfficersSectionContent,
  getSponsorsPartnersContent,
} from "@/features/cms";
import { getAllAssetsPublic } from "@/features/assets/services/assets.admin.service";
import { CrystalDice3D, FloatingBlocks, type CrystalConfig } from "@/features/effects";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COMBINED_CRYSTALS: CrystalConfig[] = [
  // Left wing
  { x: -9.5, y: 4.5, z: 0.5, size: 2.2, hue: 0.02, sx: 0.003, sy: 0.004, sz: 0.002, fa: 0.32, fs: 0.45, phase: 0.0 },
  { x: -8.8, y: 1.8, z: -0.5, size: 1.3, hue: 0.01, sx: 0.005, sy: 0.003, sz: 0.004, fa: 0.24, fs: 0.60, phase: 1.1 },
  { x: -9.2, y: -0.8, z: 0.8, size: 1.0, hue: 0.00, sx: 0.004, sy: 0.006, sz: 0.003, fa: 0.18, fs: 0.75, phase: 2.3 },
  { x: -8.4, y: -2.8, z: -0.8, size: 0.7, hue: 0.015, sx: 0.006, sy: 0.004, sz: 0.005, fa: 0.14, fs: 0.85, phase: 3.5 },
  { x: -9.6, y: -4.8, z: 0.3, size: 1.8, hue: 0.02, sx: 0.003, sy: 0.005, sz: 0.003, fa: 0.30, fs: 0.50, phase: 1.7 },

  // Right wing
  { x: 9.5, y: 4.2, z: 0.5, size: 1.0, hue: 0.00, sx: 0.005, sy: 0.003, sz: 0.004, fa: 0.20, fs: 0.70, phase: 1.4 },
  { x: 9.8, y: -1.2, z: 0.8, size: 1.5, hue: 0.03, sx: 0.004, sy: 0.005, sz: 0.003, fa: 0.28, fs: 0.55, phase: 2.2 },
  { x: 8.8, y: -4.5, z: 0.5, size: 1.8, hue: 0.01, sx: 0.003, sy: 0.004, sz: 0.003, fa: 0.35, fs: 0.50, phase: 1.8 },
  { x: 8.5, y: 2.0, z: -1.2, size: 0.7, hue: 0.00, sx: 0.007, sy: 0.003, sz: 0.005, fa: 0.18, fs: 0.90, phase: 0.8 },
];

export default async function LandingPage() {
  noStore();

  const [hero, about, officersSection, faqs, equipmentsRaw, sponsorsPartners] = await Promise.all([
    getHeroContent(),
    getAboutContent(),
    getOfficersSectionContent(),
    getActiveFAQs(),
    getAllAssetsPublic(),
    getSponsorsPartnersContent(),
  ]);

  // Group assets by category for the form
  const groupedEquipmentsMap = equipmentsRaw.reduce((acc, eq) => {
    const cat = eq.category;
    if (!acc[cat]) {
      acc[cat] = { group: cat, items: [] };
    }
    acc[cat].items.push({ id: eq.id, name: eq.name, available: eq.quantity, unit: eq.unit });
    return acc;
  }, {} as Record<string, { group: string; items: { id: string; name: string; available: number; unit: string | null }[] }>);

  const groupedEquipments = Object.values(groupedEquipmentsMap).sort((a, b) => a.group.localeCompare(b.group));

  const faqItems =
    faqs.length > 0
      ? faqs.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))
      : [
          {
            question:
              "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
            answer:
              "Lorem ipsum dolor sit amet consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
          },
        ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section id="home" className="landing-section scroll-mt-24 relative flex min-h-screen flex-col bg-black overflow-hidden">

        {/* background photo — shifted right on mobile so subject stays visible */}
        <Image
          src="/BG-ACCESS.webp"
          alt=""
          fill
          priority
          className="object-cover object-[70%_center] sm:object-center"
        />

        {/* dark overlay — slightly heavier on mobile for text contrast */}
        <div className="absolute inset-0 bg-black/65 sm:bg-black/55 pointer-events-none" />

        {/* floating 3-D blocks — hidden on phone, right strip on tablet, half on desktop */}
        <div className="absolute inset-y-0 right-0 hidden sm:block sm:w-2/3 md:w-1/2 pointer-events-none">
          <FloatingBlocks />
        </div>

        {/* orange glow — bottom-right corner */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-14%",
            right: "-8%",
            width: "65%",
            height: "80%",
            background: "radial-gradient(ellipse at bottom right, rgba(242,98,35,0.95) 0%, #e84d0e 33%, rgba(242,98,35,0.4) 55%, rgba(180,60,10,0.28) 75%, transparent 97%)",
            filter: "blur(140px) brightness(1.3)",
            zIndex: 1,
          }}
        />

        {/* secondary softer glow — right-center */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "20%",
            right: "5%",
            width: "35%",
            height: "40%",
            background: "radial-gradient(ellipse at center, rgba(255,140,50,0.30) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* navbar spacer — fixed nav overlays hero */}
        <div className="relative z-10 h-[72px] shrink-0 md:h-[80px]" aria-hidden />

        <HeroCopy
          titleLines={hero.titleLines}
          subtitle={hero.subtitle}
          primaryCtaLabel={hero.primaryCtaLabel}
          secondaryCtaLabel={hero.secondaryCtaLabel}
        />
      </section>
            
      <AboutSection content={about} />
      
      <SponsorsPartnersSection content={sponsorsPartners} />
      
      <div className="relative">
        {/* Sticky Background & Crystals seamlessly spanning the sections */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="sticky top-0 h-screen w-full overflow-hidden">
            <Image
              src="/EventsBG.webp"
              alt=""
              fill
              className="object-cover"
            />
            <div className="absolute inset-0" style={{ background: "#862520" }} />
            <CrystalDice3D crystals={COMBINED_CRYSTALS} cameraZ={13} className="z-[1]" />
          </div>
        </div>
        
        {/* Transparent Overlays */}
        <div className="relative z-10 overflow-hidden">
          
          {/* ── Seamless Decorative Blobs ── */}
          {/* Black Blobs */}
          <div className="absolute top-[20%] left-[-30%] w-[600px] h-[500px] bg-black/85 blur-[120px] rounded-full pointer-events-none z-[-1] mix-blend-multiply" />
          <div className="absolute top-[30%] right-[-20%] w-[700px] h-[600px] bg-black/90 blur-[130px] rounded-full pointer-events-none z-[-1] mix-blend-multiply" />
          <div className="absolute top-[60%] left-[-30%] w-[600px] h-[600px] bg-black/85 blur-[140px] rounded-full pointer-events-none z-[-1] mix-blend-multiply" />
          <div className="absolute top-[85%] right-[-5%] w-[500px] h-[500px] bg-black/90 blur-[130px] rounded-full pointer-events-none z-[-1] mix-blend-multiply" />
          
          {/* Yellow/Orange Blobs */}
          <div className="absolute top-[1%] left-[5%] w-[500px] h-[500px] bg-[#FFB800] opacity-40 blur-[140px] rounded-full pointer-events-none z-[-1]" />
          <div className="absolute top-[15%] right-[5%] w-[500px] h-[500px] bg-[#FFB800] opacity-40 blur-[140px] rounded-full pointer-events-none z-[-1]" />
          <div className="absolute top-[60%] left-[40%] w-[600px] h-[600px] bg-[#FF8C00] opacity-40 blur-[140px] rounded-full pointer-events-none z-[-1]" />
          <div className="absolute top-[90%] left-[15%] w-[400px] h-[400px] bg-[#FFB800] opacity-40 blur-[120px] rounded-full pointer-events-none z-[-1]" />
          <div className="absolute top-[80%] left-[5%] w-[700px] h-[700px] bg-[#FFB800] opacity-40 blur-[120px] rounded-full pointer-events-none z-[-1]" />
          <div className="absolute top-[50%] right-[-10%] w-[400px] h-[400px] bg-[#FFB800] opacity-40 blur-[120px] rounded-full pointer-events-none z-[-1]" />
          <div className="absolute top-[40%] left-[0%] w-[500px] h-[500px] bg-[#FFB800] opacity-40 blur-[120px] rounded-full pointer-events-none z-[-1]" />

          <EventsSection />
          <MeetTheOfficersSection content={officersSection} />
          <BorrowSection equipments={groupedEquipments} />
          <FAQSection items={faqItems} />
          <CTASection />
          <FooterSection />
        </div>
      </div>

    </div>
  );
}
