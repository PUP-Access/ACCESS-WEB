import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createTestSupabaseClient } from "../helpers/test-supabase-client";
import { TestDataTracker, TEST_PREFIX, sweepLeftoverTestData } from "../helpers/cleanup";
import {
  provisionTestUsers,
  QA_ADMIN_EMAIL,
  QA_ADMIN_PASSWORD,
  QA_BORROWER_EMAIL,
  QA_BORROWER_PASSWORD,
  QA_GOVS_EMAIL,
  QA_GOVS_PASSWORD,
  QA_SPONSORS_EMAIL,
  QA_SPONSORS_PASSWORD,
  QA_TECH_EMAIL,
  QA_TECH_PASSWORD,
} from "../setup/provision-test-users";

/**
 * Exercises the RLS layer for every role through the anon key + a real
 * session (no service role), i.e. exactly what createSupabaseServerClient()
 * sees. Expected access mirrors ROLE_AREAS in src/utils/adminAccess.ts.
 */

type Client = SupabaseClient<Database>;

const service = createTestSupabaseClient();
const tracker = new TestDataTracker();

// 1x1 transparent PNG
const PNG_BYTES = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="),
  (c) => c.charCodeAt(0)
);

let ids: Awaited<ReturnType<typeof provisionTestUsers>>;
let admin: Client;
let tech: Client;
let govs: Client;
let sponsors: Client;
let borrower: Client;

let assetId: string;
let borrowRequestId: string;
let draftEventId: string;
const notificationIds: Record<"borrow_request" | "contact_message" | "user_registration", string> = {
  borrow_request: "",
  contact_message: "",
  user_registration: "",
};
const createdEventIds: string[] = [];
const createdOfficerIds: string[] = [];
const storagePaths: string[] = [];

async function signIn(email: string, password: string): Promise<Client> {
  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function canSeeBorrowRequest(client: Client) {
  const { data } = await client.from("BorrowRequests").select("id").eq("id", borrowRequestId);
  return (data ?? []).length === 1;
}

async function canSeeDraftEvent(client: Client) {
  const { data } = await client.from("Events").select("id").eq("id", draftEventId);
  return (data ?? []).length === 1;
}

async function canUpdateAsset(client: Client) {
  const { data } = await client.from("Assets").update({ unit: "PCS" }).eq("id", assetId).select("id");
  return (data ?? []).length === 1;
}

async function canInsertAsset(client: Client) {
  const { data, error } = await client
    .from("Assets")
    .insert({ name: `${TEST_PREFIX}RLS Asset ${crypto.randomUUID()}`, category: "TOOLS", quantity: 1 })
    .select("id")
    .single();
  if (data) tracker.trackAsset(data.id);
  return !error && !!data;
}

async function canInsertEvent(client: Client) {
  const { data, error } = await client
    .from("Events")
    .insert({ title: `${TEST_PREFIX}RLS Event`, status: "Draft" })
    .select("id")
    .single();
  if (data) createdEventIds.push(data.id);
  return !error && !!data;
}

async function canInsertOfficer(client: Client) {
  const id = crypto.randomUUID();
  const { data, error } = await client
    .from("Officers")
    .insert({ id, full_name: `${TEST_PREFIX}RLS Officer`, is_active: false })
    .select("id")
    .single();
  if (data) createdOfficerIds.push(data.id);
  return !error && !!data;
}

async function canUploadToPublicBucket(client: Client, folder: string) {
  const path = `${folder}/${TEST_PREFIX}${crypto.randomUUID()}.png`;
  const { error } = await client.storage
    .from("access_web_assets")
    .upload(path, PNG_BYTES, { contentType: "image/png", upsert: false });
  if (!error) storagePaths.push(path);
  return !error;
}

/** Tries to promote the borrower to Admin; returns whether the role actually changed. */
async function canEscalateBorrower(client: Client) {
  await client.from("Users").update({ role: "Admin" }).eq("id", ids.borrowerId);
  const { data } = await service.from("Users").select("role").eq("id", ids.borrowerId).single();
  const changed = data?.role === "Admin";
  if (changed) await service.from("Users").update({ role: "Organization" }).eq("id", ids.borrowerId);
  return changed;
}

async function visibleNotificationTypes(client: Client) {
  const { data } = await client
    .from("Notifications")
    .select("id, type")
    .in("id", Object.values(notificationIds));
  return new Set((data ?? []).map((n) => n.type));
}

beforeAll(async () => {
  await sweepLeftoverTestData(service);
  ids = await provisionTestUsers();

  [admin, tech, govs, sponsors, borrower] = await Promise.all([
    signIn(QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD),
    signIn(QA_TECH_EMAIL, QA_TECH_PASSWORD),
    signIn(QA_GOVS_EMAIL, QA_GOVS_PASSWORD),
    signIn(QA_SPONSORS_EMAIL, QA_SPONSORS_PASSWORD),
    signIn(QA_BORROWER_EMAIL, QA_BORROWER_PASSWORD),
  ]);

  const { data: asset, error: assetError } = await service
    .from("Assets")
    .insert({ name: `${TEST_PREFIX}RLS Fixture ${Date.now()}`, category: "TOOLS", quantity: 5 })
    .select()
    .single();
  if (assetError || !asset) throw assetError ?? new Error("Failed to create fixture asset");
  assetId = asset.id;
  tracker.trackAsset(assetId);

  const now = new Date().toISOString();
  const { data: br, error: brError } = await service
    .from("BorrowRequests")
    .insert({
      user_id: ids.borrowerId,
      borrower_contact_name: `${TEST_PREFIX}RLS Borrower`,
      status: "Pending",
      requested_start_date: now,
      requested_end_date: now,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (brError || !br) throw brError ?? new Error("Failed to create fixture borrow request");
  borrowRequestId = br.id;
  tracker.trackBorrowRequest(borrowRequestId);

  const { data: event, error: eventError } = await service
    .from("Events")
    .insert({ title: `${TEST_PREFIX}RLS Draft`, status: "Draft" })
    .select()
    .single();
  if (eventError || !event) throw eventError ?? new Error("Failed to create fixture event");
  draftEventId = event.id;
  createdEventIds.push(draftEventId);

  for (const type of Object.keys(notificationIds) as (keyof typeof notificationIds)[]) {
    const { data, error } = await service
      .from("Notifications")
      .insert({ title: `${TEST_PREFIX}${type}`, content: "rls test", type })
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error(`Failed to create ${type} notification`);
    notificationIds[type] = data.id;
  }
});

afterAll(async () => {
  await service.from("Notifications").delete().in("id", Object.values(notificationIds).filter(Boolean));
  // The BorrowRequests insert trigger also creates a notification; drop it too.
  await service.from("Notifications").delete().like("content", `%${TEST_PREFIX}RLS Borrower%`);
  if (createdEventIds.length) await service.from("Events").delete().in("id", createdEventIds);
  if (createdOfficerIds.length) await service.from("Officers").delete().in("id", createdOfficerIds);
  if (storagePaths.length) await service.storage.from("access_web_assets").remove(storagePaths);
  await tracker.cleanup(service);
});

describe("Admin (full access, regression)", () => {
  it("can manage borrowing, inventory, events and officers", async () => {
    expect(await canSeeBorrowRequest(admin)).toBe(true);
    expect(await canUpdateAsset(admin)).toBe(true);
    expect(await canSeeDraftEvent(admin)).toBe(true);
    expect(await canInsertEvent(admin)).toBe(true);
    expect(await canInsertOfficer(admin)).toBe(true);
    expect(await canUploadToPublicBucket(admin, "site-content")).toBe(true);
  });

  it("sees every notification type", async () => {
    expect(await visibleNotificationTypes(admin)).toEqual(
      new Set(["borrow_request", "contact_message", "user_registration"])
    );
  });
});

describe("Tech (borrow-requests, inventory, contact-messages)", () => {
  it("can read and review borrow requests", async () => {
    expect(await canSeeBorrowRequest(tech)).toBe(true);

    const { data } = await tech
      .from("BorrowRequests")
      .update({ status: "Approved", reviewed_by: ids.techId })
      .eq("id", borrowRequestId)
      .select("status");
    expect(data?.[0]?.status).toBe("Approved");

    await service.from("BorrowRequests").update({ status: "Pending" }).eq("id", borrowRequestId);
  });

  it("can create and update assets", async () => {
    expect(await canInsertAsset(tech)).toBe(true);
    expect(await canUpdateAsset(tech)).toBe(true);
  });

  it("cannot manage events, officers or users", async () => {
    expect(await canSeeDraftEvent(tech)).toBe(false);
    expect(await canInsertEvent(tech)).toBe(false);
    expect(await canInsertOfficer(tech)).toBe(false);
    expect(await canUploadToPublicBucket(tech, "events")).toBe(false);
    expect(await canEscalateBorrower(tech)).toBe(false);
  });

  it("sees borrow-request and contact-message notifications only", async () => {
    expect(await visibleNotificationTypes(tech)).toEqual(new Set(["borrow_request", "contact_message"]));
  });
});

describe("Govs (content, officers, events, contact-messages)", () => {
  it("can read drafts and create/update/delete events", async () => {
    expect(await canSeeDraftEvent(govs)).toBe(true);
    expect(await canInsertEvent(govs)).toBe(true);

    const eventId = createdEventIds[createdEventIds.length - 1];
    const { data: updated } = await govs
      .from("Events")
      .update({ status: "Published" })
      .eq("id", eventId)
      .select("id");
    expect(updated).toHaveLength(1);

    const { data: deleted } = await govs.from("Events").delete().eq("id", eventId).select("id");
    expect(deleted).toHaveLength(1);
  });

  it("can create officers and upload event/officer images, but not other storage paths", async () => {
    expect(await canInsertOfficer(govs)).toBe(true);
    expect(await canUploadToPublicBucket(govs, "events")).toBe(true);
    expect(await canUploadToPublicBucket(govs, "officers")).toBe(true);
    expect(await canUploadToPublicBucket(govs, "site-content")).toBe(false);
  });

  it("cannot touch borrowing, inventory or users", async () => {
    expect(await canSeeBorrowRequest(govs)).toBe(false);
    expect(await canUpdateAsset(govs)).toBe(false);
    expect(await canInsertAsset(govs)).toBe(false);
    expect(await canEscalateBorrower(govs)).toBe(false);
  });

  it("sees contact-message notifications only", async () => {
    expect(await visibleNotificationTypes(govs)).toEqual(new Set(["contact_message"]));
  });
});

describe("SponsorsPartners (sponsors-partners, contact-messages)", () => {
  it("cannot touch borrowing, inventory, events, officers or users", async () => {
    expect(await canSeeBorrowRequest(sponsors)).toBe(false);
    expect(await canUpdateAsset(sponsors)).toBe(false);
    expect(await canInsertAsset(sponsors)).toBe(false);
    expect(await canSeeDraftEvent(sponsors)).toBe(false);
    expect(await canInsertEvent(sponsors)).toBe(false);
    expect(await canInsertOfficer(sponsors)).toBe(false);
    expect(await canUploadToPublicBucket(sponsors, "events")).toBe(false);
    expect(await canEscalateBorrower(sponsors)).toBe(false);
  });

  it("sees contact-message notifications only", async () => {
    expect(await visibleNotificationTypes(sponsors)).toEqual(new Set(["contact_message"]));
  });
});

describe("Organization (borrower, no admin access)", () => {
  it("sees its own borrow request but nothing admin-only", async () => {
    expect(await canSeeBorrowRequest(borrower)).toBe(true);
    expect(await canSeeDraftEvent(borrower)).toBe(false);
    expect(await canUpdateAsset(borrower)).toBe(false);
    expect(await canInsertAsset(borrower)).toBe(false);
    expect(await canInsertOfficer(borrower)).toBe(false);
    expect(await visibleNotificationTypes(borrower)).toEqual(new Set());
  });
});
