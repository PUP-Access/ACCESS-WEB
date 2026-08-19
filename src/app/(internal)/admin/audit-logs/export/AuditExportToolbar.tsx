"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AuditExportToolbar({
  filterAction,
  totalCount,
}: {
  filterAction: string;
  totalCount: number;
}) {
  const handlePrint = () => {
    window.print();
  };

  // Optional convenience: auto trigger print on load if requested or just give clean button
  useEffect(() => {
    // Small delay so font & image loads before print dialog
    const timer = setTimeout(() => {
      // Ready for printing
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <aside aria-label="PDF Export Controls" className="print:hidden sticky top-0 z-50 mb-8 border-b border-white/10 bg-[#0d0d0d]/90 backdrop-blur-md px-6 py-4 shadow-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/audit-logs"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
          <div className="hidden sm:block text-xs text-white/50">
            Exporting <strong className="text-white">{totalCount}</strong> log entries {filterAction !== "All" ? `(Filtered by: ${filterAction})` : ""}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#F26223] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#F26223]/25 transition hover:bg-[#d95217] active:scale-[0.98]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Save / Download PDF</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
