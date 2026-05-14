"""
YouTube Data API v3 上傳模組

首次使用需要 OAuth 授權：
  python uploader.py --auth

之後 token 會快取在 youtube_token.json，自動刷新。
"""

import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent
TOKEN_FILE = BASE_DIR / "youtube_token.json"
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def upload_video(video_path: Path, seo: dict, config: dict) -> str:
    """上傳影片到 YouTube，回傳 video ID"""
    creds = _get_credentials(config)

    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    youtube = build("youtube", "v3", credentials=creds)
    yt_cfg = config.get("youtube", {})

    body = {
        "snippet": {
            "title": seo["title"],
            "description": seo["description"],
            "tags": seo["tags"],
            "categoryId": "10",  # Music
            "defaultLanguage": "en",
        },
        "status": {
            "privacyStatus": yt_cfg.get("privacy", "public"),
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(
        str(video_path),
        mimetype="video/mp4",
        resumable=True,
        chunksize=50 * 1024 * 1024,
    )

    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            pct = int(status.progress() * 100)
            print(f"   Upload: {pct}%", end="\r")
    print()

    video_id = response["id"]

    # 加入播放清單（如果有設定）
    playlist_id = yt_cfg.get("playlist_id", "")
    if playlist_id:
        youtube.playlistItems().insert(
            part="snippet",
            body={
                "snippet": {
                    "playlistId": playlist_id,
                    "resourceId": {"kind": "youtube#video", "videoId": video_id},
                }
            },
        ).execute()
        print(f"   Added to playlist {playlist_id}")

    return video_id


def _get_credentials(config: dict):
    try:
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.auth.transport.requests import Request
    except ImportError:
        print("❌ 缺少 Google 套件，請執行：pip install -r requirements.txt")
        sys.exit(1)

    client_secrets_file = BASE_DIR / config.get("youtube", {}).get("client_secrets_file", "client_secret.json")

    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not client_secrets_file.exists():
                print(
                    f"\n❌ OAuth 憑證檔案未找到：{client_secrets_file}\n"
                    "   請依照 setup.sh 輸出的說明申請 Google Cloud OAuth 憑證\n"
                    "   或執行：python uploader.py --auth"
                )
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(str(client_secrets_file), SCOPES)
            creds = flow.run_local_server(port=8080)

        TOKEN_FILE.write_text(creds.to_json())

    return creds


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--auth", action="store_true", help="執行 OAuth 授權流程")
    args = parser.parse_args()

    if args.auth:
        config_path = BASE_DIR / "config.json"
        if not config_path.exists():
            print("❌ 請先建立 config.json（cp config.example.json config.json）")
            sys.exit(1)
        with open(config_path) as f:
            config = json.load(f)
        _get_credentials(config)
        print("✅ 授權成功！Token 已儲存至 youtube_token.json")
