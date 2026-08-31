import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { checkRole } from "@/utils/checkRole";

/**
 * Drains storage_cleanup_queue (populated by the monthly purge_old_borrow_requests
 * pg_cron job, which cannot call the Storage HTTP API directly) by actually
 * removing the queued files via the app's authenticated Supabase client.
 */
export async function drainStorageCleanupQueue(limit = 50): Promise<number> {
  await checkRole({ roles: "Admin" });
  const supabase = createSupabaseAdminClient();

  const { data: queued, error } = await supabase
    .from("storage_cleanup_queue")
    .select("id, bucket, path")
    .limit(limit);

  if (error) throw error;
  if (!queued || queued.length === 0) return 0;

  const byBucket = new Map<string, string[]>();
  for (const row of queued) {
    byBucket.set(row.bucket, [...(byBucket.get(row.bucket) ?? []), row.path]);
  }

  for (const [bucket, paths] of byBucket) {
    const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
    if (removeError) console.error(`Failed to remove files from ${bucket}:`, removeError);
  }

  const { error: deleteError } = await supabase
    .from("storage_cleanup_queue")
    .delete()
    .in("id", queued.map((q) => q.id));

  if (deleteError) throw deleteError;

  return queued.length;
}
