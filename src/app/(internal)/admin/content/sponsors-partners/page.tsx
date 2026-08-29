import { redirect } from "next/navigation";
import {
  AdminAlert,
  AdminCard,
  AdminFieldLabel,
  AdminPageHeader,
  AdminPageShell,
  adminBtnPrimaryClass,
  adminInputClass,
  adminTextareaClass,
} from "../../components/admin-ui";
import { getSponsorsPartnersContent } from "@/features/cms";
import { updateSponsorsPartnersContentAction } from "@/features/cms/actions/cms.actions";
import SponsorsManager from "./SponsorsManager";

export const dynamic = "force-dynamic";

export default async function AdminSponsorsPartnersPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: "success" | "error"; message?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const content = await getSponsorsPartnersContent();

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateSponsorsPartnersContentAction({ status: "idle" }, formData);

    if (result.status === "error") {
      redirect(
        `/admin/content/sponsors-partners?status=error&message=${encodeURIComponent(result.message)}`
      );
    }

    redirect(
      `/admin/content/sponsors-partners?status=success&message=${encodeURIComponent(
        result.status === "success" ? (result.message ?? "Saved") : "Saved"
      )}`
    );
  }

  return (
    <AdminPageShell width="wide">
      <AdminPageHeader
        eyebrow="Site Content"
        title="Sponsors & Partners"
        description="Manage the landing page marquee, comprehensive partners page, sponsor tiers, and organization logos."
      />

      {params.status && params.message ? (
        <AdminAlert status={params.status} message={params.message} />
      ) : null}

      <form action={handleUpdate} className="space-y-6">
        <AdminCard title="Landing Page Banner Settings">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
              <input
                type="checkbox"
                name="hideSection"
                id="hideSection"
                defaultChecked={content.hideSection}
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#F26223] focus:ring-[#F26223] cursor-pointer"
              />
              <label htmlFor="hideSection" className="text-xs font-semibold text-white/80 cursor-pointer">
                Hide Sponsors & Partners Section on Landing Page
              </label>
            </div>

            <div>
              <AdminFieldLabel>Landing Marquee Section Title</AdminFieldLabel>
              <input
                name="landingTitle"
                defaultValue={content.landingTitle}
                className={adminInputClass}
              />
            </div>

            <div>
              <AdminFieldLabel>Landing Marquee Subtitle</AdminFieldLabel>
              <textarea
                name="landingSubtitle"
                defaultValue={content.landingSubtitle}
                rows={2}
                className={adminTextareaClass}
              />
            </div>

            <div>
              <AdminFieldLabel>Call-to-Action Button Label</AdminFieldLabel>
              <input
                name="ctaLabel"
                defaultValue={content.ctaLabel}
                className={adminInputClass}
              />
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Sponsors & Partners Roster">
          <SponsorsManager initialItems={content.items || []} />
        </AdminCard>

        <AdminCard title="Dedicated /partners Page Headlines">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <input
                  type="checkbox"
                  name="hideSponsors"
                  id="hideSponsors"
                  defaultChecked={content.hideSponsors}
                  className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#F26223] focus:ring-[#F26223] cursor-pointer"
                />
                <label htmlFor="hideSponsors" className="text-xs font-semibold text-white/80 cursor-pointer">
                  Hide Sponsors Section on /partners Page
                </label>
              </div>
              <div>
                <AdminFieldLabel>Sponsors Section Title</AdminFieldLabel>
                <input
                  name="sponsorsTitle"
                  defaultValue={content.sponsorsTitle}
                  className={adminInputClass}
                />
              </div>
              <div>
                <AdminFieldLabel>Sponsors Section Subtitle</AdminFieldLabel>
                <textarea
                  name="sponsorsSubtitle"
                  defaultValue={content.sponsorsSubtitle}
                  rows={2}
                  className={adminTextareaClass}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <input
                  type="checkbox"
                  name="hidePartners"
                  id="hidePartners"
                  defaultChecked={content.hidePartners}
                  className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#F26223] focus:ring-[#F26223] cursor-pointer"
                />
                <label htmlFor="hidePartners" className="text-xs font-semibold text-white/80 cursor-pointer">
                  Hide Partners Section on /partners Page
                </label>
              </div>
              <div>
                <AdminFieldLabel>Partners Section Title</AdminFieldLabel>
                <input
                  name="partnersTitle"
                  defaultValue={content.partnersTitle}
                  className={adminInputClass}
                />
              </div>
              <div>
                <AdminFieldLabel>Partners Section Subtitle</AdminFieldLabel>
                <textarea
                  name="partnersSubtitle"
                  defaultValue={content.partnersSubtitle}
                  rows={2}
                  className={adminTextareaClass}
                />
              </div>
            </div>
          </div>
        </AdminCard>

        <div className="sticky bottom-6 z-20 flex justify-end">
          <button type="submit" className={`${adminBtnPrimaryClass} shadow-2xl`}>
            Save All Sponsors & Partners Changes
          </button>
        </div>
      </form>
    </AdminPageShell>
  );
}
