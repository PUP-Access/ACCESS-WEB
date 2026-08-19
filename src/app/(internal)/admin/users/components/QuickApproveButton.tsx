"use client";

import { useTransition } from "react";
import { updateUserRoleAction } from "@/features/users/actions/users.actions";

type QuickApproveButtonProps = {
  userId: string;
  onSuccess?: () => void;
};

export default function QuickApproveButton({
  userId,
  onSuccess,
}: QuickApproveButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, "Organization");
      if (res.status === "success" && onSuccess) {
        onSuccess();
      }
    });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleApprove}
      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/25 hover:border-emerald-500/50 disabled:opacity-50 cursor-pointer"
      title="Approve as Organization (Grants Borrowing Access)"
    >
      {isPending ? (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      ) : (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      <span>{isPending ? "Approving..." : "Approve Org"}</span>
    </button>
  );
}
