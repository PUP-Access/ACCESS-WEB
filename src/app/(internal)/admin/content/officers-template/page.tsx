import Image from "next/image";
import { redirect } from "next/navigation";
import {
  AdminAlert,
  AdminCard,
  AdminFieldLabel,
  AdminPageHeader,
  AdminPageShell,
  adminBtnPrimaryClass,
  adminFileClass,
  adminInputClass,
  adminTextareaClass,
} from "../../components/admin-ui";
import { getOfficersSectionContent } from "@/features/cms";
import { updateOfficersSectionAction } from "@/features/cms/actions/cms.actions";
import DynamicButtonSettings from "./DynamicButtonSettings";

export const dynamic = "force-dynamic";

export default async function AdminOfficersTemplatePage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: "success" | "error"; message?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const content = await getOfficersSectionContent();

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateOfficersSectionAction({ status: "idle" }, formData);

    if (result.status === "error") {
      redirect(
        `/admin/content/officers-template?status=error&message=${encodeURIComponent(result.message)}`
      );
    }

    redirect(
      `/admin/content/officers-template?status=success&message=${encodeURIComponent(
        result.status === "success" ? (result.message ?? "Saved") : "Saved"
      )}`
    );
  }

  return (
    <AdminPageShell width="narrow">
      <AdminPageHeader
        eyebrow="Site Content"
        title="Officers Section"
        description="Upload the decorative background and edit the section title and subtitle."
      />

      {params.status && params.message ? (
        <AdminAlert status={params.status} message={params.message} />
      ) : null}

      <AdminCard title="Current template preview">
        <div className="relative h-40 overflow-hidden rounded-xl border border-white/10">
          <Image
            src={content.templateImageUrl}
            alt="Officers section template"
            fill
            className="object-cover"
            unoptimized={content.templateImageUrl.startsWith("http")}
          />
        </div>
      </AdminCard>

      <AdminCard title="Section settings">
        <form action={handleUpdate} className="space-y-5">
          <input type="hidden" name="templateImageUrl" value={content.templateImageUrl} />

          <div>
            <AdminFieldLabel>Section title</AdminFieldLabel>
            <input name="title" defaultValue={content.title} className={adminInputClass} />
          </div>

          <div>
            <AdminFieldLabel>Section subtitle</AdminFieldLabel>
            <textarea name="subtitle" defaultValue={content.subtitle} rows={3} className={adminTextareaClass} />
          </div>

          <div>
            <AdminFieldLabel>Upload new template PNG</AdminFieldLabel>
            <input type="file" name="templateImage" accept="image/png,image/webp,image/jpeg" className={adminFileClass} />
          </div>

          <div className="pt-4 border-t border-white/10">
            <DynamicButtonSettings initialParts={content.parts || []} />
          </div>

          <button type="submit" className={adminBtnPrimaryClass}>
            Save officers section
          </button>
        </form>
      </AdminCard>
    </AdminPageShell>
  );
}
