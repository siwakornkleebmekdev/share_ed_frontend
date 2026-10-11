import { expect } from "@playwright/test";

export const API_BASE_URL = (
  process.env.E2E_API_BASE_URL || "http://localhost:5000/api/v1"
).replace(/\/$/, "");

function findAccessToken(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);
  if (typeof value.access_token === "string" && value.access_token) {
    return value.access_token;
  }
  for (const child of Object.values(value)) {
    const token = findAccessToken(child, seen);
    if (token) return token;
  }
  return null;
}

export async function getAccessToken(page) {
  const state = await page.context().storageState();
  let token = null;
  for (const origin of state.origins) {
    for (const entry of origin.localStorage) {
      if (!entry.name.startsWith("sb-")) continue;
      try {
        token = findAccessToken(JSON.parse(entry.value));
        if (token) break;
      } catch {
        // Ignore unrelated or legacy localStorage entries.
      }
    }
    if (token) break;
  }

  expect(token, "ไม่พบ Supabase access token ใน browser session").toBeTruthy();
  return token;
}

export async function apiRequest(page, method, path, data) {
  const token = await getAccessToken(page);
  return page.request.fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(data === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(data === undefined ? {} : { data }),
  });
}

export async function responseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`API ตอบข้อมูลที่ไม่ใช่ JSON: ${text.slice(0, 300)}`);
  }
}

export function unwrapData(payload) {
  return payload?.data?.data ?? payload?.data ?? payload;
}

export async function getMyWidgets(page) {
  const response = await apiRequest(page, "GET", "/users/me/widgets");
  expect(response.status()).toBe(200);
  const rows = unwrapData(await responseJson(response));
  return Array.isArray(rows) ? rows : [];
}

export async function restoreWidgets(page, widgets) {
  const response = await apiRequest(page, "PUT", "/users/me/widgets", { widgets });
  expect(response.status(), "คืนค่าวิดเจ็ตหลังทดสอบไม่สำเร็จ").toBe(200);
}
