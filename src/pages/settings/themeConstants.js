// Shared profile-theme options. Profile avatars always use a circle.

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
