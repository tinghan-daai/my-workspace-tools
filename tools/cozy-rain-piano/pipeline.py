"""
Cozy Rain Piano — Daily YouTube Pipeline
每天自動跑一次，生成 8 小時睡眠音樂影片並上傳 YouTube
"""

import json
import sys
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).parent
CONFIG_FILE = BASE_DIR / "config.json"
LOG_FILE = BASE_DIR / "upload_log.json"
OUTPUT_DIR = BASE_DIR / "output"
ASSETS_DIR = BASE_DIR / "assets"


def load_config() -> dict:
    if not CONFIG_FILE.exists():
        print("❌ config.json not found.")
        print("   cp config.example.json config.json  # then fill in your keys")
        sys.exit(1)
    with open(CONFIG_FILE) as f:
        return json.load(f)


def log_entry(entry: dict):
    log = []
    if LOG_FILE.exists():
        with open(LOG_FILE) as f:
            log = json.load(f)
    log.append(entry)
    with open(LOG_FILE, "w") as f:
        json.dump(log, f, indent=2, ensure_ascii=False)


def main(dry_run: bool = False):
    print(f"🎵 Cozy Rain Piano Pipeline — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    if dry_run:
        print("   [DRY RUN: skipping video generation and upload]")

    config = load_config()
    OUTPUT_DIR.mkdir(exist_ok=True)
    ASSETS_DIR.mkdir(exist_ok=True)

    # Step 1: Image
    print("\n📸 Step 1: Getting scene image...")
    from image_source import get_image
    image_path = get_image(config, ASSETS_DIR)
    print(f"   → {image_path.name}")

    # Step 2: SEO metadata
    print("\n✍️  Step 2: Generating SEO metadata...")
    from seo_generator import generate_seo
    seo = generate_seo(config)
    print(f"   Title : {seo['title']}")
    print(f"   Tags  : {', '.join(seo['tags'][:5])} ...")

    if dry_run:
        print("\n✅ Dry run complete. No video generated.")
        return

    # Step 3: Build video
    print("\n🎬 Step 3: Building 8-hour video (ffmpeg)...")
    from video_builder import build_video
    date_str = datetime.now().strftime("%Y%m%d_%H%M")
    output_path = OUTPUT_DIR / f"cozy-rain-{date_str}.mp4"
    build_video(image_path, config, output_path)
    size_mb = output_path.stat().st_size / 1024 / 1024
    print(f"   → {output_path.name} ({size_mb:.0f} MB)")

    # Step 4: Upload
    video_id = None
    if config.get("youtube", {}).get("enabled"):
        print("\n📤 Step 4: Uploading to YouTube...")
        from uploader import upload_video
        video_id = upload_video(output_path, seo, config)
        print(f"   → https://youtu.be/{video_id}")
    else:
        print("\n⏭️  Step 4: YouTube upload disabled in config (set youtube.enabled=true to enable)")

    log_entry({
        "date": datetime.now().isoformat(),
        "image": str(image_path),
        "output": str(output_path),
        "size_mb": round(size_mb, 1),
        "title": seo["title"],
        "video_id": video_id,
        "youtube_url": f"https://youtu.be/{video_id}" if video_id else None,
    })

    print("\n✅ Done! See upload_log.json for history.")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Cozy Rain Piano daily pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Skip video generation and upload")
    args = parser.parse_args()
    main(dry_run=args.dry_run)
