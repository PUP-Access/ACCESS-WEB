import Link from "next/link";
import {
  AdminCard,
  AdminEmptyState,
  AdminFilterPills,
  AdminPageHeader,
  AdminPageShell,
} from "../components/admin-ui";
import { getBorrowRequestsForAdmin } from "@/features/cms";
import StatusSelect from "./components/StatusSelect";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["All", "Pending", "Approved", "Rejected", "Active", "Returned", "Cancelled"] as const;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function statusBadgeClass(status: string | null) {
  const value = status ?? "Pending";
  if (value === "Pending") return "admin-badge admin-badge-pending";
  if (value === "Approved" || value === "Active") return "admin-badge admin-badge-published";
  if (value === "Rejected" || value === "Cancelled") return "admin-badge admin-badge-neutral";
  return "admin-badge admin-badge-draft";
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
              <th>Status</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {data.map((request) => (
              <tr key={request.id}>
                <td>
                  <p className="font-semibold text-white">{request.borrower_contact_name}</p>
                  <p className="text-xs text-white/45">{request.borrower_email}</p>
                  <p className="text-xs text-white/35">{request.organization_name}</p>
                </td>
                <td>{request.requested_item ?? "—"}</td>
                <td>
                  <p>{formatDate(request.requested_start_date)}</p>
                  <p className="text-white/35">to</p>
                  <p>{formatDate(request.requested_end_date)}</p>
                </td>
                <td>
                  <StatusSelect id={request.id} currentStatus={request.status ?? "Pending"} />
                </td>
                <td className="text-white/45">{formatDate(request.created_at)}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5}>
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

      {data.some((request) => request.letter_file_url) && (
        <AdminCard title="Request letters" description="Download letters attached to current page results.">
          <div className="space-y-2">
            {data
              .filter((request) => request.letter_file_url)
              .map((request) => (
                <div key={`${request.id}-letter`} className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-black/20 px-4 py-3">
                  <span className="text-sm text-white/75">
                    {request.borrower_contact_name} · {request.requested_item}
                  </span>
                  <a href={request.letter_file_url ?? "#"} target="_blank" rel="noreferrer" className="admin-link">
                    View letter
                  </a>
                </div>
              ))}
          </div>
        </AdminCard>
      )}
    </AdminPageShell>
  );
}
