import { redirect } from "next/navigation";
import {
  AdminAlert,
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminPageShell,
  adminBtnMutedClass,
} from "../components/admin-ui";
import { getContactMessagesForAdmin } from "@/features/cms";
import { markContactMessageReadAction } from "@/features/cms/actions/cms.actions";
import AdminMessageReply from "./AdminMessageReply";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default async function AdminContactMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: "success" | "error"; message?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const messages = await getContactMessagesForAdmin();

  async function handleMarkRead(formData: FormData) {
    "use server";
    const id = formData.get("id");
    if (typeof id !== "string") {
      redirect("/admin/contact-messages?status=error&message=Message%20ID%20required");
    }

    const result = await markContactMessageReadAction(id);

    if (result.status === "error") {
      redirect(`/admin/contact-messages?status=error&message=${encodeURIComponent(result.message)}`);
    }

    redirect("/admin/contact-messages?status=success&message=Marked%20as%20read");
  }

  return (
    <AdminPageShell width="default">
      <AdminPageHeader
        eyebrow="Operations"
        title="Contact Messages"
        description="Messages submitted through the Contact Us form on the landing page."
      />

      {params.status && params.message ? (
        <AdminAlert status={params.status} message={params.message} />
      ) : null}

      <div className="space-y-4">
        {messages.length === 0 ? (
          <AdminEmptyState>No contact messages yet.</AdminEmptyState>
        ) : (
          messages.map((message) => (
            <AdminCard key={message.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{message.full_name}</h3>
                    {!message.is_read ? (
                      <span className="admin-badge admin-badge-unread">Unread</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-white/45">{message.email}</p>
                  <p className="mt-1 text-xs text-white/35">{formatDate(message.created_at)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <AdminMessageReply 
                    messageId={message.id} 
                    userEmail={message.email} 
                    originalSubject={message.purpose || ""} 
                  />
                  {!message.is_read && (
                    <form action={handleMarkRead}>
                      <input type="hidden" name="id" value={message.id} />
                      <button type="submit" className={adminBtnMutedClass}>
                        Mark as read
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-white/40">Course / Year / Section</dt>
                  <dd className="text-white/80">{message.course_year_section ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Contact number</dt>
                  <dd className="text-white/80">{message.contact_number ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Organization</dt>
                  <dd className="text-white/80">{message.organization ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Purpose</dt>
                  <dd className="text-white/80">{message.purpose ?? "—"}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="text-sm text-white/40">Concern</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-white/75">{message.concern}</p>
              </div>
            </AdminCard>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}
