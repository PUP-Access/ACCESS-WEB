"use client";

import { signOut } from "@/features/auth/actions/auth.actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ProfileDropdown from "./ProfileDropdown";

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  items?: NavItem[];
}

export const landingNavItems: NavItem[] = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Events", href: "/#events" },
  { label: "Officers", href: "/#officers" },
  { label: "Borrow", href: "/#borrow" },
  { label: "Contact", href: "/#contact" },
];

const SECTION_IDS = ["home", "about", "events", "officers", "borrow", "contact"] as const;

function NavLink({
  href,
  label,
  className,
  onNavigate,
  active,
}: {
  href: string;
  label: string;
  className: string;
  onNavigate?: () => void;
  active?: boolean;
}) {
  const pathname = usePathname();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("/#")) return;

    const sectionId = href.slice(2);
    if (pathname !== "/") return;

    event.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", href);
    onNavigate?.();
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      aria-current={active ? "true" : undefined}
    >
      {label}
    </Link>
  );
}

export default function Navbar({ items = landingNavItems }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const pathname = usePathname();
  const router = useRouter();
  const onLanding = pathname === "/";

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const syncUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setIsAdmin(false);
        setUserRole(null);
        setOrgName(null);
        setAvatarUrl(null);
        return;
      }

      const { data: userRow } = await supabase
        .from("Users")
        .select("role, organization_name")
        .eq("id", nextUser.id)
        .maybeSingle();

      const role = userRow?.role ?? (nextUser.user_metadata?.role as string | undefined) ?? null;
      const organizationName =
        userRow?.organization_name ??
        (nextUser.user_metadata?.organization_name as string | undefined) ??
        null;
      const userAvatar = (nextUser.user_metadata?.avatar_url as string | undefined) ?? null;

      setIsAdmin(role === "Admin");
      setUserRole(role);
      setOrgName(organizationName);
      setAvatarUrl(userAvatar);
    };

    syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
      void syncUser();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!onLanding) {
      setScrolled(true);
      return;
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 40);
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onLanding]);

  useEffect(() => {
    if (!onLanding) return;

    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el != null,
    );
    if (elements.length === 0) return;

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let bestId = "home";
        let bestRatio = 0;
        for (const id of SECTION_IDS) {
          const ratio = ratios.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestRatio > 0) setActiveSection(bestId);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [onLanding]);

  const linkClass = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-normal transition-colors lg:px-4 lg:text-[15px] ${
      active ? "text-[#F26223]" : "text-[#D8D8D8] hover:text-white"
    }`;
  const mobileLinkClass = (active: boolean) =>
    `block rounded-xl px-3 py-2.5 text-sm font-normal transition-colors ${
      active ? "bg-white/5 text-[#F26223]" : "text-[#D8D8D8] hover:bg-white/5 hover:text-white"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-[100] w-full px-3 pt-3 md:px-5 md:pt-4 lg:px-6 lg:pt-5 pointer-events-none">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-2.5 md:gap-4">
        <nav
          className="flex-1 min-w-0 flex items-center justify-between rounded-full border border-white/10 px-3.5 py-1.5 backdrop-blur-xl transition-[background,box-shadow,border-color] duration-300 md:px-6 md:py-2.5 pointer-events-auto"
          style={{
            background: scrolled ? "rgba(18, 18, 18, 0.92)" : "rgba(18, 18, 18, 0.72)",
            boxShadow: scrolled
              ? "0 8px 32px rgba(0, 0, 0, 0.45)"
              : "0 4px 24px rgba(0, 0, 0, 0.35)",
            borderColor: scrolled ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.1)",
          }}
          aria-label="Main navigation"
        >
          <Link href="/#home" className="flex shrink-0 items-center justify-self-start">
            <Image
              src="/AccessLogo.webp"
              alt="ACCESS"
              width={140}
              height={40}
              className="h-7 w-auto object-contain sm:h-8 md:h-9"
              priority
            />
          </Link>

          <ul className="hidden list-none items-center justify-center gap-1 p-0 md:flex lg:gap-2">
            {items.map((item) => {
              const sectionId = item.href.startsWith("/#") ? item.href.slice(2) : "";
              const active = onLanding && sectionId === activeSection;
              return (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    label={item.label}
                    className={linkClass(active)}
                    active={active}
                    onNavigate={() => setMenuOpen(false)}
                  />
                </li>
              );
            })}
          </ul>

          <div className="flex shrink-0 items-center justify-end gap-2.5 justify-self-end md:gap-3">
            {isAdmin ? (
              <Link
                href="/admin"
                className="hidden items-center gap-2 rounded-full border border-[#F26223]/45 bg-[#F26223]/15 px-3 py-1.5 transition hover:bg-[#F26223]/25 sm:inline-flex"
                title="Open admin dashboard"
              >
                <span className="rounded-full bg-[#F26223] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Admin
                </span>
                <span className="text-xs font-medium text-[#FFD4BC]">Dashboard</span>
              </Link>
            ) : null}

            <button
              type="button"
              className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[5px] md:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <span
                className={`block h-0.5 w-5 rounded-full bg-[#D8D8D8] transition-transform duration-200 ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-[#D8D8D8] transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-[#D8D8D8] transition-transform duration-200 ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
              />
            </button>
          </div>
        </nav>

        {user ? (
          <div className="shrink-0 pointer-events-auto">
            <ProfileDropdown
              userEmail={user.email || ""}
              organizationName={orgName}
              role={userRole}
              avatarUrl={avatarUrl}
              isAdmin={isAdmin}
            />
          </div>
        ) : null}
      </div>

      {menuOpen ? (
        <div
          className="mx-auto mt-2 flex w-full max-w-[1360px] flex-col gap-3 rounded-3xl border border-white/10 px-5 pb-5 pt-4 backdrop-blur-xl md:hidden pointer-events-auto"
          style={{
            background: "rgba(18, 18, 18, 0.95)",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35)",
          }}
        >
          <ul className="flex list-none flex-col gap-1 p-0">
            {items.map((item) => {
              const sectionId = item.href.startsWith("/#") ? item.href.slice(2) : "";
              const active = onLanding && sectionId === activeSection;
              return (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    label={item.label}
                    className={mobileLinkClass(active)}
                    active={active}
                    onNavigate={() => setMenuOpen(false)}
                  />
                </li>
              );
            })}
          </ul>

          {user ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {orgName || "Organization Account"}
                  </p>
                  <p className="text-[11px] text-white/40 truncate">{user.email}</p>
                </div>
                {userRole && (
                  <span className="shrink-0 rounded-full bg-[#F26223]/20 px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#FFB89A]">
                    {userRole}
                  </span>
                )}
              </div>

              {isAdmin ? (
                <Link
                  href="/admin"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#F26223]/35 bg-[#F26223]/15 px-3 py-2 text-xs font-medium text-[#FFD4BC] transition hover:bg-[#F26223]/25"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="rounded-full bg-[#F26223] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    Admin
                  </span>
                  Open dashboard
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
