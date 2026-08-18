"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; exact?: boolean }[];
}[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", exact: true }],
  },
  {
    label: "Site Content",
    items: [
      { href: "/admin/content/landing", label: "Landing" },
      { href: "/admin/content/about", label: "About Us" },
      { href: "/admin/content/about-images", label: "About Images" },
      { href: "/admin/content/officers-template", label: "Officers Section" },
      { href: "/admin/content/officers-roster", label: "Officers Image" },
      { href: "/admin/content/faqs", label: "FAQs" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/users", label: "User Accounts" },
      { href: "/admin/events", label: "Events" },
      { href: "/admin/borrow-requests", label: "Borrow Requests" },
      { href: "/admin/inventory", label: "Inventory" },
      { href: "/admin/contact-messages", label: "Contact Messages" },
      { href: "/admin/audit-logs", label: "Audit Logs" },
    ],
  },
];

function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AdminSidebarProps = {
  adminEmail: string | null;
};

export default function AdminSidebar({ adminEmail }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="admin-glass print:hidden sticky top-0 z-20 flex h-screen w-64 shrink-0 flex-col border-r border-white/10 backdrop-blur-xl">
      <div className="shrink-0 border-b border-white/10 px-5 py-6">
        <Link href="/admin" className="block">
          <span className="title-header text-lg font-extrabold tracking-wide">ACCESS</span>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.25em] text-[#FFB89A]/70">
            Admin Console
          </p>
        </Link>
        {adminEmail ? (
          <p className="mt-3 truncate rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-[11px] text-white/50 lg:hidden">
            {adminEmail}
          </p>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = isNavActive(pathname, item.href, item.exact);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`block rounded-xl py-2.5 pl-3 pr-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "border border-[#F26223]/35 bg-[#F26223]/15 text-[#FFD4BC]"
                          : "border border-transparent text-white/55 hover:border-white/10 hover:bg-white/5 hover:text-white"
                      }`}
                      style={
                        isActive ? { boxShadow: "inset 3px 0 0 0 #F26223" } : undefined
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="mt-auto shrink-0 border-t border-white/10 px-5 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/45 transition hover:text-[#FFB89A]"
        >
          <span aria-hidden>←</span>
          View public site
        </Link>
      </div>
    </aside>
  );
}
