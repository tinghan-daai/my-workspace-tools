#!/usr/bin/env python3
from pathlib import Path
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parent
BASE_PATH = ROOT / "0526主視覺底圖.jpg"
FINAL_PATH = ROOT / "0526主視覺01v8fin.jpg"
OUT_PATH = ROOT / "2026台中長照台日論壇_電視牆動態主視覺_20秒_1920x1080.mp4"
POSTER_PATH = ROOT / "2026台中長照台日論壇_電視牆動態主視覺_預覽.jpg"

W, H = 1920, 1080
FPS = 30
DURATION = 20
FRAMES = FPS * DURATION


def cover_crop(im: Image.Image, target_ratio: float) -> Image.Image:
    w, h = im.size
    ratio = w / h
    if ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        return im.crop((left, 0, left + new_w, h))
    new_h = int(w / target_ratio)
    top = (h - new_h) // 2
    return im.crop((0, top, w, top + new_h))


def fit_frame(im: Image.Image) -> Image.Image:
    return cover_crop(im, W / H).resize((W, H), Image.Resampling.LANCZOS)


def ease_out_cubic(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def fade_between(t: float, start: float, end: float) -> float:
    return ease_out_cubic((t - start) / (end - start))


def make_layer(overlay: Image.Image, y0: int, y1: int) -> Image.Image:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    region = overlay.crop((0, y0, W, y1))
    layer.paste(region, (0, y0), region)
    return layer


def shifted(layer: Image.Image, dx: float, dy: float, opacity: float) -> Image.Image:
    opacity = max(0.0, min(1.0, opacity))
    if opacity <= 0:
        return Image.new("RGBA", (W, H), (0, 0, 0, 0))
    moved = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    moved.alpha_composite(layer, (int(round(dx)), int(round(dy))))
    if opacity < 0.999:
        r, g, b, a = moved.split()
        a = a.point(lambda p: int(p * opacity))
        moved = Image.merge("RGBA", (r, g, b, a))
    return moved


def background_at(base: Image.Image, t: float) -> Image.Image:
    zoom = 1.018 + 0.012 * math.sin((t / DURATION) * math.pi)
    zw, zh = int(W * zoom), int(H * zoom)
    big = base.resize((zw, zh), Image.Resampling.LANCZOS)
    x = int((zw - W) * (0.5 + 0.32 * math.sin(t * 0.19)))
    y = int((zh - H) * (0.5 + 0.22 * math.cos(t * 0.16)))
    return big.crop((x, y, x + W, y + H)).convert("RGBA")


def build_overlay(base: Image.Image, final: Image.Image) -> Image.Image:
    base_arr = np.asarray(base.convert("RGB")).astype(np.int16)
    final_arr = np.asarray(final.convert("RGB")).astype(np.int16)
    diff = np.abs(final_arr - base_arr).max(axis=2)
    alpha = np.where(diff > 32, 255, 0).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, "L").filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    overlay = final.convert("RGBA")
    overlay.putalpha(alpha_img)
    return overlay


def render() -> None:
    base = fit_frame(Image.open(BASE_PATH))
    final = fit_frame(Image.open(FINAL_PATH))
    overlay = build_overlay(base, final)

    layers = [
        (make_layer(overlay, 0, 178), 0.2, 2.6, -76, 0, 0.20),
        (make_layer(overlay, 178, 505), 1.2, 4.8, -96, 0, 0.24),
        (make_layer(overlay, 505, 610), 3.6, 6.2, -64, 0, 0.18),
        (make_layer(overlay, 610, 790), 5.2, 8.0, -52, 0, 0.16),
        (make_layer(overlay, 880, 1080), 7.2, 10.5, 0, 58, 0.10),
    ]

    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{W}x{H}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(OUT_PATH),
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    poster = None
    for i in range(FRAMES):
        t = i / FPS
        frame = background_at(base, t)
        for layer, start, end, in_dx, in_dy, float_amp in layers:
            op = fade_between(t, start, end)
            dx = in_dx * (1 - op) + math.sin(t * 0.72 + start) * float_amp * 9
            dy = in_dy * (1 - op) + math.cos(t * 0.55 + end) * float_amp * 7
            frame.alpha_composite(shifted(layer, dx, dy, op))
        rgb = frame.convert("RGB")
        if i == FPS * 10:
            poster = rgb.copy()
        proc.stdin.write(rgb.tobytes())
    proc.stdin.close()
    code = proc.wait()
    if code != 0:
        raise SystemExit(code)
    if poster is not None:
        poster.save(POSTER_PATH, quality=94)


if __name__ == "__main__":
    render()
    print(OUT_PATH)
    print(POSTER_PATH)
