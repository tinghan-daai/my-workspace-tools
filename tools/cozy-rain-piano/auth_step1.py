"""Step 1: 產生授權網址"""
import json, sys
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow

BASE_DIR = Path(__file__).parent
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

with open(BASE_DIR / "config.json") as f:
    config = json.load(f)

client_secrets = BASE_DIR / config.get("youtube", {}).get("client_secrets_file", "client_secret.json")
flow = InstalledAppFlow.from_client_secrets_file(str(client_secrets), SCOPES)
flow.redirect_uri = "urn:ietf:wg:oauth:2.0:oob"
auth_url, _ = flow.authorization_url(prompt="consent", access_type="offline")

print(auth_url)
