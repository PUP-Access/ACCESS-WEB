"use client";

import { useTransition, useState } from "react";
import { updateBorrowRequestStatusAction } from "@/features/cms/actions/cms.actions";

type StatusSelectProps = {
  id: string;
  currentStatus: string;
};

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Active", "Returned", "Cancelled"];

function statusSelectClass(status: string) {
  if (status === "Pending") return "bg-yellow-500/20 text-yellow-200 border-yellow-500/50";
  if (status === "Approved" || status === "Active") return "bg-green-500/20 text-green-200 border-green-500/50";
  if (status === "Rejected" || status === "Cancelled") return "bg-red-500/20 text-red-200 border-red-500/50";
  return "bg-gray-500/20 text-gray-200 border-gray-500/50";
}

export default function StatusSelect({ id, currentStatus }: StatusSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    startTransition(async () => {
      const result = await updateBorrowRequestStatusAction(id, newStatus);
      if (result.status === "error") {
        alert(result.message);
        setStatus(currentStatus); // Revert on error
      }
    });
  };

  return (
    <div className="relative inline-block">
      <select
        value={status}
        onChange={handleChange}
        disabled={isPending}
        className={`appearance-none px-3 py-1 pr-8 rounded-full text-xs font-medium border outline-none cursor-pointer transition-colors ${statusSelectClass(status)} ${isPending ? 'opacity-50' : ''}`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt} className="bg-neutral-900 text-white">
            {opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-inherit opacity-70">
        <svg className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}
