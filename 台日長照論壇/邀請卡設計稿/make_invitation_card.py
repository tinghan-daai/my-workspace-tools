from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

BASE = Path(__file__).resolve().parent
SOURCE = Path("/Users/tcdopc003/Documents/台日長照論壇/主題/0526主視覺01v8fin.jpg")
OUT_PNG = BASE / "2026臺中長照台日論壇_邀請卡_A5橫式_初稿.png"
OUT_PDF = BASE / "2026臺中長照台日論壇_邀請卡_A5橫式_初稿.pdf"

W, H = 2480, 1748  # A5 landscape, 300 dpi

NAVY = (11, 38, 83)
DEEP = (5, 22, 52)
GOLD = (190, 142, 54)
GOLD_LIGHT = (224, 180, 95)
INK = (15, 34, 74)
MUTED = (82, 87, 99)
PAPER = (246, 249, 250)


def font(path, size):
    return ImageFont.truetype(path, size)


SERIF_BOLD = "/Library/Fonts/NotoSerifTC-Bold.ttf"
SERIF_SEMI = "/Library/Fonts/NotoSerifTC-SemiBold.ttf"
SERIF_MED = "/Library/Fonts/NotoSerifTC-Medium.ttf"
SANS_REG = "/Library/Fonts/NotoSansTC-Regular.otf"
SANS_MED = "/Library/Fonts/NotoSansTC-Medium.otf"
SANS_BOLD = "/Library/Fonts/NotoSansTC-Bold.otf"


def fit_cover(img, size, focus_x=0.68, focus_y=0.44):
    tw, th = size
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = int((nw - tw) * focus_x)
    top = int((nh - th) * focus_y)
    left = max(0, min(left, nw - tw))
    top = max(0, min(top, nh - th))
    return resized.crop((left, top, left + tw, top + th))


def draw_text(draw, xy, text, fnt, fill, anchor=None, spacing=8):
    draw.multiline_text(xy, text, font=fnt, fill=fill, anchor=anchor, spacing=spacing)


def text_width(draw, text, fnt):
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0]


def gradient_alpha(width, height, left_alpha, right_alpha):
    alpha = Image.new("L", (width, height), 0)
    px = alpha.load()
    for x in range(width):
        t = x / max(1, width - 1)
        a = int(left_alpha * (1 - t) + right_alpha * t)
        for y in range(height):
            px[x, y] = a
    return alpha


def draw_wave(draw, y_base, color, outline=None):
    pts = []
    for x in range(-80, W + 120, 12):
        y = y_base + 42 * math.sin((x / W) * math.pi * 1.2 - 0.45)
        pts.append((x, y))
    poly = [(-80, H + 80), (W + 80, H + 80)] + list(reversed(pts))
    draw.polygon(poly, fill=color)
    if outline:
        draw.line(pts, fill=outline, width=8, joint="curve")


def rounded_panel(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_icon_calendar(draw, x, y):
    r = 42
    draw.ellipse((x, y, x + r * 2, y + r * 2), outline=GOLD, width=6)
    cx, cy = x + r, y + r
    draw.rounded_rectangle((cx - 19, cy - 19, cx + 19, cy + 22), radius=4, outline=INK, width=4)
    draw.line((cx - 19, cy - 5, cx + 19, cy - 5), fill=INK, width=4)
    for dx in (-10, 0, 10):
        for dy in (5, 15):
            draw.ellipse((cx + dx - 2, cy + dy - 2, cx + dx + 2, cy + dy + 2), fill=INK)


def draw_icon_pin(draw, x, y):
    r = 42
    draw.ellipse((x, y, x + r * 2, y + r * 2), outline=GOLD, width=6)
    cx, cy = x + r, y + r - 2
    draw.ellipse((cx - 17, cy - 24, cx + 17, cy + 10), outline=INK, width=5)
    draw.polygon([(cx - 12, cy + 4), (cx + 12, cy + 4), (cx, cy + 30)], fill=INK)
    draw.ellipse((cx - 6, cy - 13, cx + 6, cy - 1), fill=PAPER)


def main():
    src = Image.open(SOURCE).convert("RGB")
    bg = fit_cover(src, (W, H), focus_x=0.70, focus_y=0.40)
    bg = bg.filter(ImageFilter.GaussianBlur(0.45))

    canvas = Image.new("RGB", (W, H), PAPER)
    canvas.paste(bg)

    overlay = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    overlay.paste((248, 251, 253, 236), (0, 0, 1320, H), gradient_alpha(1320, H, 246, 110))
    overlay.paste((7, 25, 58, 62), (1220, 0, W, H), gradient_alpha(W - 1220, H, 45, 126))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay)

    draw = ImageDraw.Draw(canvas)

    # Bottom official band
    band_h = 300
    draw_wave(draw, H - band_h + 30, DEEP, GOLD_LIGHT)
    draw_wave(draw, H - band_h + 70, NAVY)
    draw.line((160, H - 156, W - 160, H - 156), fill=(223, 178, 88, 150), width=2)

    # Invitation paper panel
    panel = (132, 120, 1168, 1370)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    rounded_panel(sd, (panel[0] + 18, panel[1] + 22, panel[2] + 18, panel[3] + 22), 8, (0, 0, 0, 46))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    canvas = Image.alpha_composite(canvas, shadow)
    draw = ImageDraw.Draw(canvas)
    rounded_panel(draw, panel, 8, (249, 251, 250, 238), (204, 158, 73), 3)

    # Subtle gold top rule
    draw.line((210, 205, 1090, 205), fill=GOLD, width=4)
    draw.line((210, 222, 740, 222), fill=(204, 158, 73), width=1)

    # Header
    draw.text((210, 280), "誠摯邀請您", font=font(SERIF_SEMI, 70), fill=GOLD)
    draw.text((210, 382), "蒞臨指導", font=font(SERIF_BOLD, 118), fill=INK)
    draw.text((210, 530), "2026 臺中長照台日論壇", font=font(SERIF_SEMI, 58), fill=INK)
    draw.text((212, 604), "跨域共融  智啟長照新時代", font=font(SERIF_BOLD, 66), fill=INK)

    # Theme tags
    tags = ["跨域協作", "智慧創新", "在地實踐", "國際共享"]
    tx, ty = 214, 710
    for i, tag in enumerate(tags):
        tw = text_width(draw, tag, font(SANS_MED, 30))
        rounded_panel(draw, (tx, ty, tx + tw + 46, ty + 54), 8, (245, 238, 224), (211, 166, 83), 2)
        draw.text((tx + 23, ty + 9), tag, font=font(SANS_MED, 30), fill=(88, 65, 33))
        tx += tw + 76
        if i != len(tags) - 1:
            draw.text((tx - 30, ty + 7), "×", font=font(SANS_REG, 30), fill=GOLD)

    # Formal note
    note = "敬邀產官學研及長照服務夥伴共襄盛舉，\n交流臺日長照經驗，凝聚智慧照護與在地實踐的新動能。"
    draw_text(draw, (214, 825), note, font(SANS_REG, 36), MUTED, spacing=18)

    # Details
    y1 = 1008
    draw_icon_calendar(draw, 216, y1)
    draw.text((326, y1 - 1), "115年7月3日（五）", font=font(SERIF_SEMI, 48), fill=INK)
    draw.text((806, y1 + 5), "9:00–16:30", font=font(SERIF_SEMI, 44), fill=INK)
    draw.line((326, y1 + 74, 1080, y1 + 74), fill=(188, 200, 214), width=2)

    y2 = 1138
    draw_icon_pin(draw, 216, y2)
    draw.text((326, y2 - 1), "裕元花園酒店  B1 國際演講廳", font=font(SERIF_SEMI, 46), fill=INK)
    draw.text((328, y2 + 70), "臺中市西屯區臺灣大道四段610號", font=font(SANS_REG, 28), fill=MUTED)

    # Footer organizations typed for legibility
    draw.text((210, H - 130), "指導單位  衛生福利部", font=font(SANS_MED, 28), fill=(231, 205, 143))
    draw.text((780, H - 130), "主辦單位  臺中市政府衛生局", font=font(SANS_MED, 28), fill=(231, 205, 143))
    draw.text((1370, H - 130), "委辦單位  佛教慈濟醫療財團法人台中慈濟醫院", font=font(SANS_MED, 24), fill=(231, 205, 143))

    # Visual label on the open sky side
    draw.text((1590, 166), "INVITATION", font=font("/Library/Fonts/Times.ttc", 50), fill=(255, 244, 214, 225))
    draw.line((1532, 245, 2134, 245), fill=(229, 184, 91, 175), width=2)
    draw.text((1534, 275), "Global Integration and Smart Innovation", font=font(SANS_REG, 26), fill=(255, 255, 255, 225))

    # Fine gold city line echo
    for i in range(5):
        y = H - 355 + i * 17
        draw.arc((1320 - i * 40, y - 120, 2440 + i * 30, y + 360), 194, 350, fill=(214, 162, 71, 75), width=2)

    canvas = canvas.convert("RGB")
    canvas.save(OUT_PNG, quality=96)
    canvas.save(OUT_PDF, "PDF", resolution=300.0)
    print(OUT_PNG)
    print(OUT_PDF)


if __name__ == "__main__":
    main()
