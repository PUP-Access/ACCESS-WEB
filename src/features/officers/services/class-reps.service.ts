import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { throwSupabaseError } from "@/lib/errors";
import { checkRole } from "@/utils/checkRole";
import { rolesForArea } from "@/utils/adminAccess";
import { DEFAULT_CLASS_REPRESENTATIVES } from "../data/class-representatives";
import {
  ClassRepsContentSchema,
  type ClassRepItemInput,
  type ClassRepsContent,
} from "../schemas";

const SITE_CONTENT_KEY = "class_representatives";

export async function getClassRepresentativesContent(): Promise<ClassRepsContent> {
  noStore();

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("SiteContent")
      .select("value")
      .eq("key", SITE_CONTENT_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      return DEFAULT_CLASS_REPRESENTATIVES as ClassRepsContent;
    }

    const parsed = ClassRepsContentSchema.safeParse(data.value);
    if (!parsed.success || !parsed.data) {
      return DEFAULT_CLASS_REPRESENTATIVES as ClassRepsContent;
    }

    return parsed.data;
  } catch (error) {
    console.error("[getClassRepresentativesContent] Error:", error);
    return DEFAULT_CLASS_REPRESENTATIVES as ClassRepsContent;
  }
}

export async function saveClassRepresentativesContent(
  content: ClassRepsContent
): Promise<ClassRepsContent> {
  await checkRole({ roles: rolesForArea("officers") });
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

  return saved.value as ClassRepsContent;
}

export async function saveClassRepItem(
  item: ClassRepItemInput
): Promise<ClassRepsContent> {
  await checkRole({ roles: rolesForArea("officers") });
  const current = await getClassRepresentativesContent();
  const yearLevels = [...current];

  // Remove existing if updating
  for (const y of yearLevels) {
    y.representatives = y.representatives.filter((r) => r.id !== item.id);
  }

  // Find target year level
  let targetYear = yearLevels.find((y) => y.id === item.yearId);
  if (!targetYear) {
    targetYear = {
      id: item.yearId,
      label: item.yearId.replace("-", " ").toUpperCase(),
      yearNumber: item.yearId.split("-")[0] || "1st",
      description: "Class Representatives",
      sealUrl: "/circle-access-logo.webp",
      representatives: [],
    };
    yearLevels.push(targetYear);
  }

  targetYear.representatives.push({
    ...item,
    courseYear: item.section || item.courseYear,
  });

  return await saveClassRepresentativesContent(yearLevels);
}

export async function deleteClassRepItem(id: string): Promise<ClassRepsContent> {
  await checkRole({ roles: rolesForArea("officers") });
  const current = await getClassRepresentativesContent();
  const yearLevels = current.map((y) => ({
    ...y,
    representatives: y.representatives.filter((r) => r.id !== id),
  }));

  return await saveClassRepresentativesContent(yearLevels);
}
