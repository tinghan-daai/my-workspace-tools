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

## 接 Firestore 時要改的地方
打開 `index.html`，搜尋 `// STORAGE_LAYER` 註解，整段換掉即可。其他 UI 邏輯不動。

## 接 YouTube API 時要改的地方
搜尋 `// API_FETCH_HOOK` 註解，那個函式目前回 null，把它換成 fetch YouTube Data API v3 的呼叫。

## 自動計算指標
- **CPM**（每千次觀看成本）= 預算 / 觀看數 × 1000
- **互動率** = (讚 + 留言 + 分享) / 觀看數 × 100%

## 給長官看的視角
- 列表預設按「互動率」排序（成效高的在上）
- 提供「匯出本月報表」按鈕（CSV / 列印）
