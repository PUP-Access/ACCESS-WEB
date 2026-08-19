import { redirect } from "next/navigation";
import Image from "next/image";
import {
  AdminAlert,
  AdminCard,
  AdminFieldLabel,
  AdminPageHeader,
  AdminPageShell,
  adminBtnPrimaryClass,
} from "../../components/admin-ui";
import { getAboutContent } from "@/features/cms";
import { updateAboutImagesAction } from "@/features/cms/actions/cms.actions";

export const dynamic = "force-dynamic";

export default async function AdminAboutImagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: "success" | "error"; message?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const about = await getAboutContent();
  const currentImages = about.carouselImages || [];

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateAboutImagesAction({ status: "idle" }, formData);

    if (result.status === "error") {
      redirect(`/admin/content/about-images?status=error&message=${encodeURIComponent(result.message)}`);
    }

    redirect(
      `/admin/content/about-images?status=success&message=${encodeURIComponent(
        result.status === "success" ? (result.message ?? "Saved") : "Saved"
      )}`
    );
  }

  return (
    <AdminPageShell width="narrow">
      <AdminPageHeader
        eyebrow="Site Content"
        title="About Images"
        description="Upload images for the About Us carousel (up to 5 images)."
      />

      {params.status && params.message ? (
        <AdminAlert status={params.status} message={params.message} />
      ) : null}

      <AdminCard title="Carousel Images">
        <form action={handleUpdate} className="space-y-6">
          {[0, 1, 2, 3, 4].map((index) => {
            const currentImg = currentImages[index];
            return (
              <div key={index} className="space-y-3">
                <AdminFieldLabel>Image {index + 1}</AdminFieldLabel>
                {currentImg ? (
                  <div className="space-y-2">
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10">
                      <Image
                        src={currentImg}
                        alt={`About Image ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 cursor-pointer">
                      <input
                        type="checkbox"
                        name={`remove_image${index}`}
                        value="true"
                        className="rounded border-white/20 bg-white/10 text-red-500 focus:ring-red-500"
                      />
                      <span>Remove / Delete this image</span>
                    </label>
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-sm">
                    No image set
                  </div>
                )}
                <input
                  type="file"
                  name={`image${index}`}
                  accept="image/png, image/jpeg, image/webp"
                  className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
                />
              </div>
            );
          })}
          
          <button type="submit" className={adminBtnPrimaryClass}>
            Save about images
          </button>
        </form>
      </AdminCard>
    </AdminPageShell>
  );
}
