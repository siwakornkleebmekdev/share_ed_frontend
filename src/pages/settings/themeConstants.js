// Shared profile-theme option lists, used by SettingsProfile (avatar shape),
// SettingsAppearance (card layout/style/color/corner/font), and ProfilePreview.
export const AVATAR_SHAPES = [
  { id: 'square', label: 'สี่เหลี่ยม', className: 'rounded-none' },
  { id: 'soft', label: 'มนละมุน', className: 'rounded-2xl' },
  { id: 'rounded', label: 'ขอบมน', className: 'rounded-3xl' },
  { id: 'circle', label: 'วงกลม', className: 'rounded-full' },
];

export const CARD_LAYOUTS = [
  { id: 'floating', label: 'Floating', description: 'Avatar ลอยอยู่กลาง' },
  { id: 'stacked', label: 'Stacked', description: 'Avatar ซ้าย บนล่าง' },
  { id: 'compact', label: 'Compact', description: 'Avatar+ชื่อ แถวเดียว' },
];

export const CARD_STYLES = [
  { id: 'classic', label: 'Classic' },
  { id: 'frosted-square', label: 'Frosted Square' },
  { id: 'frosted-soft', label: 'Frosted Soft' },
  { id: 'outlined', label: 'Outlined' },
];

export const CORNER_OPTIONS = [0, 8, 16, 24, 32];

// Quick-pick swatches for card background color.
export const CARD_COLOR_PRESETS = [
  '#000000', '#0F172A', '#1E293B', '#312E81', '#475569', '#065F46', '#7F1D1D', '#020617',
];

export const DEFAULT_THEME = {
  avatarShape: 'circle',
  cardLayout: 'floating',
  cardStyle: 'classic',
  cardColorCustom: true,
  cardColor: '#050C1D',
  cardOpacity: 80,
  cardBorderColor: '', // empty = inherit the border treatment from cardStyle
  cornerRoundness: 24,
  nameColor: '#FFFFFF',
  textColor: '#94A3B8',
};
