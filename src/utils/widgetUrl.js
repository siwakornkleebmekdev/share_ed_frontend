// รายชื่อโดเมนที่อนุญาตของแต่ละแพลตฟอร์ม ใช้กับฟอร์ม บันทึก และแสดงผลร่วมกัน
const PLATFORM_DOMAINS = {
  facebook: ["facebook.com", "fb.com"],
  instagram: ["instagram.com"],
  discord: ["discord.gg", "discord.com"],
  youtube: ["youtube.com", "youtu.be"],
};

// ต้องตรงโดเมนหรือเป็นซับโดเมนจริง เพื่อกันชื่อเลียนแบบ เช่น facebook.com.evil.example
const isDomainOrSubdomain = (hostname, domain) =>
  hostname === domain || hostname.endsWith(`.${domain}`);

export function getWidgetUrlError(platformId, value) {
  const domains = PLATFORM_DOMAINS[platformId];
  if (!domains) return "ไม่รองรับแพลตฟอร์มนี้";

  const raw = value?.trim() || "";
  if (!raw) return "กรุณาใส่ลิงก์";
  if (/\s/.test(raw)) return "ลิงก์ต้องไม่มีช่องว่าง";

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return "กรุณาใส่ URL ที่ถูกต้อง เช่น ลิงก์ที่ขึ้นต้นด้วย https://";
  }

  // รับเฉพาะ HTTPS ปกติ ไม่รับข้อมูลล็อกอินหรือพอร์ตที่ฝังอยู่ใน URL
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port) {
    return "กรุณาใช้ลิงก์ https:// ของแพลตฟอร์มนี้";
  }

  if (!domains.some((domain) => isDomainOrSubdomain(parsed.hostname, domain))) {
    return `กรุณาใช้ลิงก์ ${platformId === "discord" ? "คำเชิญ Discord" : `ของ ${platformId}`} ที่ถูกต้อง`;
  }

  // ลิงก์ต้องชี้ไปยังรายการจริง ไม่ใช่หน้าแรกของแพลตฟอร์ม
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "กรุณาใส่ลิงก์ไปยังโปรไฟล์ ช่อง หรือคำเชิญ ไม่ใช่หน้าแรก";
  }

  // ตรวจส่วนที่จำเป็นของลิงก์พิเศษ เช่น รหัสคำเชิญ รหัสโปรไฟล์ และรหัสวิดีโอ
  if (platformId === "discord" && isDomainOrSubdomain(parsed.hostname, "discord.com") &&
      (segments[0] !== "invite" || segments.length < 2)) {
    return "กรุณาใช้ลิงก์คำเชิญ discord.gg หรือ discord.com/invite";
  }

  if (platformId === "facebook" && segments[0] === "profile.php" && !parsed.searchParams.get("id")) {
    return "ลิงก์โปรไฟล์ Facebook ต้องมีรหัส id";
  }

  if (platformId === "instagram" && ["p", "reel", "stories"].includes(segments[0]) && segments.length < 2) {
    return "กรุณาใส่ลิงก์ Instagram ให้ครบ";
  }

  if (platformId === "youtube" && segments[0] === "watch" && !parsed.searchParams.get("v")) {
    return "ลิงก์วิดีโอ YouTube ต้องมีรหัสวิดีโอ";
  }

  return "";
}
