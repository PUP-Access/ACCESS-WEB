"use client";

import { useState, useTransition } from "react";
import { deleteUserAccountAction } from "@/features/users/actions/users.actions";
import type { UserRow } from "@/features/users/types";

type DeleteUserButtonProps = {
  user: UserRow;
  onDeleted: (userId: string) => void;
};

export default function DeleteUserButton({ user, onDeleted }: DeleteUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDelete = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await deleteUserAccountAction(user.id);
      if (result.status === "error") {
        setErrorMsg(result.message || "Failed to delete user account.");
      } else {
        setIsOpen(false);
        onDeleted(user.id);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300"
        title="Delete User Account"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        <span>Delete</span>
      </button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#18191E] p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/15 text-red-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Delete User Account?
                </h3>
                <p className="text-xs text-white/50">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-white/70">
              <div className="font-semibold text-white">
                {user.organization_name || "Personal User"}
              </div>
              <div className="text-white/50">{user.email}</div>
              <div className="mt-2 text-[11px] text-amber-300/90">
                ⚠️ All associated authentication credentials and borrow requests will be permanently deleted.
              </div>
            </div>

            {errorMsg && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-950/50 transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <svg
                      className="h-3.5 w-3.5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Permanently Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
