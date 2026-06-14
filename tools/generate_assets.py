from __future__ import annotations

import math
import random
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
SOURCE = WORKSPACE / "heart_frame_animation"
SPRITES = ROOT / "assets" / "sprites"
EXPORTS = ROOT / "exports"
CELL = 128


def open_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def paste_center(canvas: Image.Image, image: Image.Image, scale: float = 1.0, y_offset: int = 0) -> None:
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    resized = image.resize(size, Image.Resampling.LANCZOS)
    x = (canvas.width - resized.width) // 2
    y = (canvas.height - resized.height) // 2 + y_offset
    canvas.alpha_composite(resized, (x, y))


def star(draw: ImageDraw.ImageDraw, cx: float, cy: float, outer: float, inner: float, fill) -> None:
    points = []
    for i in range(10):
        angle = -math.pi / 2 + i * math.pi / 5
        radius = outer if i % 2 == 0 else inner
        points.append((cx + math.cos(angle) * radius, cy + math.sin(angle) * radius))
    draw.polygon(points, fill=fill)


def make_glow_ring(radius: int, alpha: int) -> Image.Image:
    image = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    bbox = (CELL // 2 - radius, CELL // 2 - radius, CELL // 2 + radius, CELL // 2 + radius)
    draw.ellipse(bbox, outline=(255, 99, 154, alpha), width=5)
    return image.filter(ImageFilter.GaussianBlur(2.2))


def build_heart_pop(idle_frames: list[Image.Image]) -> list[Image.Image]:
    base = idle_frames[2]
    frames: list[Image.Image] = []
    specs = [
        (0.92, 28, 108, 0),
        (1.05, 38, 126, 0),
        (0.78, 47, 116, 1),
        (0.36, 56, 72, 2),
    ]

    for index, (scale, ring_radius, ring_alpha, burst) in enumerate(specs):
        frame = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
        frame.alpha_composite(make_glow_ring(ring_radius, ring_alpha))

        if index < 3:
            heart = base.copy()
            if index == 2:
                heart.putalpha(210)
            paste_center(frame, heart, scale)

        draw = ImageDraw.Draw(frame)
        random.seed(40 + index)
        for i in range(6 + burst * 4):
            angle = (math.tau / (6 + burst * 4)) * i + 0.25 * index
            distance = 24 + index * 13 + (i % 2) * 6
            sx = CELL / 2 + math.cos(angle) * distance
            sy = CELL / 2 + math.sin(angle) * distance
            size = max(3, 8 - index)
            star(draw, sx, sy, size, size * 0.42, (255, 222, 104, max(70, 230 - index * 45)))

        frames.append(frame)
    return frames


def build_sparkles() -> list[Image.Image]:
    frames: list[Image.Image] = []
    for index, size in enumerate([8, 13, 18, 12]):
        frame = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        glow = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)
        glow_draw.ellipse((18 - index, 18 - index, 46 + index, 46 + index), fill=(255, 118, 171, 42 + index * 10))
        frame.alpha_composite(glow.filter(ImageFilter.GaussianBlur(5)))

        draw = ImageDraw.Draw(frame)
        star(draw, 32, 32, size, size * 0.38, (255, 215, 81, 230))
        star(draw, 43, 22, max(3, size * 0.38), max(1.5, size * 0.16), (255, 255, 255, 190))
        frames.append(frame)
    return frames


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def build_score_pop() -> list[Image.Image]:
    font = load_font(26)
    frames: list[Image.Image] = []
    for index, scale in enumerate([0.84, 1.0, 1.08, 0.92]):
        frame = Image.new("RGBA", (96, 48), (0, 0, 0, 0))
        layer = Image.new("RGBA", (96, 48), (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        text = "+1"
        bbox = draw.textbbox((0, 0), text, font=font, stroke_width=3)
        x = (96 - (bbox[2] - bbox[0])) // 2
        y = (48 - (bbox[3] - bbox[1])) // 2 - 2
        alpha = 245 - index * 38
        draw.text((x, y), text, font=font, fill=(190, 18, 74, alpha), stroke_width=3, stroke_fill=(255, 255, 255, alpha))
        resized = layer.resize((round(96 * scale), round(48 * scale)), Image.Resampling.LANCZOS)
        frame.alpha_composite(resized, ((96 - resized.width) // 2, (48 - resized.height) // 2))
        frames.append(frame)
    return frames


def save_sheet(frames: list[Image.Image], path: Path) -> None:
    width = sum(frame.width for frame in frames)
    height = max(frame.height for frame in frames)
    sheet = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = 0
    for frame in frames:
        sheet.alpha_composite(frame, (x, (height - frame.height) // 2))
        x += frame.width
    sheet.save(path)


def save_frames(frames: list[Image.Image], folder: Path, prefix: str) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    for index, frame in enumerate(frames, start=1):
        frame.save(folder / f"{prefix}-{index}.png")


def composite_gameplay_frame(
    idle_frames: list[Image.Image],
    pop_frames: list[Image.Image],
    sparkle_frames: list[Image.Image],
    t: int,
) -> Image.Image:
    frame = Image.new("RGBA", (480, 270), (255, 242, 248, 255))
    draw = ImageDraw.Draw(frame)
    for y in range(270):
        shade = int(248 - y * 0.08)
        draw.line((0, y, 480, y), fill=(255, shade, min(255, shade + 9), 255))

    for i, (x, y) in enumerate([(76, 52), (396, 42), (420, 198), (118, 214), (244, 58), (314, 230)]):
        sparkle = sparkle_frames[(t // 3 + i) % len(sparkle_frames)].resize((32, 32), Image.Resampling.LANCZOS)
        frame.alpha_composite(sparkle, (x - 16, y - 16))

    font = load_font(18)
    score = min(9, t // 9 + 1)
    draw.text((18, 14), f"SCORE {score}", font=font, fill=(179, 19, 70, 255), stroke_width=2, stroke_fill=(255, 255, 255, 255))

    positions = [(130, 148), (260, 102), (348, 174), (210, 196), (372, 90), (104, 92)]
    cycle = t % 48
    phase = (t // 8) % len(positions)
    x, y = positions[phase]

    if cycle in range(16, 24):
        heart = pop_frames[(cycle - 16) // 2 % len(pop_frames)].resize((96, 96), Image.Resampling.LANCZOS)
        frame.alpha_composite(heart, (x - 48, y - 48))
        score_frame = build_score_pop()[(cycle - 16) // 2 % 4].resize((72, 36), Image.Resampling.LANCZOS)
        frame.alpha_composite(score_frame, (x - 36, y - 84))
    else:
        heart = idle_frames[(t // 3) % len(idle_frames)].resize((88, 88), Image.Resampling.LANCZOS)
        frame.alpha_composite(heart, (x - 44, y - 44))

    return frame.convert("P", palette=Image.Palette.ADAPTIVE)


def main() -> None:
    SPRITES.mkdir(parents=True, exist_ok=True)
    EXPORTS.mkdir(parents=True, exist_ok=True)

    idle_sheet = SOURCE / "sheet-transparent.png"
    if not idle_sheet.exists():
        raise FileNotFoundError(f"Missing source idle sheet: {idle_sheet}")

    shutil.copy2(idle_sheet, SPRITES / "heart-idle.png")
    shutil.copy2(SOURCE / "animation.gif", EXPORTS / "heart-idle.gif")

    idle_frames = [open_rgba(SOURCE / f"heart-{i}.png") for i in range(1, 5)]
    pop_frames = build_heart_pop(idle_frames)
    sparkle_frames = build_sparkles()
    score_frames = build_score_pop()

    save_sheet(pop_frames, SPRITES / "heart-pop.png")
    save_sheet(sparkle_frames, SPRITES / "sparkle-loop.png")
    save_sheet(score_frames, SPRITES / "score-pop.png")

    save_frames(idle_frames, SPRITES / "heart-idle-frames", "heart-idle")
    save_frames(pop_frames, SPRITES / "heart-pop-frames", "heart-pop")
    save_frames(sparkle_frames, SPRITES / "sparkle-loop-frames", "sparkle")
    save_frames(score_frames, SPRITES / "score-pop-frames", "score-pop")

    pop_frames[0].save(EXPORTS / "heart-pop.gif", save_all=True, append_images=pop_frames[1:], duration=90, loop=0, disposal=2)
    sparkle_frames[0].save(EXPORTS / "sparkle-loop.gif", save_all=True, append_images=sparkle_frames[1:], duration=120, loop=0, disposal=2)
    score_frames[0].save(EXPORTS / "score-pop.gif", save_all=True, append_images=score_frames[1:], duration=85, loop=0, disposal=2)

    gameplay_frames = [composite_gameplay_frame(idle_frames, pop_frames, sparkle_frames, t) for t in range(80)]
    gameplay_frames[0].save(
        EXPORTS / "gameplay-demo.gif",
        save_all=True,
        append_images=gameplay_frames[1:],
        duration=100,
        loop=0,
        disposal=2,
    )


if __name__ == "__main__":
    main()
