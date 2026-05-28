from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import random

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent
W, H = 3000, 1688

FONT_REG = "/Library/Fonts/NotoSansCJKtc-Regular.otf"
FONT_MED = "/Library/Fonts/NotoSansCJKtc-Medium.otf"
FONT_BOLD = "/Library/Fonts/SourceHanSansTWHK-Bold.otf"
FONT_LIGHT = "/Library/Fonts/SourceHanSansTWHK-Light.otf"


def font(size, weight="regular"):
    path = {
        "regular": FONT_REG,
        "medium": FONT_MED,
        "bold": FONT_BOLD,
        "light": FONT_LIGHT,
    }[weight]
    return ImageFont.truetype(path, size)


def rgba(hex_color, a=255):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def blend_bg(top, bottom):
    img = Image.new("RGBA", (W, H), top)
    pix = img.load()
    for y in range(H):
        t = y / (H - 1)
        col = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(4))
        for x in range(W):
            pix[x, y] = col
    return img


def text(draw, xy, value, size, fill, weight="regular", anchor=None, spacing=12, align="left"):
    draw.multiline_text(xy, value, font=font(size, weight), fill=fill, anchor=anchor, spacing=spacing, align=align)


def fit_logo(path, max_w, max_h):
    img = Image.open(path).convert("RGBA")
    alpha = img.getchannel("A") if img.mode == "RGBA" else None
    bbox = img.getbbox() if alpha else img.convert("RGB").getbbox()
    if bbox:
        img = img.crop(bbox)
    scale = min(max_w / img.width, max_h / img.height)
    return img.resize((int(img.width * scale), int(img.height * scale)), Image.Resampling.LANCZOS)


def paste_logo(canvas, path, xy, max_w, max_h, opacity=210):
    logo = fit_logo(path, max_w, max_h)
    if opacity < 255:
        a = logo.getchannel("A").point(lambda p: int(p * opacity / 255))
        logo.putalpha(a)
    canvas.alpha_composite(logo, xy)


def glow_line(layer, pts, color, width=8, blur=10):
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.line(pts, fill=color, width=width, joint="curve")
    layer.alpha_composite(glow.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(layer).line(pts, fill=color, width=max(2, width // 3), joint="curve")


def draw_opera_house(d, x, y, scale, fill, line):
    # Stylized National Taichung Theater: soft concrete mass with organic apertures.
    body = [
        (x, y + 240 * scale), (x + 90 * scale, y + 70 * scale),
        (x + 290 * scale, y + 20 * scale), (x + 520 * scale, y + 70 * scale),
        (x + 640 * scale, y + 250 * scale), (x + 570 * scale, y + 430 * scale),
        (x + 350 * scale, y + 500 * scale), (x + 120 * scale, y + 440 * scale),
    ]
    d.polygon(body, fill=fill)
    d.line(body + [body[0]], fill=line, width=int(5 * scale), joint="curve")
    for ox, oy, rw, rh in [(170, 150, 90, 150), (340, 120, 120, 190), (455, 260, 92, 150)]:
        d.ellipse((x + ox * scale, y + oy * scale, x + (ox + rw) * scale, y + (oy + rh) * scale), outline=line, width=int(5 * scale))


def draw_bridge(d, x, y, scale, color):
    d.arc((x, y, x + 920 * scale, y + 360 * scale), 195, 345, fill=color, width=int(12 * scale))
    for i in range(8):
        px = x + (110 + i * 95) * scale
        d.line((px, y + 245 * scale, px + 28 * scale, y + 92 * scale), fill=color, width=int(4 * scale))
    d.line((x + 40 * scale, y + 250 * scale, x + 900 * scale, y + 250 * scale), fill=color, width=int(7 * scale))


def draw_tree_network(d, cx, cy, scale, trunk, leaf, node):
    d.line((cx, cy + 250 * scale, cx, cy - 80 * scale), fill=trunk, width=int(24 * scale))
    branches = [(-250, -20), (-150, -150), (0, -210), (170, -150), (260, -30)]
    for bx, by in branches:
        d.line((cx, cy - 40 * scale, cx + bx * scale, cy + by * scale), fill=trunk, width=int(12 * scale))
        d.ellipse((cx + (bx - 85) * scale, cy + (by - 75) * scale, cx + (bx + 85) * scale, cy + (by + 75) * scale), fill=leaf)
        d.ellipse((cx + (bx - 11) * scale, cy + (by - 11) * scale, cx + (bx + 11) * scale, cy + (by + 11) * scale), fill=node)
    d.ellipse((cx - 115 * scale, cy - 315 * scale, cx + 115 * scale, cy - 115 * scale), fill=leaf)
    d.ellipse((cx - 13 * scale, cy - 225 * scale, cx + 13 * scale, cy - 199 * scale), fill=node)


def tiny_label(d, xy, value, fill):
    text(d, xy, value, 28, fill, "medium")


def draw_version_a():
    img = blend_bg(rgba("#f4efe7"), rgba("#dfeee8"))
    city = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(city)

    for i in range(0, W, 72):
        d.line((i, 0, i - 420, H), fill=rgba("#2f6f73", 18), width=2)
    for i in range(0, H, 72):
        d.line((0, i, W, i + 200), fill=rgba("#2f6f73", 12), width=2)

    d.rectangle((0, 1115, W, H), fill=rgba("#0c3b43", 232))
    d.rectangle((0, 1115, W, 1124), fill=rgba("#d6a84f", 210))
    d.polygon([(0, 1220), (620, 1078), (1180, 1185), (1720, 1060), (3000, 1225), (3000, H), (0, H)], fill=rgba("#123f43", 255))

    draw_opera_house(d, 1740, 535, 1.22, rgba("#d8d3c6", 230), rgba("#33595c", 230))
    draw_bridge(d, 1745, 855, 1.0, rgba("#d7a44a", 230))
    d.rounded_rectangle((2230, 735, 2485, 1015), radius=36, fill=rgba("#9ec8bc", 170), outline=rgba("#29585f", 200), width=5)
    d.rectangle((2264, 785, 2452, 980), fill=rgba("#f5efe3", 150))
    for j in range(6):
        d.line((2290 + j * 28, 808, 2290 + j * 28, 954), fill=rgba("#29585f", 90), width=4)

    nodes = [(1660, 995), (1888, 810), (2218, 908), (2520, 752), (2670, 1035), (2025, 1038)]
    for a, b in [(0, 1), (1, 3), (1, 2), (2, 4), (0, 5), (5, 4)]:
        glow_line(city, [nodes[a], nodes[b]], rgba("#5bb8a8", 135), width=9, blur=14)
    for x, y in nodes:
        d.ellipse((x - 16, y - 16, x + 16, y + 16), fill=rgba("#f3c65c", 255))
        d.ellipse((x - 7, y - 7, x + 7, y + 7), fill=rgba("#ffffff", 255))

    sun = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sun)
    sd.ellipse((2345, 185, 2870, 710), fill=rgba("#d95d4f", 34))
    img.alpha_composite(sun.filter(ImageFilter.GaussianBlur(28)))
    img.alpha_composite(city)
    d = ImageDraw.Draw(img)

    text(d, (170, 190), "2026臺中市長照國際論壇", 70, rgba("#123f43"), "medium")
    text(d, (170, 304), "跨域共融\n智啟長照新時代", 172, rgba("#0d2f36"), "bold", spacing=22)
    d.rectangle((174, 742, 960, 754), fill=rgba("#d7a44a", 230))
    text(d, (170, 812), "Taichung Long-Term Care International Forum", 48, rgba("#315b60"), "regular")
    text(d, (170, 892), "Taiwan × Japan  |  Long-term Care 3.0  |  Dementia-inclusive Future", 34, rgba("#315b60"), "regular")
    d.rounded_rectangle((150, 965, 1115, 1144), radius=0, fill=rgba("#fffdf7", 226))
    d.rectangle((150, 965, 164, 1144), fill=rgba("#d7a44a", 235))
    text(d, (198, 1004), "115年7月3日（五） 09:00-17:00", 55, rgba("#123f43"), "medium")
    text(d, (198, 1090), "裕元花園酒店 B1 國際演講廳", 42, rgba("#315b60"), "regular")
    text(d, (170, 1240), "指導單位  衛生福利部", 30, rgba("#cfe1d8"), "regular")
    text(d, (170, 1292), "主辦單位  臺中市政府衛生局", 30, rgba("#cfe1d8"), "regular")
    text(d, (170, 1344), "委辦單位  佛教慈濟醫療財團法人台中慈濟醫院", 30, rgba("#cfe1d8"), "regular")

    tiny_label(d, (1830, 525), "臺中城市曲線", rgba("#426d70"))
    tiny_label(d, (2510, 720), "智慧照護節點", rgba("#426d70"))
    tiny_label(d, (2040, 1190), "跨域交流", rgba("#d8c688"))

    paste_logo(img, ROOT / "素材/2024-09-19＼臺中市政府LOGO.png", (162, 1482), 475, 92, 235)
    paste_logo(img, ROOT / "素材/台中慈濟醫院標準字20130703-藍漸層L.JPG", (690, 1484), 530, 86, 235)
    img.convert("RGB").save(OUT / "主視覺提案A_城市脈絡.png", quality=96)
    img.convert("RGB").save(OUT / "主視覺提案A_城市脈絡.pdf", resolution=180)


def draw_version_b():
    img = blend_bg(rgba("#f7f4ed"), rgba("#e8f1ef"))
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    random.seed(7)
    for _ in range(360):
        x = random.randint(0, W)
        y = random.randint(0, H)
        a = random.randint(8, 22)
        d.ellipse((x, y, x + 2, y + 2), fill=rgba("#315e62", a))

    river = []
    for x in range(-80, W + 80, 24):
        y = 965 + 120 * math.sin(x / 260) + 55 * math.sin(x / 88)
        river.append((x, y))
    glow_line(layer, river, rgba("#2d9a91", 155), width=84, blur=28)
    ImageDraw.Draw(layer).line(river, fill=rgba("#d7af5a", 235), width=10, joint="curve")

    rings = [(780, 825, 430), (1015, 645, 300), (1320, 790, 390), (1645, 620, 280), (1980, 820, 410)]
    for cx, cy, r in rings:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=rgba("#1a6265", 34), width=8)
        d.ellipse((cx - r * .62, cy - r * .62, cx + r * .62, cy + r * .62), outline=rgba("#d35e4d", 32), width=5)

    draw_tree_network(d, 2240, 875, 1.08, rgba("#236267", 215), rgba("#7dbd9c", 200), rgba("#f0be54", 255))
    draw_opera_house(d, 255, 570, .82, rgba("#e5dfd1", 210), rgba("#355e62", 190))
    draw_bridge(d, 300, 872, .62, rgba("#d35e4d", 210))

    care_nodes = [(795, 908), (1040, 773), (1268, 955), (1515, 746), (1785, 898), (2075, 760), (2240, 660), (2240, 875)]
    for i in range(len(care_nodes) - 1):
        glow_line(layer, [care_nodes[i], care_nodes[i + 1]], rgba("#236267", 118), width=10, blur=16)
    for i, (x, y) in enumerate(care_nodes):
        fill = rgba("#d35e4d", 250) if i in (1, 5) else rgba("#f0be54", 255)
        d.ellipse((x - 21, y - 21, x + 21, y + 21), fill=fill)
        d.ellipse((x - 8, y - 8, x + 8, y + 8), fill=rgba("#fffdf7", 255))

    img.alpha_composite(layer)
    d = ImageDraw.Draw(img)

    d.rounded_rectangle((142, 126, 1786, 570), radius=0, fill=rgba("#fffdf7", 216))
    d.rectangle((142, 126, 161, 570), fill=rgba("#d35e4d", 235))
    text(d, (210, 180), "跨域共融", 130, rgba("#153f43"), "bold")
    text(d, (210, 326), "智啟長照新時代", 130, rgba("#153f43"), "bold")
    text(d, (215, 495), "2026臺中市長照國際論壇", 54, rgba("#41676b"), "medium")

    d.rounded_rectangle((1825, 137, 2798, 350), radius=0, fill=rgba("#153f43", 236))
    text(d, (1878, 177), "115.07.03  FRI", 66, rgba("#f8f2e7"), "medium")
    text(d, (1882, 272), "09:00-17:00  裕元花園酒店 B1", 38, rgba("#cde2da"), "regular")

    text(d, (210, 1288), "以臺中為場域，連結臺日長照政策、失智共生、智慧醫養與數位轉型", 43, rgba("#153f43"), "regular")
    d.rectangle((210, 1365, 1120, 1374), fill=rgba("#d35e4d", 210))
    text(d, (210, 1425), "指導單位  衛生福利部    主辦單位  臺中市政府衛生局", 31, rgba("#41676b"), "regular")
    text(d, (210, 1476), "委辦單位  佛教慈濟醫療財團法人台中慈濟醫院", 31, rgba("#41676b"), "regular")

    for label, xy in [
        ("長照3.0", (905, 710)),
        ("LIFE", (1518, 683)),
        ("失智共生", (1755, 944)),
        ("DX", (2106, 704)),
        ("臺中地標", (335, 610)),
    ]:
        d.rounded_rectangle((xy[0] - 24, xy[1] - 18, xy[0] + 150, xy[1] + 38), radius=28, fill=rgba("#fffdf7", 210))
        text(d, xy, label, 30, rgba("#315e62"), "medium")

    paste_logo(img, ROOT / "素材/2024-09-19＼臺中市政府LOGO.png", (1890, 1457), 420, 82, 235)
    paste_logo(img, ROOT / "素材/台中慈濟醫院標準字20130703-藍漸層L.JPG", (2350, 1460), 500, 80, 235)
    img.convert("RGB").save(OUT / "主視覺提案B_綠川照護網.png", quality=96)
    img.convert("RGB").save(OUT / "主視覺提案B_綠川照護網.pdf", resolution=180)


if __name__ == "__main__":
    draw_version_a()
    draw_version_b()
