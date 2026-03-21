import { test, expect } from "@playwright/test";

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /bruma dashboard/i })).toBeVisible();
  await expect(page.getByLabel("API key")).toBeVisible();
});

test("unauthenticated user is redirected from app to login", async ({ page }) => {
  await page.goto("/overview");
  await expect(page).toHaveURL(/\/login$/);
});
