"""
金門義診暨整合式健康篩檢 海報
2480 x 3508 px  (A4 @ 300 dpi)
"""
from PIL import Image, ImageDraw, ImageFont
import math, os

# ── 尺寸 ──────────────────────────────────────────
W, H = 2480, 3508
M    = 110   # 外邊距

# ── 色盤 ──────────────────────────────────────────
NAVY   = (  0,  55, 110)   # 深藍（header / footer）
BLUE   = (  0, 102, 179)   # 主藍
ICE    = (225, 240, 255)   # 淡藍（資訊卡底色）
GOLD   = (245, 166,  35)   # 金黃
GOLD_D = (190, 120,  10)
WHITE  = (255, 255, 255)
OFFWH  = (248, 249, 252)
DGRAY  = ( 60,  60,  80)
MGRAY  = (130, 130, 150)

# ── 字型 ──────────────────────────────────────────
def F(path, size, idx=0):
    try:
        return ImageFont.truetype(path, size, index=idx)
    except Exception:
        return ImageFont.truetype(r"C:\Windows\Fonts\msjh.ttc", size)

BOLD = r"C:\Windows\Fonts\msjhbd.ttc"
REG  = r"C:\Windows\Fonts\msjh.ttc"
NOTO = r"C:\Windows\Fonts\NotoSansTC-VF.ttf"

# ── 工具函式 ──────────────────────────────────────

def rr(draw, x1, y1, x2, y2, r, fill=None, stroke=None, sw=0):
    """圓角矩形（fill + 可選描邊）"""
    r = min(r, (x2-x1)//2, (y2-y1)//2)
    if fill:
        draw.rectangle([x1+r, y1, x2-r, y2], fill=fill)
        draw.rectangle([x1, y1+r, x2, y2-r], fill=fill)
        for cx, cy in [(x1,y1),(x2-2*r,y1),(x1,y2-2*r),(x2-2*r,y2-2*r)]:
            draw.ellipse([cx, cy, cx+2*r, cy+2*r], fill=fill)
    if stroke and sw:
        r2 = r
        for start, end, cx, cy in [
            (180,270, x1,      y1),
            (270,360, x2-2*r2, y1),
            ( 90,180, x1,      y2-2*r2),
            (  0, 90, x2-2*r2, y2-2*r2),
        ]:
            draw.arc([cx,cy,cx+2*r2,cy+2*r2], start, end, fill=stroke, width=sw)
        draw.line([x1+r2, y1,    x2-r2, y1   ], fill=stroke, width=sw)
        draw.line([x1+r2, y2,    x2-r2, y2   ], fill=stroke, width=sw)
        draw.line([x1,    y1+r2, x1,    y2-r2], fill=stroke, width=sw)
        draw.line([x2,    y1+r2, x2,    y2-r2], fill=stroke, width=sw)

def ct(draw, cx, y, text, fnt, color):
    """水平置中繪文字"""
    bb = draw.textbbox((0,0), text, font=fnt)
    w  = bb[2] - bb[0]
    draw.text((cx - w//2, y), text, fill=color, font=fnt)

def lt(draw, x, y, text, fnt, color):
    draw.text((x, y), text, fill=color, font=fnt)

def th(draw, text, fnt):
    """回傳文字高度"""
    bb = draw.textbbox((0,0), text, font=fnt)
    return bb[3] - bb[1]

def tw(draw, text, fnt):
    bb = draw.textbbox((0,0), text, font=fnt)
    return bb[2] - bb[0]

# ── 波浪分隔線 ──────────────────────────────────

def wave_polygon(y_top, y_mid, amplitude, waves, color, d):
    """在 y_top 到 y_mid 間畫純色帶，底邊為波浪"""
    pts = [(0, y_top)]
    steps = 600
    for i in range(steps+1):
        x = i * W / steps
        y = y_mid + amplitude * math.sin(waves * math.pi * i / steps)
        pts.append((x, y))
    pts.append((W, y_top))
    d.polygon(pts, fill=color)

# ══════════════════════════════════════════════════
# 版面常數（由上到下）
# ══════════════════════════════════════════════════
HEADER_END  = 1160   # header 主體結束 y（波浪頂）
WAVE_AMP    = 55
BODY_TOP    = HEADER_END + WAVE_AMP + 20   # 資訊卡起始 y
CARD_H      = 530
GAP         = 85
BAND_H      = 250    # 整篩帶狀 h
DR_H        = 420    # 醫師陣容 h
CTA_H       = 230    # 底部 CTA 列 h
FOOTER_TOP  = 3040   # 固定 footer 起點，約佔下方 15%

# ══════════════════════════════════════════════════
# 建立畫布
# ══════════════════════════════════════════════════
img  = Image.new("RGB", (W, H), OFFWH)
d    = ImageDraw.Draw(img)

# ──────────────────────────────────────────────────
# 0. 白色主體背景（header 下方到 footer 上方）
# ──────────────────────────────────────────────────
d.rectangle([0, 0, W, H], fill=OFFWH)

# ──────────────────────────────────────────────────
# 1. HEADER 背景（深藍 → 波浪過渡到白）
# ──────────────────────────────────────────────────
# 主深藍底
d.rectangle([0, 0, W, HEADER_END], fill=NAVY)

# 藍色波浪過渡帶（稍亮的 BLUE，讓波浪有層次）
wave_polygon(0, HEADER_END - 30, WAVE_AMP - 10, 3, BLUE, d)

# 波浪銜接到白色的過渡（用白色多邊形蓋掉波浪以下的深藍）
pts_white = [(0, HEADER_END - 10)]
steps = 600
for i in range(steps+1):
    x = i * W / steps
    y = HEADER_END + WAVE_AMP * math.sin(3 * math.pi * i / steps)
    pts_white.append((x, y))
pts_white += [(W, HEADER_END - 10), (W, H), (0, H)]
d.polygon(pts_white, fill=OFFWH)

# ──────────────────────────────────────────────────
# 2. HEADER 內容
# ──────────────────────────────────────────────────
# 金色頂邊條
d.rectangle([0, 0, W, 20], fill=GOLD)

# 右上角裝飾大圓
d.ellipse([W-520, -320, W+120, 420], fill=BLUE)
d.ellipse([W-700, -420, W+50,  250], fill=None)  # outline only via arc
for angle in range(0, 360, 6):
    a = math.radians(angle)
    a2= math.radians(angle+3)
    cx, cy, r = W-325, 50, 325
    d.line([
        cx + r*math.cos(a), cy + r*math.sin(a),
        cx + (r+12)*math.cos(a2), cy + (r+12)*math.sin(a2)
    ], fill=(255,255,255,30), width=2)
d.ellipse([W-560, -260, W+160, 360], outline=(255,255,255), width=5)

# 左上角小點
for dx, dy, dr, col in [(M, 90, 26, GOLD), (M+68, 80, 16, WHITE), (M+110, 118, 11, GOLD)]:
    d.ellipse([dx-dr, dy-dr, dx+dr, dy+dr], fill=col)

# 年份 badge
f_yr   = F(BOLD, 60)
yr_txt = "2026  ·  115年"
yw     = tw(d, yr_txt, f_yr) + 60
rr(d, M, 78, M + yw, 78+82, 16, fill=GOLD)
lt(d, M+30, 90, yr_txt, f_yr, NAVY)

# 主標題
f_t1 = F(BOLD, 168)
f_t2 = F(BOLD, 148)
ct(d, W//2,  185, "金門義診", f_t1, WHITE)
ct(d, W//2,  380, "暨整合式健康篩檢", f_t2, WHITE)

# 金色分隔線
d.rectangle([M, 558, W-M, 568], fill=GOLD)

# 副標（金色）
f_sub = F(BOLD, 108)
ct(d, W//2, 592, "義診 ＋ 整篩  等您來！", f_sub, GOLD)

# 口號（淡藍）
f_slo = F(REG, 72)
ct(d, W//2, 734, "自己的健康  自己顧", f_slo, ICE)

# 服務膠囊標籤（4個並排）
badges  = ["各科義診", "成人健檢抽血", "口腔癌篩檢", "大腸癌篩檢"]
f_bdg   = F(BOLD, 56)
bpad_x  = 48
bpad_y  = 24
bh_val  = th(d, badges[0], f_bdg) + bpad_y * 2
bwidths = [tw(d, t, f_bdg) + bpad_x * 2 for t in badges]
bgap    = 40
total_bw= sum(bwidths) + bgap * (len(badges)-1)
bx_start= (W - total_bw) // 2
by_val  = 900
for i, txt in enumerate(badges):
    bx = bx_start + sum(bwidths[:i]) + bgap*i
    bw = bwidths[i]
    rr(d, bx, by_val, bx+bw, by_val+bh_val, bh_val//2, fill=GOLD)
    rr(d, bx+6, by_val+6, bx+bw-6, by_val+bh_val-6, (bh_val-12)//2, fill=NAVY)
    txt_w = tw(d, txt, f_bdg)
    txt_h = th(d, txt, f_bdg)
    lt(d, bx + (bw-txt_w)//2, by_val + (bh_val-txt_h)//2, txt, f_bdg, WHITE)

# ──────────────────────────────────────────────────
# 3. 資訊卡（義診時間 + 地點）
# ──────────────────────────────────────────────────
CARD_W = (W - M*2 - 60) // 2
cy0    = BODY_TOP

# ── 左卡：義診時間 ──
x1l, x2l = M, M + CARD_W
rr(d, x1l, cy0, x2l, cy0+CARD_H, 28, fill=WHITE, stroke=BLUE, sw=5)

# 卡頭藍帶
rr(d, x1l, cy0, x2l, cy0+88, 28, fill=BLUE)
d.rectangle([x1l, cy0+60, x2l, cy0+88], fill=BLUE)

f_ct  = F(BOLD, 70)
f_cb  = F(REG, 58)
f_cs  = F(REG, 50)

# 時鐘 icon（左卡頭）
ick_cx, ick_cy = x1l + 60, cy0 + 44
ick_r = 34
d.ellipse([ick_cx-ick_r, ick_cy-ick_r, ick_cx+ick_r, ick_cy+ick_r], outline=WHITE, width=8)
d.line([ick_cx, ick_cy - ick_r*0.6, ick_cx, ick_cy], fill=WHITE, width=8)
d.line([ick_cx, ick_cy, ick_cx + ick_r*0.4, ick_cy + ick_r*0.32], fill=WHITE, width=8)
lt(d, ick_cx + ick_r + 20, cy0 + 13, "義診時間", F(BOLD, 68), WHITE)

# 義診詳細時間
lt(d, x1l + 50, cy0 + 108, "6 月 12 日（星期五）", f_cb, DGRAY)
lt(d, x1l + 50, cy0 + 184, "下午  1:00 – 5:00", F(BOLD, 62), BLUE)
d.rectangle([x1l+50, cy0+272, x2l-50, cy0+278], fill=ICE)
lt(d, x1l + 50, cy0 + 296, "6 月 13 日（星期六）", f_cb, DGRAY)
lt(d, x1l + 50, cy0 + 374, "上午  7:30 – 12:00", F(BOLD, 62), BLUE)

# ── 右卡：整篩 + 地點 ──
x1r, x2r = M + CARD_W + 60, W - M
rr(d, x1r, cy0, x2r, cy0+CARD_H, 28, fill=WHITE, stroke=BLUE, sw=5)

# 卡頭
rr(d, x1r, cy0, x2r, cy0+88, 28, fill=BLUE)
d.rectangle([x1r, cy0+60, x2r, cy0+88], fill=BLUE)

# 地圖 pin icon
px, py = x1r + 60, cy0 + 44
pr     = 30
d.ellipse([px-pr, py-pr*1.1, px+pr, py+pr*0.6], fill=WHITE)
d.polygon([(px-pr, py), (px+pr, py), (px, py+pr*1.8)], fill=WHITE)
d.ellipse([px-pr//2, py-pr//2, px+pr//2, py+pr//4], fill=BLUE)
lt(d, px + pr + 25, cy0 + 13, "整篩 ＆ 地點", F(BOLD, 68), WHITE)

# 整篩抽血
lt(d, x1r + 50, cy0 + 108, "整篩（抽血）", F(BOLD, 64), NAVY)
lt(d, x1r + 50, cy0 + 186, "6 月 13 日（六）", F(REG, 58), DGRAY)
lt(d, x1r + 50, cy0 + 258, "上午  7:30 – 10:30", F(BOLD, 62), BLUE)
d.rectangle([x1r+50, cy0+338, x2r-50, cy0+344], fill=ICE)
# 地點
lt(d, x1r + 50, cy0 + 362, "活動地點", F(BOLD, 60), NAVY)
lt(d, x1r + 50, cy0 + 440, "金城鎮公所（民生路 2 號）", F(REG, 52), MGRAY)

# ──────────────────────────────────────────────────
# 4. 整篩說明帶（藍底橫條）
# ──────────────────────────────────────────────────
by2 = cy0 + CARD_H + GAP
rr(d, M, by2, W-M, by2+BAND_H, 24, fill=BLUE)
# 左金色豎條
rr(d, M, by2, M+22, by2+BAND_H, 12, fill=GOLD)

f_bnd = F(BOLD, 76)
f_bns = F(REG,  60)
lt(d, M + 55,  by2 + 42,  "報名截止", f_bnd, GOLD)
lt(d, M + 55,  by2 + 138, "即日起至 5/24（星期日）或額滿為止", f_bns, WHITE)
# 右側標誌
rr(d, W-M-320, by2+60, W-M-50, by2+188, 22, fill=NAVY)
ct(d, W-M-185, by2+96, "免費義診", F(BOLD, 60), GOLD)

# ──────────────────────────────────────────────────
# 5. 醫師陣容
# ──────────────────────────────────────────────────
dy = by2 + BAND_H + GAP
rr(d, M, dy, W-M, dy+DR_H, 24, fill=WHITE, stroke=ICE, sw=4)
# 頭部淡藍背景
rr(d, M, dy, W-M, dy+78, 24, fill=ICE)
d.rectangle([M, dy+50, W-M, dy+78], fill=ICE)
# 聽診器小圖示（圓弧代替）
scx, scy = M+55, dy+39
sr = 28
d.arc([scx-sr, scy-sr, scx, scy], 0, 180, fill=BLUE, width=8)
d.line([scx-sr, scy, scx-sr, scy+sr], fill=BLUE, width=8)
d.line([scx, scy, scx, scy+sr], fill=BLUE, width=8)
d.ellipse([scx-sr//2-12, scy+sr-12, scx-sr//2+12, scy+sr+12], fill=BLUE)
lt(d, scx+sr+20, dy+10, "醫師陣容", F(BOLD, 68), NAVY)
# 分隔
d.rectangle([M+50, dy+88, W-M-50, dy+93], fill=BLUE)
lt(d, M+60, dy+115,  "簡守信院長率副院長群領軍", F(BOLD, 64), NAVY)
lt(d, M+60, dy+205, "內科・外科・中醫・耳鼻喉等各科部主任", F(REG, 56), DGRAY)
lt(d, M+60, dy+280, "全陣容強力出席  守護您的健康", F(REG, 52), MGRAY)

# ──────────────────────────────────────────────────
# 6. CTA 特色橫幅（三大亮點）
# ──────────────────────────────────────────────────
cta_y = dy + DR_H + GAP
cta_items = [
    ("免費義診", "完全免費・無需掛號"),
    ("全家適用", "歡迎闔家一同參與"),
    ("專業陣容", "慈濟醫師親自看診"),
]
cta_w = (W - M*2 - 60) // 3
for i, (title, sub) in enumerate(cta_items):
    cx1 = M + i * (cta_w + 30)
    cx2 = cx1 + cta_w
    rr(d, cx1, cta_y, cx2, cta_y + CTA_H, 20, fill=ICE)
    # 頂部金色帶
    rr(d, cx1, cta_y, cx2, cta_y+10, 10, fill=GOLD)
    d.rectangle([cx1, cta_y+6, cx2, cta_y+10], fill=GOLD)
    # 標題
    ct(d, (cx1+cx2)//2, cta_y + 30, title, F(BOLD, 68), BLUE)
    # 分隔點
    d.ellipse([(cx1+cx2)//2 - 5, cta_y + 112, (cx1+cx2)//2 + 5, cta_y + 122], fill=GOLD)
    # 副文
    ct(d, (cx1+cx2)//2, cta_y + 135, sub, F(REG, 50), MGRAY)

# ──────────────────────────────────────────────────
# 7. FOOTER
# ──────────────────────────────────────────────────
d.rectangle([0, FOOTER_TOP, W, H], fill=NAVY)
# 金色頂線
d.rectangle([0, FOOTER_TOP, W, FOOTER_TOP+14], fill=GOLD)
# 白色小波紋裝飾
for i in range(5):
    bx = M + i * (W - 2*M) // 4
    d.ellipse([bx-6, FOOTER_TOP-6, bx+6, FOOTER_TOP+6], fill=GOLD)

# 主辦單位
f_org = F(BOLD, 72)
f_ors = F(REG,  58)
ct(d, W//2, FOOTER_TOP + 55,  "主辦單位", f_org, GOLD)
ct(d, W//2, FOOTER_TOP + 150, "慈濟基金會  ×  台中慈濟醫院", f_ors, WHITE)
d.rectangle([M, FOOTER_TOP+230, W-M, FOOTER_TOP+234], fill=(60, 100, 160))
ct(d, W//2, FOOTER_TOP + 258, "慈濟基金會及台中慈濟醫院與您健康有約・歡迎轉發分享", F(REG, 44), (160, 200, 240))

# 金色底線
d.rectangle([0, H-20, W, H], fill=GOLD)

# ══════════════════════════════════════════════════
# 輸出
# ══════════════════════════════════════════════════
OUT = r"G:\我的雲端硬碟\my-workspace-tools\tools\kinmen-design-free\kinmen-poster.png"
img.save(OUT, "PNG", dpi=(300,300))
print("Saved:", OUT)
print("Layout check:")
print("  BODY_TOP   :", BODY_TOP)
print("  FOOTER_TOP :", FOOTER_TOP, " (", round(FOOTER_TOP/H*100), "% from top)")
