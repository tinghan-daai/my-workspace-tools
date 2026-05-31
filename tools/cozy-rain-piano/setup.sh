#!/bin/bash
# Cozy Rain Piano — 一次性初始化腳本
# 執行：bash setup.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🎵 Cozy Rain Piano — 初始化"
echo "================================"

# 1. 檢查 ffmpeg
echo ""
echo "1️⃣  檢查 ffmpeg..."
if ! command -v ffmpeg &>/dev/null; then
  echo "   ❌ ffmpeg 未安裝。執行：brew install ffmpeg"
  exit 1
fi
echo "   ✅ ffmpeg $(ffmpeg -version 2>&1 | head -1 | cut -d' ' -f3)"

# 2. 建立虛擬環境
echo ""
echo "2️⃣  建立 Python 虛擬環境..."
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "   ✅ venv 建立完成"
else
  echo "   ✅ venv 已存在"
fi

# 3. 安裝套件
echo ""
echo "3️⃣  安裝 Python 套件..."
venv/bin/pip install -q --upgrade pip
venv/bin/pip install -q -r requirements.txt
echo "   ✅ 套件安裝完成"

# 4. 建立 config.json
echo ""
echo "4️⃣  設定檔..."
if [ ! -f "config.json" ]; then
  cp config.example.json config.json
  echo "   ✅ config.json 已建立（請填入你的 API key）"
else
  echo "   ✅ config.json 已存在"
fi

# 5. 確認目錄結構
mkdir -p assets/images music/piano music/rain output
echo ""
echo "5️⃣  目錄結構確認 ✅"

# 6. 提示用戶下一步
echo ""
echo "================================"
echo "✅ 初始化完成！接下來："
echo ""
echo "   【必做】加入音樂素材（CC0 授權）："
echo "   music/piano/  ← 放鋼琴 MP3（建議：pixabay.com 搜 'piano'）"
echo "   music/rain/   ← 放雨聲 MP3（建議：pixabay.com 搜 'rain ambience'）"
echo ""
echo "   【必做】加入場景圖："
echo "   assets/images/ ← 放 CC0 臥室雨景圖（.jpg / .png）"
echo "   推薦來源：pixabay.com 搜 'cozy bedroom rain'"
echo ""
echo "   【選填】YouTube 自動上傳設定："
echo "   1. 到 https://console.cloud.google.com/ 建立專案"
echo "   2. 啟用 YouTube Data API v3"
echo "   3. 建立 OAuth 2.0 憑證（桌面應用程式類型）"
echo "   4. 下載 client_secret.json 放入此資料夾"
echo "   5. 執行：venv/bin/python uploader.py --auth"
echo "   6. 在 config.json 設定 youtube.enabled = true"
echo ""
echo "   【測試】先跑 dry run 確認沒問題："
echo "   venv/bin/python pipeline.py --dry-run"
echo ""
echo "   【正式跑】生成 8 小時影片："
echo "   venv/bin/python pipeline.py"
echo ""
echo "   【排程】每天早上 8:00 自動跑（加到 crontab）："
echo "   crontab -e"
echo "   加入這行（記得換成你的實際路徑）："
ESCAPED_DIR=$(echo "$SCRIPT_DIR" | sed 's/ /\\ /g')
echo "   0 8 * * * $ESCAPED_DIR/run.sh >> $ESCAPED_DIR/pipeline.log 2>&1"
