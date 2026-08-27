"use client";

import { useTransition } from "react";
import { getBorrowRequestLetterUrlAction } from "@/features/borrow/actions/borrow-requests.actions";

type ViewLetterButtonProps = {
  requestId: string;
};

export default function ViewLetterButton({ requestId }: ViewLetterButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await getBorrowRequestLetterUrlAction(requestId);
      if (result.status === "error") {
        alert(result.message);
        return;
      }
      if (result.kind === "none" || !result.url) {
        alert("No letter has been uploaded for this request.");
        return;
      }
      window.open(result.url, "_blank", "noopener");
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={isPending} className="admin-link disabled:opacity-50">
      {isPending ? "Opening..." : "View Letter"}
    </button>
  );
}
