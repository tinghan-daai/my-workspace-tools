from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
import math


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "outputs"
PREV = OUT / "previews"
OUT.mkdir(exist_ok=True)
PREV.mkdir(exist_ok=True)

MAIN = Image.open(ROOT / "2026臺中長照台日論壇主視覺.jpg").convert("RGB")
AGENDA = Image.open(ROOT / "2026臺中長照台日論壇議程表v6.jpg").convert("RGB")
PHOTO = MAIN.crop((2050, 40, 4096, 1840))

FONT_REG = "/Library/Fonts/NotoSansTC-Regular.ttf"
FONT_MED = "/Library/Fonts/NotoSansTC-Medium.ttf"
FONT_BOLD = "/Library/Fonts/NotoSansTC-Bold.ttf"
FONT_SERIF = "/Library/Fonts/NotoSerifTC-Bold.ttf"

pdfmetrics.registerFont(TTFont("NotoTC", FONT_REG))
pdfmetrics.registerFont(TTFont("NotoTCM", FONT_MED))
pdfmetrics.registerFont(TTFont("NotoTCB", FONT_BOLD))
pdfmetrics.registerFont(TTFont("NotoSerifTC", FONT_SERIF))

NAVY = "#09285f"
NAVY2 = "#061d4a"
GOLD = "#c89b43"
SKY = "#dff2ff"
WHITE = "#ffffff"
TEAL = "#258e91"
GREEN = "#84a942"


def font(path, size):
    return ImageFont.truetype(path, max(8, int(size)))


def cover(img, size, focus=(0.5, 0.5)):
    tw, th = size
    scale = max(tw / img.width, th / img.height)
    nw, nh = int(img.width * scale), int(img.height * scale)
    r = img.resize((nw, nh), Image.Resampling.LANCZOS)
    x = int((nw - tw) * focus[0])
    y = int((nh - th) * focus[1])
    return r.crop((x, y, x + tw, y + th))


def contain(img, size, bg=WHITE):
    tw, th = size
    scale = min(tw / img.width, th / img.height)
    nw, nh = int(img.width * scale), int(img.height * scale)
    r = img.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGB", size, bg)
    out.paste(r, ((tw - nw)//2, (th - nh)//2))
    return out


def fit_text(draw, text, box, font_path, max_size, min_size=12, spacing=1.0):
    x0, y0, x1, y1 = box
    for s in range(int(max_size), int(min_size)-1, -1):
        f = font(font_path, s)
        b = draw.multiline_textbbox((0, 0), text, font=f, spacing=int(s*0.22), align="center")
        if b[2]-b[0] <= x1-x0 and b[3]-b[1] <= y1-y0:
            return f
    return font(font_path, min_size)


def draw_center(draw, box, text, f, fill, spacing=None):
    x0, y0, x1, y1 = box
    sp = spacing if spacing is not None else int(f.size * 0.22)
    b = draw.multiline_textbbox((0, 0), text, font=f, spacing=sp, align="center")
    x = x0 + (x1-x0-(b[2]-b[0]))/2
    y = y0 + (y1-y0-(b[3]-b[1]))/2 - b[1]
    draw.multiline_text((x, y), text, font=f, fill=fill, spacing=sp, align="center")


def gold_wave(draw, w, h, base_y, thickness):
    pts = []
    for x in range(-20, w+21, max(4, w//240)):
        y = base_y + math.sin(x/w*math.pi*1.35) * h*0.035
        pts.append((x, y))
    pts += [(w+20, h), (-20, h)]
    draw.polygon(pts, fill=GOLD)
    pts2 = []
    for x in range(-20, w+21, max(4, w//240)):
        y = base_y + thickness + math.sin(x/w*math.pi*1.35) * h*0.035
        pts2.append((x, y))
    pts2 += [(w+20, h), (-20, h)]
    draw.polygon(pts2, fill=NAVY)


def skyline(draw, w, h, y, color=GOLD, alpha=None):
    lw = max(2, w//500)
    draw.line((0, y, w, y), fill=color, width=lw)
    # Abstract Taichung bridge and civic skyline, intentionally simplified.
    cx = int(w*0.72)
    draw.line((cx, y, cx, y-int(h*.12)), fill=color, width=lw)
    for dx in range(-int(w*.12), int(w*.12), max(12, w//50)):
        draw.line((cx, y-int(h*.10), cx+dx, y), fill=color, width=max(1,lw//2))
    x = int(w*.08)
    for bw, bh in [(0.06,.05),(.035,.09),(.08,.065),(.04,.12),(.07,.075)]:
        ww = int(w*bw); hh = int(h*bh)
        draw.rectangle((x, y-hh, x+ww, y), outline=color, width=lw)
        x += ww + int(w*.018)


def icon(draw, kind, cx, cy, r, color=WHITE):
    sw = int(max(4, r//9))
    if kind == "hall":
        draw.polygon([(cx-r,cy+r*.65),(cx,cy-r),(cx+r,cy+r*.65)], outline=color)
        draw.line((cx-r*.8,cy+r*.65,cx+r*.8,cy+r*.65), fill=color, width=sw)
        for i in (-.45, 0, .45):
            x=cx+r*i; draw.line((x,cy-r*.15,x,cy+r*.6), fill=color,width=sw)
    elif kind == "wc":
        for xx in (cx-r*.42, cx+r*.42):
            draw.ellipse((xx-r*.18,cy-r*.8,xx+r*.18,cy-r*.44), fill=color)
            draw.line((xx,cy-r*.35,xx,cy+r*.15),fill=color,width=sw)
        draw.polygon([(cx-r*.72,cy+r*.15),(cx-r*.12,cy+r*.15),(cx-r*.25,cy+r*.9),(cx-r*.58,cy+r*.9)],fill=color)
        draw.rectangle((cx+r*.2,cy+r*.15,cx+r*.62,cy+r*.9),fill=color)
    elif kind == "checkin":
        draw.rounded_rectangle((cx-r,cy-r*.55,cx+r,cy+r*.55),radius=r*.15,outline=color,width=sw)
        draw.line((cx-r*.5,cy,cx-r*.1,cy+r*.35),fill=color,width=sw)
        draw.line((cx-r*.1,cy+r*.35,cx+r*.55,cy-r*.35),fill=color,width=sw)


def brand_header(draw, w, h, compact=False):
    pad = int(w*.055)
    title_size = min(h*.045 if not compact else h*.07, w*.055)
    draw.text((pad, int(h*.035)), "2026 臺中長照台日論壇", font=font(FONT_MED,title_size), fill=NAVY)
    draw.line((pad,int(h*.105),w-pad,int(h*.105)),fill=GOLD,width=max(2,w//450))


def make_sign(label, kind, filename):
    w,h = 1200,3200
    bg = cover(MAIN,(w,h),focus=(.73,.47)).filter(ImageFilter.GaussianBlur(1.2))
    overlay = Image.new("RGBA",(w,h),(234,247,255,210))
    img = Image.alpha_composite(bg.convert("RGBA"),overlay)
    d = ImageDraw.Draw(img)
    brand_header(d,w,h)
    d.ellipse((w*.29,h*.18,w*.71,h*.34),fill=NAVY)
    icon(d,kind,w*.5,h*.26,w*.13)
    box=(w*.09,h*.39,w*.91,h*.72)
    f=fit_text(d,label,box,FONT_BOLD,w*.22,w*.10)
    draw_center(d,box,label,f,NAVY)
    d.text((w*.5,h*.755),"裕元花園酒店 B1",font=font(FONT_MED,w*.055),fill=GOLD,anchor="mm")
    skyline(d,w,h,int(h*.84),GOLD)
    gold_wave(d,w,h,int(h*.87),int(h*.022))
    export(img.convert("RGB"),filename,60,160,1)


def make_agenda():
    w,h=1320,3000
    img=Image.new("RGB",(w,h),SKY); d=ImageDraw.Draw(img)
    brand_header(d,w,h)
    d.rounded_rectangle((55,350,w-55,h-280),radius=28,fill=WHITE,outline=GOLD,width=6)
    fitted=contain(AGENDA,(w-150,h-760),WHITE)
    img.paste(fitted,(75,455))
    d.text((w/2,255),"議 程 表",font=font(FONT_BOLD,92),fill=NAVY,anchor="mm")
    gold_wave(d,w,h,h-230,35)
    d.text((w/2,h-115),"115 年 7 月 3 日（五）｜裕元花園酒店 B1",font=font(FONT_MED,38),fill=WHITE,anchor="mm")
    export(img,"04_議程表_易拉展_88x200cm",88,200,1)


def make_horizontal(filename, cmw, cmh, scale, title, subtitle, mode="banner"):
    ratio=cmw/cmh
    w=3600; h=max(240,int(w/ratio))
    bg=cover(PHOTO,(w,h),focus=(.58,.43))
    img=Image.blend(bg,Image.new("RGB",(w,h),SKY),.42); d=ImageDraw.Draw(img)
    d.rectangle((0,0,int(w*.24),h),fill=NAVY)
    d.rectangle((int(w*.24),0,int(w*.247),h),fill=GOLD)
    d.text((int(w*.12),h*.50),"2026\n臺中長照\n台日論壇",font=font(FONT_BOLD,h*.22),fill=WHITE,anchor="mm",align="center",spacing=int(h*.02))
    d.text((w*.61,h*.44),title,font=font(FONT_BOLD,min(h*.31,w*.054)),fill=NAVY,anchor="mm")
    d.text((w*.61,h*.71),subtitle,font=font(FONT_MED,min(h*.125,w*.022)),fill=GOLD,anchor="mm")
    d.rectangle((int(w*.247),int(h*.88),w,h),fill=NAVY)
    skyline(d,int(w*.753),h,int(h*.98),GOLD)
    export(img,filename,cmw,cmh,scale)


def make_podium():
    w,h=1600,2120
    bg=cover(MAIN,(w,h),focus=(.78,.45)); img=Image.blend(bg,Image.new("RGB",(w,h),SKY),.30); d=ImageDraw.Draw(img)
    d.rectangle((0,0,w,int(h*.19)),fill=NAVY)
    d.text((w/2,h*.095),"2026 臺中長照台日論壇",font=font(FONT_MED,83),fill=WHITE,anchor="mm")
    d.text((w/2,h*.43),"跨域共融",font=font(FONT_SERIF,190),fill=NAVY,anchor="mm")
    d.text((w/2,h*.57),"智啟長照新時代",font=font(FONT_SERIF,135),fill=NAVY,anchor="mm")
    d.text((w/2,h*.70),"臺中 × 日本",font=font(FONT_MED,68),fill=GOLD,anchor="mm")
    gold_wave(d,w,h,int(h*.82),52); skyline(d,w,h,int(h*.93),GOLD)
    export(img,"06_講台珍珠板_80x106cm",80,106,1)


def make_mic():
    w,h=1300,600
    img=cover(PHOTO,(w,h),focus=(.62,.42)); img=Image.blend(img,Image.new("RGB",(w,h),SKY),.52); d=ImageDraw.Draw(img)
    d.rectangle((0,0,int(w*.12),h),fill=NAVY)
    d.rectangle((int(w*.12),0,int(w*.135),h),fill=GOLD)
    d.text((w*.57,h*.38),"2026 臺中長照台日論壇",font=font(FONT_BOLD,78),fill=NAVY,anchor="mm")
    d.text((w*.57,h*.63),"跨域共融｜智啟長照新時代",font=font(FONT_MED,40),fill=GOLD,anchor="mm")
    export(img,"07_麥克風牌_13x6cm_共5個",13,6,1)


def make_signing():
    w,h=2200,800
    bg=cover(PHOTO,(w,h),focus=(.60,.42)); img=Image.blend(bg,Image.new("RGB",(w,h),SKY),.58); d=ImageDraw.Draw(img)
    d.text((w*.06,h*.10),"2026 臺中長照台日論壇",font=font(FONT_MED,78),fill=NAVY)
    d.text((w*.06,h*.28),"跨域共融　智啟長照新時代",font=font(FONT_BOLD,112),fill=NAVY)
    d.line((w*.06,h*.49,w*.94,h*.49),fill=GOLD,width=7)
    d.text((w*.5,h*.61),"貴賓簽名",font=font(FONT_MED,46),fill=GOLD,anchor="mm")
    gold_wave(d,w,h,int(h*.86),20)
    export(img,"09_簽名軸_110x40cm",110,40,1)


def export(img, stem, cmw, cmh, scale):
    preview=img.copy(); preview.thumbnail((1800,1800),Image.Resampling.LANCZOS)
    preview.save(PREV/f"{stem}_預覽.png",quality=95)
    pdf_path=OUT/f"{stem}_{'1比10' if scale==10 else '1比1'}印刷稿.pdf"
    pw=cmw/scale/2.54*72; ph=cmh/scale/2.54*72
    c=canvas.Canvas(str(pdf_path),pagesize=(pw,ph),pageCompression=1)
    c.drawImage(ImageReader(img),0,0,width=pw,height=ph,mask='auto')
    c.setTitle(stem); c.setAuthor("臺中長照台日論壇")
    c.showPage(); c.save()


make_sign("國際會議廳", "hall", "01_指示牌_國際會議廳_60x160cm")
make_sign("化 妝 室", "wc", "02_指示牌_化妝室_60x160cm")
make_sign("報 到 處", "checkin", "03_指示牌_報到處_60x160cm")
make_agenda()
make_horizontal("05_舞台前緣帆布_1300x49cm",1300,49,10,"跨域共融　智啟長照新時代","CROSS-SECTOR COLLABORATION · SMART LONG-TERM CARE")
make_podium()
make_mic()
make_horizontal("08_拍照布條_750x80cm",750,80,10,"2026 臺中長照台日論壇","跨域共融 × 智慧創新 × 在地實踐 × 國際共享")
make_signing()

# Contact sheet for quick review.
files=sorted(PREV.glob("*.png"))
thumbs=[]
for p in files:
    im=Image.open(p).convert("RGB"); im.thumbnail((620,420),Image.Resampling.LANCZOS); thumbs.append((p,im.copy()))
sheet=Image.new("RGB",(1400, math.ceil(len(thumbs)/2)*520),(238,243,248)); sd=ImageDraw.Draw(sheet)
sd.text((60,35),"2026 臺中長照台日論壇｜會場設計物總覽",font=font(FONT_BOLD,48),fill=NAVY)
for i,(p,im) in enumerate(thumbs):
    col=i%2; row=i//2; x=60+col*680; y=110+row*520
    sheet.paste(im,(x+(620-im.width)//2,y))
    sd.text((x+310,y+435),p.stem.replace("_預覽",""),font=font(FONT_REG,24),fill=NAVY,anchor="ma")
sheet.save(OUT/"00_會場設計物總覽.png")
