import { SiFacebook, SiInstagram, SiDiscord, SiYoutube } from "react-icons/si";

// วิดเจ็ตเป็นลิงก์ของแต่ละแพลตฟอร์ม ไม่ดึงข้อมูลจากบริการภายนอก
// นำตัวเลือกตกแต่งเฉพาะแพลตฟอร์มออกแล้ว จึงเก็บเพียงข้อมูลที่ใช้สร้างลิงก์
export const WIDGET_PLATFORMS = [
  {
    id: "facebook",
    label: "Facebook",
    icon: SiFacebook,
    brandColor: "#1877F2",
    urlPlaceholder: "https://facebook.com/yourpage",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: SiInstagram,
    brandColor: "#E4405F",
    urlPlaceholder: "https://instagram.com/yourprofile",
  },
  {
    id: "discord",
    label: "Discord",
    icon: SiDiscord,
    brandColor: "#5865F2",
    urlPlaceholder: "https://discord.gg/yourinvite",
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: SiYoutube,
    brandColor: "#FF0000",
    urlPlaceholder: "https://youtube.com/@yourchannel",
  },
];

export const DEFAULT_WIDGET_OPTIONS = {
  // ตัวเลือกนี้ยังใช้กำหนดว่าจะแสดงไอคอนลิงก์บนหน้าโปรไฟล์หรือไม่
  insideProfileCard: true,
};

export function createWidget(platformId, { url = "", options = {} } = {}) {
  return {
    id: platformId,
    platformId,
    url,
    // ไม่บันทึกค่าตกแต่งที่ถูกนำออก แม้ข้อมูลเดิมจะยังมีค่าเหล่านั้นอยู่
    options: { insideProfileCard: options.insideProfileCard !== false },
  };
}

export function getPlatformConfig(platformId) {
  return WIDGET_PLATFORMS.find((p) => p.id === platformId) || null;
}
