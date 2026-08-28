# AI 聲音實驗室

串接 [Fish Audio](https://fish.audio/) S2.1 Pro 的聲音克隆 + 文字轉語音工具。上傳約 10 秒的個人聲音樣本，或直接挑一個內建聲線，就能把中文台詞或英文文章生成對應的口播音檔。

## 為什麼有一個 `server.js`？

Fish Audio 的 `/v1/tts`、`/model` 這兩個端點目前**不支援瀏覽器直接跨網域呼叫**（CORS preflight 會回 404），所以不能像 `video-to-audio`、`file-to-md` 那樣做成純前端工具。這裡用一個很薄的 Node/Express 代理程式：

- 前端把 API Key 存在自己瀏覽器的 `localStorage`（打勾「記住」才會存）
- 每次呼叫時透過 `X-Fish-Key` header 帶給這個本地 server
- server 直接轉發給 Fish Audio，不落地、不記錄任何 Key

## 安裝與啟動

```bash
cd tools/ai-voice-lab
npm install
npm start
```

啟動後開瀏覽器到 [http://localhost:8787](http://localhost:8787)。

## 使用流程

1. 到 [fish.audio/app/api-keys](https://fish.audio/app/api-keys/) 免費申請 API Key，貼到畫面右上角
2. 左側「克隆我的聲音」上傳一段乾淨的 10 秒人聲樣本並建立聲線，或切到「內建聲線庫」搜尋現成聲線
3. 右側貼上台詞或文章，可插入 `[happy]` `[whispering]` 等情緒／語氣標籤，調整語速
4. 按「生成語音」，完成後可直接試聽或下載

## 檔案結構

- `server.js` — Express 代理伺服器（`/api/voices`、`/api/clone`、`/api/tts`）
- `public/index.html` `public/style.css` `public/app.js` — 純前端介面

## 部署備註

因為需要一個常駐的 Node 後端來轉發 API 請求，這個工具**不適合**用純靜態的 Firebase Hosting / GitHub Pages 部署；要放上雲端的話，需要 Cloud Run、Firebase Functions 之類支援 Node runtime 的環境。日常使用建議直接在本機跑 `npm start`。
