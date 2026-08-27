"use client";

import { useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import { adminBtnDangerClass, adminBtnMutedClass, adminTextareaClass } from "../../components/admin-ui";
import { rejectBorrowRequestAction } from "@/features/borrow/actions/borrow-requests.actions";

type RejectReasonModalProps = {
  id: string;
};

export default function RejectReasonModal({ id }: RejectReasonModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        className="admin-btn admin-btn-danger py-1 px-3 text-[10px]"
        onClick={() => setIsOpen(true)}
      >
        Reject
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-md rounded-2xl bg-neutral-950 border border-white/10 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Reject Borrow Request</h3>
            <p className="mt-1 text-xs text-white/50">
              Provide a reason for the borrower. This will be included in the rejection email.
            </p>

            <form
              action={(formData) => {
                startTransition(async () => {
                  const result = await rejectBorrowRequestAction(id, formData);
                  if (result.status === "error") {
                    alert(result.message);
                    return;
                  }
                  setIsOpen(false);
                });
              }}
              className="mt-4 space-y-4"
            >
              <textarea
                required
                minLength={5}
                maxLength={1000}
                name="reason"
                placeholder="e.g. Requested equipment is currently under maintenance."
                className={adminTextareaClass}
              />

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={adminBtnMutedClass}
                  disabled={isPending}
                >
                  Cancel
                </button>
                <SubmitButton isPending={isPending} />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  const { pending } = useFormStatus();
  const busy = pending || isPending;
  return (
    <button type="submit" disabled={busy} className={adminBtnDangerClass}>
      {busy ? "Rejecting..." : "Reject Request"}
    </button>
  );
}
