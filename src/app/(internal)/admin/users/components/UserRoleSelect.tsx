"use client";

import { useState, useTransition } from "react";
import { updateUserRoleAction } from "@/features/users/actions/users.actions";
import type { UserRole } from "@/features/users/types";

type UserRoleSelectProps = {
  userId: string;
  currentRole: UserRole | null;
  onRoleChange?: (newRole: UserRole) => void;
};

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "Organization", label: "Organization", description: "Eligible to borrow equipment" },
  { value: "Pending", label: "Pending", description: "Ineligible (Cannot borrow)" },
  { value: "Admin", label: "Admin", description: "Full admin dashboard access" },
  { value: "Tech", label: "Tech", description: "Admin: borrow requests, inventory, contact messages" },
  {
    value: "SponsorsPartners",
    label: "Sponsors & Partners",
    description: "Admin: sponsors & partners, contact messages",
  },
  {
    value: "Govs",
    label: "Govs",
    description: "Admin: landing, about, officers, FAQs, events, contact messages",
  },
];

export default function UserRoleSelect({
  userId,
  currentRole,
  onRoleChange,
}: UserRoleSelectProps) {
  const [role, setRole] = useState<UserRole>(currentRole ?? "Pending");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (newRole: UserRole) => {
    const previousRole = role;
    setRole(newRole);
    if (onRoleChange) onRoleChange(newRole);

    startTransition(async () => {
      const res = await updateUserRoleAction(userId, newRole);
      if (res.status === "error") {
        setRole(previousRole);
        if (onRoleChange) onRoleChange(previousRole);
        setMessage(res.message ?? "Update failed");
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage("Updated");
        setTimeout(() => setMessage(null), 2000);
      }
    });
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <select
        value={role}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as UserRole)}
        className="admin-input cursor-pointer rounded-lg bg-black/40 px-3 py-1.5 text-xs font-semibold text-white outline-none transition-all hover:bg-white/10 focus:border-[#F26223] focus:ring-1 focus:ring-[#F26223] disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value} className="bg-[#1a1a1a] text-white">
            {r.label}
          </option>
        ))}
      </select>

      {isPending && (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      )}

      {message && !isPending && (
        <span
          className={`text-[11px] font-medium transition-opacity duration-300 ${
            message === "Updated" ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
