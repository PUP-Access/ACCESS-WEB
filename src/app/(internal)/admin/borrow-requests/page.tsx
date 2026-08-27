import Link from "next/link";
import {
  AdminEmptyState,
  AdminFilterPills,
  AdminPageHeader,
  AdminPageShell,
} from "../components/admin-ui";
import { getBorrowRequestsForAdmin } from "@/features/borrow";
import RequestActions from "./components/RequestActions";
import ViewLetterButton from "./components/ViewLetterButton";
import { formatFullDateTime } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["All", "Pending", "Approved", "Rejected", "Active", "Returned", "Cancelled"] as const;

function formatDate(value: string | null) {
  return formatFullDateTime(value);
}

export default async function AdminBorrowRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const currentPage = Number(params.page) || 1;
  const currentStatus = (params.status as (typeof STATUS_OPTIONS)[number]) || "Pending";

  const { data, meta } = await getBorrowRequestsForAdmin({
    page: currentPage,
    status: currentStatus,
    limit: 10,
  });

  return (
    <AdminPageShell width="wide">
      <AdminPageHeader
        eyebrow="Operations"
        title="Borrow Requests"
        description="Review equipment borrowing requests submitted by authorized users."
      />

      <AdminFilterPills
        options={STATUS_OPTIONS}
        current={currentStatus}
        buildHref={(option) => `?status=${option}&page=1`}
      />

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Borrower</th>
              <th>Item</th>
              <th>Dates</th>
              <th>Letter</th>
              <th>Status</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {data.map((request) => (
              <tr key={request.id}>
                <td>
                  <Link href={`/admin/borrow-requests/${request.id}`} className="font-semibold text-white hover:underline">
                    {request.borrower_contact_name}
                  </Link>
                  <p className="text-xs text-white/45">{request.borrower_email}</p>
                  <p className="text-xs text-white/35">{request.organization_name}</p>
                </td>
                <td>
                  <p>{formatDate(request.requested_start_date)}</p>
                  <p className="text-white/35">to</p>
                  <p>{formatDate(request.requested_end_date)}</p>
                </td>
                <td>
                  {request.letter_file_url ? (
                    <ViewLetterButton requestId={request.id} />
                  ) : (
                    <span className="text-white/35">—</span>
                  )}
                </td>
                <td>
                  <RequestActions id={request.id} status={request.status} />
                </td>
                <td className="text-white/45">{formatDate(request.created_at)}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <AdminEmptyState>No borrow requests found.</AdminEmptyState>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/45">
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex gap-2">
            {meta.page > 1 && (
              <Link href={`?status=${currentStatus}&page=${meta.page - 1}`} className="admin-btn admin-btn-secondary">
                Previous
              </Link>
            )}
            {meta.page < meta.totalPages && (
              <Link href={`?status=${currentStatus}&page=${meta.page + 1}`} className="admin-btn admin-btn-primary">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
