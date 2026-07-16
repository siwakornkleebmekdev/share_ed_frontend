export function hexToRgba(hex, opacityPercent) {
  const clean = (hex || '#0F172A').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${(opacityPercent ?? 80) / 100})`;
}

export function rgbToRgba({ r, g, b } = {}, opacityPercent) {
  return `rgba(${r ?? 15}, ${g ?? 23}, ${b ?? 42}, ${(opacityPercent ?? 80) / 100})`;
}

function mixRgb(color, target, ratio) {
  return {
    r: Math.round(color.r * (1 - ratio) + target.r * ratio),
    g: Math.round(color.g * (1 - ratio) + target.g * ratio),
    b: Math.round(color.b * (1 - ratio) + target.b * ratio),
  };
}

// Turns a raw average color sampled from a background image into a readable
// "frosted glass" tint — darkened toward black on dark surfaces (keeps white
// text legible) or lightened toward white on light surfaces, while keeping
// the source hue so the surface visibly matches the background's color.
export function getGlassColor(heroColor, isDark) {
  const target = isDark ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
  return mixRgb(heroColor || target, target, 0.35);
}
