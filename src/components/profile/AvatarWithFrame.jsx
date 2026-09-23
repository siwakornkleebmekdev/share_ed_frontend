/**
 * คอมโพเนนต์แสดงผลรูปโปรไฟล์พร้อมกรอบรูป (Avatar With Frame)
 * - การทำงาน: เรนเดอร์รูปโปรไฟล์เป็นวงกลม และซ้อนกรอบรูปขนาดขยาย scale-125 ไว้ด้านบนอย่างแม่นยำ
 * - อิงจาก: รูปแบบกรอบรูปและ Avatar ทรงกลมมาตรฐานของระบบ
 * - เชื่อมโยงกับ: ใช้งานร่วมกันในทุกหน้า (Navbar, PostCard, PostDetails, Profile, SettingsProfile, FrameDecorationModal)
 */
export default function AvatarWithFrame({
  avatarSrc,
  frameSrc,
  avatarAlt = 'Avatar',
  frameAlt = '',
  sizeClass = 'h-12 w-12',
  frameScaleClass = 'scale-125',
  className = '',
  avatarClassName = '',
  avatarFallback = null,
  onAvatarError,
}) {
  return (
    <div className={`relative shrink-0 overflow-visible rounded-full ${sizeClass} ${className}`}>
      <div className="absolute inset-0 overflow-hidden rounded-full">
        {avatarSrc ? (
          <img src={avatarSrc} alt={avatarAlt} onError={onAvatarError} className={`h-full w-full object-cover ${avatarClassName}`} />
        ) : avatarFallback}
      </div>
      {frameSrc && (
        <img src={frameSrc} alt={frameAlt} aria-hidden={!frameAlt} draggable={false} className={`pointer-events-none absolute inset-0 z-10 h-full w-full select-none object-contain ${frameScaleClass}`} />
      )}
    </div>
  );
}
