# Playwright E2E สำหรับ US-11

ชุดทดสอบนี้ครอบคลุม TC-001 ถึง TC-007 ของ Profile Management และออกแบบให้รันกับ Frontend และ Backend แบบ local

## ตัวแปรที่ต้องกำหนด

PowerShell:

```powershell
$env:E2E_MEMBER_A_EMAIL="member-a@example.com"
$env:E2E_MEMBER_A_PASSWORD="รหัสผ่านบัญชีทดสอบ"
$env:E2E_MEMBER_B_ID="UUID ของ Member B"
$env:E2E_LOCKED_FRAME_ID="UUID ของกรอบที่ Member A ยังไม่ได้รับสิทธิ์"
$env:E2E_BASE_URL="http://127.0.0.1:5173"
$env:E2E_API_BASE_URL="http://localhost:5000/api/v1"
```

`E2E_LOCKED_FRAME_ID` ไม่จำเป็นเมื่อ API `/achievements` มีกรอบที่ยังไม่ `CLAIMED` ให้เลือกอัตโนมัติ

## เตรียมข้อมูล

- Member A ต้องยืนยันอีเมลและเข้าสู่ระบบได้
- Member A ควรมีกรอบที่ `CLAIMED` อย่างน้อยหนึ่งกรอบสำหรับ TC-003
- Member B ต้องเป็นบัญชีอื่นและมีข้อมูลใน Supabase Authentication กับฐานข้อมูล
- Frontend ต้องชี้ไปยัง Backend local ที่ใช้ฐานข้อมูลทดสอบ

## คำสั่งรัน

```powershell
npm run test:e2e
```

ชุดทดสอบ local ใช้ Google Chrome ที่ติดตั้งในเครื่องโดยค่าเริ่มต้น หากต้องการใช้ Chromium ของ Playwright ให้ติดตั้งด้วย `npm run test:e2e:install` แล้วกำหนด `$env:E2E_BROWSER_CHANNEL="chromium"`

เปิด Browser ระหว่างทดสอบ:

```powershell
npm run test:e2e:headed
```

เปิด Playwright UI:

```powershell
npm run test:e2e:ui
```

Playwright จะเปิด Vite ที่พอร์ต 5173 ให้อัตโนมัติ แต่ต้องเปิด Backend local และบริการที่เกี่ยวข้องไว้ก่อนรัน
