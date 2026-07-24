# Settings: Appearance

**ไฟล์นี้**: คำอธิบายโครงสร้างการเก็บค่าตั้งค่าหน้า Settings → Appearance เพื่อให้ทีม frontend/backend เรียนรู้วิธีเก็บ อ่าน และอิมพลีเมนต์พรีวิวและการบันทึกค่า

## วัตถุประสงค์

เก็บค่าตกแต่งการ์ดโปรไฟล์ของผู้ใช้ (layout, style, สี, ความโค้ง, สีข้อความ, รูปทรงอวาตาร์ ฯลฯ) เป็นวัตถุเดียวเพื่อ:
- อ่าน/เขียนเมื่อผู้ใช้แก้ไขการตั้งค่า
- ใช้ในพรีวิวแบบเรียลไทม์บนหน้า Settings
- แสดงผลบนหน้าโปรไฟล์สาธารณะ

## ที่เก็บข้อมูล (Recommended)

เก็บเป็นส่วนหนึ่งของ profile metadata ของผู้ใช้:
- `user.user_metadata.theme_settings` (object)

## Schema / Keys (ชนิดและค่าเริ่มต้น)

| Key | ชนิด | ค่าอนุญาต | ค่าเริ่มต้น | อธิบาย |
|-----|------|---------|---------|--------|
| `avatarShape` | string | `"square" \| "soft" \| "rounded" \| "circle"` | `"circle"` | รูปทรงอวาตาร์ |
| `cardLayout` | string | `"floating" \| "stacked" \| "compact"` | `"floating"` | เค้าโครงการ์ด |
| `cardStyle` | string | `"classic" \| "frosted-square" \| "frosted-soft" \| "outlined"` | `"classic"` | สไตล์การ์ด |
| `cardColorCustom` | boolean | `true \| false` | `true` | เปิด/ปิดการปรับสีการ์ดเอง |
| `cardColor` | string | hex format `#RRGGBB` | `"#050C1D"` | สีพื้นหลักของการ์ด |
| `cardOpacity` | number | 0–100 | `80` | ความเข้ม/opacity เป็นเปอร์เซ็นต์ |
| `cardBorderColor` | string | hex format หรือ empty string | `""` | สีขอบ (empty = inherit) |
| `cornerRoundness` | number | `0 \| 8 \| 16 \| 24 \| 32` | `24` | ความโค้งมุม (px) |
| `nameColor` | string | hex format `#RRGGBB` | `"#FFFFFF"` | สีชื่อ |
| `textColor` | string | hex format `#RRGGBB` | `"#94A3B8"` | สีข้อความรอง |
| `fontFamily` (optional) | string | ชื่อฟอนต์/คลาส | `""` | ฟอนต์ที่เลือก |

## ตัวอย่าง JSON

```json
{
  "avatarShape": "circle",
  "cardLayout": "floating",
  "cardStyle": "classic",
  "cardColorCustom": true,
  "cardColor": "#050C1D",
  "cardOpacity": 80,
  "cardBorderColor": "",
  "cornerRoundness": 24,
  "nameColor": "#FFFFFF",
  "textColor": "#94A3B8",
  "fontFamily": ""
}
```

## UI → Key Mapping

| UI Component | Key | ค่าอนุญาต |
|-------------|-----|---------|
| **เค้าโครงการ์ด** (radio/buttons) | `cardLayout` | `"floating" \| "stacked" \| "compact"` |
| **สไตล์การ์ด** (radio) | `cardStyle` | `"classic" \| "frosted-square" \| "frosted-soft" \| "outlined"` |
| **ปรับสีการ์ดเอง** (toggle) | `cardColorCustom` | `true \| false` |
| **สีพื้นการ์ด** (color picker) | `cardColor` | hex `#RRGGBB` |
| **ความเข้ม** (slider 0–100) | `cardOpacity` | 0–100 |
| **สีขอบ** (color picker, optional) | `cardBorderColor` | hex หรือ empty string |
| **ความโค้ง** (slider/buttons) | `cornerRoundness` | `0 \| 8 \| 16 \| 24 \| 32` |
| **รูปทรงอวาตาร์** (select) | `avatarShape` | `"square" \| "soft" \| "rounded" \| "circle"` |
| **สีชื่อ** (color picker) | `nameColor` | hex `#RRGGBB` |
| **สีข้อความ** (color picker) | `textColor` | hex `#RRGGBB` |

## Validation Rules

- **Hex color**: must match `/^#([0-9a-fA-F]{6})$/`
- **`cardOpacity`**: integer 0–100
- **`cornerRoundness`**: must be one of allowed values `[0, 8, 16, 24, 32]`
- **Enum fields** (`cardLayout`, `cardStyle`, `avatarShape`): must be within allowed lists
- **String lengths**: limit URLs/IDs to reasonable max (e.g., 1024 chars)

## Behavior & Fallbacks

### Reading Settings

Frontend ควรใช้ merge pattern:
```javascript
const DEFAULT_THEME = {
  avatarShape: 'circle',
  cardLayout: 'floating',
  cardStyle: 'classic',
  cardColorCustom: true,
  cardColor: '#050C1D',
  cardOpacity: 80,
  cardBorderColor: '',
  cornerRoundness: 24,
  nameColor: '#FFFFFF',
  textColor: '#94A3B8',
  fontFamily: ''
};

const cardTheme = { 
  ...DEFAULT_THEME, 
  ...(user?.user_metadata?.theme_settings || {}) 
};
```

### Color Customization Toggle

- ถ้า `cardColorCustom` เป็น `true`: ใช้ค่า `cardColor` และ `cardOpacity` ที่เก็บไว้
- ถ้า `cardColorCustom` เป็น `false`: fallback ไปใช้ `DEFAULT_THEME.cardColor` และ `DEFAULT_THEME.cardOpacity`

### Border Styling

- ถ้า `cardBorderColor` เป็น empty string หรือ null → derive border เฉพาะจาก `cardStyle` presentation
- ถ้า `cardBorderColor` มีค่า → apply custom border color เหนือ style

## Persistence

### When to Save
บันทึกเมื่อผู้ใช้คลิก "บันทึก" บนหน้า Appearance เท่านั้น ไม่ใช่ระหว่างการแก้ไข

### API Call
```javascript
profileService.updateProfile(userId, { theme_settings: <object> })
```

### Preview Mode
- สำหรับ live preview ในหน้า Settings: ใช้ local component state สำหรับ staged preview
- **อย่า** persist จนกว่าผู้ใช้คลิกยืนยัน

## Rendering Notes (Frontend)

### Dynamic Colors

ใช้ inline styles หรือ CSS variables:
```javascript
backgroundColor: hexToRgba(cardColor, cardOpacity)
```

### Layout Transformations

- **`cardLayout === 'stacked'`**: apply vertical (column) layout ด้วย left-aligned avatar
- **`cardLayout === 'compact'`**: horizontal layout ด้วย avatar ทางซ้าย
- **`cardLayout === 'floating'`** (default): vertical layout ด้วย centered avatar

### Card Styling

- **`cardStyle: 'frosted-square' | 'frosted-soft'`**: include `backdrop-filter: blur(...)` + border/shadow classes
- **`cardStyle: 'classic'`**: shadow-based styling
- **`cardStyle: 'outlined'`**: border-only styling

### Text Colors

- `nameColor` ไปที่ชื่อ (h3/name element)
- `textColor` ไปที่ bio/secondary text (p element)
- **ระวัง**: ตรวจสอบ contrast ratio สำหรับ a11y

## Migration & Compatibility

### Backward Compatibility

เมื่อโหลด user records:
- ถ้า `theme_settings` ขาด keys → fill from `DEFAULT_THEME`
- ถ้ามี key เก่าหรือ deprecated → convert/upgrade ด้วย migration logic

### Version Tracking (Optional)

เพิ่ม `themeVersion` integer ใน `theme_settings` เพื่อ run upgrades:
```json
{
  "themeVersion": 1,
  "avatarShape": "circle",
  ...
}
```

## Privacy & Size Considerations

- เก็บเฉพาะ primitive values และ image URLs (ไม่ใช่ binary)
- สำหรับ uploads (wallpaper/banner): เก็บไฟล์แยกต่างหาก save URL ใน `user_metadata`
- เก็บ `theme_settings` ให้ compact เพื่อไม่ให้ `user_metadata` ใหญ่เกินไป

## Developer Checklist

- [ ] **Frontend**: merge กับ `DEFAULT_THEME` ก่อน rendering/passing ไปที่ components (ProfilePreview, WidgetCard)
- [ ] **Backend**: validate incoming `theme_settings` payload on update (colors, enums, sizes)
- [ ] **Tests**: unit tests verify merge fallback และ `hexToRgba` conversion สำหรับ typical opacity values
- [ ] **Documentation**: Reference file นี้จาก README ในส่วน Settings area
- [ ] **ProfilePreview**: ใช้ `cardTheme` prop เพื่อ render live preview
- [ ] **SettingsAppearance**: เก็บ staged `formData` ใน component state จนกว่าคลิก "บันทึก"
- [ ] **WidgetCard**: ใช้ `cardTheme` prop เพื่อ style widget cards บนหน้า profile

## References

- `themeConstants.js`: DEFAULT_THEME, AVATAR_SHAPES, CARD_LAYOUTS, CARD_STYLES, CORNER_OPTIONS
- `ProfilePreview.jsx`: live preview component ใช้ `theme_settings`
- `SettingsAppearance.jsx`: UI form สำหรับแก้ไข theme
- `colorUtils.js`: helper functions เช่น `hexToRgba()`
