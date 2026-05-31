# 2026臺中長照台日論壇 — 動態主視覺（v2）

把主視覺定稿做成「文字優雅進場 → 停留 → 淡出」的 **20 秒無縫循環**動態影片，給論壇現場大螢幕用。

## 成品（直接用這個）
**`2026台日論壇_動態主視覺_1920x1080.mp4`** — 1920×1080 / 30fps / 20 秒無縫循環 / H.264 高畫質

- 現場播放：用任何播放器循環播放即可；或開 `index.html`（會自動全螢幕循環播放這支 MP4）。

## 設計重點（v2 相較舊版的改進）
- **背景有生命力**：緩慢推鏡（zoom 1.0→1.05）＋陽光呼吸＋飄移雲霧＋34 顆金色光點漂浮＋標題金光掃過 2 次
- **文字優雅**：主標逐字「由下往上遮罩揭開」、修正舊版行距過擠、實色深藍＋柔投影
- **乾淨底圖**：官方 `0526主視覺底圖.jpg` ＋無縫接回主辦單位 logo 帶（合成為 `bg-final.jpg`）

## 要改內容 / 重新輸出
動畫定義在 **`record.html`**（1920×1080 固定舞台，WAAPI，可逐格 seek）。改完重跑：

```bash
node capture.js     # 逐格擷取 600 幀 PNG（寫到本機暫存，約 10 分鐘）
python encode.py    # 用 ffmpeg 合成 MP4（輸出回本資料夾）
node capture.js test   # 只出 8 張測試幀，快速檢查
```

### 環境注意（這台 Windows + Google Drive 的坑）
- **逐格 PNG 一律寫到本機暫存**（`%TEMP%\tjforum_kv\frames`），不要寫到 Google Drive 資料夾——在 Drive 上做遞迴刪除會讓 Node 崩潰（exit 127）。`encode.py` 透過 `_framesdir.txt` 讀取暫存路徑。
- ffmpeg 用 pip 套件 `imageio-ffmpeg` 內建的，免系統安裝。
- Chrome 路徑、`file://` 中文路徑都已在 `capture.js` 處理好。

## 檔案
- `record.html` — 動畫主程式（渲染來源）
- `bg-final.jpg` — 乾淨底圖＋logo 帶
- `capture.js` / `encode.py` — 逐格擷取 + 合成 MP4
- `index.html` — 全螢幕循環播放 MP4 的播放頁
