import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getErrorMessage, isRlsPolicyError, throwSupabaseError } from "@/lib/errors";
import { checkRole } from "@/utils/checkRole";
import {
  AboutContentSchema,
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_HERO_CONTENT,
  DEFAULT_OFFICERS_SECTION_CONTENT,
  DEFAULT_SPONSORS_PARTNERS_CONTENT,
  HeroContentSchema,
  OfficersSectionContentSchema,
  SponsorsPartnersContentSchema,
  type AboutContent,
  type HeroContent,
  type OfficersSectionContent,
  type SponsorsPartnersContent,
} from "../schemas";

type SiteContentKey = "hero" | "about" | "officers_section" | "sponsors_partners";

async function getContentByKey<T>(
  key: SiteContentKey,
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T } },
  fallback: T
): Promise<T> {
  noStore();

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("SiteContent")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error(`[SiteContent] Failed to read "${key}":`, error.message);
      return fallback;
    }

    if (!data?.value) {
      return fallback;
    }

    const parsed = schema.safeParse(data.value);
    if (!parsed.success || !parsed.data) {
      console.error(`[SiteContent] Invalid stored value for "${key}"`);
      return fallback;
    }

    return parsed.data;
  } catch (error) {
    console.error(`[SiteContent] Unexpected read error for "${key}":`, error);
    return fallback;
  }
}

export async function getHeroContent(): Promise<HeroContent> {
  return getContentByKey("hero", HeroContentSchema, DEFAULT_HERO_CONTENT);
}

export async function getAboutContent(): Promise<AboutContent> {
  return getContentByKey("about", AboutContentSchema, DEFAULT_ABOUT_CONTENT);
}

export async function getOfficersSectionContent(): Promise<OfficersSectionContent> {
  return getContentByKey(
    "officers_section",
    OfficersSectionContentSchema,
    DEFAULT_OFFICERS_SECTION_CONTENT
  );
}

export async function getSponsorsPartnersContent(): Promise<SponsorsPartnersContent> {
  return getContentByKey(
    "sponsors_partners",
    SponsorsPartnersContentSchema,
    DEFAULT_SPONSORS_PARTNERS_CONTENT
  );
}

export async function updateSiteContent(
  key: SiteContentKey,
  value: HeroContent | AboutContent | OfficersSectionContent | SponsorsPartnersContent
) {
  await checkRole({ roles: "Admin" });
  const supabase = createSupabaseAdminClient();
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  const updatePayload = {
    value,
    updated_by: user?.id ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: readError } = await supabase
    .from("SiteContent")
    .select("key")
    .eq("key", key)
    .maybeSingle();

  throwSupabaseError(readError);

  const mutation = existing
    ? supabase.from("SiteContent").update(updatePayload).eq("key", key).select("key, value").single()
    : supabase.from("SiteContent").insert({ key, ...updatePayload }).select("key, value").single();

  const { data: saved, error } = await mutation;
  throwSupabaseError(error);

  if (!saved?.value) {
    throw new Error(`Site content "${key}" was not saved.`);
  }

  return saved;
}

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

async function uploadSiteContentFileToStorage(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  file: File,
  contentType: string,
  ext: string
): Promise<string> {
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `site-content/${fileName}`;

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

const OFFICERS_ROSTER_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

export async function uploadSiteContentImage(file: File): Promise<string> {
  await checkRole({ roles: "Admin" });

  const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
  const contentType = file.type || MIME_BY_EXT[ext];

  if (!contentType) {
    throw new Error("Unsupported file type. Use PNG, JPG, WEBP, or PDF.");
  }

  try {
    const adminSupabase = createSupabaseAdminClient();
    return await uploadSiteContentFileToStorage(adminSupabase, file, contentType, ext);
  } catch (error) {
    if (!isRlsPolicyError(error)) {
      throw error instanceof Error ? error : new Error(getErrorMessage(error));
    }
  }

  const serverSupabase = await createSupabaseServerClient();
  return uploadSiteContentFileToStorage(serverSupabase, file, contentType, ext);
}

export async function uploadOfficersRosterImage(file: File): Promise<string> {
  await checkRole({ roles: "Admin" });

  const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
  const contentType = file.type || MIME_BY_EXT[ext];

  if (!contentType || !OFFICERS_ROSTER_IMAGE_TYPES.has(contentType)) {
    throw new Error("Officers roster must be an image (PNG, JPG, WEBP, or GIF).");
  }

  try {
    const adminSupabase = createSupabaseAdminClient();
    return await uploadSiteContentFileToStorage(adminSupabase, file, contentType, ext);
  } catch (error) {
    if (!isRlsPolicyError(error)) {
      throw error instanceof Error ? error : new Error(getErrorMessage(error));
    }
  }

  const serverSupabase = await createSupabaseServerClient();
  return uploadSiteContentFileToStorage(serverSupabase, file, contentType, ext);
}

export async function uploadSponsorLogoImage(file: File): Promise<string> {
  return uploadSiteContentImage(file);
}

