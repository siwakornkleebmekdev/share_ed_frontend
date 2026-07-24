import { SiFacebook, SiInstagram, SiDiscord, SiYoutube } from "react-icons/si";

// One widget per platform. Widgets are purely styled link cards — no
// external data is fetched from any of these platforms.
export const WIDGET_PLATFORMS = [
  {
    id: "facebook",
    label: "Facebook",
    icon: SiFacebook,
    brandColor: "#1877F2",
    urlPlaceholder: "https://facebook.com/yourpage",
    extraOptionKey: "showPageName",
    extraOptionLabel: "แสดงชื่อเพจ",
    extraOptionDesc: "แสดงชื่อเพจ Facebook บนการ์ดวิดเจ็ต",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: SiInstagram,
    brandColor: "#E4405F",
    urlPlaceholder: "https://instagram.com/yourprofile",
    extraOptionKey: "largeButton",
    extraOptionLabel: "แสดงเป็นปุ่มขนาดใหญ่",
    extraOptionDesc: "ขยายการ์ดให้เต็มความกว้าง เด่นชัดขึ้น",
  },
  {
    id: "discord",
    label: "Discord",
    icon: SiDiscord,
    brandColor: "#5865F2",
    urlPlaceholder: "https://discord.gg/yourinvite",
    extraOptionKey: "compactLayout",
    extraOptionLabel: "เลย์เอาต์กะทัดรัด",
    extraOptionDesc: "ย่อขนาดการ์ดให้กระชับขึ้น",
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: SiYoutube,
    brandColor: "#FF0000",
    urlPlaceholder: "https://youtube.com/@yourchannel",
    extraOptionKey: "bannerStyle",
    extraOptionLabel: "พื้นหลังแบบแบนเนอร์",
    extraOptionDesc: "แสดงพื้นหลังไล่สีแบบแบนเนอร์วิดีโอ",
  },
];

export const DEFAULT_WIDGET_OPTIONS = {
  insideProfileCard: true,
  useCardStyle: false,
  showPageName: false,
  largeButton: false,
  secondStyle: false,
  compactLayout: false,
  bannerStyle: false,
};

export function createWidget(platformId, { url = "", options = {} } = {}) {
  return {
    id: platformId,
    platformId,
    url,
    options: { ...DEFAULT_WIDGET_OPTIONS, ...options },
  };
}

export function getPlatformConfig(platformId) {
  return WIDGET_PLATFORMS.find((p) => p.id === platformId) || null;
}
