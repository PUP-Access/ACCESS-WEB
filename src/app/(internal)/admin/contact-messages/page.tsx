import {
  AdminAlert,
  AdminPageHeader,
  AdminPageShell,
} from "../components/admin-ui";
import { getContactMessagesForAdmin } from "@/features/cms";
import ContactMessagesList from "./ContactMessagesList";

export const dynamic = "force-dynamic";

export default async function AdminContactMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: "success" | "error"; message?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const messages = await getContactMessagesForAdmin();

  return (
    <AdminPageShell width="wide">
      <AdminPageHeader
        eyebrow="Operations"
        title="Contact Messages"
        description="Review student inquiries, track unread feedback, and compose direct email replies via Resend."
      />

      {params.status && params.message ? (
        <AdminAlert status={params.status} message={params.message} />
      ) : null}

      <ContactMessagesList initialMessages={messages} />
    </AdminPageShell>
  );
}
