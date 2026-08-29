import { Navbar } from "@/components/ui";
import FooterSection from "@/features/landing/components/FooterSection";
import { getSponsorsPartnersContent } from "@/features/cms";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import { redirect } from "next/navigation";
import PartnersPageClient from "./PartnersPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Sponsors & Partners | PUP ACCESS",
  description:
    "Discover the valued sponsors, industry partners, and community organizations collaborating with the Association of Concerned Computer Engineering Students for Service (PUP ACCESS).",
};

export default async function PartnersPage() {
  noStore();
  const content = await getSponsorsPartnersContent();

  if (content.hideSection || (content.hideSponsors && content.hidePartners)) {
    redirect("/");
  }

  return (
    <div className="relative min-h-screen bg-[#0d0404] text-white overflow-x-hidden flex flex-col">
      <Navbar />

      {/* Decorative Warm Ambient Background Layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Deep Crimson/Orange Radial Glows */}
        <div
          className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[900px] h-[700px] rounded-full opacity-35"
          style={{
            background: "radial-gradient(circle, #f26223 0%, #862520 40%, transparent 75%)",
            filter: "blur(140px)",
          }}
        />
        <div
          className="absolute top-[45%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, #ff8c00 0%, #70100a 50%, transparent 70%)",
            filter: "blur(120px)",
          }}
        />
        <div
          className="absolute bottom-[10%] left-[-10%] w-[650px] h-[650px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, #f26223 0%, #4a0d09 60%, transparent 75%)",
            filter: "blur(130px)",
          }}
        />

        {/* Subtle geometric crystal overlay texture */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* Navbar top spacer */}
      <div className="h-24 sm:h-28 md:h-32 shrink-0" aria-hidden />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 px-5 sm:px-8 md:px-12 lg:px-16 pb-24 max-w-6xl mx-auto w-full">
        <PartnersPageClient content={content} />
      </main>

      <div className="relative z-20">
        <FooterSection />
      </div>
    </div>
  );
}
