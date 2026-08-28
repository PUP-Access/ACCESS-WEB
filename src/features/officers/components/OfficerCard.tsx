import Image from "next/image"

export interface OfficerCardProps {
  name: string
  role: string
  description: string
  image: string
  featured?: boolean
}

/* ---------- Lava banner ---------- */
const LAVA = `
  linear-gradient(38deg,
    transparent 27%, rgba(255,175,10,0.92) 29.5%, rgba(255,215,55,1) 30.5%,
    rgba(255,175,10,0.92) 31.5%, transparent 34%),
  linear-gradient(56deg,
    transparent 44%, rgba(230,95,0,0.80) 46%, rgba(255,148,0,0.90) 47%,
    rgba(230,95,0,0.80) 48%, transparent 50%),
  linear-gradient(130deg,
    transparent 54%, rgba(255,130,0,0.70) 56%, rgba(255,185,30,0.80) 57%,
    rgba(255,130,0,0.70) 58%, transparent 60%),
  linear-gradient(170deg,
    transparent 34%, rgba(200,55,0,0.55) 36%, rgba(240,110,10,0.65) 37%,
    transparent 39%),
  linear-gradient(-15deg,
    transparent 58%, rgba(195,50,0,0.60) 60%, rgba(245,115,5,0.70) 61%,
    transparent 63%),
  radial-gradient(ellipse at 22% 52%, rgba(255,110,0,0.75)  0%, transparent 38%),
  radial-gradient(ellipse at 75% 22%, rgba(210,65,0,0.65)   0%, transparent 32%),
  radial-gradient(ellipse at 60% 82%, rgba(185,40,0,0.55)   0%, transparent 30%),
  radial-gradient(ellipse at 10% 78%, rgba(235,95,0,0.55)   0%, transparent 28%),
  radial-gradient(ellipse at 88% 65%, rgba(255,145,15,0.50) 0%, transparent 26%),
  linear-gradient(145deg, #090100 0%, #1d0301 35%, #0d0200 65%, #220502 100%)
`

const AVATAR_SIZE = 100
const BANNER_H    = 94

export default function OfficerCard({
  name,
  role,
  description,
  image,
  featured = false,
}: OfficerCardProps) {
  return (
    <div
      className="relative flex flex-col select-none transition-all duration-500 flex-shrink-0"
      style={{
        width          : "100%",
        borderRadius   : 24,
        border         : "1px solid rgba(255, 255, 255, 0.13)",
        background     : "rgba(255, 255, 255, 0.03)",
        backdropFilter : "blur(16.5px)",
        boxShadow      : featured
          ? "0 28px 72px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.08)"
          : "0 10px 40px rgba(0,0,0,0.40)",
        overflow : "hidden",
      }}
    >
      {/* ── Lava banner ─────────────────────────────────────── */}
      <div
        className="relative w-full flex-shrink-0"
        style={{ height: BANNER_H, background: LAVA }}
      >
        {/* Subtle vignette at the edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        {/* Fade into card body */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: 52,
            background: "linear-gradient(to top, rgba(6,1,1,0.88) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Avatar (Circle Profile) ───────────────────────── */}
      {image && (
        <img
          src={image}
          alt={name}
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          style={{
            position: "absolute",
            left: "50%",
            top: BANNER_H - AVATAR_SIZE / 2,
            transform: "translateX(-50%)",
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: "50%",
            boxShadow: "0 0 0 1px #F26223, 0 4px 24px 4px rgba(0,0,0,0.24)",
            objectFit: "cover",
            background: "#1a0602",
            zIndex: 1,
          }}
          className="shadow-xl"
        />
      )}


      {/* ── Body ────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center text-center w-full px-6"
        style={{ paddingTop: AVATAR_SIZE / 2 + 14, paddingBottom: 66 }}
      >
        {/* Name */}
        <h3
          className="font-bold leading-snug"
          style={{
            color    : "rgba(255, 255, 255, 1)",
            fontSize : "1.05rem",
          }}
        >
          {name}
        </h3>

        {/* Role */}
        <p
          className="mt-1 font-semibold tracking-wide"
          style={{ color: "rgba(242, 98, 35, 1)", fontSize: "0.8125rem" }}
        >
          {role}
        </p>

        {/* Thin divider */}
        <div
          className="my-3 rounded-full"

        />
        {/* Description */}
        {description?.trim() && (
          <p
            className="font-light"
            style={{
              color    : "rgba(255, 245, 240, 0.75)",
              fontSize : "0.8125rem",
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
