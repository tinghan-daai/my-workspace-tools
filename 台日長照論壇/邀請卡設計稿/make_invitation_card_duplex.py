from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

BASE = Path(__file__).resolve().parent
REPO = BASE.parents[1]

KV = REPO / "台日長照論壇/主視覺定稿/0526主視覺01v8fin.jpg"
KV_CLEAN = REPO / "台日長照論壇/主視覺動畫/bg-clean.jpg"
HERO = REPO / "tools/taiwan-japan-care-forum/assets/hero01.jpg"

OUT_FRONT = BASE / "2026臺中長照台日論壇_邀請卡_雙面_正面.png"
OUT_INSIDE = BASE / "2026臺中長照台日論壇_邀請卡_雙面_內頁.png"
OUT_PDF = BASE / "2026臺中長照台日論壇_邀請卡_雙面.pdf"

W, H = 1748, 2480  # A5 portrait, 300 dpi
FOLD = H // 2

IVORY = (249, 247, 240)
PAPER = (252, 250, 244)
WARM_GRAY = (188, 191, 188)
PALE_BLUE = (199, 218, 231)
NAVY = (13, 38, 77)
DEEP = (7, 24, 53)
TEAL = (36, 93, 118)
GOLD = (161, 119, 45)
GOLD_LIGHT = (215, 178, 101)
INK = (34, 38, 44)
MUTED = (92, 96, 101)
LINE = (207, 184, 137)

SERIF_BOLD = "/Library/Fonts/NotoSerifTC-Bold.ttf"
SERIF_SEMI = "/Library/Fonts/NotoSerifTC-SemiBold.ttf"
SERIF_MED = "/Library/Fonts/NotoSerifTC-Medium.ttf"
SANS_REG = "/Library/Fonts/NotoSansTC-Regular.otf"
SANS_MED = "/Library/Fonts/NotoSansTC-Medium.otf"
SANS_BOLD = "/Library/Fonts/NotoSansTC-Bold.otf"
TIMES = "/Library/Fonts/Times.ttc"


def font(path, size):
    return ImageFont.truetype(path, size)


def fit_cover(img, size, focus_x=0.5, focus_y=0.5):
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


def draw_centered(draw, y, text, fnt, fill, spacing=0):
    box = draw.textbbox((0, 0), text, font=fnt, spacing=spacing)
    x = (W - (box[2] - box[0])) // 2
    draw.text((x, y), text, font=fnt, fill=fill, spacing=spacing)


def text_width(draw, text, fnt):
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0]


def add_paper_noise(img, opacity=14):
    noise = Image.effect_noise(img.size, 9).convert("L")
    tint = Image.new("RGBA", img.size, (90, 72, 42, opacity))
    tint.putalpha(noise.point(lambda p: int((p + 128) / 255 * opacity)))
    return Image.alpha_composite(img.convert("RGBA"), tint)


def horizontal_rule(draw, y, cx, width, color=LINE):
    draw.line((cx - width // 2, y, cx - 90, y), fill=color, width=2)
    draw.line((cx + 90, y, cx + width // 2, y), fill=color, width=2)
    draw.polygon(
        [(cx, y - 14), (cx + 24, y), (cx, y + 14), (cx - 24, y)],
        outline=color,
        fill=None,
    )


def wrap_text(draw, text, fnt, max_width):
    lines = []
    for para in text.split("\n"):
        if not para:
            lines.append("")
            continue
        current = ""
        for ch in para:
            test = current + ch
            if text_width(draw, test, fnt) <= max_width:
                current = test
            else:
                if current:
                    lines.append(current)
                current = ch
        if current:
            lines.append(current)
    return lines


def draw_wrapped(draw, xy, text, fnt, fill, max_width, line_gap=18, indent=0):
    x, y = xy
    line_h = draw.textbbox((0, 0), "漢", font=fnt)[3] + line_gap
    for idx, line in enumerate(wrap_text(draw, text, fnt, max_width)):
        draw.text((x + (indent if idx else 0), y), line, font=fnt, fill=fill)
        y += line_h
    return y


def draw_rotated_center(base, y_center, text, fnt, fill):
    temp = Image.new("RGBA", (980, 180), (0, 0, 0, 0))
    d = ImageDraw.Draw(temp)
    bbox = d.textbbox((0, 0), text, font=fnt)
    d.text(((980 - (bbox[2] - bbox[0])) // 2, 42), text, font=fnt, fill=fill)
    temp = temp.rotate(180, expand=True)
    base.alpha_composite(temp, ((W - temp.width) // 2, int(y_center - temp.height / 2)))


def agenda_items():
    return [
        ("09:00", "開幕貴賓致詞"),
        ("09:30", "邁向台灣長照3.0新時代"),
        ("10:10", "科學化照護資訊系統 LIFE"),
        ("11:05", "高齡心理與長照實務交流"),
        ("11:45", "上午綜合座談"),
        ("13:20", "臺中長照政策與在地實踐"),
        ("14:00", "邁向失智症共生社會"),
        ("14:40", "以人為本的智慧醫養與失智照護"),
        ("15:40", "日本長照經營與服務創新"),
        ("16:20", "下午綜合座談"),
    ]


def draw_cover():
    canvas = Image.new("RGBA", (W, H), PALE_BLUE + (255,))
    draw = ImageDraw.Draw(canvas)

    # Upper outside flap.
    draw.rectangle((0, 0, W, FOLD), fill=WARM_GRAY)
    for y in range(0, FOLD, 34):
        draw.line((0, y, W, y + 80), fill=(179, 183, 180), width=1)
    draw_rotated_center(
        canvas,
        FOLD * 0.46,
        "2026 臺中長照台日論壇",
        font(SERIF_BOLD, 68),
        (12, 12, 12, 255),
    )

    # Lower visual cover.
    src_path = KV_CLEAN if KV_CLEAN.exists() else (KV if KV.exists() else HERO)
    src = Image.open(src_path).convert("RGB")
    # Use the clean city landmark background, then typeset the invitation title
    # separately so the front does not inherit poster text artifacts.
    hero = fit_cover(src, (W, FOLD), focus_x=0.58, focus_y=0.43).filter(ImageFilter.GaussianBlur(0.1))
    canvas.paste(hero, (0, FOLD))
    shade = Image.new("RGBA", (W, FOLD), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    sd.rectangle((0, 0, W, FOLD), fill=(8, 31, 67, 72))
    sd.rectangle((0, 0, W, 420), fill=(6, 28, 62, 126))
    for i in range(360):
        alpha = int(160 * (1 - i / 360))
        sd.line((0, i, W, i), fill=(5, 22, 50, alpha), width=1)
    canvas.alpha_composite(shade, (0, FOLD))
    draw = ImageDraw.Draw(canvas)

    draw.line((0, FOLD, W, FOLD), fill=(235, 239, 238), width=3)
    draw.text((124, FOLD + 112), "INVITATION", font=font(TIMES, 44), fill=(246, 231, 192))
    draw.line((124, FOLD + 178, 595, FOLD + 178), fill=(218, 181, 103), width=2)
    draw.text((124, FOLD + 215), "2026 臺中長照", font=font(SERIF_BOLD, 72), fill=(255, 255, 255))
    draw.text((124, FOLD + 306), "台日論壇", font=font(SERIF_BOLD, 116), fill=(255, 255, 255))
    draw.text((128, FOLD + 462), "跨域共融  智啟長照新時代", font=font(SERIF_SEMI, 48), fill=GOLD_LIGHT)

    panel = (124, FOLD + 770, W - 124, H - 126)
    draw.rounded_rectangle(panel, radius=8, fill=(247, 250, 250, 226), outline=(225, 187, 105), width=3)
    draw.text((panel[0] + 58, panel[1] + 54), "115年7月3日（五） 09:00–17:00", font=font(SERIF_SEMI, 46), fill=NAVY)
    draw.text((panel[0] + 58, panel[1] + 128), "裕元花園酒店 B1 國際演講廳", font=font(SANS_BOLD, 36), fill=INK)
    draw.text((panel[0] + 58, panel[1] + 188), "臺中市政府衛生局 主辦", font=font(SANS_REG, 30), fill=MUTED)
    draw.line((panel[0] + 58, panel[1] + 248, panel[2] - 58, panel[1] + 248), fill=(198, 174, 126), width=2)
    draw.text((panel[0] + 58, panel[1] + 284), "敬邀蒞臨", font=font(SERIF_BOLD, 58), fill=GOLD)

    return canvas.convert("RGB")


def draw_invitation_letter(draw, top=0):
    # Invitation panel.
    margin_x = 220
    draw.rectangle((0, top, W, FOLD), fill=PAPER)
    for inset, alpha in [(44, 92), (62, 70)]:
        draw.rectangle((inset, top + inset, W - inset, FOLD - inset), outline=(209, 187, 141), width=2)

    draw_centered(draw, top + 110, "邀  請  卡", font(SERIF_BOLD, 86), GOLD)
    draw_centered(draw, top + 220, "INVITATION", font(TIMES, 42), (126, 95, 45))
    horizontal_rule(draw, top + 248, W // 2, 650)

    body_font = font(SERIF_MED, 38)
    draw.text((margin_x, top + 360), "敬愛的貴賓　您好：", font=body_font, fill=INK)
    body = (
        "誠摯邀請您蒞臨「2026 臺中長照台日論壇」，與來自臺日的專家學者、"
        "產官學研代表共同交流，攜手推動長照跨域合作與創新發展，"
        "共創智慧長照的美好未來。"
    )
    y = draw_wrapped(draw, (margin_x + 72, top + 468), body, body_font, INK, W - margin_x * 2 - 90, 24)
    draw.text((margin_x, y + 38), "敬邀　撥冗出席　共襄盛舉", font=body_font, fill=INK)

    sig_y = FOLD - 255
    draw.text((W - 805, sig_y), "臺中市政府衛生局　局長", font=font(SERIF_MED, 34), fill=INK)
    draw.text((W - 420, sig_y - 18), "曾梓展", font=font(SERIF_BOLD, 62), fill=INK)
    draw.text((W - 226, sig_y + 74), "敬邀", font=font(SERIF_MED, 30), fill=INK)


def draw_agenda(draw):
    top = FOLD
    draw.rectangle((0, top, W, H), fill=PALE_BLUE)
    draw.line((0, top, W, top), fill=(241, 246, 248), width=4)

    draw_centered(draw, top + 92, "議程表 簡易版", font(SERIF_BOLD, 72), INK)
    draw_centered(draw, top + 184, "2026 臺中長照台日論壇", font(SANS_MED, 30), (57, 70, 84))

    card = (128, top + 270, W - 128, H - 142)
    draw.rounded_rectangle(card, radius=10, fill=(255, 255, 255), outline=(174, 194, 205), width=2)

    # Time and place strip.
    draw.rounded_rectangle((card[0] + 36, card[1] + 34, card[2] - 36, card[1] + 126), radius=6, fill=(11, 43, 83))
    draw.text((card[0] + 76, card[1] + 58), "時間｜115年7月3日（五）09:00–17:00", font=font(SANS_BOLD, 28), fill=(255, 255, 255))
    draw.text((card[0] + 710, card[1] + 58), "地點｜裕元花園酒店 B1 國際演講廳", font=font(SANS_BOLD, 28), fill=(255, 255, 255))

    left_x = card[0] + 58
    right_x = W // 2 + 20
    start_y = card[1] + 190
    col_w = (card[2] - card[0] - 136) // 2
    row_h = 73

    draw.text((left_x, start_y - 62), "上午場｜長照政策國際交流", font=font(SERIF_SEMI, 34), fill=NAVY)
    draw.text((right_x, start_y - 62), "下午場｜失智共生與科技長照", font=font(SERIF_SEMI, 34), fill=TEAL)

    items = agenda_items()
    for i, (time, topic) in enumerate(items):
        x = left_x if i < 5 else right_x
        y = start_y + (i % 5) * row_h
        if i % 5 == 0:
            draw.line((x, y - 18, x + col_w, y - 18), fill=GOLD, width=3)
        draw.text((x, y), time, font=font(SANS_BOLD, 25), fill=GOLD)
        draw.text((x + 100, y - 2), topic, font=font(SANS_MED, 25), fill=INK)
        draw.line((x, y + row_h - 20, x + col_w, y + row_h - 20), fill=(223, 230, 234), width=1)

    notes_y = card[1] + 630
    draw.rounded_rectangle((card[0] + 58, notes_y, card[2] - 58, notes_y + 212), radius=8, fill=(244, 248, 249), outline=(214, 224, 229), width=1)
    draw.text((card[0] + 94, notes_y + 34), "主題軸線", font=font(SERIF_SEMI, 30), fill=NAVY)
    themes = "長照3.0政策交流｜科學化照護資訊系統｜失智共生社會｜智慧醫養與服務創新"
    draw_wrapped(draw, (card[0] + 94, notes_y + 86), themes, font(SANS_MED, 28), INK, card[2] - card[0] - 188, 16)
    draw.text((card[0] + 94, notes_y + 160), "註：正式議程、講者與時間仍以主辦單位公告為準。", font=font(SANS_REG, 23), fill=MUTED)


def draw_inside():
    canvas = Image.new("RGBA", (W, H), PAPER + (255,))
    canvas = add_paper_noise(canvas, 8)
    draw = ImageDraw.Draw(canvas)
    draw_invitation_letter(draw)
    draw_agenda(draw)
    return canvas.convert("RGB")


def main():
    front = draw_cover()
    inside = draw_inside()
    front.save(OUT_FRONT, quality=96)
    inside.save(OUT_INSIDE, quality=96)
    front.save(OUT_PDF, "PDF", resolution=300.0, save_all=True, append_images=[inside])
    print(OUT_FRONT)
    print(OUT_INSIDE)
    print(OUT_PDF)


if __name__ == "__main__":
    main()
