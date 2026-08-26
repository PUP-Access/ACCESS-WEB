import { Navbar } from "@/components/ui";
import { FooterSection } from "@/features/landing";
import { getOfficersHierarchyContent } from "@/features/officers/services/officers-hierarchy.service";
import OfficersHierarchyView from "@/features/officers/components/OfficersHierarchyView";
import Image from "next/image";
import { CrystalDice3D, type CrystalConfig } from "@/features/effects";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OFFICERS_CRYSTALS: CrystalConfig[] = [
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

export default async function OfficersPage() {
  noStore();
  const hierarchyContent = await getOfficersHierarchyContent();

  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative selection:bg-[#F26223] selection:text-white">
      <Navbar />

      {/* ── Fixed Background Image & 3D Crystals ─────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src="/EventsBG.webp"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0" style={{ background: "#862520" }} />
        <CrystalDice3D crystals={OFFICERS_CRYSTALS} cameraZ={13} className="z-[1]" />
      </div>

      {/* ── Fixed Ambient Orange/Amber Glow Lighting ─────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[8%] left-[8%] w-[500px] h-[500px] bg-[#FFB800] opacity-25 blur-[150px] rounded-full" />
        <div className="absolute top-[28%] right-[8%] w-[600px] h-[600px] bg-[#FF8C00] opacity-25 blur-[160px] rounded-full" />
        <div className="absolute top-[55%] left-[12%] w-[600px] h-[600px] bg-[#FF8C00] opacity-25 blur-[160px] rounded-full" />
        <div className="absolute top-[80%] right-[10%] w-[500px] h-[500px] bg-[#FFB800] opacity-20 blur-[150px] rounded-full" />
      </div>

      {/* ── Foreground Scrollable Content ────────────────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen pt-24 md:pt-28">
        <main className="flex-1 py-8 px-4 sm:px-6 md:px-12 lg:px-16 relative">
          <div className="w-full max-w-7xl mx-auto">
            <OfficersHierarchyView content={hierarchyContent} />
          </div>
        </main>

        <FooterSection />
      </div>
    </div>
  );
}
