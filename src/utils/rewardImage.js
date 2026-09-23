const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

// ตรวจสอบว่าไฟล์ PNG เป็นภาพเคลื่อนไหวแบบ APNG หรือไม่ โดยค้นหา chunk "acTL" ก่อนหน้า chunk "IDAT" แรก
function hasAnimationChunk(bytes) {
  if (bytes.length < 8 || !PNG_SIGNATURE.every((value, index) => bytes[index] === value)) {
    return false;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = view.getUint32(offset);
    const next = offset + 12 + length;
    if (next > bytes.length) return false;
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (type === "acTL") return true;
    if (type === "IDAT" || type === "IEND") return false;
    offset = next;
  }
  return false;
}

/**
 * เตรียมไฟล์รูปภาพของรางวัลก่อนอัปโหลด (รองรับ APNG ภาพเคลื่อนไหว)
 * - การทำงาน: สแกนโครงสร้างไบต์ของภาพ PNG เพื่อตรวจจับแอนิเมชัน หากพบจะตั้งชื่อและระบุ MIME type เป็น image/apng
 * - อิงจาก: มาตรฐานไฟล์ภาพเคลื่อนไหว Animated PNG (APNG)
 * - เชื่อมโยงกับ: achievement.service.js ใน resolvePayloadReward() และ createRewardItem()
 */
export async function prepareRewardImageFile(file) {
  if (!file) return file;
  const isPng = /\.(?:a?png)$/i.test(file.name) || ["image/png", "image/apng"].includes(file.type);
  if (!isPng) return file;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isAnimated = hasAnimationChunk(bytes);
  if (/\.apng$/i.test(file.name) && !isAnimated) {
    throw new Error("ไฟล์ .apng ไม่มีข้อมูลภาพเคลื่อนไหว APNG ที่ถูกต้อง");
  }
  if (!isAnimated) return file;

  const name = file.name.replace(/\.(?:a?png)$/i, ".apng");
  return new File([bytes], name, { type: "image/apng", lastModified: file.lastModified });
}
