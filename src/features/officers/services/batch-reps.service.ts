import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { throwSupabaseError } from "@/lib/errors";
import { checkRole } from "@/utils/checkRole";
import { DEFAULT_BATCH_REPRESENTATIVES } from "../data/batch-representatives";
import {
  BatchRepsContentSchema,
  type BatchRepItemInput,
  type BatchRepsContent,
} from "../schemas";

const SITE_CONTENT_KEY = "batch_representatives";

export async function getBatchRepresentativesContent(): Promise<BatchRepsContent> {
  noStore();

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("SiteContent")
      .select("value")
      .eq("key", SITE_CONTENT_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      return DEFAULT_BATCH_REPRESENTATIVES;
    }

    const parsed = BatchRepsContentSchema.safeParse(data.value);
    if (!parsed.success || !parsed.data) {
      return DEFAULT_BATCH_REPRESENTATIVES;
    }

    return parsed.data;
  } catch (error) {
    console.error("[getBatchRepresentativesContent] Error:", error);
    return DEFAULT_BATCH_REPRESENTATIVES;
  }
}

export async function saveBatchRepresentativesContent(
  content: BatchRepsContent
): Promise<BatchRepsContent> {
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

  return saved.value as BatchRepsContent;
}

export async function saveBatchRepItem(
  item: BatchRepItemInput
): Promise<BatchRepsContent> {
  await checkRole({ roles: "Admin" });
  const current = await getBatchRepresentativesContent();
  const batches = [...current];

  // Remove existing if updating
  for (const b of batches) {
    b.representatives = b.representatives.filter((r) => r.id !== item.id);
  }

  let targetBatch = batches.find((b) => b.id === item.batchId);
  if (!targetBatch) {
    targetBatch = {
      id: item.batchId,
      label: item.batchId.replace("batch-", "Batch "),
      batchNumber: item.batchId.replace("batch-", ""),
      description: "Batch Representatives",
      sealUrl: "/circle-access-logo.webp",
      representatives: [],
    };
    batches.push(targetBatch);
  }

  targetBatch.representatives.push({
    ...item,
    batchYear: targetBatch.label,
  });

  return await saveBatchRepresentativesContent(batches);
}

export async function deleteBatchRepItem(id: string): Promise<BatchRepsContent> {
  await checkRole({ roles: "Admin" });
  const current = await getBatchRepresentativesContent();
  const batches = current.map((b) => ({
    ...b,
    representatives: b.representatives.filter((r) => r.id !== id),
  }));

  return await saveBatchRepresentativesContent(batches);
}
