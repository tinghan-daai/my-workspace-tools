"""
ffmpeg 影片合成模組

策略（省成本、快速）：
  Step A: 靜態圖 → 60 秒 Ken Burns clip（慢速推進 1.0→1.05）
  Step B: clip 循環 + 鋼琴 MP3 + 雨聲 MP3 混音 → 8 小時 1080p MP4
"""

import random
import shutil
import subprocess
from pathlib import Path


def build_video(image_path: Path, config: dict, output_path: Path):
    _check_ffmpeg()

    video_cfg = config.get("video", {})
    duration_hours = video_cfg.get("duration_hours", 8)
    duration_sec = duration_hours * 3600
    rain_volume = video_cfg.get("rain_volume", 0.4)

    piano_path, rain_path = _pick_audio(Path(__file__).parent / "music")

    temp_clip = output_path.parent / f"_tmp_{output_path.stem}.mp4"
    try:
        print("   🎞  Step A: Ken Burns clip (60s)...")
        _make_ken_burns_clip(image_path, temp_clip)

        print(f"   🎞  Step B: Looping to {duration_hours}h + mixing audio...")
        _assemble(temp_clip, piano_path, rain_path, output_path, duration_sec, rain_volume)
    finally:
        if temp_clip.exists():
            temp_clip.unlink()


def _check_ffmpeg():
    if not shutil.which("ffmpeg"):
        raise RuntimeError(
            "❌ ffmpeg 未安裝。請執行：brew install ffmpeg"
        )


def _pick_audio(music_dir: Path):
    piano_files = list((music_dir / "piano").glob("*.mp3")) + list((music_dir / "piano").glob("*.wav"))
    rain_files = list((music_dir / "rain").glob("*.mp3")) + list((music_dir / "rain").glob("*.wav"))

    if not piano_files:
        raise FileNotFoundError(
            "❌ music/piano/ 裡沒有音樂檔！\n"
            "   請放入 CC0 鋼琴 MP3（建議長度 ≥ 3 分鐘）"
        )
    if not rain_files:
        raise FileNotFoundError(
            "❌ music/rain/ 裡沒有音樂檔！\n"
            "   請放入 CC0 雨聲 MP3（建議長度 ≥ 3 分鐘）"
        )

    return random.choice(piano_files), random.choice(rain_files)


def _make_ken_burns_clip(image_path: Path, output_path: Path, duration: int = 60):
    fps = 24
    total_frames = duration * fps
    # 60 秒內從 1.0 慢慢推進到 1.05（非常細微，幾乎看不出重置）
    zoom_step = round(0.05 / total_frames, 8)

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", str(image_path),
        "-vf", (
            f"scale=3840:2160,"
            f"zoompan="
            f"z='min(zoom+{zoom_step},1.05)':"
            f"d={total_frames}:"
            f"s=1920x1080:"
            f"fps={fps},"
            f"format=yuv420p"
        ),
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-an",
        str(output_path),
    ]
    _run(cmd, "Ken Burns clip")


def _assemble(
    clip_path: Path,
    piano_path: Path,
    rain_path: Path,
    output_path: Path,
    duration_sec: int,
    rain_volume: float,
):
    # 影片用 stream_loop + copy（不重新編碼），音訊用 aloop 無限循環後 amix
    cmd = [
        "ffmpeg", "-y",
        "-stream_loop", "-1", "-i", str(clip_path),
        "-stream_loop", "-1", "-i", str(piano_path),
        "-stream_loop", "-1", "-i", str(rain_path),
        "-filter_complex",
        (
            f"[1:a]volume=1.0[piano];"
            f"[2:a]volume={rain_volume}[rain];"
            f"[piano][rain]amix=inputs=2:duration=first:dropout_transition=2[a]"
        ),
        "-map", "0:v",
        "-map", "[a]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-t", str(duration_sec),
        str(output_path),
    ]
    _run(cmd, f"{duration_sec // 3600}h assembly")


def _run(cmd: list, label: str):
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg [{label}] failed:\n{result.stderr[-2000:]}")
