import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

type AuthScreenLayoutProps = {
  title: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export default function AuthScreenLayout({
  title,
  children,
  backHref = "/auth",
  backLabel = "Back",
}: AuthScreenLayoutProps) {
  const glassPanelStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image src="/LogInBG/BG1.webp" alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 70% at 18% 50%, rgba(220, 40, 30, 0.35) 0%, transparent 65%), radial-gradient(ellipse 40% 50% at 85% 50%, rgba(242, 98, 35, 0.12) 0%, transparent 60%)",
        }}
      />

      <Link href="/" className="absolute left-5 top-5 z-20 sm:left-8 sm:top-8">
        <Image
          src="/AccessLogo.webp"
          alt="ACCESS"
          width={120}
          height={36}
          className="h-8 w-auto object-contain sm:h-9"
          priority
        />
      </Link>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20 sm:px-6">
        <div
          className="grid w-full max-w-5xl overflow-hidden rounded-[28px] lg:grid-cols-[1fr_1fr]"
          style={glassPanelStyle}
        >
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
            <h1 className="text-2xl font-bold text-white sm:text-[1.75rem]">{title}</h1>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-center text-sm">
              <Link
                href={backHref}
                className="text-white/60 underline-offset-2 hover:text-white hover:underline"
              >
                {backLabel}
              </Link>
            </p>
          </div>

          <div className="relative hidden min-h-[420px] items-center justify-center overflow-hidden border-l border-white/15 lg:flex">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(242, 98, 35, 0.25) 0%, transparent 70%)",
              }}
            />
            <Image
              src="/circle-access-logo.webp"
              alt="ACCESS emblem"
              width={380}
              height={380}
              className="relative z-10 h-auto w-[min(90%,340px)] object-contain drop-shadow-[0_12px_40px_rgba(242,98,35,0.35)]"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
