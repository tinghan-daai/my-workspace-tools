// AI 聲音實驗室 — 後端代理
//
// 為什麼需要這個小後端？
// Fish Audio 的 /v1/tts 與 /model 端點沒有開放瀏覽器直接呼叫所需的 CORS
// preflight（OPTIONS 會回 404），所以 API Key 與請求都必須經過這個
// server 轉發，前端本身完全不儲存任何 Fish Audio 的機密資料。
// API Key 只會存在使用者瀏覽器的 localStorage，每次請求透過
// `X-Fish-Key` header 帶過來，這個 server 不落地、不記錄它。

const path = require('path');
const { Readable } = require('stream');
const express = require('express');
const multer = require('multer');

const FISH_API_BASE = 'https://api.fish.audio';
const PORT = process.env.PORT || 8787;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB 上限，10 秒人聲樣本綽綽有餘
});

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function requireKey(req) {
  const key = req.header('x-fish-key');
  if (!key) {
    const err = new Error('缺少 Fish Audio API Key，請先在畫面上方填入');
    err.status = 401;
    throw err;
  }
  return key;
}

async function forwardJsonError(r, res) {
  const text = await r.text();
  let message = text;
  try {
    message = JSON.parse(text).message || message;
  } catch {
    /* 保留原始文字 */
  }
  res.status(r.status).json({ message });
}

// 列出聲線：self=true 是自己複製過的聲線，self=false 是公開聲線庫
app.get('/api/voices', async (req, res) => {
  try {
    const key = requireKey(req);
    const { self = 'true', title = '', page_size = '24', page_number = '1' } = req.query;

    const url = new URL(`${FISH_API_BASE}/model`);
    url.searchParams.set('self', self);
    url.searchParams.set('page_size', page_size);
    url.searchParams.set('page_number', page_number);
    if (title) url.searchParams.set('title', title);

    const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!r.ok) return forwardJsonError(r, res);
    res.json(await r.json());
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// 上傳約 10 秒人聲樣本，建立克隆聲線
app.post('/api/clone', upload.single('voice'), async (req, res) => {
  try {
    const key = requireKey(req);
    if (!req.file) {
      return res.status(400).json({ message: '請上傳一段音訊樣本' });
    }

    const title = (req.body.title || '').trim() || `我的聲線 ${new Date().toLocaleString('zh-TW')}`;

    const form = new FormData();
    form.append('type', 'tts');
    form.append('title', title);
    form.append('train_mode', 'fast');
    form.append('visibility', 'private');
    form.append('enhance_audio_quality', 'true');
    form.append(
      'voices',
      new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/wav' }),
      req.file.originalname || 'sample.wav'
    );

    const r = await fetch(`${FISH_API_BASE}/model`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!r.ok) return forwardJsonError(r, res);
    res.status(r.status).json(await r.json());
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// 文字／文章 → 語音
app.post('/api/tts', async (req, res) => {
  try {
    const key = requireKey(req);
    const {
      text,
      referenceId,
      format = 'mp3',
      temperature = 0.7,
      topP = 0.7,
      speed = 1,
      model = 's2.1-pro-free',
    } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ message: '請輸入要合成的文字' });
    }
    if (!referenceId) {
      return res.status(400).json({ message: '請先選擇或克隆一個聲線' });
    }

    const payload = {
      text,
      reference_id: referenceId,
      format,
      temperature: Number(temperature),
      top_p: Number(topP),
      normalize: true,
      prosody: { speed: Number(speed) || 1 },
    };

    const r = await fetch(`${FISH_API_BASE}/v1/tts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        model,
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok || !r.body) return forwardJsonError(r, res);

    const mime = format === 'wav' ? 'audio/wav' : format === 'opus' ? 'audio/ogg' : format === 'pcm' ? 'audio/L16' : 'audio/mpeg';
    res.setHeader('Content-Type', mime);
    Readable.fromWeb(r.body).pipe(res);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`AI 聲音實驗室已啟動 → http://localhost:${PORT}`);
});
