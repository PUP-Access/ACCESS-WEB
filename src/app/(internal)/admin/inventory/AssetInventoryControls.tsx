"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { adminBtnDangerClass, adminBtnMutedClass } from "../components/admin-ui";

type AssetInventoryControlsProps = {
  assetId: string;
  quantity: number;
  decrementAction: (formData: FormData) => void;
  removeAllAction: (formData: FormData) => void;
};

export function AssetInventoryControls({
  assetId,
  quantity,
  decrementAction,
  removeAllAction,
}: AssetInventoryControlsProps) {
  return (
    <div className="flex justify-end gap-2 items-center">
      <form action={decrementAction}>
        <input type="hidden" name="id" value={assetId} />
        <DecrementButton disabled={quantity === 0} />
      </form>

      <form action={removeAllAction}>
        <input type="hidden" name="id" value={assetId} />
        <RemoveAllButton />
      </form>
    </div>
  );
}

function DecrementButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      title={disabled ? "Quantity is already 0" : "Decrease by 1"}
      className="admin-btn admin-btn-secondary py-1 px-3 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {pending ? "..." : "-1"}
    </button>
  );
}

function RemoveAllButton() {
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
        {pending ? "..." : "Remove All"}
      </button>

      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-950 border border-white/10 p-6 shadow-2xl text-left">
            <h3 className="text-lg font-semibold text-white">Remove Asset</h3>
            <p className="mt-2 text-sm text-white/60">
              Are you sure you want to remove this item entirely from the inventory? This action cannot be undone.
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
                {pending ? "Removing..." : "Remove All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
