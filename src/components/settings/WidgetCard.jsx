import { hexToRgba } from "@/utils/colorUtils";
import { getWidgetUrlError } from "@/utils/widgetUrl";

// การ์ดวิดเจ็ตใช้สีประจำแพลตฟอร์มแบบเดียวกันทั้งหมด หลังนำตัวเลือกตกแต่งรายแพลตฟอร์มออก
// โหมดตัวอย่างและลิงก์เก่าที่ไม่ถูกต้องแสดงเป็น div เพื่อไม่ให้ผู้ใช้กดไปยังปลายทางผิด
export default function WidgetCard({
  platform,
  url,
  cardTheme,
  preview = false,
  showLabel = false,
}) {
  const Icon = platform.icon;
  const containerStyle = {
    backgroundColor: hexToRgba(platform.brandColor, 92),
    borderRadius: "16px",
  };
  const stacked = cardTheme?.cardLayout === "stacked";
  // ตรวจซ้ำตอนแสดงผล เพราะข้อมูลที่บันทึกก่อนเพิ่มกฎ URL อาจยังมีลิงก์ผิดอยู่
  const urlError = getWidgetUrlError(platform.id, url);
  const Tag = preview || urlError ? "div" : "a";
  const linkProps = preview || urlError
    ? {}
    : { href: url, target: "_blank", rel: "noreferrer" };

  return (
    <Tag
      {...linkProps}
      className={`relative flex overflow-hidden border border-white/10 shadow-sm transition-opacity hover:opacity-90 ${
        stacked
          ? "flex-col items-center text-center gap-2"
          : "items-center gap-3"
      } p-4`}
      style={containerStyle}
    >
      <div
        className="relative shrink-0 rounded-full flex items-center justify-center bg-white h-10 w-10"
      >
        <Icon
          className="h-5 w-5"
          color={platform.brandColor}
        />
      </div>
      <div className="relative min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">
          {showLabel ? platform.label : url || platform.urlPlaceholder}
        </p>
        {!preview && urlError && (
          <p className="text-xs font-semibold text-white/90">ลิงก์ไม่ถูกต้อง กรุณาแก้ไข</p>
        )}
      </div>
    </Tag>
  );
}
