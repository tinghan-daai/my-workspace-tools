#!/bin/bash
# 每日排程入口（被 crontab 呼叫）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
source venv/bin/activate
python pipeline.py
