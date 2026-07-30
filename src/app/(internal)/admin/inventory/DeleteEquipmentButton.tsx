"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { adminBtnDangerClass, adminBtnMutedClass } from "../components/admin-ui";

export function DeleteEquipmentButton() {
  const { pending } = useFormStatus();
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        className="admin-btn admin-btn-secondary py-1 px-3 text-[10px]"
        onClick={() => setIsConfirming(true)}
      >
        {pending ? "..." : "Delete"}
      </button>

      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-950 border border-white/10 p-6 shadow-2xl text-left">
            <h3 className="text-lg font-semibold text-white">Delete Equipment</h3>
            <p className="mt-2 text-sm text-white/60">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className={adminBtnMutedClass}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={adminBtnDangerClass}
                disabled={pending}
              >
                {pending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
