import Image from "next/image"
import Link from "next/link"
import { CrystalDice3D, type CrystalConfig } from "@/features/effects"
import { Navbar } from "@/components/ui"

const CRYSTALS: CrystalConfig[] = [
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

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <Navbar />

      {/* ── Background ── */}
      <Image
        src="/EventsBG.webp"
        alt=""
        fill
        priority
        className="object-cover object-center"
      />
      <div className="absolute inset-0" style={{ background: "rgba(25,4,4,0.78)" }} />

      {/* ── Ambient orange glow ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-10%",
          right: "-8%",
          width: "60%",
          height: "70%",
          background:
            "radial-gradient(ellipse at bottom right, rgba(242,98,35,0.80) 0%, rgba(180,60,10,0.30) 55%, transparent 90%)",
          filter: "blur(120px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "10%",
          left: "-10%",
          width: "45%",
          height: "50%",
          background:
            "radial-gradient(ellipse at top left, rgba(180,50,10,0.35) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* ── Crystal dice ── */}
      <CrystalDice3D crystals={CRYSTALS} cameraZ={13} className="z-[1]" />



      {/* ── 404 content ── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-8 text-center">
        {/* "404" large gradient number */}
        <p
          className="text-[8rem] sm:text-[11rem] lg:text-[14rem] font-extrabold leading-none tracking-tight select-none"
          style={{
            background: "linear-gradient(180deg, #F5C4A0 20%, #F26223 65%, #7B2210 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 4px 32px rgba(242,98,35,0.40))",
          }}
        >
          404
        </p>

        <h1
          className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-widest"
          style={{
            background: "linear-gradient(180deg, #fff 40%, rgba(242,98,35,0.85) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Page Not Found
        </h1>

        <p
          className="mt-4 max-w-md text-sm sm:text-base leading-relaxed"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="rounded-lg px-8 py-3 text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
            style={{ background: "#F26223" }}
          >
            Go Home
          </Link>
          <Link
            href="javascript:history.back()"
            className="rounded-lg border border-white/25 bg-white/10 px-8 py-3 text-sm font-semibold text-white text-center backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            ← Go Back
          </Link>
        </div>
      </div>
    </div>
  )
}
