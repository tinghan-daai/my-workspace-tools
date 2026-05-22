# 供應鏈攻擊安全檢查

這是一份用來檢查 2026 年 3 到 5 月 npm / PyPI 供應鏈攻擊的提示詞與檢查清單。  
可將下方提示詞貼到 AI coding assistant，例如 Claude Code、Cursor、Copilot 等工具，請它協助檢查本機與專案是否受影響。

> 注意：AI coding assistant 的實際檢查能力會受限於當下權限。全磁碟搜尋、DNS 快取、系統日誌、套件管理器快取可能無法完整讀取；若是高風險環境，仍建議再用正式資安工具或 EDR 交叉驗證。

## 目標攻擊

| 攻擊 | 套件 | 平台 | 暴露時間 |
|------|------|------|----------|
| [axios 供應鏈攻擊](https://www.stepsecurity.io/blog/axios-compromised-on-npm-malicious-versions-drop-remote-access-trojan) | axios | npm | 約 2 到 3 小時 |
| [litellm / telnyx 供應鏈攻擊](https://blog.pypi.org/posts/2026-04-02-incident-report-litellm-telnyx-supply-chain-attack/) | litellm, telnyx | PyPI | 約 2 小時 32 分 |
| [TanStack 供應鏈攻擊](https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx) | @tanstack/* 多個套件 | npm | 約 6 分鐘 |

## 檢查提示詞

````text
請檢查我的電腦與目前專案是否受到以下 3 件 npm / PyPI 供應鏈攻擊影響。請先判斷作業系統，再只執行適合目前系統的檢查項目。所有檢查以唯讀為主，不要刪除檔案、不要修改設定、不要更換 token，除非我另外明確同意。

## 1. axios npm 供應鏈攻擊 — 2026-03-31 UTC

- 惡意版本：axios@1.14.1、axios@0.30.4
- 惡意相依套件：plain-crypto-js，正常 axios 不應該包含這個相依套件
- 惡意落地檔：
  - Windows：%PROGRAMDATA%\wt.exe
  - macOS：/Library/Caches/com.apple.act.mond
  - Linux：/tmp/ld.py
- C2 網域：sfrclak.com
- 參考：https://www.stepsecurity.io/blog/axios-compromised-on-npm-malicious-versions-drop-remote-access-trojan

## 2. litellm / telnyx PyPI 供應鏈攻擊 — 2026-04-02

- 惡意版本：
  - litellm==1.82.7
  - litellm==1.82.8
  - telnyx==4.87.1
  - telnyx==4.87.2
- 惡意檔案：litellm_init.pth
- 風險：.pth 檔可能在 Python 啟動時自動執行，竊取環境變數與憑證
- 參考：
  - https://blog.pypi.org/posts/2026-04-02-incident-report-litellm-telnyx-supply-chain-attack/
  - https://osv.dev/vulnerability/PYSEC-2026-2
  - https://osv.dev/vulnerability/PYSEC-2026-3

## 3. TanStack npm 供應鏈攻擊 — 2026-05-11 19:20 到 19:26 UTC

- 惡意發布時間：約 2026-05-11 19:20 到 19:26 UTC
- 影響範圍：多個 @tanstack/* 套件版本，請以 GitHub Advisory GHSA-g7cv-rxg3-hmpx 的 affected package / affected version 清單為準
- 初步分流：
  - @tanstack/react-router、@tanstack/router 等 router 相關套件優先列為高關注
  - @tanstack/query*、@tanstack/table*、@tanstack/form*、@tanstack/virtual*、@tanstack/store 通常不是本次主要影響群，但仍需以 lockfile 與 advisory 對照確認
- 核心 IOC：套件根目錄中的 router_init.js，約 2.3 MB，package.json 的 files 欄位可能沒有列出，需檢查實際 tarball 或 node_modules
- 可疑相依訊號：package.json 內出現以下 optionalDependencies 或 commit hash：
  - "@tanstack/setup": "github:tanstack/router#79ac49eedf774dd4b0cfa308722bc463cfe5885c"
  - 79ac49eedf774dd4b0cfa308722bc463cfe5885c
- 第二階段 payload URL：
  - litter.catbox.moe/h8nc9u.js
  - litter.catbox.moe/7rrc6l.mjs
- 可能外洩網路端點：
  - filev2.getsession.org
  - seed1.getsession.org
  - seed2.getsession.org
  - seed3.getsession.org
- 可能竊取內容：AWS IMDS / Secrets Manager、GCP metadata、Kubernetes / Vault token、~/.npmrc、GitHub token、gh CLI 憑證、.git-credentials、SSH private key 等
- 參考：https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx

## 檢查方法

### npm：axios

1. 搜尋目前專案、常用工作資料夾、全域 npm 套件中是否安裝 axios。
2. 檢查 package.json、package-lock.json、yarn.lock、pnpm-lock.yaml、npm-shrinkwrap.json 是否出現 axios@1.14.1 或 axios@0.30.4。
3. 搜尋是否存在 plain-crypto-js 套件目錄或 lockfile 參照。
4. 依作業系統檢查惡意落地檔是否存在：
   - macOS：/Library/Caches/com.apple.act.mond
   - Linux：/tmp/ld.py
   - Windows：%PROGRAMDATA%\wt.exe
5. 可行時，檢查 shell history、DNS 快取或系統日誌中是否出現 sfrclak.com。

### PyPI：litellm / telnyx

1. 檢查 pip、pip3、pipx、conda、poetry、uv 等環境是否安裝 litellm 或 telnyx。
2. 檢查所有 Python 虛擬環境與 site-packages，確認是否有：
   - litellm==1.82.7
   - litellm==1.82.8
   - telnyx==4.87.1
   - telnyx==4.87.2
3. 搜尋 site-packages 內所有 .pth 檔，特別確認是否有 litellm_init.pth。
4. 若找到 litellm 或 telnyx，檢查 dist-info/METADATA 與安裝時間，判斷是否接近 2026-04-02 攻擊時段。
5. 可行時，檢查 shell history 或系統日誌是否有異常 Python package 安裝紀錄。

### npm：TanStack

1. 搜尋 package.json、package-lock.json、yarn.lock、pnpm-lock.yaml、npm-shrinkwrap.json 中所有 @tanstack/ 參照。
2. 將找到的套件與 GitHub Advisory GHSA-g7cv-rxg3-hmpx 的 affected package / affected version 對照。
3. 對 router 相關套件，例如 @tanstack/react-router、@tanstack/router，檢查安裝或 lockfile 更新時間是否接近 2026-05-11 19:20 到 19:26 UTC 之後。
4. 搜尋整台電腦或至少常用專案資料夾中是否存在 router_init.js。
5. 搜尋 package.json、lockfile、node_modules 是否出現 @tanstack/setup 或 commit hash：79ac49eedf774dd4b0cfa308722bc463cfe5885c。
6. 檢查 npm / yarn / pnpm 快取中是否有 @tanstack tarball；若可行，解包確認是否含 router_init.js。
7. 檢查 shell history、系統日誌或可讀取的網路紀錄中是否出現：
   - litter.catbox.moe
   - filev2.getsession.org
   - seed1.getsession.org
   - seed2.getsession.org
   - seed3.getsession.org
8. 不要只用套件名稱模式判斷安全；最後必須同時參考 affected versions、lockfile、安裝時間與 IOC。

## 輸出格式

請用繁體中文輸出，並用表格整理：

| 類別 | 檢查項目 | 結果 | 判斷 | 備註 |
|------|----------|------|------|------|

判斷請使用：安全、未命中、需人工確認、可疑、危險。

如果有可疑或危險項目，請另外列出立即處理建議，包含：

1. 暫停使用受影響專案或環境。
2. 保留證據，不要先刪除所有檔案。
3. 移除受影響套件與清除套件快取。
4. 重新安裝乾淨版本。
5. 輪替可能外洩的憑證，例如 npm token、GitHub token、SSH key、雲端 API key、.npmrc、gh CLI token、雲端服務憑證。
6. 若涉及公司或正式環境，通知資安或 IT 管理人員。
````

## 使用方式

1. 複製上方「檢查提示詞」整段內容。
2. 貼到 Claude Code、Cursor、Copilot 或其他 AI coding assistant。
3. 要求工具只做唯讀檢查，先回報結果，不要自動刪除或修改檔案。
4. 若工具需要讀取全磁碟、系統日誌或套件快取，請先確認你是否願意授權。
5. 若出現危險或可疑項目，再依照建議處理與輪替憑證。

## 判讀提醒

- 沒有找到 IOC 不代表 100% 沒有風險，只代表目前權限與掃描範圍內沒有命中。
- lockfile 比 package.json 更重要，因為 package.json 可能只寫版本範圍。
- node_modules、npm / yarn / pnpm 快取、pip / conda / uv / pipx 環境都可能留下線索。
- TanStack 事件應以 GitHub Advisory 的 affected versions 為準，不要只靠套件名稱粗略判斷。
- 若曾在攻擊時間附近安裝過可疑版本，應優先輪替憑證，而不是只更新套件。

## 參考資料

- axios：<https://www.stepsecurity.io/blog/axios-compromised-on-npm-malicious-versions-drop-remote-access-trojan>
- PyPI 官方事件報告：<https://blog.pypi.org/posts/2026-04-02-incident-report-litellm-telnyx-supply-chain-attack/>
- litellm OSV：<https://osv.dev/vulnerability/PYSEC-2026-2>
- telnyx OSV：<https://osv.dev/vulnerability/PYSEC-2026-3>
- TanStack Advisory：<https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx>
