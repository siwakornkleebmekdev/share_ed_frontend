import test from "node:test";
import assert from "node:assert/strict";
import { getWidgetUrlError } from "../src/utils/widgetUrl.js";

// ตรวจตัวอย่างลิงก์ที่ควรผ่านและลิงก์หลอก/ลิงก์ไม่ครบที่ต้องถูกปฏิเสธ
test("ยอมรับลิงก์ HTTPS ของแต่ละแพลตฟอร์ม", () => {
  const links = [
    ["facebook", "https://www.facebook.com/example.page"],
    ["instagram", "https://instagram.com/example"],
    ["discord", "https://discord.gg/example"],
    ["discord", "https://discord.com/invite/example"],
    ["youtube", "https://www.youtube.com/@example"],
    ["youtube", "https://youtu.be/abc123"],
  ];
  for (const [platform, url] of links) {
    assert.equal(getWidgetUrlError(platform, url), "", url);
  }
});

test("ปฏิเสธลิงก์ผิดแพลตฟอร์ม ลิงก์เลียนแบบ และลิงก์ไม่ครบ", () => {
  const links = [
    ["facebook", "https://das"],
    ["facebook", "https://facebook.com.evil.example/profile"],
    ["instagram", "https://facebook.com/example"],
    ["instagram", "https://instagram.com/"],
    ["instagram", "https://instagram.com/p/"],
    ["discord", "https://discord.com/channels/123"],
    ["discord", "https://discord.com/invite/"],
    ["youtube", "http://youtube.com/@example"],
    ["youtube", "https://youtube.com/watch"],
    ["facebook", "https://facebook.com/profile.php"],
    ["youtube", "https://user:pass@youtube.com/@example"],
    ["youtube", "https://youtube.com:444/@example"],
    ["youtube", "https://youtube.com/@example name"],
  ];
  for (const [platform, url] of links) {
    assert.notEqual(getWidgetUrlError(platform, url), "", url);
  }
});
