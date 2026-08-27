"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal } from "./Reveal";

const SOCIALS = [
  {
    label: "ACCESS Official Facebook",
    handle: "ACCESS Official",
    href: "https://web.facebook.com/ACCESSOfficial",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "ACCESS TV Facebook",
    handle: "ACCESS TV",
    href: "https://web.facebook.com/OfficialACCESSTV",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "ACCESS Official Instagram",
    handle: "@officialaccess",
    href: "https://www.instagram.com/officialaccess?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "Official ACCESS on X",
    handle: "@OfficialACCESS",
    href: "https://x.com/OfficialACCESS?s=20",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
  },
];

const ORG_LINKS = [
  { label: "About Us", href: "/#about" },
  { label: "Location", href: "https://maps.app.goo.gl/Bwg4EjM7fw5hJqiKA" },
  { label: "Contacts", href: "/#contact" },
  { label: "Contributors", href: "/contributors" },
];

const RESOURCE_LINKS = [
  { label: "Events", href: "/#events" },
  { label: "Borrow", href: "/#borrow" },
  { label: "Officers", href: "/#officers" },
  { label: "FAQs", href: "/#faq" },
];

const BOTTOM_LINKS = [
  { label: "Privacy Center", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Cookie Policy", href: "#" },
];

const ACCESS_ADDRESS =
  "Room 424, College of Engineering and Architecture Building, Pureza St. cor. Anonas St., Sta. Mesa, City of Manila, Metro Manila, Philippines.";

function FooterAnchor({ href, label }: { href: string; label: string }) {
  const isExternal = href.startsWith("http");

  const handleClick = (e: React.MouseEvent) => {
    if (href === "#") {
      e.preventDefault();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="text-sm transition-colors duration-150 hover:text-white"
      style={{ color: "rgba(255,255,255,0.55)", fontFamily: `'Josefin Sans', sans-serif` }}
    >
      {label}
    </Link>
  );
}

export default function FooterSection() {
  return (
    <footer
      id="location"
      className="landing-section scroll-mt-24 relative w-full"
      style={{ background: "#0f0300", fontFamily: `'Josefin Sans', sans-serif` }}
    >
      <Reveal y={16}>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pb-12 pt-14 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:gap-8 lg:px-16">
          <div className="flex flex-col gap-5" style={{ fontFamily: `'Josefin Sans', sans-serif` }}>
            <Image
              src="/AccessLogo.webp"
              alt="ACCESS"
              width={130}
              height={46}
              className="object-contain object-left"
            />
            <p
              className="max-w-[260px] text-xs leading-relaxed text-justify sm:max-w-[280px]"
              style={{ color: "rgb(255, 255, 255)", fontFamily: `'Josefin Sans', sans-serif` }}
            >
              Association of Concern Computer Engineering Students for Service — College of Engineering and Architecture,
              Polytechnic University of the Philippines.
            </p>
            <address
              className="max-w-[260px] not-italic text-xs leading-relaxed text-white/70 sm:max-w-[280px]"
              style={{ fontFamily: `'Josefin Sans', sans-serif` }}
            >
              {ACCESS_ADDRESS}
            </address>
          </div>

          <div className="flex flex-col gap-5" style={{ fontFamily: `'Josefin Sans', sans-serif` }}>
            <h3
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,0.9)", fontFamily: `'Josefin Sans', sans-serif` }}
            >
              Socials
            </h3>
            <ul className="flex flex-col gap-4">
              {SOCIALS.map((social) => (
                <li key={social.href}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="group flex items-center gap-4 transition-opacity duration-200 hover:opacity-80"
                    style={{ fontFamily: `'Josefin Sans', sans-serif` }}
                  >
                    <span
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      {social.icon}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "rgba(255,255,255,0.75)", fontFamily: `'Josefin Sans', sans-serif` }}
                    >
                      {social.handle}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-5" style={{ fontFamily: `'Josefin Sans', sans-serif` }}>
            <h3
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,0.9)", fontFamily: `'Josefin Sans', sans-serif` }}
            >
              Organization
            </h3>
            <ul className="flex flex-col gap-3">
              {ORG_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterAnchor href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-5" style={{ fontFamily: `'Josefin Sans', sans-serif` }}>
            <h3
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,0.9)", fontFamily: `'Josefin Sans', sans-serif` }}
            >
              Quick Links
            </h3>
            <ul className="flex flex-col gap-3">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterAnchor href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>

      <div
        className="w-full"
        style={{
          background: "linear-gradient(90deg, #c45000 0%, #e07020 50%, #c45000 100%)",
          fontFamily: `'Josefin Sans', sans-serif`,
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center sm:justify-end gap-3 sm:gap-8 px-6 py-4 sm:flex-row sm:px-10 lg:px-16">
          {BOTTOM_LINKS.map((link) => (
            <FooterAnchor key={link.label} href={link.href} label={link.label} />
          ))}
        </div>
      </div>
    </footer>
  );
}
