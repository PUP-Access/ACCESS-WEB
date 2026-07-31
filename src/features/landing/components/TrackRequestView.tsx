"use client";

import { useEffect, useState, startTransition } from "react";
import { getMyBorrowRequestsAction } from "@/features/landing/services/borrow.actions";

type RequestItem = {
  id: string;
  requested_item: string;
  requested_start_date: string;
  requested_end_date: string;
  status: string;
  created_at: string;
};

type TrackRequestViewProps = {
  onBackToLanding: () => void;
};

const glassCardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
};

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-500/20 text-yellow-200 border-yellow-500/50",
  Approved: "bg-green-500/20 text-green-200 border-green-500/50",
  Rejected: "bg-red-500/20 text-red-200 border-red-500/50",
  Returned: "bg-blue-500/20 text-blue-200 border-blue-500/50",
};

export default function TrackRequestView({ onBackToLanding }: TrackRequestViewProps) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getMyBorrowRequestsAction();
        if (result.status === "error") {
          setError(result.message);
        } else {
          setRequests(result.data || []);
        }
      } catch (err) {
        setError("Failed to load requests.");
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  return (
    <div
      className="relative w-full max-w-3xl rounded-3xl px-6 py-8 sm:px-10 sm:py-10 text-left"
      style={glassCardStyle}
    >
      <div className="text-center">
        <h2 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-wide title-header text-white">
          My Borrow Requests
        </h2>
        <p className="mt-2 text-sm text-white/90">
          Track the status of your borrow requests.
        </p>
      </div>

      <div className="mt-8">
        {error && (
          <p className="mb-5 rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-100" role="alert">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-4 border-white/20 border-t-[#F26223] rounded-full animate-spin"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10 text-white/70 bg-black/10 rounded-xl border border-white/10">
            <p>You have no borrow requests.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {requests.map((req) => {
              const statusColor = statusColors[req.status] || "bg-gray-500/20 text-gray-200 border-gray-500/50";
              return (
                <div key={req.id} className="bg-black/20 border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-white">{req.requested_item}</h3>
                    <div className="text-xs text-white/60 flex flex-col sm:flex-row sm:gap-3">
                      <span>Submitted: {new Date(req.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}</span>
                    </div>
                    <div className="text-xs text-white/60">
                      <span>Needed: {new Date(req.requested_start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(req.requested_end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                    {req.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onBackToLanding}
          className="px-6 py-2 rounded-xl text-sm font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20"
        >
          Close
        </button>
      </div>
    </div>
  );
}
