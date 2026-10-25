import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/providers/auth.provider";
import { getSiteUrl } from "@/lib/site-url";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

const defaultTitle = "PUP ACCESS | Computer Engineering Students for Service";
const defaultDescription =
  "PUP ACCESS is the official student organization of the Computer Engineering Department at the Polytechnic University of the Philippines.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | PUP ACCESS",
  },
  description: defaultDescription,
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: siteUrl,
    siteName: "PUP ACCESS",
    title: defaultTitle,
    description:
      "Official student organization of the PUP Computer Engineering Department — events, officers, partners, and equipment borrowing.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "PUP ACCESS",
      alternateName:
        "Association of Concerned Computer Engineering Students for Service",
      url: siteUrl,
      logo: `${siteUrl}/AccessLogo.webp`,
      address: {
        "@type": "PostalAddress",
        streetAddress:
          "Room 424, College of Engineering and Architecture Building, Pureza St. cor. Anonas St., Sta. Mesa",
        addressLocality: "Manila",
        addressRegion: "Metro Manila",
        addressCountry: "PH",
      },
      sameAs: [
        "https://www.facebook.com/ACCESSOfficial",
        "https://www.facebook.com/OfficialACCESSTV",
        "https://www.instagram.com/officialaccess",
        "https://x.com/OfficialACCESS",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "PUP ACCESS",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
