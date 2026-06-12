# -*- coding: utf-8 -*-
import asyncio, os, sys
os.environ.setdefault("PYTHONUTF8", "1")
import edge_tts

VOICE = "zh-TW-HsiaoChenNeural"
SCRIPT = [
    ("p1", "當台灣遇見日本，長照的未來，在這裡展開。"),
    ("p2", "2026 臺中長照台日論壇，七月三日，裕元花園酒店，一整天的國際交流。"),
    ("p3", "跨域共融，智啟長照新時代。來自台日兩地的頂尖專家，分享長照三點零政策、科學化照護、成功老化的最新實踐。"),
    ("p4", "衛生福利部石崇良部長、日本大浦智子教授、和田秀樹醫師，以及多位兩岸長照領域先驅。"),
    ("p5", "由臺中市政府衛生局主辦，臺中慈濟醫院承辦，聚焦高齡照護的每一個細節。"),
    ("p6", "名額有限，立即掃描 QR Code 完成報名，或前往官方網站了解更多。"),
    ("p7", "2026 臺中長照台日論壇，等你來。"),
]

async def main():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
    os.makedirs(out, exist_ok=True)
    for name, text in SCRIPT:
        path = os.path.join(out, f"{name}.mp3")
        tts = edge_tts.Communicate(text, VOICE)
        await tts.save(path)
        print(f"✅ {path}")

asyncio.run(main())
