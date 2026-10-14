import { afterAll, describe, expect, it } from "vitest";
import { createTestSupabaseClient } from "../helpers/test-supabase-client";
import { TestDataTracker } from "../helpers/cleanup";

const supabase = createTestSupabaseClient();
const tracker = new TestDataTracker();
const notificationIds: string[] = [];
const authUserIds: string[] = [];

afterAll(async () => {
  if (notificationIds.length) await supabase.from("Notifications").delete().in("id", notificationIds);
  await tracker.cleanup(supabase);
  for (const id of authUserIds) await supabase.auth.admin.deleteUser(id);
});

async function latestNotification(type: string, since: string) {
  const { data, error } = await supabase
    .from("Notifications")
    .select("id, content")
    .eq("type", type)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  notificationIds.push(data.id);
  return data;
}

describe("notification triggers tolerate NULL source columns", () => {
  it("a borrow request without borrower_contact_name is still inserted and notified", async () => {
    const since = new Date().toISOString();
    const { data: br, error } = await supabase
      .from("BorrowRequests")
      .insert({ status: "Pending", requested_start_date: since, requested_end_date: since })
      .select()
      .single();

    expect(error).toBeNull();
    tracker.trackBorrowRequest(br!.id);

    const notification = await latestNotification("borrow_request", since);
    expect(notification.content).toBe("Borrower Unknown borrower requested: Gear");
  });

  it("a Users row becoming Pending without an email is still saved and notified", async () => {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: `qa-null-email-${crypto.randomUUID()}@access-web.test`,
      password: crypto.randomUUID(),
      email_confirm: true,
    });
    if (createError) throw createError;
    authUserIds.push(created.user.id);

    await supabase.from("Users").update({ role: "Organization", email: null }).eq("id", created.user.id);

    const since = new Date().toISOString();
    const { error } = await supabase.from("Users").update({ role: "Pending" }).eq("id", created.user.id);
    expect(error).toBeNull();

    const notification = await latestNotification("user_registration", since);
    expect(notification.content).toMatch(/^User with no email \(/);
  });
});
