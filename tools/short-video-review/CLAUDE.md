# 短影音分析工具 short-video-review

## 用途
分析台中慈濟醫院外包拍攝的短影音成效，給公傳室同事 + 長官看。

## 開發階段（Phase 規劃）

| Phase | 內容 | 狀態 |
|-------|------|------|
| 1a | 純前端 UI + localStorage：手動填影片資料 + 寫檢討卡 | 🟡 進行中 |
| 1b | 換成 Firestore：多人共用、雲端同步 | ⏳ 待 Firebase 專案建好 |
| 2  | 串 YouTube Data API v3：自動抓觀看數、讚、留言 | ⏳ 待 API 金鑰 |
| 3  | Firebase Auth 登入（白名單 email） | ⏳ |
| 4  | 串 FB Graph API：抓 FB 粉專貼文成效 | ⏳ 待 FB App 審查 |

## 資料結構（Firestore 切換時直接對應）

```js
// collection: videos
{
  id: 'auto',
  title: '影片標題',
  platform: 'youtube' | 'facebook',
  url: 'https://...',
  publishedAt: '2026-04-15',  // ISO date
  vendor: '外包廠商名稱',
  budget: 30000,              // 新台幣
  topic: '衛教 / 病例 / 活動 / 形象',
  metrics: {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    fetchedAt: null,          // API 抓取時間，手填則為 null
  },
  review: {
    strengths: '做得好的地方',
    improvements: '可以改進',
    recommendations: '給長官的建議',
    rating: 1-5,              // 整體評分
  },
  createdAt: '2026-04-28T...',
  updatedAt: '2026-04-28T...',
}
```

## UI / 設計
2026-05 套用 Claude Design 產出的「Newsroom Brief」週報式版型：
- Masthead（VOL/ISSUE 自動算）+ 4 大指標 + 月度趨勢儀表板 + 主題排名
- Lead Story（本期 ER 第一）
- 影片列表：YT+FB 自動合併、檢討卡（＋／－／→）直接顯示在每列
- 後 5 名 + 廠商成績單
- 三個分頁：週報總覽 / 所有影片 / 外包廠商
- 視覺：黑墨配米白紙感、Noto Serif TC + JetBrains Mono，純資料工具感

舊版（深色螢光主題）備份在 `index.html.bak`。

## 檔案結構
- `index.html` — 主程式（HTML + CSS + ES module JS）
- `bulk-data.json` — 排播表批次匯入用的 79 筆紀錄（YT × 40、FB × 39），透過 `fetch('./bulk-data.json')` 載入
- `index.html.bak` — 2026-05 改版前的舊版（深色螢光主題），保留參考

## 接 Firestore 時要改的地方
打開 `index.html`，搜尋 `// STORAGE_LAYER` 註解，整段換掉即可。其他 UI 邏輯不動。

## 接 YouTube API 時要改的地方
搜尋 `// API_FETCH_HOOK` 註解，那個函式目前回 null，把它換成 fetch YouTube Data API v3 的呼叫。

## 自動計算指標
- **CPM**（每千次觀看成本）= 預算 / 觀看數 × 1000
- **互動率** = (讚 + 留言 + 分享) / 觀看數 × 100%

## 給長官看的視角
- 列表預設按「互動率」排序（成效高的在上）
- 「週報總覽」分頁直接是一份可列印的週報：Masthead + 指標 + 趨勢 + Lead + 後 5 名 + 廠商表
- CSV 匯出 + `Ctrl+P` 列印（@media print 已調好版面）
