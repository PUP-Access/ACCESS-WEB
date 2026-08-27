import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCard, AdminPageHeader, AdminPageShell } from "../../components/admin-ui";
import { getBorrowRequestById } from "@/features/borrow";
import { AppError } from "@/lib/errors";
import { formatFullDateTime } from "@/lib/date-utils";
import RequestActions from "../components/RequestActions";
import ViewLetterButton from "../components/ViewLetterButton";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="text-sm text-white/85">{value || "—"}</p>
    </div>
  );
}

export default async function AdminBorrowRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let request;
  try {
    request = await getBorrowRequestById(id);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) notFound();
    throw err;
  }

  return (
    <AdminPageShell width="default">
      <AdminPageHeader
        eyebrow="Operations"
        title={request.borrower_contact_name ?? "Borrow Request"}
        description={`Submitted ${formatFullDateTime(request.created_at)}`}
        action={
          <Link href="/admin/borrow-requests" className="admin-btn admin-btn-muted">
            Back to list
          </Link>
        }
      />

      <AdminCard title="Request Details">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Borrower" value={request.borrower_contact_name} />
          <Field label="Email" value={request.borrower_email} />
          <Field label="Phone" value={request.borrower_phone} />
          <Field label="Course / Year / Section" value={request.course_year_section} />
          <Field label="Organization" value={request.organization_name} />
          <Field label="Purpose" value={request.purpose} />
          <Field label="Requested Item(s)" value={request.requested_item} />
          <Field label="Additional Info" value={request.additional_info} />
          <Field label="Start Schedule" value={formatFullDateTime(request.requested_start_date)} />
          <Field label="Return Deadline" value={formatFullDateTime(request.requested_end_date)} />
          <Field label="Reviewed At" value={formatFullDateTime(request.reviewed_at)} />
          <Field label="Released At" value={formatFullDateTime(request.released_at)} />
          <Field label="Returned At" value={formatFullDateTime(request.returned_at)} />
          {request.rejection_reason && (
            <Field label="Rejection Reason" value={request.rejection_reason} />
          )}
        </div>
      </AdminCard>

      <AdminCard title="Formal Letter">
        {request.letter_file_url ? (
          <ViewLetterButton requestId={request.id} />
        ) : (
          <p className="text-sm text-white/45">No letter has been uploaded for this request.</p>
        )}
      </AdminCard>

      <AdminCard title="Actions">
        <RequestActions id={request.id} status={request.status} />
      </AdminCard>
    </AdminPageShell>
  );
}
