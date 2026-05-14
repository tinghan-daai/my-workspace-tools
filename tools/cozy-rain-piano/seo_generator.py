"""
SEO 元資料生成模組
優先用 Claude API（claude-haiku）動態生成；無 key 時 fallback 到本地模板
"""

import json
import random
from datetime import datetime

THEMES = [
    "Midnight Autumn Rain",
    "Winter Storm Lullaby",
    "Spring Shower Serenity",
    "Monsoon Evening Calm",
    "Foggy Mountain Dawn",
    "Gentle April Rainfall",
    "November Midnight Rain",
    "Cozy Rainy Afternoon",
    "Soft Summer Drizzle",
    "Tokyo Rainy Night",
]

BENEFITS = ["Sleep", "Study", "Focus", "Relax", "Meditation", "Deep Work"]

CLAUDE_PROMPT = """You are a YouTube SEO expert for sleep/relaxation music channels.

Generate metadata for a Cozy Rain Piano sleep video. Output ONLY valid JSON with these fields:
- title (string, max 100 chars)
- description (string, 300-400 words, natural language, includes timestamps)
- tags (array of exactly 20 strings)

Rules:
- Title must include: "Cozy Rain Piano", "8 Hours", and the theme
- Description must include chapter timestamps: 00:00, 2:00:00, 4:00:00, 6:00:00, 8:00:00
- Description keywords: cozy rain piano, sleep music, rain sounds for sleeping, relaxing piano, {benefit} music
- Tags: mix of exact match + long-tail. Must include: cozy rain piano, sleep music, rain sounds, relaxing piano music

Theme: {theme}
Primary use case: {benefit}
Month: {month}

Output JSON only, no markdown fences."""


def generate_seo(config: dict) -> dict:
    theme = random.choice(THEMES)
    benefit = random.choice(BENEFITS)
    month = datetime.now().strftime("%B %Y")

    api_key = config.get("claude", {}).get("api_key", "")
    if api_key:
        try:
            return _from_claude(api_key, theme, benefit, month)
        except Exception as e:
            print(f"   ⚠️  Claude API 失敗（{e}），改用本地模板")

    return _from_template(theme, benefit, month)


def _from_claude(api_key: str, theme: str, benefit: str, month: str) -> dict:
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    prompt = CLAUDE_PROMPT.format(theme=theme, benefit=benefit, month=month)

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    # 防止 Claude 偶爾加 markdown fence
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


def _from_template(theme: str, benefit: str, month: str) -> dict:
    title = f"Cozy Rain Piano 🌧️ 8 Hours | {theme} | {benefit} Music {month}"
    return {
        "title": title[:100],
        "description": (
            f"🌧️ {theme} — 8 Hours of Cozy Rain Piano for {benefit}\n\n"
            f"Let the gentle patter of rain and soft piano melodies carry you into deep, restful sleep. "
            f"This 8-hour sleep music video blends soothing piano with ambient rain sounds, "
            f"creating the perfect atmosphere for relaxation, study, or meditation.\n\n"
            f"⏱ Timestamps:\n"
            f"00:00 — Cozy Rain Piano Begins\n"
            f"2:00:00 — Midnight Calm\n"
            f"4:00:00 — Deep Sleep Phase\n"
            f"6:00:00 — Pre-Dawn Quiet\n"
            f"8:00:00 — Gentle Morning\n\n"
            f"🎵 Perfect for: sleep, study, focus, meditation, working from home, and relaxation.\n\n"
            f"✨ No ads in the first 30 minutes for uninterrupted sleep.\n\n"
            f"🔔 Subscribe for new cozy rain piano videos every day.\n\n"
            f"#CozyRainPiano #SleepMusic #RainSounds #RelaxingPiano #{benefit}Music"
        ),
        "tags": [
            "cozy rain piano", "sleep music", "rain sounds for sleeping",
            "relaxing piano music", f"{benefit.lower()} music",
            "8 hour sleep music", "rain and piano", "cozy music",
            "ambient piano", "sleep aid music", "study music piano",
            "focus music", "rain sounds", "peaceful piano",
            "cozy rain sounds", "sleeping music", "calming music",
            "meditation music piano", "white noise rain", "piano for sleep",
        ],
    }
