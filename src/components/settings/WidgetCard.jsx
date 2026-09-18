import { hexToRgba } from "@/utils/colorUtils";

/**
 * =========================================================================
 * ตำแหน่งบนหน้าเว็บ: 
 *   1. หน้าต่างป๊อปอัปเพิ่ม/แก้ไขวิดเจ็ต (WidgetModal): ฝั่งขวาในกล่อง "ตัวอย่าง"
 *   2. หน้าตั้งค่าวิดเจ็ต (SettingsWidgets): ในการ์ดแสดงรายการ "วิดเจ็ตที่เพิ่มแล้ว"
 *   3. หน้าโปรไฟล์ (Profile.jsx): กล่องการ์ดลิงก์โซเชียลมีเดียใต้ข้อมูลโปรไฟล์
 * 
 * หน้าที่: การ์ดแสดงผลวิดเจ็ตโซเชียลมีเดียแต่ละตัว (เช่น Facebook, Instagram, Discord, YouTube, GitHub, เว็บไซต์)
 *         แสดงไอคอนประจำแพลตฟอร์ม, ชื่อแพลตฟอร์ม, ลิงก์ URL และปรับแต่งสี/ความโค้งมน
 *         ตามสีแบรนด์ของแพลตฟอร์ม หรือตามสไตล์ของธีมการ์ดโปรไฟล์ที่ผู้ใช้เลือกไว้
 * =========================================================================
 */
export default function WidgetCard({
  platform,
  url,
  options,
  cardTheme,
  preview = false,
  showLabel = false,
}) {
  const Icon = platform.icon;
  const extraOn = !!options?.[platform.extraOptionKey];

  const containerStyle = options?.useCardStyle
    ? {
        backgroundColor: hexToRgba(
          cardTheme?.cardColor,
          cardTheme?.cardOpacity,
        ),
        borderRadius: `${cardTheme?.cornerRoundness ?? 16}px`,
      }
    : {
        // Solid-ish brand color (not a low-opacity tint) so the card reads
        // correctly regardless of what page/background it sits on — the
        // light Settings list and the dark Profile hero alike.
        backgroundColor: hexToRgba(platform.brandColor, 92),
        borderRadius: "16px",
      };

  const compact = platform.id === "discord" && extraOn;
  const fullWidth = platform.id === "instagram" && extraOn;
  const showCaption = platform.id === "facebook" && extraOn;
  const showBanner = platform.id === "youtube" && extraOn;
  const stacked = cardTheme?.cardLayout === "stacked";
  const Tag = preview ? "div" : "a";
  const linkProps = preview
    ? {}
    : { href: url, target: "_blank", rel: "noreferrer" };

  return (
    <Tag
      {...linkProps}
      className={`relative flex overflow-hidden border border-white/10 shadow-sm transition-opacity hover:opacity-90 ${
        stacked
          ? "flex-col items-center text-center gap-2"
          : "items-center gap-3"
      } ${compact ? "p-2" : "p-4"} ${fullWidth ? "w-full" : ""}`}
      style={containerStyle}
    >
      {showBanner && (
        <div
          className="absolute inset-x-0 top-0 h-6 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${hexToRgba(platform.brandColor, 35)}, transparent)`,
          }}
        />
      )}
      <div
        className={`relative shrink-0 rounded-full flex items-center justify-center bg-white ${compact ? "h-8 w-8" : "h-10 w-10"}`}
      >
        <Icon
          className={compact ? "h-4 w-4" : "h-5 w-5"}
          color={platform.brandColor}
        />
      </div>
      <div className="relative min-w-0 flex-1">
        {showCaption && !showLabel && (
          <p className="text-xs font-bold text-white/90 leading-tight">
            {platform.label}
          </p>
        )}
        <p className="text-sm font-semibold text-white truncate">
          {showLabel ? platform.label : url || platform.urlPlaceholder}
        </p>
      </div>
    </Tag>
  );
}
