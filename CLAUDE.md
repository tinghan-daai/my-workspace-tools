# my-workspace-tools — 我的班級工具總專案

## 對話開始時請先讀
進度與最近更動都在 Obsidian：`obsidian/my-workspace-tools/工作筆記.md`

## 工作模式
- **加新工具**：對 Claude 說「我想做一個 XXX 工具」→ Claude 會建 `tools/<工具名>/` 子資料夾、引導我跟著 EP10 影片做
- **結束工作**：對 Claude 說「**收工**」→ 自動 commit + push + 更新 Obsidian 工作筆記
- **接續工作**：對 Claude 說「讀工作筆記、告訴我上次做到哪」

## 工作桌 + 三個家
- 📋 GDrive 工作桌：`G:\我的雲端硬碟\my-workspace-tools\`（自動跨電腦同步）
- 🐙 GitHub repo：`tinghan-daai/my-workspace-tools`（公開，網頁的家）
- 📘 Obsidian 駕駛艙：`obsidian/my-workspace-tools/工作筆記.md`（想法的家）
- 🔥 Firebase 專案：`my-teaching-tools`（或你建的，資料的家）

## 工具清單
（之後加新工具時會自動更新）
- **座標獵人** `tools/coordinate-hunter/` — 直角座標練習遊戲，60 秒計時
- **影片轉音訊** `tools/video-to-audio/` — 純瀏覽器影片轉 WAV/MP3/WebM
- **短影音分析** `tools/short-video-review/` — 台中慈濟醫院外包短影音成效追蹤＋檢討卡（Phase 1: localStorage）
- **open-design 捷徑** `tools/open-design-shortcut/` — 設計工具啟動捷徑（主程式在 `G:\我的雲端硬碟\open-design\`）

## 設計工具（open-design）
- **啟動**：雙擊 `tools/open-design-shortcut/start.bat`，或對 Claude 說「開設計工具」
- **主程式路徑**：`G:\我的雲端硬碟\open-design\`（不在 git 管理範圍內）
- **何時用**：
  - 做新工具前先產出 UI 設計稿
  - 做海報、Landing Page、社群圖卡（如金門義診系列）
  - 需要快速生成多個視覺方向供選擇
- **代理**：自動偵測到你的 Claude Code，直接使用，不需額外設定
- **更新**：`cd G:\我的雲端硬碟\open-design && git pull && pnpm install`

## 工作注意事項
- 學生資料一律去識別化（只用座號 + 班級代號）
- commit 訊息要寫清楚做了什麼 + 為什麼
- 收工前說「收工」讓 Claude 同步三方
