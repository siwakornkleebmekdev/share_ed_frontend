from math import atan2, cos, hypot, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


SOURCE_DIR = Path(r"C:\Users\Eyejang\.codex\generated_images\01a0cf4b-1ef3-7f32-98fc-6afde510aee9")
OUTPUT_DIR = Path(__file__).parent
THEMES = {
    "fire": ("exec-5bafe751-1d50-42f2-82e2-6e14e2f65fe1.png", (255, 143, 30), 1.50, 1.08),
    "hearts": ("exec-fbacfb26-a8c9-4cab-ab76-e09341da6a6f.png", (255, 105, 177), 1.85, 1.12),
    "space": ("exec-58bd464a-0800-4dbe-b2e9-90505e12d821.png", (135, 137, 255), 1.80, 1.07),
    "black-hole": ("exec-61988e5e-7a89-4ff4-a12b-4b621126e210.png", (175, 107, 252), 2.05, 1.22),
    "cyber": ("exec-ec6cfac4-4e32-44e9-8334-c51c1ba2ffcd.png", (44, 225, 245), 1.40, 1.05),
    "stormborn": ("exec-6883e633-aff8-46c8-9bce-893d2f3946c8.png", (223, 75, 239), 1.25, 1.08),
}

SAFE_ALPHA = Image.new("L", (288, 288), 0)
safe_pixels = SAFE_ALPHA.load()
for safe_y in range(288):
    for safe_x in range(288):
        safe_radius = hypot(safe_x - 144, safe_y - 144)
        if 118 <= safe_radius <= 140:
            safe_pixels[safe_x, safe_y] = 255


def make_variants(source, scale):
    base = Image.open(source).convert("RGBA").resize((288, 288), Image.Resampling.LANCZOS)
    enlarged_size = round(288 * scale)
    base = base.resize((enlarged_size, enlarged_size), Image.Resampling.LANCZOS)
    inset = (enlarged_size - 288) // 2
    base = base.crop((inset, inset, inset + 288, inset + 288))
    variants = []
    for low, high in [(-93, -42), (-77, -24), (-104, -55)]:
        part = base.copy()
        alpha = part.getchannel("A")
        pixels = alpha.load()
        for y in range(288):
            for x in range(288):
                radius = hypot(x - 144, y - 144)
                angle = atan2(y - 144, x - 144) * 180 / pi
                angular = min(1, max(0, (angle - low) / 7), max(0, (high - angle) / 7))
                radial = min(1, max(0, (radius - 118) / 5), max(0, (140 - radius) / 5))
                pixels[x, y] = min(255, int(pixels[x, y] * angular * radial * 1.65))
        part.putalpha(alpha)
        variants.append(part)
    return variants


def animate_theme(name, source_name, color, lifetime, scale):
    variants = make_variants(SOURCE_DIR / source_name, scale)
    starts = [0, 0.58, 1.18, 1.79, 2.42, 3.03]
    angles = [304, 349, 46, 111, 174, 238]
    travels = [30, 39, 27, 43, 33, 37]
    frames = []

    for frame_index in range(48):
        time = frame_index * 0.075
        frame = Image.new("RGBA", (288, 288))
        glow = Image.new("RGBA", (288, 288))
        details = Image.new("RGBA", (288, 288))
        glow_draw = ImageDraw.Draw(glow)
        draw = ImageDraw.Draw(details)

        for event_index, start in enumerate(starts):
            progress = ((time - start) % 3.6) / lifetime
            if progress >= 1:
                continue

            fade = sin(pi * progress) ** (1.15 if name in ("fire", "stormborn") else 1.4)
            eased = progress - 0.045 * sin(2 * pi * progress)
            angle = angles[event_index] + travels[event_index] * eased
            segment = variants[event_index % 3].rotate(
                -angle, resample=Image.Resampling.BICUBIC, expand=False
            )
            segment.putalpha(segment.getchannel("A").point(lambda a: int(a * fade)))
            frame = Image.alpha_composite(frame, segment)

            if progress > 0.48:
                particle_fade = fade * sin(pi * (progress - 0.48) / 0.52) ** 1.4
                for particle in range(2):
                    particle_angle = (angle - 57 + particle * 5) * pi / 180
                    radius = 127 + particle * 5 + 3 * progress
                    x = 144 + radius * cos(particle_angle)
                    y = 144 + radius * sin(particle_angle)
                    alpha = int(155 * particle_fade)
                    if alpha <= 0:
                        continue
                    glow_draw.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(*color, int(alpha * 0.45)))
                    if name == "cyber":
                        draw.rectangle((x - 1, y - 1, x + 2, y + 2), fill=(*color, alpha))
                    elif name in ("space", "black-hole") and particle == 0:
                        draw.line((x - 3, y, x + 3, y), fill=(*color, alpha), width=1)
                        draw.line((x, y - 3, x, y + 3), fill=(*color, alpha), width=1)
                    else:
                        draw.ellipse((x - 1.5, y - 1.5, x + 1.5, y + 1.5), fill=(*color, alpha))

        frame = Image.alpha_composite(frame, glow.filter(ImageFilter.GaussianBlur(3)))
        finished = Image.alpha_composite(frame, details)
        finished.putalpha(Image.composite(finished.getchannel("A"), Image.new("L", (288, 288)), SAFE_ALPHA))
        frames.append(finished)

    output = OUTPUT_DIR / f"avatar-decoration-{name}.apng"
    frames[0].save(
        output,
        format="PNG",
        save_all=True,
        append_images=frames[1:],
        duration=75,
        loop=0,
        disposal=2,
        blend=0,
        optimize=True,
    )
    print(f"{name}: {output.stat().st_size} bytes")


for theme_name, (source_name, color, lifetime, scale) in THEMES.items():
    animate_theme(theme_name, source_name, color, lifetime, scale)
