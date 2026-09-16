# แผนจัดการ Notification เมื่อ Like / Unlike

## เป้าหมาย

ให้ notification สะท้อนสถานะจริงของโพสต์เสมอ:

- กด Like: สร้าง notification หนึ่งรายการให้เจ้าของโพสต์
- กด Unlike: ลบ notification ที่เกิดจาก Like นั้น
- กด Like ใหม่: สร้าง notification ใหม่หนึ่งรายการ
- หน้าเว็บอัปเดตทันทีผ่าน Socket.IO และยังถูกต้องหลัง refresh หรือ reconnect
- ผู้ใช้คนเดิมต้องไม่มี notification Like ซ้ำในโพสต์เดียวกัน

## ข้อตกลงข้อมูลระหว่าง Frontend และ Backend

ใช้ชื่อฟิลด์ให้ชัดเจนและไม่ใช้ `userId` แบบกำกวม:

- `recipientId`: เจ้าของโพสต์ ผู้ได้รับ notification
- `actorId`: ผู้กด Like
- `postId`: โพสต์ที่ถูก Like
- `type`: ใช้ค่า `LIKE` เพียงค่าเดียวสำหรับระบบใหม่
- `notificationId`: ID ของ notification

ตัวอย่าง notification ที่ `GET /api/v1/notifications` และ event `new_notification` ต้องส่ง:

```json
{
  "id": "notification-id",
  "type": "LIKE",
  "recipientId": "post-owner-id",
  "actorId": "liker-id",
  "postId": "post-id",
  "title": "มีคนถูกใจโพสต์ของคุณ",
  "message": "ชื่อผู้ใช้ ถูกใจโพสต์ของคุณ",
  "isRead": false,
  "createdAt": "2026-09-17T10:00:00.000Z",
  "link": "/post/post-id",
  "actor": {
    "id": "liker-id",
    "username": "username",
    "avatarUrl": "https://..."
  }
}
```

เมื่อ Unlike ให้ backend ส่ง event `notification_removed` ไปยังห้องของ `recipientId`:

```json
{
  "notificationId": "notification-id",
  "type": "LIKE",
  "recipientId": "post-owner-id",
  "actorId": "liker-id",
  "postId": "post-id",
  "reason": "UNLIKE",
  "occurredAt": "2026-09-17T10:05:00.000Z"
}
```

`notificationId` เป็นตัวหลักในการลบ ฝั่ง frontend จะใช้ `type + actorId + postId` เป็น fallback สำหรับข้อมูลเก่าหรือกรณีมีรายการซ้ำก่อน migration

## งานฝั่ง Backend

### 1. ปรับ Notification schema

Notification ประเภท Like ต้องมีฟิลด์ต่อไปนี้:

```js
{
  recipientId: ObjectId,
  actorId: ObjectId,
  postId: ObjectId,
  type: 'LIKE',
  isRead: Boolean,
  createdAt: Date
}
```

เพิ่ม compound unique index เพื่อป้องกันรายการซ้ำ:

```js
notificationSchema.index(
  { recipientId: 1, actorId: 1, postId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: 'LIKE' }
  }
);
```

ก่อนสร้าง index ต้องลบ notification `LIKE` ที่ซ้ำ โดยเก็บรายการล่าสุดไว้หนึ่งรายการต่อ `recipientId + actorId + postId`

### 2. สร้าง notification แบบ idempotent ตอน Like

หลังบันทึก Like สำเร็จ:

1. โหลดโพสต์เพื่อหา `recipientId` จากเจ้าของโพสต์
2. ถ้า `actorId === recipientId` ไม่ต้องสร้าง notification
3. ใช้ `findOneAndUpdate(..., { upsert: true, new: true })` ด้วย key:

```js
{
  recipientId,
  actorId,
  postId,
  type: 'LIKE'
}
```

4. ส่ง `new_notification` เฉพาะเมื่อมีการสร้างรายการใหม่ ไม่ส่งซ้ำเมื่อ Like เดิมมีอยู่แล้ว
5. Payload ต้องมี `id`, `actorId`, `postId` และ `link`

### 3. ลบ notification ตอน Unlike

หลังลบ Like สำเร็จ ให้ค้นหาและลบ notification ด้วย identity เดียวกัน:

```js
const notification = await Notification.findOneAndDelete({
  recipientId: post.authorId,
  actorId: currentUserId,
  postId,
  type: 'LIKE'
});
```

ถ้าพบรายการที่ลบ ให้ emit `notification_removed` ไปยังห้องของเจ้าของโพสต์ โดยใช้ payload ตาม contract ด้านบน หากไม่พบ notification ให้ Unlike สำเร็จตามปกติและไม่ต้อง emit

การสร้างหรือลบ notification ไม่ควรทำให้ Like/Unlike หลักล้มเหลว หาก notification service ผิดพลาด ให้บันทึก structured log พร้อม `actorId`, `recipientId`, `postId` เพื่อ retry หรือแก้ข้อมูลภายหลัง

### 4. Socket.IO และความปลอดภัย

- ตรวจ JWT ตอนเชื่อมต่อ socket
- หา user ID จาก token ฝั่ง server
- ไม่เชื่อ `userId` ที่ client ส่งมาโดยตรงในการเลือกห้อง
- ใช้ชื่อห้องรูปแบบเดียวกัน เช่น `user:<recipientId>`
- ส่งทั้ง `new_notification` และ `notification_removed` ไปยังห้องเดียวกัน

### 5. GET notifications ต้องเป็น source of truth

`GET /api/v1/notifications` ต้องคืนเฉพาะรายการที่ยังมีอยู่ในฐานข้อมูล ดังนั้นถ้าผู้ใช้พลาด socket event ระหว่าง offline เมื่อ reconnect หรือ refresh notification ที่ถูก Unlike แล้วต้องไม่กลับมาอีก

## งานฝั่ง Frontend

### 1. เพิ่ม action ใน Zustand

เพิ่ม `removeNotification(payload)` โดยลบตามลำดับ:

1. `notificationId`
2. fallback ด้วย `type === LIKE/NEW_LIKE`, `actorId` และ `postId`

หลังลบ จำนวน unread จะลดอัตโนมัติ เพราะ `unreadCount()` คำนวณจาก array ใน store

### 2. ฟัง Socket.IO event ใหม่

ใน `connectRealtime`:

```js
socket.on('notification_removed', removeNotification);
```

และต้องถอด listener ตอน logout, เปลี่ยนบัญชี หรือ component cleanup:

```js
socket.off('notification_removed', removeNotification);
```

Polling และ fetch ตอน reconnect ที่มีอยู่แล้วให้คงไว้ เพื่อแก้กรณี event หลุด

### 3. รองรับช่วงเปลี่ยนผ่าน

Frontend รองรับทั้ง `LIKE` และ `NEW_LIKE` ชั่วคราว แต่ backend ควรส่ง `LIKE` สำหรับข้อมูลใหม่ หลังข้อมูลเก่าหมดหรือ migration เสร็จจึงค่อยลบ alias `NEW_LIKE`

## ลำดับการ deploy

1. Backend cleanup ข้อมูล Like notification ที่ซ้ำ
2. Backend เพิ่ม unique index
3. Backend deploy logic upsert, delete และ event `notification_removed`
4. Frontend deploy listener และ Zustand action
5. ทดสอบบน staging ด้วยผู้ใช้สองบัญชี
6. ตรวจ log การสร้างซ้ำและการลบไม่พบเป็นเวลาอย่างน้อยหนึ่งรอบทดสอบ

Backend สามารถ deploy ก่อน frontend ได้ เพราะ frontend รุ่นเก่าจะเพิกเฉยต่อ event ที่ไม่รู้จัก แต่ notification จะหายหลัง refresh จาก API อยู่แล้ว

## Acceptance criteria

- A กด Like โพสต์ของ B: B ได้ notification หนึ่งรายการและกดเข้าโพสต์ได้
- A กด Like ซ้ำหรือ request ซ้ำ: B ยังมี notification เพียงหนึ่งรายการ
- A กด Unlike: notification หายจากหน้าของ B ทันทีโดยไม่ต้อง refresh
- A กด Like ใหม่: B ได้ notification ใหม่หนึ่งรายการ
- A กด Unlike แล้ว B เปิดเว็บภายหลัง: API ไม่คืน notification เก่า
- A และ C Like โพสต์เดียวกัน แล้ว A Unlike: ลบเฉพาะ notification ของ A
- Unlike หลัง notification ถูกอ่านแล้ว: notification ยังต้องถูกลบ
- เจ้าของโพสต์ Like โพสต์ตัวเอง: ไม่สร้าง notification
- ผู้ใช้ไม่สามารถ subscribe ห้องหรือรับ notification ของบัญชีอื่นด้วยการปลอม `userId`
- reconnect หลังพลาด `notification_removed`: รายการหายหลัง frontend fetch ข้อมูลล่าสุด

## Definition of done

- Backend unit/integration tests ครอบคลุม Like, duplicate Like, Unlike, re-Like และ self-Like
- Socket integration test ตรวจ payload ของ `new_notification` และ `notification_removed`
- Frontend store test ตรวจการลบด้วย `notificationId` และ fallback identity
- Build และ lint ผ่านโดยไม่มี error ใหม่
- ทดสอบจริงด้วยสองบัญชีผ่านทั้ง dropdown ใน Navbar และหน้า Notifications
