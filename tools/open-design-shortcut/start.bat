@echo off
echo 啟動 open-design...
cd /d "G:\我的雲端硬碟\open-design"
start "" http://localhost:3010
pnpm tools-dev run web
