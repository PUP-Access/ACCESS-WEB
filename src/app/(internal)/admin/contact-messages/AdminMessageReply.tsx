"use client";

import { useState, useTransition } from "react";
import { replyContactMessageAction } from "@/features/cms/actions/cms.actions";

type AdminMessageReplyProps = {
  messageId: string;
  userName?: string;
  userEmail: string;
  originalSubject?: string;
  onClose?: () => void;
  onSuccess?: (details: { email: string; subject: string }) => void;
};

const QUICK_TEMPLATES = [
  {
    label: "General Acknowledgment",
    text: "Thank you for reaching out to PUP ACCESS. We have received your inquiry and are currently reviewing it. We will get back to you shortly with more details.",
  },
  {
    label: "Office Visit",
    text: "Thank you for reaching out. Please feel free to visit our official ACCESS Organization Room at the College of Engineering during office hours (Monday - Friday, 9:00 AM - 5:00 PM) for further assistance.",
  },
  {
    label: "Social Media Channels",
    text: "Hello! Thank you for contacting ACCESS. For the latest announcements and event guidelines, please check our official Facebook and social media pages.",
  },
];

export default function AdminMessageReply({
  messageId,
  userName = "Student",
  userEmail,
  originalSubject = "Inquiry",
  onClose,
  onSuccess,
}: AdminMessageReplyProps) {
  const [subject, setSubject] = useState(`Re: ${originalSubject || "Your concern from ACCESS"}`);
  const [replyBody, setReplyBody] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sendResult, setSendResult] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApplyTemplate = (templateText: string) => {
    setReplyBody(templateText);
  };

  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !subject.trim()) return;
    // Open confirmation pop-up first
    setShowConfirmModal(true);
  };

  const handleConfirmSend = () => {
    setShowConfirmModal(false);
    setSendResult(null);

    const formData = new FormData();
    formData.set("id", messageId);
    formData.set("email", userEmail);
    formData.set("subject", subject.trim());
    formData.set("message", replyBody.trim());

    startTransition(async () => {
      try {
        const result = await replyContactMessageAction({ status: "idle" }, formData);
        if (result.status === "error") {
          setSendResult({
            status: "error",
            message: result.message || "Failed to send email via Resend.",
          });
        } else {
          setSendResult({
            status: "success",
            message: `Email successfully sent to ${userEmail}!`,
          });
          if (onSuccess) {
            onSuccess({ email: userEmail, subject: subject.trim() });
          }
        }
      } catch (err) {
        setSendResult({
          status: "error",
          message: "An unexpected network or server error occurred while sending.",
        });
      }
    });
  };

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#1c1410] to-[#120a06] p-4 sm:p-5 ring-1 ring-white/15 shadow-2xl backdrop-blur-xl">
      {/* ── HEADER ── */}
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]/20 text-[#FF6B35]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Compose Email Reply
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-normal text-white/60">
                via Resend
              </span>
            </h4>
            <p className="text-xs text-white/45">
              To: <span className="font-semibold text-white/80">{userName}</span> ({userEmail})
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-all"
            title="Cancel and close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── POST-SEND RESULT STATUS POPUP BANNER ── */}
      {sendResult && (
        <div
          className={`mb-4 rounded-xl p-4 ring-1 transition-all ${
            sendResult.status === "success"
              ? "bg-emerald-500/15 ring-emerald-500/40 text-emerald-200"
              : "bg-red-500/15 ring-red-500/40 text-red-200"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {sendResult.status === "success" ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 mt-0.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider">
                  {sendResult.status === "success" ? "Reply Sent Successfully!" : "Email Failed to Send"}
                </h5>
                <p className="mt-0.5 text-xs text-white/80 leading-relaxed">
                  {sendResult.message}
                </p>
                {sendResult.status === "success" && (
                  <p className="mt-1 text-[11px] text-emerald-400/80">
                    Recipient inbox: <strong>{userEmail}</strong> • Sender: <strong>noreply@pupaccess.org</strong>
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSendResult(null)}
              className="text-xs text-white/50 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── QUICK INSERT TEMPLATES ── */}
      <div className="mb-4 space-y-1.5">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
          ⚡ Quick Templates
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyTemplate(tmpl.text)}
              className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs text-white/70 ring-1 ring-white/10 hover:bg-[#FF6B35]/20 hover:text-[#FFB89A] hover:ring-[#FF6B35]/30 transition-all cursor-pointer"
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── FORM ── */}
      <form onSubmit={handleInitiateSubmit} className="space-y-3.5">
        {/* Subject input */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-white/60">
            Email Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line..."
            required
            className="w-full rounded-xl bg-black/40 px-3.5 py-2 text-sm text-white placeholder-white/30 ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF6B35]/60 focus:outline-none transition-all"
          />
        </div>

        {/* Message body */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-semibold text-white/60">
              Message Content
            </label>
            <span className="text-[11px] text-white/35">
              {replyBody.length} characters
            </span>
          </div>
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write your email response here..."
            required
            rows={5}
            className="w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-white/30 ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF6B35]/60 focus:outline-none transition-all resize-y leading-relaxed"
          />
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="text-[11px] text-white/40">
            Sending from: <code className="text-white/60">ACCESS &lt;noreply@pupaccess.org&gt;</code>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-xl bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isPending || !replyBody.trim() || !subject.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E04810] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#FF6B35]/25 hover:from-[#FF7D4D] hover:to-[#EB551D] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {isPending ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Verifying &amp; Sending...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send Reply</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ── CONFIRMATION POP-UP MODAL (BEFORE SENDING) ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#18110c] p-6 ring-1 ring-white/20 shadow-2xl border border-white/10">
            {/* Modal Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FF6B35]/20 text-[#FF6B35] ring-1 ring-[#FF6B35]/30">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">
                  Confirm Sending Email Reply
                </h3>
                <p className="mt-1 text-xs text-white/50">
                  Please review the details below before dispatching the email via Resend.
                </p>
              </div>
            </div>

            {/* Email Summary Box */}
            <div className="mt-4 space-y-2 rounded-xl bg-black/40 p-4 ring-1 ring-white/10 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-semibold text-white/50 uppercase tracking-wider text-[10px]">
                  Recipient
                </span>
                <span className="font-bold text-white">
                  {userName} &lt;{userEmail}&gt;
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-semibold text-white/50 uppercase tracking-wider text-[10px]">
                  Subject
                </span>
                <span className="font-medium text-[#FFB89A] truncate max-w-[280px]">
                  {subject}
                </span>
              </div>
              <div className="pt-1">
                <span className="block font-semibold text-white/50 uppercase tracking-wider text-[10px] mb-1">
                  Message Preview
                </span>
                <div className="max-h-28 overflow-y-auto rounded-lg bg-black/30 p-2.5 text-white/80 whitespace-pre-wrap leading-relaxed text-[11px]">
                  {replyBody}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E04810] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#FF6B35]/25 hover:from-[#FF7D4D] hover:to-[#EB551D] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Yes, Send Email</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
