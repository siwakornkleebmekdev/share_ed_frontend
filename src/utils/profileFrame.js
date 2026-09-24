// รวมศูนย์การค้นหาและดึงข้อมูลกรอบโปรไฟล์ (Frame) ให้เป็นมาตรฐานเดียวกัน
// เพื่อให้แสดงผลกรอบรูปของผู้ใช้และผู้อื่นได้อย่างถูกต้องโดยไม่ต้องพึ่งพาข้อมูลชั่วคราว
// และใช้แสดงผลกรอบได้ทุกจุดในระบบ ทั้ง Navbar, PostCard, PostDetails และ Profile
export function resolveProfileFrame(profile, milestones = []) {
  const frame =
    profile?.current_frame ||
    profile?.currentFrame ||
    profile?.equipped_frame ||
    profile?.equippedFrame ||
    null;
  const selectedFrameId =
    profile?.current_frame_id ||
    profile?.currentFrameId ||
    null;
  const embeddedFrameId =
    frame?.id ||
    frame?.reward_item_id ||
    null;
  const frameId = selectedFrameId || embeddedFrameId;
  const matchedMilestone = milestones.find((milestone) =>
    [milestone?.reward_item_id, milestone?.reward_item?.id, milestone?.reward?.id]
      .filter(Boolean)
      .some((candidate) => String(candidate) === String(frameId)),
  );

  // ในกรณีเปลี่ยนกรอบทันที current_frame อาจยังเป็นอ็อบเจกต์เดิมอยู่
  // ในขณะที่ current_frame_id ได้รับการอัปเดตเป็น ID ของกรอบใหม่แล้ว
  // โค้ดส่วนนี้จะยึด ID ล่าสุดเป็นหลักเพื่อให้ได้กรอบรูปที่ถูกต้องเสมอ
  const embeddedFrameIsCurrent = !selectedFrameId
    || (embeddedFrameId && String(selectedFrameId) === String(embeddedFrameId));
  const resolvedFrame = embeddedFrameIsCurrent
    ? (frame || matchedMilestone)
    : (matchedMilestone || frame);
  const previewUrl =
    resolvedFrame?.image_url ||
    resolvedFrame?.imageUrl ||
    resolvedFrame?.preview_url ||
    resolvedFrame?.previewUrl ||
    resolvedFrame?.metadata?.image_url ||
    resolvedFrame?.metadata?.imageUrl ||
    resolvedFrame?.metadata?.preview_url ||
    resolvedFrame?.metadata?.previewUrl ||
    resolvedFrame?.reward_item?.image_url ||
    resolvedFrame?.reward?.image_url ||
    resolvedFrame?.reward?.previewUrl ||
    profile?.current_frame_image_url ||
    matchedMilestone?.reward?.previewUrl ||
    null;

  return { frameId, frame: resolvedFrame, previewUrl };
}
