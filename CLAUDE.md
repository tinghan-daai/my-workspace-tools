# my-workspace-tools — 我的班級工具總專案

## 對話開始時請先讀
進度與最近更動都在 Obsidian：`obsidian/my-workspace-tools/工作筆記.md`

## 工作模式
- **加新工具**：對 Claude 說「我想做一個 XXX 工具」→ Claude 會建 `tools/<工具名>/` 子資料夾、引導我跟著 EP10 影片做
- **結束工作**：對 Claude 說「**收工**」→ 自動 commit + push + 更新 Obsidian 工作筆記
- **接續工作**：對 Claude 說「讀工作筆記、告訴我上次做到哪」

## 工作桌 + 三個家
- 📋 GDrive 工作桌：`~/Library/CloudStorage/GoogleDrive-tinghan@gmail.com/我的雲端硬碟/my-workspace-tools/`（自動跨電腦同步）
- 🐙 GitHub repo：`tinghan-daai/my-workspace-tools`（公開，網頁的家）
- 📘 Obsidian 駕駛艙：`obsidian/my-workspace-tools/工作筆記.md`（想法的家）
- 🔥 Firebase 專案：`my-teaching-tools`（或你建的，資料的家）

## 工具清單
（之後加新工具時會自動更新）
- **座標獵人** `tools/coordinate-hunter/` — 直角座標練習遊戲，60 秒計時
- **影片轉音訊** `tools/video-to-audio/` — 純瀏覽器影片轉 WAV/MP3/WebM
- **短影音分析** `tools/short-video-review/` — 台中慈濟醫院外包短影音成效追蹤＋檢討卡（Phase 1: localStorage）
- **open-design 捷徑** `tools/open-design-shortcut/` — 設計工具啟動捷徑（Windows 桌面版，安裝於 `C:\Users\admin\AppData\Local\Programs\Open Design\Open Design.exe`）
- **AI 書僮** `tools/ai-reader/` — 三階段深讀 Prompt 生成器：輸入書名＋個人人設，一鍵生成三段 AI 深讀 Prompt
- **檔案轉 Markdown** `tools/file-to-md/` — PDF / Word / PPT / 圖片 → .md，純瀏覽器；掃描檔走 tesseract.js OCR（繁中＋英文）
- **AI 代理人入門** `tools/ai-agent-intro/` — 給同事的 10 張簡報 + 5 頁報告（.pptx / .docx）；附 build 腳本可重新生成
- **Cozy Rain Piano** `tools/cozy-rain-piano/` — 全自動 YouTube 睡眠音樂 pipeline：CC0 圖像 + Ken Burns ffmpeg + Claude SEO + YouTube API 每日自動上傳；英文市場關鍵字 `Cozy Rain Piano`
- **生成圖片客製化機器** `tools/ai-image-params/` — AI 生圖 7 大參數（Prompt／Negative／Steps／CFG／Seed／長寬比／解析度）滑桿＋下拉即時調節，輸出文字／YAML／偽代碼三格式可一鍵複製；純瀏覽器
- **影片製作 Kit** `tools/video-kit/` — 給 Claude Code 用的三類影片製作範本（活動紀錄／教學／社群科普）：純 CSS/JS + Playwright + Edge-TTS 旁白 + ffmpeg，已內建 Windows/中文/GDrive 避坑（見 `GOTCHAS.md`）。做影片時讀 `tools/video-kit/CLAUDE.md` 進流程；鐵律＝先寫 SCRIPT.md + DESIGN.md 給我審、說「go」才動工。來源 fork 自 mathruffian-dot/claude-code-video-kit
- **三軍棋** `tools/three-army-chess/` — 單人 vs 電腦的陸海空三軍棋（軍旗／地雷／炸彈／工兵拆雷／行營／鐵路滑行／戰爭迷霧），純瀏覽器；規則細節見 `tools/three-army-chess/RULES.md`

## 設計工具（open-design）
- **平台**：Windows 桌面版（v0.10.0 起，來源 `nexu-io/open-design`）。舊的 Mac 版已不再用。
- **啟動**：對 Claude 說「開設計工具」，或開始選單／桌面直接點 **Open Design**
- **安裝路徑**：`C:\Users\admin\AppData\Local\Programs\Open Design\Open Design.exe`
- **何時用**：
  - 做新工具前先產出 UI 設計稿
  - 做海報、Landing Page、社群圖卡（如金門義診系列）
  - 需要快速生成多個視覺方向供選擇
- **代理**：第一次開啟時選 Claude Code，之後自動偵測，不需額外設定
- **更新**：到 [GitHub Releases](https://github.com/nexu-io/open-design/releases/latest) 下載新版 `win-x64-setup.exe` 重裝（桌面 App 不用 git pull）

## 工作注意事項
- 學生資料一律去識別化（只用座號 + 班級代號）
- commit 訊息要寫清楚做了什麼 + 為什麼
- 收工前說「收工」讓 Claude 同步三方
