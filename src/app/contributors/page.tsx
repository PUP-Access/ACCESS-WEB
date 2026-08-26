import { ContributorsSection, FooterSection } from "@/features/landing"
import Image from "next/image"
import { CrystalDice3D, type CrystalConfig } from "@/features/effects"
import Link from "next/link"

const CONTRIBUTORS_CRYSTALS: CrystalConfig[] = [
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

export default function ContributorsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      
      <div className="relative z-10">
      </div>

      <div className="relative flex-1">
        {/* Sticky Background & Crystals (matches home page sections) */}
        <div className="sticky top-0 h-screen w-full z-0 overflow-hidden pointer-events-none">
          <Image src="/EventsBG.webp" alt="" fill className="object-cover" />
          <div className="absolute inset-0" style={{ background: "#862520" }} />
          <CrystalDice3D crystals={CONTRIBUTORS_CRYSTALS} cameraZ={13} className="z-[1]" />
        </div>

        {/* Foreground content */}
        <main className="relative z-10 -mt-[100vh] overflow-hidden">
          {/* Back to home */}
          <div className="px-6 sm:px-10 lg:px-16 pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <span aria-hidden>←</span>
              Back
            </Link>
          </div>

          {/* Decorative blobs (matches home page) */}
          <div className="absolute top-[20%] left-[-30%] w-[600px] h-[500px] bg-black/85 blur-[120px] rounded-full pointer-events-none z-[-1] mix-blend-multiply" />
          <div className="absolute top-[30%] right-[-20%] w-[700px] h-[600px] bg-black/90 blur-[130px] rounded-full pointer-events-none z-[-1] mix-blend-multiply" />
          <div className="absolute top-[60%] left-[-30%] w-[600px] h-[600px] bg-black/85 blur-[140px] rounded-full pointer-events-none z-[-1] mix-blend-multiply" />
          <div className="absolute top-[85%] right-[-5%] w-[500px] h-[500px] bg-black/90 blur-[130px] rounded-full pointer-events-none z-[-1] mix-blend-multiply" />

          <div className="absolute top-[1%] left-[5%] w-[500px] h-[500px] bg-[#FFB800] opacity-40 blur-[140px] rounded-full pointer-events-none z-[-1]" />
          <div className="absolute top-[15%] right-[5%] w-[500px] h-[500px] bg-[#FFB800] opacity-40 blur-[140px] rounded-full pointer-events-none z-[-1]" />
          <div className="absolute top-[60%] left-[40%] w-[600px] h-[600px] bg-[#FF8C00] opacity-40 blur-[140px] rounded-full pointer-events-none z-[-1]" />
          <div className="absolute top-[90%] left-[15%] w-[400px] h-[400px] bg-[#FFB800] opacity-40 blur-[120px] rounded-full pointer-events-none z-[-1]" />

          <ContributorsSection />
          <FooterSection />
        </main>
      </div>
    </div>
  )
}

