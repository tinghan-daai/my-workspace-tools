@echo off
echo 啟動 open-design...
cd /d "C:\open-design"
start "" http://127.0.0.1:3010
pnpm tools-dev run web --web-port 3010 --daemon-port 3011
