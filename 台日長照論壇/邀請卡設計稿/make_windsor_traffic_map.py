from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

BASE = Path(__file__).resolve().parent
OUT_PNG = BASE / "裕元花園酒店_交通地圖簡圖.png"
OUT_PDF = BASE / "裕元花園酒店_交通地圖簡圖.pdf"

W, H = 1748, 1240

BG = (248, 250, 248)
PAPER = (255, 253, 247)
NAVY = (14, 43, 84)
DEEP = (8, 26, 55)
BLUE = (44, 98, 130)
PALE_BLUE = (218, 234, 242)
GOLD = (184, 136, 55)
GOLD_LIGHT = (225, 191, 112)
GREEN = (86, 136, 108)
GRAY = (108, 116, 124)
LIGHT_GRAY = (226, 230, 230)
INK = (32, 38, 44)
WHITE = (255, 255, 255)

SERIF_BOLD = "/Library/Fonts/NotoSerifTC-Bold.ttf"
SERIF_SEMI = "/Library/Fonts/NotoSerifTC-SemiBold.ttf"
SANS_REG = "/Library/Fonts/NotoSansTC-Regular.otf"
SANS_MED = "/Library/Fonts/NotoSansTC-Medium.otf"
SANS_BOLD = "/Library/Fonts/NotoSansTC-Bold.otf"


def font(path, size):
    return ImageFont.truetype(path, size)


def add_shadow(base, box, radius=18, opacity=50, blur=18):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x1, y1, x2, y2 = box
    d.rounded_rectangle((x1 + 8, y1 + 10, x2 + 8, y2 + 10), radius=radius, fill=(0, 0, 0, opacity))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(base, layer)


def text_center(draw, xy, text, fnt, fill):
    x, y = xy
    box = draw.textbbox((0, 0), text, font=fnt)
    draw.text((x - (box[2] - box[0]) / 2, y - (box[3] - box[1]) / 2), text, font=fnt, fill=fill)


def line_with_arrow(draw, points, fill, width=10, arrow=28):
    draw.line(points, fill=fill, width=width, joint="curve")
    x1, y1 = points[-2]
    x2, y2 = points[-1]
    angle = math.atan2(y2 - y1, x2 - x1)
    left = (x2 - arrow * math.cos(angle - math.pi / 6), y2 - arrow * math.sin(angle - math.pi / 6))
    right = (x2 - arrow * math.cos(angle + math.pi / 6), y2 - arrow * math.sin(angle + math.pi / 6))
    draw.polygon([(x2, y2), left, right], fill=fill)


def draw_pin(draw, x, y, color, label, sub=None):
    draw.ellipse((x - 42, y - 42, x + 42, y + 42), fill=WHITE, outline=color, width=7)
    draw.ellipse((x - 18, y - 18, x + 18, y + 18), fill=color)
    draw.polygon([(x - 18, y + 28), (x + 18, y + 28), (x, y + 66)], fill=color)
    draw.text((x + 58, y - 34), label, font=font(SANS_BOLD, 34), fill=INK)
    if sub:
        draw.text((x + 58, y + 12), sub, font=font(SANS_MED, 24), fill=GRAY)


def draw_label_box(draw, x, y, title, sub, color=NAVY, w=280):
    draw.rounded_rectangle((x, y, x + w, y + 92), radius=12, fill=WHITE, outline=(198, 210, 216), width=2)
    draw.rectangle((x, y, x + 12, y + 92), fill=color)
    draw.text((x + 28, y + 16), title, font=font(SANS_BOLD, 25), fill=INK)
    draw.text((x + 28, y + 52), sub, font=font(SANS_MED, 20), fill=GRAY)


def main():
    canvas = Image.new("RGBA", (W, H), BG + (255,))
    d = ImageDraw.Draw(canvas)

    # Subtle paper background.
    for y in range(0, H, 32):
        d.line((0, y, W, y + 80), fill=(238, 242, 241), width=1)

    # Header.
    d.rectangle((0, 0, W, 168), fill=DEEP)
    d.text((80, 42), "裕元花園酒店 交通地圖簡圖", font=font(SERIF_BOLD, 52), fill=WHITE)
    d.text((82, 108), "Windsor Hotel Taichung｜非比例示意，供邀請卡與活動資料使用", font=font(SANS_MED, 24), fill=(220, 230, 237))
    d.rounded_rectangle((1288, 42, 1668, 126), radius=12, fill=(255, 255, 255, 20), outline=(214, 176, 98), width=2)
    d.text((1322, 62), "臺中市西屯區", font=font(SANS_MED, 22), fill=(218, 227, 234))
    d.text((1322, 92), "臺灣大道四段610號", font=font(SANS_BOLD, 26), fill=GOLD_LIGHT)

    # Main map card.
    card = (70, 205, 1678, 985)
    canvas = add_shadow(canvas, card)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle(card, radius=20, fill=PAPER, outline=(213, 222, 224), width=2)

    # Water/green area accents.
    d.rounded_rectangle((106, 700, 1628, 940), radius=18, fill=(235, 244, 239), outline=None)
    d.text((126, 910), "臺中市區方向", font=font(SANS_MED, 22), fill=(106, 128, 116))

    # Roads.
    # National Highway 1
    d.line((205, 250, 205, 875), fill=(172, 177, 180), width=54)
    d.line((205, 250, 205, 875), fill=WHITE, width=8)
    d.text((112, 286), "國道 1 號", font=font(SANS_BOLD, 27), fill=GRAY)
    d.text((107, 322), "中山高速公路", font=font(SANS_MED, 21), fill=GRAY)

    # Taiwan Boulevard.
    d.line((118, 545, 1588, 545), fill=NAVY, width=86)
    d.line((118, 545, 1588, 545), fill=(255, 255, 255, 190), width=5)
    d.text((760, 492), "臺灣大道四段", font=font(SANS_BOLD, 34), fill=WHITE)
    d.text((1360, 492), "往市區 / 朝馬", font=font(SANS_MED, 23), fill=(224, 234, 240))
    d.text((282, 492), "往沙鹿 / 中港交流道", font=font(SANS_MED, 23), fill=(224, 234, 240))

    # Anhe Road and Fuan Road.
    d.line((1045, 270, 1045, 862), fill=BLUE, width=46)
    d.text((1072, 306), "安和路", font=font(SANS_BOLD, 27), fill=BLUE)
    d.line((935, 645, 1295, 645), fill=(112, 153, 174), width=34)
    d.text((965, 665), "福安路55巷（飯店正門）", font=font(SANS_BOLD, 23), fill=(48, 83, 101))

    # Interchange loop.
    d.arc((120, 450, 330, 662), 260, 80, fill=GOLD, width=14)
    d.text((258, 620), "中港交流道", font=font(SANS_BOLD, 27), fill=GOLD)
    d.text((258, 654), "下交流道後約500公尺", font=font(SANS_MED, 21), fill=GRAY)
    line_with_arrow(d, [(245, 545), (580, 545), (930, 545)], GOLD, width=10, arrow=28)

    # Hotel pin.
    draw_pin(d, 1038, 610, GOLD, "裕元花園酒店", "正門：福安路55巷｜B1 國際演講廳")
    d.rounded_rectangle((878, 715, 1225, 790), radius=10, fill=(255, 250, 235), outline=GOLD, width=2)
    d.text((908, 733), "寶成國際集團大樓後方", font=font(SANS_BOLD, 24), fill=(95, 70, 31))

    # Nearby transport labels.
    draw_label_box(d, 1130, 420, "統聯中港轉運站", "臺灣大道對面", color=GREEN, w=320)
    draw_label_box(d, 690, 420, "福安站", "臺灣大道幹線公車", color=BLUE, w=265)
    draw_label_box(d, 1320, 626, "朝馬轉運站", "約10分鐘車程", color=NAVY, w=275)
    draw_label_box(d, 370, 736, "臺中工業區", "安和路周邊", color=GRAY, w=260)

    # Directions from major nodes.
    line_with_arrow(d, [(1450, 815), (1250, 735), (1105, 655)], GREEN, width=8, arrow=24)
    d.text((1312, 842), "高鐵臺中站", font=font(SANS_BOLD, 28), fill=GREEN)
    d.text((1312, 878), "車程約15–20分鐘", font=font(SANS_MED, 22), fill=GRAY)

    line_with_arrow(d, [(1428, 330), (1278, 420), (1110, 548)], BLUE, width=8, arrow=24)
    d.text((1298, 276), "臺中市區", font=font(SANS_BOLD, 26), fill=BLUE)
    d.text((1298, 310), "沿臺灣大道往西", font=font(SANS_MED, 21), fill=GRAY)

    line_with_arrow(d, [(420, 300), (560, 410), (770, 520)], GOLD, width=8, arrow=24)
    d.text((348, 252), "臺中機場", font=font(SANS_BOLD, 26), fill=GOLD)
    d.text((348, 286), "接臺灣大道", font=font(SANS_MED, 21), fill=GRAY)

    # North arrow.
    d.polygon([(1540, 265), (1518, 330), (1540, 315), (1562, 330)], fill=DEEP)
    d.text((1527, 337), "N", font=font(SANS_BOLD, 26), fill=DEEP)

    # Legend / route instructions.
    footer = (70, 1018, 1678, 1214)
    d.rounded_rectangle(footer, radius=18, fill=WHITE, outline=(211, 222, 226), width=2)
    d.text((112, 1048), "建議路線", font=font(SERIF_SEMI, 34), fill=NAVY)

    steps = [
        ("開車", "國道1號下中港交流道，接臺灣大道四段，轉安和路／福安路55巷進飯店正門。"),
        ("高鐵", "高鐵臺中站轉計程車或接駁交通，約15–20分鐘可抵達。"),
        ("公車", "臺灣大道幹線於「福安站」下車，步行至寶成國際大樓後方飯店入口。"),
    ]

    def wrap(draw, text, fnt, max_w):
        lines, cur = [], ""
        for ch in text:
            test = cur + ch
            if draw.textbbox((0, 0), test, font=fnt)[2] <= max_w:
                cur = test
            else:
                lines.append(cur)
                cur = ch
        if cur:
            lines.append(cur)
        return lines

    x_positions = [270, 745, 1220]
    body_font = font(SANS_MED, 20)
    for x, (title, body) in zip(x_positions, steps):
        d.rounded_rectangle((x, 1048, x + 112, 1096), radius=10, fill=PALE_BLUE, outline=None)
        text_center(d, (x + 56, 1073), title, font(SANS_BOLD, 24), NAVY)
        y = 1110
        for line in wrap(d, body, body_font, 385):
            d.text((x, y), line, font=body_font, fill=INK)
            y += 27

    d.text((112, 1184), "註：本圖為交通位置示意，實際路線、車程與公車資訊請以現場道路狀況及交通單位公告為準。", font=font(SANS_REG, 19), fill=GRAY)

    canvas = canvas.convert("RGB")
    canvas.save(OUT_PNG, quality=96)
    canvas.save(OUT_PDF, "PDF", resolution=300)
    print(OUT_PNG)
    print(OUT_PDF)


if __name__ == "__main__":
    main()
