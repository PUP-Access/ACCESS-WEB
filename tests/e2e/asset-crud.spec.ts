import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/playwright-auth";
import { createTestSupabaseClient } from "../helpers/test-supabase-client";
import { TEST_PREFIX } from "../helpers/cleanup";
import { QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD } from "../setup/provision-test-users";

const supabase = createTestSupabaseClient();
// Admin table cells render names via CSS text-transform: uppercase — use an
// already-uppercase name so Playwright's exact-text matches line up with
// what's actually rendered (and it matches this app's real-data convention,
// e.g. "ESP 32 WROOM", "EXTENSION CORD").
const assetName = `${TEST_PREFIX}ASSET ${Date.now()}`;

test.afterAll(async () => {
  // Belt-and-suspenders cleanup in case a step failed before the UI delete ran.
  await supabase.from("Assets").delete().ilike("name", `${assetName}%`);
});

test.describe("Asset CRUD (admin inventory)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD);
  });

  test("create, edit, decrement, and soft-delete an asset", async ({ page }) => {
    await page.goto("/admin/inventory");

    // Create — scoped to the "Add New Item" form specifically, since the
    // page also has a hidden input[name="category"] in the filter form.
    const addForm = page.locator("form", { has: page.getByRole("button", { name: "Add Item" }) });
    await addForm.locator('input[name="name"]').fill(assetName);
    await addForm.locator('input[name="category"]').fill("TOOLS");
    await addForm.locator('input[name="quantity"]').fill("3");
    await addForm.locator('input[name="unit"]').fill("PCS");
    await addForm.getByRole("button", { name: "Add Item" }).click();
    await page.waitForURL(/feedback=success/);

    // There are 50+ real production assets in this list — filter down to
    // just ours (by its unique timestamped name) instead of assuming it's
    // on the default first page.
    await page.goto(`/admin/inventory?q=${encodeURIComponent(assetName)}`);

    const row = page.locator("tr", { has: page.getByText(assetName, { exact: true }) });
    await expect(row).toBeVisible();
    await expect(row).toContainText("3");

    // Confirms it's in the same query getAllAssetsPublic() uses (is_deleted=false),
    // which is what makes it show up in the public borrow-item dropdown; the
    // actual dropdown rendering is exercised end-to-end in borrow-workflow.spec.ts.
    const { data: publicRow } = await supabase.from("Assets").select("is_deleted").eq("name", assetName).single();
    expect(publicRow?.is_deleted).toBe(false);

    // Edit
    await row.getByRole("button", { name: "Edit" }).click();
    const modal = page.locator("text=Edit Asset").locator("..").locator("..");
    await modal.locator('input[name="quantity"]').fill("5");
    await modal.getByRole("button", { name: "Save Changes" }).click();
    await page.waitForURL(/feedback=success/);
    await page.goto(`/admin/inventory?q=${encodeURIComponent(assetName)}`);
    await expect(row).toContainText("5");

    // Merge-on-duplicate-name: adding another item with the same name merges quantity.
    await addForm.locator('input[name="name"]').fill(assetName);
    await addForm.locator('input[name="category"]').fill("TOOLS");
    await addForm.locator('input[name="quantity"]').fill("2");
    await addForm.getByRole("button", { name: "Add Item" }).click();
    await page.waitForURL(/feedback=success/);
    await page.goto(`/admin/inventory?q=${encodeURIComponent(assetName)}`);
    await expect(row).toContainText("7");
    await expect(row).toHaveCount(1);

    // Decrement floors correctly and never goes below 0.
    for (let i = 0; i < 7; i++) {
      await row.getByRole("button", { name: "-1" }).click();
      await page.waitForURL(/feedback=success/);
      await page.goto(`/admin/inventory?q=${encodeURIComponent(assetName)}`);
    }
    await expect(row).toContainText("0");
    await expect(row.getByRole("button", { name: "-1" })).toBeDisabled();

    // Soft-delete (Remove All) — scope the confirm-dialog button to the dialog
    // itself, since every row on the page has its own "Remove All" toggle.
    await row.getByRole("button", { name: "Remove All" }).click();
    const confirmDialog = page.getByText("Are you sure you want to remove this item entirely").locator("..");
    await confirmDialog.getByRole("button", { name: "Remove All" }).click();
    await page.waitForURL(/feedback=success/);
    await page.goto(`/admin/inventory?q=${encodeURIComponent(assetName)}`);
    await expect(page.getByText(assetName, { exact: true })).toHaveCount(0);

    // Confirm it's gone from the public catalog too (soft-deleted -> is_deleted=true).
    const { data: publicAssets } = await supabase.from("Assets").select("name").eq("name", assetName).eq("is_deleted", false);
    expect(publicAssets).toHaveLength(0);
  });
});
