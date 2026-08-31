import type { Page } from "@playwright/test";

/**
 * BorrowRequestForm's category/item pickers are custom <button>+popover
 * dropdowns (not native <select>), and FieldLabel isn't wired via htmlFor —
 * so we scope by the label's own text container instead of getByLabel.
 */
export async function selectFromCustomDropdown(page: Page, labelText: string, optionText: string) {
  const container = page.getByText(labelText, { exact: true }).locator("..");
  await container.locator("button").first().click();
  await container.getByText(optionText, { exact: false }).click();
}

/**
 * Picks a date `daysFromNow` days out and a fixed time slot, within the
 * DateTimeGroup under the given "Start"/"End" label. The calendar popover
 * always opens showing the real-world current month (viewDate defaults to
 * `new Date()` until a date is chosen) regardless of which field this is,
 * so it navigates forward/back by the exact month delta before clicking the
 * day. The month-nav buttons have no accessible name (icon-only), so they're
 * targeted by their distinctive SVG path data instead.
 */
export async function pickDateTime(page: Page, labelText: "Start" | "End", daysFromNow: number, timeSlot: string) {
  const container = page.getByText(labelText, { exact: true }).locator("..");
  await container.locator("button").first().click();

  const today = new Date();
  const target = new Date();
  target.setDate(target.getDate() + daysFromNow);

  const monthDelta =
    (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());

  const nextMonthButton = container.locator('button:has(path[d="m9 18 6-6-6-6"])');
  const prevMonthButton = container.locator('button:has(path[d="m15 18-6-6 6-6"])');

  for (let i = 0; i < monthDelta; i++) await nextMonthButton.click();
  for (let i = 0; i < -monthDelta; i++) await prevMonthButton.click();

  const day = String(target.getDate());
  await container.getByRole("button", { name: day, exact: true }).click();
  await container.getByRole("button", { name: timeSlot, exact: true }).click();
}
