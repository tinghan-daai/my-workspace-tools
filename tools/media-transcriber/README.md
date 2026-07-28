# 影音逐字稿

將影片或聲音檔在瀏覽器本機轉成含時間碼與講者標示的逐字稿。
使用情境支援採訪、會議、簡報分享與影片字幕。

## 支援範圍

- Windows 10/11：最新版 Chrome、Edge
- macOS：最新版 Chrome
- MP4、MOV、MP3、M4A、WAV
- TXT、Markdown、Word、SRT及 JSON 專案備份

## 隱私

影音透過 `AudioContext` 在目前瀏覽器解碼，推論也在 Web Worker 內執行。
工具不提供影音上傳 API，不建立帳號或雲端逐字稿資料庫。首次使用會向
Hugging Face 下載公開模型，並由套件 CDN 取得執行元件；這些資源由
瀏覽器快取。

## 開發

```bash
npm install
npm run dev
npm run build
```

正式靜態檔輸出到 `site/`。工具入口 `index.html` 會導向
`site/app.html`，可直接由 GitHub Pages 提供。

## 模型

- 快速：`onnx-community/whisper-base_timestamped`（WASM q8）
- 標準：`onnx-community/whisper-small_timestamped`（WASM q8）
- 高準確：`onnx-community/whisper-large-v3-turbo`（WebGPU，encoder fp16 / decoder q4）
- 講者辨識：`diarization-js@0.1.0`

高準確模式在 WebGPU 不可用或模型載入失敗時，會自動降級為標準模式。
Large-v3 Turbo 的量化瀏覽器模型使用句段級時間碼；Base 與 Small 使用
逐字級時間碼。兩者皆可合併講者並匯出 SRT。
中文辨識結果會在瀏覽器內以 `opencc-js` 轉成臺灣繁體；載入既有的中文
專案時也會自動轉換，英文與日文專案不受影響。
音訊解碼後會先混合所有聲道、移除直流偏移並適度正規化音量。使用者輸入
的專有名詞會轉成 Whisper prompt IDs，實際參與辨識。
文字辨識與講者分析採依序執行，避免 ONNX Runtime Web 的工作階段衝突；
若講者分析仍失敗，已完成的文字會以單一講者保留，不會整份丟失。

講者辨識套件仍屬 alpha，因此已鎖定版本，所有講者標籤皆設計為可人工
改名、重新指派與合併。詳見 `THIRD_PARTY_NOTICES.md`。
