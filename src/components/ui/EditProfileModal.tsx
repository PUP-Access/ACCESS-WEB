"use client";

import { useState, useRef, useTransition } from "react";
import {
  updateUserProfileAction,
  changeUserPasswordAction,
} from "@/features/users/actions/users.actions";
import { signOut } from "@/features/auth/actions/auth.actions";

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  userEmail: string;
  currentAvatarUrl?: string | null;
  onSaved: (newData: { name: string; avatarUrl?: string | null }) => void;
};

type ActiveTab = "profile" | "password";

export default function EditProfileModal({
  isOpen,
  onClose,
  currentName,
  userEmail,
  currentAvatarUrl,
  onSaved,
}: EditProfileModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [orgName, setOrgName] = useState(currentName || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl || null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Image file size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!orgName.trim()) {
      setErrorMsg("Organization / Display Name cannot be empty.");
      return;
    }

    startTransition(async () => {
      const res = await updateUserProfileAction({
        organizationName: orgName,
        avatarUrl: avatarPreview,
      });

      if (res.status === "error") {
        setErrorMsg(res.message || "Failed to update profile.");
      } else {
        setSuccessMsg(res.message || "Profile updated successfully!");
        onSaved({ name: orgName.trim(), avatarUrl: avatarPreview });
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1200);
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg("Current password is required.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await changeUserPasswordAction({
        currentPassword,
        newPassword,
      });

      if (res.status === "error") {
        setErrorMsg(res.message || "Failed to change password.");
      } else {
        setSuccessMsg(res.message || "Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1500);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#141416] p-6 shadow-2xl ring-1 ring-white/15 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white tracking-wide">Account & Profile Settings</h3>
            <p className="text-xs text-white/50">Manage your display details, photo, security, and session.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pt-4 pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("profile");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-[#F26223]/20 text-[#FFB89A] border border-[#F26223]/40"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <svg className="h-4 w-4 text-[#F26223]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile & Photo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("password");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "password"
                ? "bg-[#F26223]/20 text-[#FFB89A] border border-[#F26223]/40"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <svg className="h-4 w-4 text-[#F26223]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Password & Security</span>
          </button>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200 font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-200 font-medium flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Profile & Photo Form */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
            {/* Avatar Photo Section */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                Profile Photo
              </label>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-[#F26223]/50 bg-black/40 shadow-inner flex items-center justify-center text-lg font-bold text-white">
                  {avatarPreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={avatarPreview}
                      alt="Profile Photo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{(orgName || userEmail)[0]?.toUpperCase()}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                  >
                    Change Photo
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => setAvatarPreview(null)}
                      className="ml-2 text-xs text-red-400 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-[11px] text-white/40">PNG, JPG, or WEBP (Max 2MB)</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
                Account Email
              </label>
              <input
                type="text"
                value={userEmail}
                disabled
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white/40 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Organization / Display Name
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. ACCESS Student Council"
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#F26223] focus:outline-none focus:ring-1 focus:ring-[#F26223] transition-all"
              />
            </div>

            {/* Profile Action Buttons */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    await signOut();
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
              >
                <svg className="h-3.5 w-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F26223] to-[#C93A12] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#F26223]/25 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Password & Security Form */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 pr-11 text-sm text-white placeholder-white/30 focus:border-[#F26223] focus:outline-none focus:ring-1 focus:ring-[#F26223] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-pointer"
                  title={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 pr-11 text-sm text-white placeholder-white/30 focus:border-[#F26223] focus:outline-none focus:ring-1 focus:ring-[#F26223] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-pointer"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 pr-11 text-sm text-white placeholder-white/30 focus:border-[#F26223] focus:outline-none focus:ring-1 focus:ring-[#F26223] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Password Action Buttons */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    await signOut();
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
              >
                <svg className="h-3.5 w-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F26223] to-[#C93A12] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#F26223]/25 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
