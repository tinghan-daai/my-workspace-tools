// AI 聲音實驗室 — 前端邏輯（純瀏覽器，呼叫同源的 /api/* 代理）
(() => {
  const $ = (sel) => document.querySelector(sel);

  const el = {
    apiKey: $('#apiKey'),
    toggleKey: $('#toggleKey'),
    rememberKey: $('#rememberKey'),
    banner: $('#banner'),

    tabBtns: document.querySelectorAll('.tab-btn'),
    panels: document.querySelectorAll('.tab-panel'),

    voiceFile: $('#voiceFile'),
    fileName: $('#fileName'),
    cloneTitle: $('#cloneTitle'),
    cloneBtn: $('#cloneBtn'),
    refreshMine: $('#refreshMine'),
    myVoices: $('#myVoices'),

    librarySearch: $('#librarySearch'),
    searchBtn: $('#searchBtn'),
    libraryVoices: $('#libraryVoices'),

    selectedVoiceLabel: $('#selectedVoiceLabel'),

    ttsText: $('#ttsText'),
    charCount: $('#charCount'),
    emotionSelect: $('#emotionSelect'),
    insertTagBtn: $('#insertTagBtn'),

    speed: $('#speed'),
    speedVal: $('#speedVal'),
    format: $('#format'),
    temperature: $('#temperature'),
    tempVal: $('#tempVal'),
    topP: $('#topP'),
    topPVal: $('#topPVal'),

    generateBtn: $('#generateBtn'),
    generateLabel: $('#generateLabel'),
    player: $('#player'),
    audioEl: $('#audioEl'),
    downloadLink: $('#downloadLink'),
  };

  const state = {
    selectedVoiceId: null,
    selectedVoiceTitle: null,
  };

  // ---------- API Key ----------
  const savedKey = localStorage.getItem('fishApiKey');
  if (savedKey) {
    el.apiKey.value = savedKey;
    el.rememberKey.checked = true;
  }
  el.apiKey.addEventListener('input', () => {
    if (el.rememberKey.checked) localStorage.setItem('fishApiKey', el.apiKey.value);
  });
  el.rememberKey.addEventListener('change', () => {
    if (el.rememberKey.checked) localStorage.setItem('fishApiKey', el.apiKey.value);
    else localStorage.removeItem('fishApiKey');
  });
  el.toggleKey.addEventListener('click', () => {
    el.apiKey.type = el.apiKey.type === 'password' ? 'text' : 'password';
  });

  function getKey() {
    return el.apiKey.value.trim();
  }

  function showBanner(message, kind = 'error') {
    el.banner.textContent = message;
    el.banner.className = `banner ${kind === 'info' ? 'info' : ''}`;
    el.banner.classList.remove('hidden');
  }
  function hideBanner() {
    el.banner.classList.add('hidden');
  }

  function requireKeyOrWarn() {
    const key = getKey();
    if (!key) {
      showBanner('請先在右上角填入 Fish Audio API Key。');
      return null;
    }
    return key;
  }

  // ---------- Tabs ----------
  el.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      el.tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      el.panels.forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== target));
      if (target === 'library' && !el.libraryVoices.dataset.loaded) {
        loadVoices({ self: false });
      }
    });
  });

  // ---------- 聲線清單 ----------
  function renderVoiceList(container, voices, emptyMsg) {
    container.innerHTML = '';
    if (!voices || voices.length === 0) {
      container.innerHTML = `<div class="empty-note">${emptyMsg}</div>`;
      return;
    }
    voices.forEach((v) => {
      const id = v._id || v.id;
      const item = document.createElement('div');
      item.className = 'voice-item' + (state.selectedVoiceId === id ? ' selected' : '');
      item.innerHTML = `<span class="vt">${escapeHtml(v.title || '未命名聲線')}</span><span class="vs">${escapeHtml((v.languages || []).join('/') || v.state || '')}</span>`;
      item.addEventListener('click', () => selectVoice(id, v.title || '未命名聲線'));
      container.appendChild(item);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function selectVoice(id, title) {
    state.selectedVoiceId = id;
    state.selectedVoiceTitle = title;
    el.selectedVoiceLabel.textContent = title;
    document.querySelectorAll('.voice-item').forEach((n) => n.classList.remove('selected'));
    document.querySelectorAll('.voice-item').forEach((n) => {
      if (n.querySelector('.vt')?.textContent === title) n.classList.add('selected');
    });
    hideBanner();
  }

  async function loadVoices({ self, title = '' } = {}) {
    const key = requireKeyOrWarn();
    if (!key) return;
    const container = self ? el.myVoices : el.libraryVoices;
    container.innerHTML = '<div class="empty-note">載入中…</div>';
    try {
      const params = new URLSearchParams({ self: String(self), title, page_size: '24' });
      const r = await fetch(`/api/voices?${params}`, { headers: { 'X-Fish-Key': key } });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || '載入聲線失敗');
      renderVoiceList(container, data.items, self ? '目前還沒有克隆過的聲線，先到左側上傳樣本建立一個吧。' : '沒有符合的聲線，換個關鍵字試試。');
      if (!self) container.dataset.loaded = '1';
    } catch (err) {
      container.innerHTML = `<div class="empty-note">${escapeHtml(err.message)}</div>`;
    }
  }

  el.refreshMine.addEventListener('click', () => loadVoices({ self: true }));
  el.searchBtn.addEventListener('click', () => loadVoices({ self: false, title: el.librarySearch.value.trim() }));
  el.librarySearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadVoices({ self: false, title: el.librarySearch.value.trim() });
  });

  // 一開始就把「我的聲線」載入
  loadVoices({ self: true });

  // ---------- 聲音克隆 ----------
  el.voiceFile.addEventListener('change', () => {
    const f = el.voiceFile.files[0];
    el.fileName.textContent = f ? `已選擇：${f.name}（${(f.size / 1024).toFixed(0)} KB）` : '';
  });

  el.cloneBtn.addEventListener('click', async () => {
    const key = requireKeyOrWarn();
    if (!key) return;
    const file = el.voiceFile.files[0];
    if (!file) {
      showBanner('請先選擇一個約 10 秒的音訊檔案。');
      return;
    }
    hideBanner();
    el.cloneBtn.disabled = true;
    el.cloneBtn.textContent = '建立中…';
    try {
      const form = new FormData();
      form.append('voice', file);
      form.append('title', el.cloneTitle.value.trim());
      const r = await fetch('/api/clone', { method: 'POST', headers: { 'X-Fish-Key': key }, body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || '建立聲線失敗');
      showBanner(`聲線「${data.title}」建立成功！已自動選取。`, 'info');
      selectVoice(data._id || data.id, data.title);
      el.voiceFile.value = '';
      el.fileName.textContent = '';
      el.cloneTitle.value = '';
      loadVoices({ self: true });
    } catch (err) {
      showBanner(err.message);
    } finally {
      el.cloneBtn.disabled = false;
      el.cloneBtn.textContent = '建立克隆聲線';
    }
  });

  // ---------- 情緒標籤插入 ----------
  el.insertTagBtn.addEventListener('click', () => {
    const tag = el.emotionSelect.value;
    if (!tag) return;
    const ta = el.ttsText;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const insert = `[${tag}] `;
    ta.value = ta.value.slice(0, start) + insert + ta.value.slice(end);
    const pos = start + insert.length;
    ta.focus();
    ta.setSelectionRange(pos, pos);
    updateCharCount();
  });

  function updateCharCount() {
    el.charCount.textContent = el.ttsText.value.length;
  }
  el.ttsText.addEventListener('input', updateCharCount);

  // ---------- 滑桿數值顯示 ----------
  el.speed.addEventListener('input', () => (el.speedVal.textContent = Number(el.speed.value).toFixed(2)));
  el.temperature.addEventListener('input', () => (el.tempVal.textContent = Number(el.temperature.value).toFixed(2)));
  el.topP.addEventListener('input', () => (el.topPVal.textContent = Number(el.topP.value).toFixed(2)));

  // ---------- 生成語音 ----------
  el.generateBtn.addEventListener('click', async () => {
    const key = requireKeyOrWarn();
    if (!key) return;
    const text = el.ttsText.value.trim();
    if (!text) {
      showBanner('請先輸入要合成的文字或文章內容。');
      return;
    }
    if (!state.selectedVoiceId) {
      showBanner('請先在左側選擇或克隆一個聲線。');
      return;
    }
    hideBanner();
    el.generateBtn.disabled = true;
    el.generateLabel.textContent = '生成中…';

    try {
      const r = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Fish-Key': key },
        body: JSON.stringify({
          text,
          referenceId: state.selectedVoiceId,
          format: el.format.value,
          speed: el.speed.value,
          temperature: el.temperature.value,
          topP: el.topP.value,
        }),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.message || `生成失敗（${r.status}）`);
      }

      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      el.audioEl.src = url;
      el.player.classList.remove('hidden');
      el.audioEl.play().catch(() => {});

      const ext = el.format.value === 'wav' ? 'wav' : el.format.value === 'opus' ? 'opus' : 'mp3';
      el.downloadLink.href = url;
      el.downloadLink.download = `${(state.selectedVoiceTitle || 'voice').replace(/\s+/g, '_')}_${Date.now()}.${ext}`;
    } catch (err) {
      showBanner(err.message);
    } finally {
      el.generateBtn.disabled = false;
      el.generateLabel.textContent = '生成語音';
    }
  });
})();
