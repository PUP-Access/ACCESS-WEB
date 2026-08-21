"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { signOut } from "@/features/auth/actions/auth.actions";
import EditProfileModal from "./EditProfileModal";

type ProfileDropdownProps = {
  userEmail: string;
  organizationName?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
};

function getInitials(name: string, email: string): string {
  const target = name?.trim() || email.split("@")[0] || "U";
  const parts = target.split(/[\s._-]+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return target.slice(0, 2).toUpperCase();
}

export default function ProfileDropdown({
  userEmail,
  organizationName,
  role,
  avatarUrl,
  isAdmin = false,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(organizationName || "");
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(avatarUrl || null);
  const [, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(displayName || organizationName || "", userEmail);

  // Sync props if user details update
  useEffect(() => {
    if (organizationName !== undefined) setDisplayName(organizationName || "");
    if (avatarUrl !== undefined) setCurrentAvatar(avatarUrl || null);
  }, [organizationName, avatarUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        {/* Floating Profile Trigger Icon */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#F26223] via-[#E04810] to-[#862520] font-bold text-xs text-white shadow-xl shadow-[#F26223]/25 ring-2 ring-white/20 hover:ring-[#F26223]/60 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none cursor-pointer"
          title="Account Profile & Settings"
          aria-label="Open Profile Menu"
          aria-expanded={isOpen}
        >
          {currentAvatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentAvatar}
              alt="User Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </button>

        {/* Dropdown Menu Popup */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl border border-white/10 bg-[#161618]/95 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150 z-50">
            {/* Header info */}
            <div className="border-b border-white/10 px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20 bg-black/40 flex items-center justify-center font-bold text-xs text-white">
                  {currentAvatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={currentAvatar}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate" title={displayName || "Organization Account"}>
                      {displayName || "Organization Account"}
                    </p>
                  </div>
                  <p className="text-[11px] text-white/45 truncate" title={userEmail}>
                    {userEmail}
                  </p>
                  {role ? (
                    <span className="inline-block rounded-full bg-[#F26223]/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#FFB89A] border border-[#F26223]/30 mt-1">
                      {role}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Menu options */}
            <div className="py-1 space-y-1">
              {/* Edit Profile & Photo */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <svg className="h-4 w-4 text-[#F26223]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Edit Profile & Photo</span>
              </button>

              {/* Admin Dashboard (if admin) */}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#FFB89A] transition-colors hover:bg-[#F26223]/15 hover:text-[#FFD4BC]"
                >
                  <svg className="h-4 w-4 text-[#F26223]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  <span>Admin Console</span>
                </Link>
              )}
            </div>

            {/* Logout Divider & Button */}
            <div className="border-t border-white/10 pt-1 mt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  startTransition(async () => {
                    await signOut();
                  });
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200 cursor-pointer"
              >
                <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile & Password Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentName={displayName || organizationName || ""}
        userEmail={userEmail}
        currentAvatarUrl={currentAvatar}
        onSaved={(newData) => {
          setDisplayName(newData.name);
          if (newData.avatarUrl !== undefined) {
            setCurrentAvatar(newData.avatarUrl);
          }
        }}
      />
    </>
  );
}
