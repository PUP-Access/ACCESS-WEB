"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { adminBtnPrimaryClass, adminBtnMutedClass } from "../components/admin-ui";
import type { Asset } from "@/features/assets/services/assets.admin.service";

type EditAssetModalProps = {
  asset: Asset;
  allCategories: string[];
  action: (formData: FormData) => void;
};

export function EditAssetModal({ asset, allCategories, action }: EditAssetModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // We need to wrap the form action so we can close the modal after submission.
  // Next.js server actions in forms automatically reset pending state, but to
  // ensure we only close on success, we can just let it run.
  return (
    <>
      <button
        type="button"
        className="admin-btn admin-btn-secondary py-1 px-3 text-[10px]"
        onClick={() => setIsOpen(true)}
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-md rounded-2xl bg-neutral-950 border border-white/10 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Edit Asset</h3>

            <form
              action={(formData) => {
                action(formData);
                setIsOpen(false);
              }}
              className="mt-4 space-y-4"
            >
              <input type="hidden" name="id" value={asset.id} />

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  defaultValue={asset.name}
                  className="w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F26223]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Category</label>
                <input
                  required
                  type="text"
                  name="category"
                  defaultValue={asset.category}
                  list="category-list-edit"
                  className="w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F26223]"
                />
                <datalist id="category-list-edit">
                  {allCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-white/50 mb-1">Quantity</label>
                  <input
                    required
                    type="number"
                    name="quantity"
                    defaultValue={asset.quantity}
                    min="0"
                    className="w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F26223]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-white/50 mb-1">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    defaultValue={asset.unit || ""}
                    placeholder="PCS"
                    className="w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F26223]"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={adminBtnMutedClass}
                >
                  Cancel
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={adminBtnPrimaryClass}>
      {pending ? "Saving..." : "Save Changes"}
    </button>
  );
}
