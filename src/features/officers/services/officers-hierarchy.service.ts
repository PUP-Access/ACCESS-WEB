import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { throwSupabaseError } from "@/lib/errors";
import { checkRole } from "@/utils/checkRole";
import { DEFAULT_OFFICERS_HIERARCHY_CONTENT } from "../data/officers-hierarchy";
import {
  OfficersHierarchyContentSchema,
  type OfficerHierarchyItemInput,
  type OfficersHierarchyContent,
} from "../schemas";

const SITE_CONTENT_KEY = "officers_hierarchy";

export async function getOfficersHierarchyContent(): Promise<OfficersHierarchyContent> {
  noStore();

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("SiteContent")
      .select("value")
      .eq("key", SITE_CONTENT_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      return DEFAULT_OFFICERS_HIERARCHY_CONTENT;
    }

    const parsed = OfficersHierarchyContentSchema.safeParse(data.value);
    if (!parsed.success || !parsed.data) {
      console.error("[getOfficersHierarchyContent] Failed to parse stored JSON, using default");
      return DEFAULT_OFFICERS_HIERARCHY_CONTENT;
    }

    return parsed.data;
  } catch (error) {
    console.error("[getOfficersHierarchyContent] Unexpected error:", error);
    return DEFAULT_OFFICERS_HIERARCHY_CONTENT;
  }
}

export async function saveOfficersHierarchyContent(
  content: OfficersHierarchyContent
): Promise<OfficersHierarchyContent> {
  await checkRole({ roles: "Admin" });
  const supabase = createSupabaseAdminClient();
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  const updatePayload = {
    value: content,
    updated_by: user?.id ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: readError } = await supabase
    .from("SiteContent")
    .select("key")
    .eq("key", SITE_CONTENT_KEY)
    .maybeSingle();

  throwSupabaseError(readError);

  const mutation = existing
    ? supabase
        .from("SiteContent")
        .update(updatePayload)
        .eq("key", SITE_CONTENT_KEY)
        .select("key, value")
        .single()
    : supabase
        .from("SiteContent")
        .insert({ key: SITE_CONTENT_KEY, ...updatePayload })
        .select("key, value")
        .single();

  const { data: saved, error } = await mutation;
  throwSupabaseError(error);

  if (!saved?.value) {
    throw new Error(`Site content "${SITE_CONTENT_KEY}" was not saved.`);
  }

  return saved.value as OfficersHierarchyContent;
}

export async function uploadOfficerAsset(file: File, folder = "officers"): Promise<string> {
  await checkRole({ roles: "Admin" });
  const supabase = createSupabaseAdminClient();

  const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
  const contentType = file.type || `image/${ext}`;
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("access_web_assets")
    .upload(filePath, file, {
      contentType,
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("access_web_assets").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function saveOfficerCardItem(
  item: OfficerHierarchyItemInput,
  imageFile?: File | null,
  bannerFile?: File | null
): Promise<OfficersHierarchyContent> {
  await checkRole({ roles: "Admin" });

  let finalImageUrl = item.imageUrl || "";
  let finalBannerUrl = item.bannerUrl || "";

  if (imageFile && imageFile.size > 0) {
    finalImageUrl = await uploadOfficerAsset(imageFile, "officers");
  }

  if (bannerFile && bannerFile.size > 0) {
    finalBannerUrl = await uploadOfficerAsset(bannerFile, "banners");
  }

  const currentContent = await getOfficersHierarchyContent();
  const updatedItem: OfficerHierarchyItemInput = {
    ...item,
    imageUrl: finalImageUrl,
    bannerUrl: finalBannerUrl,
  };

  const isAdviser = item.tierId === "advisers";

  if (isAdviser) {
    const existingIndex = currentContent.advisers.findIndex((a) => a.id === item.id);
    if (existingIndex >= 0) {
      currentContent.advisers[existingIndex] = updatedItem;
    } else {
      currentContent.advisers.push(updatedItem);
    }
  } else {
    // Remove from other tiers first if changing tiers
    for (const tier of currentContent.tiers) {
      tier.officers = tier.officers.filter((o) => o.id !== item.id);
    }

    // Add to target tier
    let targetTier = currentContent.tiers.find((t) => t.id === item.tierId);
    if (!targetTier) {
      targetTier = { id: item.tierId, officers: [] };
      currentContent.tiers.push(targetTier);
    }

    targetTier.officers.push(updatedItem);
  }

  return saveOfficersHierarchyContent(currentContent);
}

export async function deleteOfficerCardItem(
  officerId: string
): Promise<OfficersHierarchyContent> {
  await checkRole({ roles: "Admin" });

  const currentContent = await getOfficersHierarchyContent();

  currentContent.advisers = currentContent.advisers.filter((a) => a.id !== officerId);

  for (const tier of currentContent.tiers) {
    tier.officers = tier.officers.filter((o) => o.id !== officerId);
  }

  return saveOfficersHierarchyContent(currentContent);
}
