"""
CC0 圖像來源模組
支援兩種模式：
  local   — 從 assets/images/ 隨機挑一張（預設）
  unsplash — 從 Unsplash API 下載（需 API key）
"""

import random
import requests
from pathlib import Path

UNSPLASH_QUERIES = [
    "cozy bedroom rain window",
    "japanese room rainy night",
    "cozy interior autumn rain",
    "warm bedroom lamp rainy",
    "misty window cozy room",
]


def get_image(config: dict, assets_dir: Path) -> Path:
    mode = config.get("image_source", {}).get("mode", "local")
    if mode == "unsplash":
        return _from_unsplash(config, assets_dir)
    return _from_local(assets_dir)


def _from_local(assets_dir: Path) -> Path:
    images_dir = assets_dir / "images"
    images_dir.mkdir(exist_ok=True)
    images = list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.png")) + list(images_dir.glob("*.jpeg"))
    if not images:
        raise FileNotFoundError(
            f"\n❌ assets/images/ 裡沒有圖片！\n"
            "   請從 Pixabay / Unsplash 下載 CC0 臥室雨景圖（.jpg/.png）\n"
            "   放入：tools/cozy-rain-piano/assets/images/\n"
            "   或改用 Unsplash API 模式（設定 image_source.mode = 'unsplash'）"
        )
    return random.choice(images)


def _from_unsplash(config: dict, assets_dir: Path) -> Path:
    access_key = config.get("image_source", {}).get("unsplash_access_key", "")
    if not access_key:
        raise ValueError("❌ 請在 config.json 填入 image_source.unsplash_access_key")

    query = random.choice(UNSPLASH_QUERIES)
    resp = requests.get(
        "https://api.unsplash.com/photos/random",
        params={"query": query, "orientation": "landscape", "content_filter": "high"},
        headers={"Authorization": f"Client-ID {access_key}"},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    photo_id = data["id"]
    output_path = assets_dir / f"unsplash_{photo_id}.jpg"

    if not output_path.exists():
        img = requests.get(data["urls"]["full"], timeout=60)
        img.raise_for_status()
        output_path.write_bytes(img.content)
        # Unsplash 規定必須 trigger download event
        requests.get(data["links"]["download_location"], headers={"Authorization": f"Client-ID {access_key}"}, timeout=10)

    return output_path
