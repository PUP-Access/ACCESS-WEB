import type { Page } from "@playwright/test";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), { timeout: 15000 });
}
