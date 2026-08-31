import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/playwright-auth";
import { selectFromCustomDropdown, pickDateTime } from "../helpers/playwright-borrow-form";
import { createTestSupabaseClient } from "../helpers/test-supabase-client";
import { TEST_PREFIX } from "../helpers/cleanup";
import { QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD, QA_BORROWER_EMAIL, QA_BORROWER_PASSWORD } from "../setup/provision-test-users";

const supabase = createTestSupabaseClient();
const assetName = `${TEST_PREFIX}Workflow Asset ${Date.now()}`;
const PDF_BYTES = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>");

// The form's "Email" field is a free-text field validated by EMAIL_PATTERN
// (requires a .com-style address) and is stored as borrower_email — it's
// unrelated to the Supabase Auth session email (QA_BORROWER_EMAIL, .test
// TLD, used only for login), so a separate valid-looking address is used here.
const FORM_CONTACT_EMAIL = "qa-borrower-form@example.com";

async function fillStep1(page: import("@playwright/test").Page, purposeMarker: string) {
  await page.locator('input[placeholder="Last Name First Name"]').fill("QA Borrower");
  await page.locator('input[type="email"]').fill(FORM_CONTACT_EMAIL);
  await page.locator('input[placeholder="e.g. BSCpE 3-7"]').fill("BSCpE 1-1");
  await page.locator('input[placeholder="912 345 6789"]').fill("9123456789");
  await page.locator('input[placeholder="e.g. Engineering Spectrum"]').fill("QA Test Org");
  await page.locator('input[placeholder="e.g. For CE Month"]').fill(purposeMarker);
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

test.describe.serial("Borrow workflow: submit -> approve -> release -> overdue -> return", () => {
  let assetId: string;
  let borrowRequestId: string;
  const purposeMarker = `${TEST_PREFIX}Purpose ${Date.now()}`;

  test.beforeAll(async () => {
    const { data: asset, error } = await supabase
      .from("Assets")
      .insert({ name: assetName, category: "TOOLS", quantity: 1 })
      .select()
      .single();
    if (error || !asset) throw error ?? new Error("Failed to create test asset");
    assetId = asset.id;
  });

  test.afterAll(async () => {
    if (borrowRequestId) {
      await supabase.from("AuditLogs").delete().eq("entity_id", borrowRequestId);
      await supabase.from("BorrowRequestItems").delete().eq("borrow_request_id", borrowRequestId);
      await supabase.from("BorrowRequests").delete().eq("id", borrowRequestId);
    }
    await supabase.from("Assets").delete().eq("id", assetId);
  });

  test("blocks submission when requested quantity exceeds availability for overlapping dates", async ({ page }) => {
    const start = new Date();
    start.setDate(start.getDate() + 3);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(17, 0, 0, 0);

    // Pre-seed a blocking Approved request consuming the asset's only unit
    // for the exact window the UI test below will pick (3 days from now, 09:00-17:00).
    const { data: blocker } = await supabase
      .from("BorrowRequests")
      .insert({
        status: "Approved",
        requested_start_date: start.toISOString(),
        requested_end_date: end.toISOString(),
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (!blocker) throw new Error("Failed to seed blocking BorrowRequest");
    await supabase.from("BorrowRequestItems").insert({ borrow_request_id: blocker.id, asset_id: assetId, quantity: 1 });

    await loginAs(page, QA_BORROWER_EMAIL, QA_BORROWER_PASSWORD);
    await page.goto("/#borrow");
    await page.getByRole("button", { name: "Submit a Request" }).click();

    await fillStep1(page, `${purposeMarker}-blocked`);

    await selectFromCustomDropdown(page, "Choose category", "TOOLS");
    await selectFromCustomDropdown(page, "Choose item", assetName);
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await pickDateTime(page, "Start", 3, "09:00");
    await pickDateTime(page, "End", 3, "17:00");

    await expect(page.getByText(/Only 0 available/)).toBeVisible({ timeout: 10000 });

    await page.setInputFiles('input[type="file"]', { name: "letter.pdf", mimeType: "application/pdf", buffer: PDF_BYTES });
    await page.getByRole("button", { name: "Submit", exact: true }).click();

    // Actual message shape (borrow.actions.ts): "{name}: only {N} available
    // for the selected dates (requested {M})."
    await expect(page.getByText(/only 0 available for the selected dates/i)).toBeVisible({ timeout: 15000 });

    // Cleanup the blocker so it doesn't affect the next test.
    await supabase.from("BorrowRequestItems").delete().eq("borrow_request_id", blocker.id);
    await supabase.from("BorrowRequests").delete().eq("id", blocker.id);
  });

  test("submits successfully for a non-overlapping date range", async ({ page }) => {
    await loginAs(page, QA_BORROWER_EMAIL, QA_BORROWER_PASSWORD);
    await page.goto("/#borrow");
    await page.getByRole("button", { name: "Submit a Request" }).click();

    await fillStep1(page, purposeMarker);

    await selectFromCustomDropdown(page, "Choose category", "TOOLS");
    await selectFromCustomDropdown(page, "Choose item", assetName);
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await pickDateTime(page, "Start", 10, "09:00");
    await pickDateTime(page, "End", 10, "17:00");

    await page.setInputFiles('input[type="file"]', { name: "letter.pdf", mimeType: "application/pdf", buffer: PDF_BYTES });
    await page.getByRole("button", { name: "Submit", exact: true }).click();

    await expect(page.getByText("Request Submitted!", { exact: true })).toBeVisible({ timeout: 20000 });

    const { data: created } = await supabase
      .from("BorrowRequests")
      .select("id, status")
      .eq("purpose", purposeMarker)
      .single();
    expect(created).toBeTruthy();
    expect(created!.status).toBe("Pending");
    borrowRequestId = created!.id;
  });

  test("admin approves, releases, and the overdue alert fires without duplicating on reload", async ({ page }) => {
    await loginAs(page, QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD);
    await page.goto("/admin/borrow-requests?status=Pending");

    const row = page.locator("tr", { has: page.getByText(purposeMarker, { exact: false }) })
      .or(page.locator(`tr:has(a[href="/admin/borrow-requests/${borrowRequestId}"])`));
    await row.first().getByRole("button", { name: "Approve" }).click();

    await expect
      .poll(async () => (await supabase.from("BorrowRequests").select("status").eq("id", borrowRequestId).single()).data?.status, { timeout: 15000 })
      .toBe("Approved");

    await page.goto("/admin/borrow-requests?status=Approved");
    await page.locator(`tr:has(a[href="/admin/borrow-requests/${borrowRequestId}"])`).getByRole("button", { name: "Release" }).click();

    await expect
      .poll(async () => (await supabase.from("BorrowRequests").select("status").eq("id", borrowRequestId).single()).data?.status, { timeout: 15000 })
      .toBe("Active");

    // Simulate the item being overdue.
    await supabase
      .from("BorrowRequests")
      .update({ requested_end_date: new Date(Date.now() - 60 * 60 * 1000).toISOString() })
      .eq("id", borrowRequestId);

    await page.goto("/admin/borrow-requests?status=Active");
    await expect(page.getByText(/overdue for return/i)).toBeVisible();
    await expect(page.locator(`tr:has(a[href="/admin/borrow-requests/${borrowRequestId}"])`).getByText("Overdue")).toBeVisible();

    const { count: firstCount } = await supabase
      .from("AuditLogs")
      .select("id", { count: "exact", head: true })
      .eq("entity_id", borrowRequestId)
      .eq("action", "BORROW_REQUEST_OVERDUE_DETECTED");
    expect(firstCount).toBe(1);

    // Reload — dedup should prevent a second entry.
    await page.goto("/admin/borrow-requests?status=Active");
    const { count: secondCount } = await supabase
      .from("AuditLogs")
      .select("id", { count: "exact", head: true })
      .eq("entity_id", borrowRequestId)
      .eq("action", "BORROW_REQUEST_OVERDUE_DETECTED");
    expect(secondCount).toBe(1);
  });

  test("admin marks it Returned and the asset quantity is restocked", async ({ page }) => {
    await loginAs(page, QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD);
    await page.goto("/admin/borrow-requests?status=Active");
    await page.locator(`tr:has(a[href="/admin/borrow-requests/${borrowRequestId}"])`).getByRole("button", { name: "Mark Returned" }).click();

    await expect
      .poll(async () => (await supabase.from("BorrowRequests").select("status").eq("id", borrowRequestId).single()).data?.status, { timeout: 15000 })
      .toBe("Returned");

    const { data: asset } = await supabase.from("Assets").select("quantity").eq("id", assetId).single();
    expect(asset?.quantity).toBe(1);
  });
});
