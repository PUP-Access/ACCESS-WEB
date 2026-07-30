"use client";

import { useState, useTransition } from "react";
import { adminBtnMutedClass, adminBtnPrimaryClass } from "../components/admin-ui";
import { replyContactMessageAction } from "@/features/cms/actions/cms.actions";

type AdminMessageReplyProps = {
  messageId: string;
  userEmail: string;
  originalSubject: string;
};

export default function AdminMessageReply({
  messageId,
  userEmail,
  originalSubject,
}: AdminMessageReplyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setStatus("idle");
    const formData = new FormData();
    formData.set("id", messageId);
    formData.set("email", userEmail);
    formData.set("subject", `Re: Your concern from ACCESS`);
    formData.set("message", replyBody);

    startTransition(async () => {
      try {
        const result = await replyContactMessageAction({ status: "idle" }, formData);
        if (result.status === "error") {
          setStatus("error");
          setErrorMessage(result.message || "Failed to send reply");
        } else {
          setStatus("success");
          setIsOpen(false);
          setReplyBody("");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("An unexpected error occurred.");
      }
    });
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className={adminBtnMutedClass}>
        Reply via Email
      </button>
    );
  }

  return (
    <div className="mt-4 w-full rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">Reply to {userEmail}</h4>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-white/50 hover:text-white"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleReplySubmit} className="space-y-3">
        {status === "error" && (
          <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded">{errorMessage}</p>
        )}
        
        <textarea
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder="Type your reply here..."
          className="w-full rounded-lg bg-black/20 px-3 py-2 text-sm text-white placeholder-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/25 min-h-[100px]"
          required
        />
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !replyBody.trim()}
            className={adminBtnPrimaryClass}
          >
            {isPending ? "Sending..." : "Send Reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
