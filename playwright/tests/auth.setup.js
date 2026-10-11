import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const authFile = path.join(process.cwd(), "playwright", ".auth", "member-a.json");

setup("เข้าสู่ระบบด้วยบัญชี Member A", async ({ page }) => {
  const email = process.env.E2E_MEMBER_A_EMAIL;
  const password = process.env.E2E_MEMBER_A_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "กรุณากำหนด E2E_MEMBER_A_EMAIL และ E2E_MEMBER_A_PASSWORD ก่อนรัน Playwright",
    );
  }

  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();

  await expect(page).toHaveURL(/\/home(?:\?.*)?$/);
  await expect(page.getByText("เข้าสู่ระบบสำเร็จ!", { exact: true })).toBeVisible();

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
