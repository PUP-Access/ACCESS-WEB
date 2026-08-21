import { redirect } from "next/navigation";
import OfficersRosterMedia from "@/features/cms/components/OfficersRosterMedia";
import {
  AdminAlert,
  AdminCard,
  AdminEmptyState,
  AdminFieldLabel,
  AdminPageHeader,
  AdminPageShell,
  adminBtnPrimaryClass,
  adminFileClass,
} from "../../components/admin-ui";
import { getOfficersSectionContent } from "@/features/cms";
import { updateOfficersRosterAction } from "@/features/cms/actions/cms.actions";

export const dynamic = "force-dynamic";

export default async function AdminOfficersRosterPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: "success" | "error"; message?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const content = await getOfficersSectionContent();

  async function handleUpload(formData: FormData) {
    "use server";
    const result = await updateOfficersRosterAction({ status: "idle" }, formData);

    if (result.status === "error") {
      redirect(
        `/admin/content/officers-roster?status=error&message=${encodeURIComponent(result.message)}`
      );
    }

    redirect(
      `/admin/content/officers-roster?status=success&message=${encodeURIComponent(
        result.status === "success" ? (result.message ?? "Saved") : "Saved"
      )}`
    );
  }

  return (
    <AdminPageShell width="narrow">
      <AdminPageHeader
        eyebrow="Site Content"
        title="Officers Image"
        description="Upload an image of current ACCESS officers. It appears on the /officers page."
      />

      {params.status && params.message ? (
        <AdminAlert status={params.status} message={params.message} />
      ) : null}

      <AdminCard title="Current officers images">
        <div className="space-y-6">
          {(content.parts || []).map((part, index) => (
            <div key={part.id}>
              <h4 className="text-sm font-semibold text-zinc-200 mb-2">{part.label || `Part ${index + 1}`}</h4>
              {part.imageUrl ? (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <OfficersRosterMedia
                    url={part.imageUrl}
                    alt={part.label}
                    className="h-[min(40vh,400px)] w-full rounded-xl border-0 bg-white object-contain"
                  />
                </div>
              ) : (
                <AdminEmptyState>No image uploaded yet.</AdminEmptyState>
              )}
            </div>
          ))}
          {(!content.parts || content.parts.length === 0) && (
             <AdminEmptyState>No parts configured. Add buttons in the Officers Template settings.</AdminEmptyState>
          )}
        </div>
      </AdminCard>

      <AdminCard title="Upload images">
        <form action={handleUpload} className="space-y-5">
          {(content.parts || []).map((part, index) => (
            <div key={part.id} className="pt-4 border-t border-white/10 first:border-0 first:pt-0">
              <AdminFieldLabel>{part.label || `Part ${index + 1}`} Image</AdminFieldLabel>
              <input
                type="file"
                name={`image_${part.id}`}
                accept="image/png,image/webp,image/jpeg,image/gif"
                className={adminFileClass}
              />
            </div>
          ))}

          {content.parts && content.parts.length > 0 && (
            <button type="submit" className={adminBtnPrimaryClass}>
              Save images
            </button>
          )}
        </form>
      </AdminCard>
    </AdminPageShell>
  );
}
