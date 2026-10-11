import { test, expect } from "@playwright/test";
import {
  apiRequest,
  getMyWidgets,
  responseJson,
  restoreWidgets,
  unwrapData,
} from "../helpers/api.js";

const uniqueUsername = () => `e2e_${Date.now().toString(36)}`;

async function openProfileSettings(page) {
  await page.goto("/settings/profile");
  await expect(page.getByRole("heading", { name: "โปรไฟล์", exact: true })).toBeVisible();
}

async function openInstagramWidget(page) {
  await page.goto("/settings/widgets");
  await expect(page.getByRole("heading", { name: "วิดเจ็ต", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Instagram", exact: true }).click();
  const input = page.locator('input[placeholder="https://instagram.com/yourprofile"]');
  await expect(input).toBeVisible();
  return input;
}

test.describe("US-11 การจัดการโปรไฟล์ส่วนตัว", () => {
  test("TC-001 แก้ไขข้อมูลโปรไฟล์ได้สำเร็จ", async ({ page }) => {
    await openProfileSettings(page);

    const usernameInput = page.locator('input[placeholder="กรอกชื่อผู้ใช้ของคุณ"]');
    const bioInput = page.locator('textarea[placeholder="เขียนอะไรสักอย่างเกี่ยวกับตัวเอง..."]');
    const educationSelect = page.locator("select").filter({ has: page.locator('option[value="UNIVERSITY"]') });
    const original = {
      username: await usernameInput.inputValue(),
      bio: await bioInput.inputValue(),
      education_level: await educationSelect.inputValue(),
    };
    const next = {
      username: uniqueUsername(),
      bio: `ผู้ใช้งานสำหรับทดสอบระบบ ${Date.now()}`,
      education_level: "UNIVERSITY",
    };

    try {
      await usernameInput.fill(next.username);
      await bioInput.fill(next.bio);
      await educationSelect.selectOption(next.education_level);

      const updateResponse = page.waitForResponse(
        (response) =>
          response.request().method() === "PUT" &&
          /\/api\/v1\/users\/profile(?:\?.*)?$/.test(response.url()),
      );
      await page.getByRole("button", { name: "บันทึกข้อมูล", exact: true }).click();
      expect((await updateResponse).status()).toBe(200);
      await expect(page.getByText("บันทึกข้อมูลสำเร็จ", { exact: true })).toBeVisible();

      await page.goto("/profile");
      await expect(page.getByText(next.username, { exact: true }).first()).toBeVisible();
      await expect(page.getByText(next.bio, { exact: true }).first()).toBeVisible();
    } finally {
      const restore = await apiRequest(page, "PUT", "/users/profile", original);
      expect(restore.status(), "คืนค่าข้อมูลโปรไฟล์หลังทดสอบไม่สำเร็จ").toBe(200);
    }
  });

  test("TC-002 จัดการลิงก์โซเชียลมีเดียได้สำเร็จ", async ({ page }) => {
    const originalWidgets = await getMyWidgets(page);
    const instagramUrl = `https://instagram.com/shareed_e2e_${Date.now()}`;

    try {
      const input = await openInstagramWidget(page);
      await input.fill(instagramUrl);
      await page
        .getByRole("button", { name: /เพิ่มวิดเจ็ต|บันทึกการเปลี่ยนแปลง/ })
        .click();

      await expect(page.getByText("บันทึกวิดเจ็ตแล้ว", { exact: true })).toBeVisible();
      await page.goto("/profile");
      await expect(page.locator(`a[href="${instagramUrl}"]`).first()).toBeVisible();
    } finally {
      await restoreWidgets(page, originalWidgets);
    }
  });

  test("TC-003 เปิดใช้งานกรอบรูปที่ได้รับสิทธิ์ได้สำเร็จ", async ({ page }) => {
    const meResponse = await apiRequest(page, "GET", "/auth/me");
    expect(meResponse.status()).toBe(200);
    const me = unwrapData(await responseJson(meResponse));
    const originalFrameId = me?.current_frame_id ?? null;

    try {
      await openProfileSettings(page);
      await page.getByRole("button", { name: "เลือกกรอบรูปภาพ", exact: true }).click();
      await expect(page.getByRole("heading", { name: "เลือกกรอบรูปโปรไฟล์" })).toBeVisible();

      const availableFrames = page.locator("button:not([disabled])").filter({ hasText: "พร้อมใช้" });
      await expect(availableFrames.first()).toBeVisible({ timeout: 20_000 });

      await availableFrames.first().click();
      await expect(page.getByText("เปลี่ยนกรอบโปรไฟล์แล้ว", { exact: true })).toBeVisible();

      await page.reload();
      await page.getByRole("button", { name: "เลือกกรอบรูปภาพ", exact: true }).click();
      await expect(page.locator("button").filter({ hasText: "พร้อมใช้" }).first()).toBeVisible();
    } finally {
      const restore = await apiRequest(page, "PUT", "/users/equip", {
        itemId: originalFrameId,
        type: "FRAME",
      });
      expect(restore.status(), "คืนค่ากรอบโปรไฟล์หลังทดสอบไม่สำเร็จ").toBe(200);
    }
  });

  test("TC-004 ปฏิเสธ URL โซเชียลมีเดียที่ไม่ถูกต้อง", async ({ page }) => {
    const originalWidgets = await getMyWidgets(page);
    const input = await openInstagramWidget(page);
    const saveButton = page.getByRole("button", {
      name: /เพิ่มวิดเจ็ต|บันทึกการเปลี่ยนแปลง/,
    });

    await input.fill("instagram.com/testuser");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#widget-url-error")).toContainText("URL");
    await expect(saveButton).toBeDisabled();

    await input.fill("https://facebook.com/testuser");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#widget-url-error")).toContainText("instagram");
    await expect(saveButton).toBeDisabled();

    for (const invalidUrl of ["instagram.com/testuser", "https://facebook.com/testuser"]) {
      const invalidWidget = {
        id: "instagram",
        platformId: "instagram",
        url: invalidUrl,
        options: { insideProfileCard: true },
      };
      const widgets = [
        ...originalWidgets.filter((widget) => widget.platformId !== "instagram"),
        invalidWidget,
      ];
      const response = await apiRequest(page, "PUT", "/users/me/widgets", { widgets });
      expect(response.status()).toBe(400);
    }

    expect(await getMyWidgets(page)).toEqual(originalWidgets);
  });

  test("TC-005 ปฏิเสธไฟล์ที่ไม่ตรงตามข้อกำหนด", async ({ page }) => {
    await openProfileSettings(page);

    const avatarInput = page.locator('label:has-text("แก้ไขรูปโปรไฟล์") input[type="file"]');
    const wallpaperInput = page.locator('label:has-text("เปลี่ยนพื้นหลัง") input[type="file"]');

    await avatarInput.setInputFiles({
      name: "profile.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("unsupported profile file"),
    });
    await expect(page.getByText(/รองรับเฉพาะไฟล์ JPG, JPEG และ PNG/).last()).toBeVisible();

    await avatarInput.setInputFiles({
      name: "avatar-too-large.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(8 * 1024 * 1024 + 1),
    });
    await expect(page.getByText("กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 2 MB", { exact: true }).last()).toBeVisible();

    await wallpaperInput.setInputFiles({
      name: "wallpaper-too-large.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(25 * 1024 * 1024 + 1),
    });
    await expect(page.getByText("ไฟล์ต้องมีขนาดไม่เกิน 25 MB", { exact: true }).last()).toBeVisible();
  });

  test("TC-006 ไม่อนุญาตให้เปิดใช้กรอบรูปที่ไม่ได้รับสิทธิ์", async ({ page }) => {
    await openProfileSettings(page);
    await page.getByRole("button", { name: "เลือกกรอบรูปภาพ", exact: true }).click();
    await page.getByRole("button", { name: /ยังไม่ปลดล็อก/ }).click();

    const lockedButtons = page.locator("button[disabled]").filter({ hasText: "ล็อก" });
    await expect(lockedButtons.first()).toBeVisible({ timeout: 20_000 });
    await expect(lockedButtons.first()).toBeDisabled();

    let lockedFrameId = process.env.E2E_LOCKED_FRAME_ID;
    if (!lockedFrameId) {
      const achievementsResponse = await apiRequest(page, "GET", "/achievements");
      expect(achievementsResponse.status()).toBe(200);
      const achievements = unwrapData(await responseJson(achievementsResponse));
      const locked = (Array.isArray(achievements) ? achievements : []).find(
        (item) =>
          item?.status !== "CLAIMED" &&
          (item?.reward_item_id || item?.reward_item?.id || item?.reward?.id),
      );
      lockedFrameId = locked?.reward_item_id || locked?.reward_item?.id || locked?.reward?.id;
    }
    test.skip(!lockedFrameId, "กำหนด E2E_LOCKED_FRAME_ID หรือเตรียม Achievement ที่ยังไม่ CLAIMED");

    const response = await apiRequest(page, "PUT", "/users/equip", {
      itemId: lockedFrameId,
      type: "FRAME",
    });
    expect(response.status()).toBe(403);
    expect(await responseJson(response)).toMatchObject({ success: false });
  });

  test("TC-007 ไม่อนุญาตให้แก้ไขโปรไฟล์ของผู้ใช้งานอื่น", async ({ page }) => {
    const memberBId = process.env.E2E_MEMBER_B_ID;
    test.skip(!memberBId, "กรุณากำหนด E2E_MEMBER_B_ID");

    const beforeResponse = await apiRequest(page, "GET", `/users/${encodeURIComponent(memberBId)}`);
    expect(beforeResponse.status()).toBe(200);
    const before = unwrapData(await responseJson(beforeResponse));

    await page.goto(`/profile/${encodeURIComponent(memberBId)}`);
    await expect(page.getByRole("button", { name: "แก้ไขโปรไฟล์", exact: true })).toHaveCount(0);

    const selfScopedResponse = await apiRequest(page, "PUT", "/users/profile", {
      userId: memberBId,
    });
    expect(selfScopedResponse.status()).toBe(200);

    const unsupportedResponse = await apiRequest(
      page,
      "PUT",
      `/users/${encodeURIComponent(memberBId)}`,
      { nickname: `unauthorized_${Date.now()}` },
    );
    expect([404, 405]).toContain(unsupportedResponse.status());

    const afterResponse = await apiRequest(page, "GET", `/users/${encodeURIComponent(memberBId)}`);
    expect(afterResponse.status()).toBe(200);
    const after = unwrapData(await responseJson(afterResponse));
    expect({
      username: after?.username,
      nickname: after?.nickname,
      bio: after?.bio,
      education_level: after?.education_level,
    }).toEqual({
      username: before?.username,
      nickname: before?.nickname,
      bio: before?.bio,
      education_level: before?.education_level,
    });
  });
});
