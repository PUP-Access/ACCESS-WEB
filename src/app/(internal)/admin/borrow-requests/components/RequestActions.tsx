"use client";

import { useTransition } from "react";
import type { BorrowRequest } from "@/features/borrow/services/borrow-requests.admin.service";
import {
  approveBorrowRequestAction,
  releaseBorrowRequestAction,
  returnBorrowRequestAction,
} from "@/features/borrow/actions/borrow-requests.actions";
import RejectReasonModal from "./RejectReasonModal";

type RequestActionsProps = {
  id: string;
  status: BorrowRequest["status"];
  isOverdue?: boolean;
};

function statusBadgeClass(status: string | null) {
  const value = status ?? "Pending";
  if (value === "Rejected" || value === "Cancelled") return "admin-badge admin-badge-neutral";
  return "admin-badge admin-badge-draft";
}

export default function RequestActions({ id, status, isOverdue = false }: RequestActionsProps) {
  const [isPending, startTransition] = useTransition();

  function runAction(action: (id: string) => Promise<{ status: string; message?: string }>) {
    startTransition(async () => {
      const result = await action(id);
      if (result.status === "error") {
        alert(result.message);
      }
    });
  }

  if (status === "Pending") {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(approveBorrowRequestAction)}
          className="admin-btn admin-btn-primary py-1 px-3 text-[10px] disabled:opacity-50"
        >
          {isPending ? "Working..." : "Approve"}
        </button>
        <RejectReasonModal id={id} />
      </div>
    );
  }

  if (status === "Approved") {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => runAction(releaseBorrowRequestAction)}
        className="admin-btn admin-btn-primary py-1 px-3 text-[10px] disabled:opacity-50"
      >
        {isPending ? "Releasing..." : "Release"}
      </button>
    );
  }

  if (status === "Active") {
    return (
      <div className="flex items-center gap-2">
        {isOverdue && <span className="admin-badge admin-badge-danger">Overdue</span>}
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(returnBorrowRequestAction)}
          className="admin-btn admin-btn-primary py-1 px-3 text-[10px] disabled:opacity-50"
        >
          {isPending ? "Working..." : "Mark Returned"}
        </button>
      </div>
    );
  }

  return <span className={statusBadgeClass(status)}>{status ?? "Pending"}</span>;
}
