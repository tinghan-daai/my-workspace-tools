import "./styles.css";
import OpenCC from "opencc-js";
import {
  buildQuickContent,
  organizeTranscriptRows,
} from "./summarizer.js";
import {
  buildDocx,
  buildMarkdown,
  buildPlainText,
  buildSrt,
  downloadBlob,
  formatClock,
} from "./exporters.js";
import {
  clearActiveProject,
  loadActiveProject,
  saveActiveProject,
} from "./storage.js";

const $ = (selector) => document.querySelector(selector);
const toTaiwanTraditional = OpenCC.Converter({ from: "cn", to: "tw" });
const elements = {
  file: $("#mediaFile"),
  dropZone: $("#dropZone"),
  fileSummary: $("#fileSummary"),
  fileName: $("#fileName"),
  fileMeta: $("#fileMeta"),
  start: $("#startButton"),
  setup: $("#setupPanel"),
  processing: $("#processingPanel"),
  editor: $("#editorPanel"),
  player: $("#mediaPlayer"),
  processingMessage: $("#processingMessage"),
  progressBar: $("#progressBar"),
  progressLabel: $("#progressLabel"),
  elapsed: $("#elapsedTime"),
  stageList: $("#stageList"),
  rows: $("#transcriptRows"),
  speakers: $("#speakerList"),
  summary: $("#transcriptSummary"),
  exportDialog: $("#exportDialog"),
  restoreDialog: $("#restoreDialog"),
  summaryText: $("#summaryText"),
  keyPoints: $("#keyPoints"),
  contentMode: $("#contentMode"),
  aiStatus: $("#aiStatus"),
  aiProgressBar: $("#aiProgressBar"),
  aiStatusText: $("#aiStatusText"),
};

const colors = ["#2d6a65", "#b15d3b", "#7562a8", "#b28a21", "#3f72a0", "#8b566f"];
let selectedFile = null;
let objectUrl = null;
let project = null;
let worker = null;
let timer = null;
let startedAt = null;
let deferredInstallPrompt = null;
let saveTimer = null;
let summaryWorker = null;

function createSpeaker(id, index) {
  return {
    id,
    name: `講者 ${index + 1}`,
    color: colors[index % colors.length],
  };
}

function convertProjectToTraditional(target) {
  if (!target?.rows?.length || target.settings?.language !== "zh") return false;
  let changed = false;
  for (const row of target.rows) {
    const converted = toTaiwanTraditional(String(row.text || ""));
    if (converted !== row.text) {
      row.text = converted;
      changed = true;
    }
  }
  if (changed) target.updatedAt = new Date().toISOString();
  return changed;
}

function ensureContent(target) {
  if (!target.content?.summary || target.content?.points?.length !== 5) {
    target.content = buildQuickContent(target.rows || []);
  }
}

function formatSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit > 1 ? 1 : 0)} ${units[unit]}`;
}

function getDuration(file) {
  return new Promise((resolve, reject) => {
    const media = document.createElement(file.type.startsWith("video") ? "video" : "audio");
    const url = URL.createObjectURL(file);
    media.preload = "metadata";
    media.onloadedmetadata = () => {
      resolve(media.duration);
      URL.revokeObjectURL(url);
    };
    media.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("無法讀取這個影音檔案"));
    };
    media.src = url;
  });
}

async function handleFile(file) {
  if (!file) return;
  try {
    const duration = await getDuration(file);
    if (!Number.isFinite(duration)) throw new Error("無法確認影音長度");
    selectedFile = file;
    selectedFile.duration = duration;
    elements.dropZone.hidden = true;
    elements.fileSummary.hidden = false;
    elements.fileName.textContent = file.name;
    elements.fileMeta.textContent = `${formatClock(duration)}・${formatSize(file.size)}・${file.type || "媒體檔案"}`;
    elements.start.disabled = false;
  } catch (error) {
    alert(error.message);
  }
}

async function decodeAudio(file) {
  updateStage("decode", 0.25, "在瀏覽器內解碼音訊");
  const context = new AudioContext({ sampleRate: 16000 });
  try {
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    const samples = new Float32Array(decoded.length);
    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const source = decoded.getChannelData(channel);
      for (let index = 0; index < source.length; index += 1) {
        samples[index] += source[index] / decoded.numberOfChannels;
      }
    }
    let mean = 0;
    for (const sample of samples) mean += sample;
    mean /= Math.max(1, samples.length);
    let peak = 0;
    let squareSum = 0;
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] -= mean;
      peak = Math.max(peak, Math.abs(samples[index]));
      squareSum += samples[index] ** 2;
    }
    const rms = Math.sqrt(squareSum / Math.max(1, samples.length));
    const gain = Math.min(4, 0.95 / Math.max(peak, 0.0001), 0.12 / Math.max(rms, 0.0001));
    if (gain > 1.05) {
      for (let index = 0; index < samples.length; index += 1) samples[index] *= gain;
    }
    return { samples, sampleRate: decoded.sampleRate, duration: decoded.duration };
  } finally {
    await context.close();
  }
}

function setProcessing(active) {
  elements.setup.hidden = active;
  elements.processing.hidden = !active;
  elements.editor.hidden = true;
}

function updateStage(stage, fraction, message) {
  const stages = ["decode", "models", "transcribe", "diarize", "merge"];
  const stageIndex = stages.indexOf(stage);
  document.querySelectorAll("#stageList li").forEach((item, index) => {
    item.classList.toggle("active", index === stageIndex);
    item.classList.toggle("done", index < stageIndex);
  });
  const base = Math.max(0, stageIndex) / stages.length;
  const progress = Math.min(1, base + (fraction || 0) / stages.length);
  elements.progressBar.style.width = `${progress * 100}%`;
  elements.progressLabel.textContent = `${Math.round(progress * 100)}%`;
  elements.processingMessage.textContent = message || "處理中";
}

function startTimer() {
  startedAt = Date.now();
  timer = setInterval(() => {
    elements.elapsed.textContent = formatClock((Date.now() - startedAt) / 1000);
  }, 500);
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

async function runTranscription() {
  setProcessing(true);
  startTimer();
  try {
    const decoded = await decodeAudio(selectedFile);
    updateStage("models", 0, "準備本機 AI 模型");
    worker = new Worker(new URL("./engine-worker.js", import.meta.url), {
      type: "module",
    });
    worker.onmessage = async ({ data }) => {
      if (data.type === "progress") {
        updateStage(data.stage, data.fraction, data.message);
      }
      if (data.type === "notice") {
        elements.processingMessage.textContent = data.message;
      }
      if (data.type === "error") {
        stopTimer();
        setProcessing(false);
        alert(`轉錄失敗：${data.message}`);
        console.error(data.stack);
        worker.terminate();
        worker = null;
      }
      if (data.type === "complete") {
        updateStage("merge", 1, "完成");
        stopTimer();
        buildProject(data.result, decoded.duration);
        await saveProjectSoon(true);
        showEditor();
        worker.terminate();
        worker = null;
      }
    };
    worker.postMessage(
      {
        type: "run",
        audio: decoded.samples,
        sampleRate: decoded.sampleRate,
        duration: decoded.duration,
        quality: $("#qualityMode").value,
        language: $("#language").value,
        glossary: $("#glossary").value.trim(),
      },
      [decoded.samples.buffer],
    );
  } catch (error) {
    stopTimer();
    setProcessing(false);
    alert(`無法開始轉錄：${error.message}`);
  }
}

function buildProject(result, duration) {
  const speakerIds = [...new Set(result.rows.map((row) => row.speaker))];
  const translatedRows = result.rows.map((row) => ({
    ...row,
    text:
      $("#language").value === "zh"
        ? toTaiwanTraditional(row.text)
        : row.text,
  }));
  project = {
    version: 2,
    title: selectedFile.name.replace(/\.[^.]+$/, ""),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    file: {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      duration,
    },
    settings: {
      usage: $("#usageMode").value,
      quality: $("#qualityMode").value,
      speakers: $("#speakerCount").value,
      language: $("#language").value,
      glossary: $("#glossary").value.trim(),
    },
    speakers: speakerIds.map(createSpeaker),
    rows: organizeTranscriptRows(translatedRows),
    raw: {
      transcript: result.rawTranscript,
      diarization: result.rawDiarization,
      metrics: result.metrics,
    },
  };
  project.content = buildQuickContent(project.rows);
}

function showEditor() {
  elements.setup.hidden = true;
  elements.processing.hidden = true;
  elements.editor.hidden = false;
  $("#editorTitle").textContent = project.title;
  if (selectedFile) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(selectedFile);
    elements.player.src = objectUrl;
  } else {
    elements.player.removeAttribute("src");
    elements.player.load();
  }
  renderSpeakers();
  ensureContent(project);
  renderContent();
  renderRows();
}

function renderContent() {
  ensureContent(project);
  elements.summaryText.value = project.content.summary;
  elements.contentMode.textContent =
    project.content.mode === "ai"
      ? "本機 AI 精修版，可直接編輯"
      : "快速整理版，可直接編輯";
  $("#restoreQuickButton").hidden = project.content.mode !== "ai";
  elements.keyPoints.innerHTML = "";
  project.content.points.forEach((point, index) => {
    const node = document.createElement("div");
    node.className = "key-point";
    node.innerHTML = `
      <div>
        <label for="pointTitle${index}">重點 ${index + 1} 小標</label>
        <input id="pointTitle${index}" value="${escapeHtml(point.title)}">
      </div>
      <div>
        <label for="pointText${index}">重點內容</label>
        <textarea id="pointText${index}">${escapeHtml(point.text)}</textarea>
      </div>
    `;
    node.querySelector("input").addEventListener("input", (event) => {
      point.title = event.target.value;
      saveProjectSoon();
    });
    node.querySelector("textarea").addEventListener("input", (event) => {
      point.text = event.target.value;
      saveProjectSoon();
    });
    elements.keyPoints.append(node);
  });
}

function speakerName(id) {
  return project.speakers.find((speaker) => speaker.id === id)?.name || id;
}

function renderSpeakers() {
  elements.speakers.innerHTML = "";
  for (const speaker of project.speakers) {
    const row = document.createElement("div");
    row.className = "speaker-item";
    row.innerHTML = `
      <span class="speaker-dot" style="background:${speaker.color}"></span>
      <input aria-label="講者名稱" value="${escapeHtml(speaker.name)}">
      <button title="刪除講者" aria-label="刪除 ${escapeHtml(speaker.name)}">×</button>
    `;
    row.querySelector("input").addEventListener("input", (event) => {
      speaker.name = event.target.value || speaker.id;
      project.updatedAt = new Date().toISOString();
      renderRows();
      saveProjectSoon();
    });
    row.querySelector("button").addEventListener("click", () => {
      if (project.speakers.length === 1) return;
      const replacement = project.speakers.find((item) => item.id !== speaker.id);
      project.rows.forEach((item) => {
        if (item.speaker === speaker.id) item.speaker = replacement.id;
      });
      project.speakers = project.speakers.filter((item) => item.id !== speaker.id);
      renderSpeakers();
      renderRows();
      saveProjectSoon();
    });
    elements.speakers.append(row);
  }
}

function renderRows() {
  elements.rows.innerHTML = "";
  const options = project.speakers
    .map(
      (speaker) =>
        `<option value="${speaker.id}">${escapeHtml(speaker.name)}</option>`,
    )
    .join("");
  project.rows.forEach((row, index) => {
    const node = document.createElement("article");
    node.className = "transcript-row";
    node.dataset.id = row.id;
    node.innerHTML = `
      <div class="row-meta">
        <button class="time-button">${formatClock(row.start)}</button>
        <select aria-label="選擇講者">${options}</select>
      </div>
      <div class="row-text">
        <textarea aria-label="${escapeHtml(speakerName(row.speaker))}逐字稿">${escapeHtml(row.text)}</textarea>
        <div class="row-actions">
          <button data-action="split">拆分</button>
          <button data-action="merge">與下一段合併</button>
          <button data-action="unclear">標記聽不清楚</button>
          <button data-action="delete">刪除</button>
        </div>
      </div>
    `;
    const select = node.querySelector("select");
    select.value = row.speaker;
    select.addEventListener("change", () => {
      row.speaker = select.value;
      saveProjectSoon();
    });
    node.querySelector(".time-button").addEventListener("click", () => {
      elements.player.currentTime = row.start;
      elements.player.play();
    });
    node.querySelector("textarea").addEventListener("input", (event) => {
      row.text = event.target.value;
      saveProjectSoon();
      updateSummary();
    });
    node.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => handleRowAction(button.dataset.action, index));
    });
    elements.rows.append(node);
  });
  updateSummary();
}

function handleRowAction(action, index) {
  const row = project.rows[index];
  if (action === "delete") {
    project.rows.splice(index, 1);
  }
  if (action === "merge" && project.rows[index + 1]) {
    const next = project.rows[index + 1];
    row.text = `${row.text} ${next.text}`.trim();
    row.end = next.end;
    project.rows.splice(index + 1, 1);
  }
  if (action === "split") {
    const midpoint = Math.floor(row.text.length / 2);
    const splitAt = row.text.indexOf("，", midpoint) + 1 || midpoint;
    const ratio = splitAt / Math.max(1, row.text.length);
    const splitTime = row.start + (row.end - row.start) * ratio;
    const second = {
      ...row,
      id: crypto.randomUUID(),
      start: splitTime,
      text: row.text.slice(splitAt).trim(),
    };
    row.end = splitTime;
    row.text = row.text.slice(0, splitAt).trim();
    project.rows.splice(index + 1, 0, second);
  }
  if (action === "unclear" && !row.text.includes("〔聽不清楚〕")) {
    row.text = `${row.text}〔聽不清楚〕`;
  }
  renderRows();
  saveProjectSoon();
}

function updateSummary() {
  const characters = project.rows.reduce((sum, row) => sum + row.text.length, 0);
  elements.summary.innerHTML = `
    <span>${project.rows.length} 段</span>
    <span>${characters.toLocaleString("zh-TW")} 字</span>
    <span>${project.speakers.length} 位講者</span>
    <span>${formatClock(project.file?.duration || 0)}</span>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function saveProjectSoon(immediate = false) {
  clearTimeout(saveTimer);
  const save = () => {
    if (!project) return;
    project.updatedAt = new Date().toISOString();
    saveActiveProject(project).catch(console.error);
  };
  if (immediate) return save();
  saveTimer = setTimeout(save, 500);
}

async function exportTranscript() {
  const format = $("#exportFormat").value;
  const options = {
    layout: $("#exportLayout").value,
    includeTimestamps: $("#includeTimestamps").checked,
    reviewed: $("#reviewedStatus").checked,
  };
  const safeName = (project.title || "逐字稿").replace(/[\\/:*?"<>|]/g, "-");
  if (format === "txt") {
    downloadBlob(buildPlainText(project, options), `${safeName}.txt`, "text/plain;charset=utf-8");
  } else if (format === "md") {
    downloadBlob(buildMarkdown(project, options), `${safeName}.md`, "text/markdown;charset=utf-8");
  } else if (format === "srt") {
    downloadBlob(buildSrt(project), `${safeName}.srt`, "application/x-subrip;charset=utf-8");
  } else {
    const blob = await buildDocx(project, options);
    downloadBlob(blob, `${safeName}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  }
  elements.exportDialog.close();
}

function exportProject() {
  const payload = {
    ...project,
    exportedAt: new Date().toISOString(),
    note: "此備份不包含原始影音。換裝置後請重新選取相同檔案。",
  };
  downloadBlob(
    JSON.stringify(payload, null, 2),
    `${project.title || "逐字稿"}-專案備份.json`,
    "application/json;charset=utf-8",
  );
}

async function importProject(file) {
  const imported = JSON.parse(await file.text());
  if (!Array.isArray(imported.rows) || !Array.isArray(imported.speakers)) {
    throw new Error("這不是有效的逐字稿專案備份");
  }
  project = imported;
  selectedFile = null;
  await saveProjectSoon(true);
  showEditor();
}

function updatePlayingRow() {
  const time = elements.player.currentTime;
  document.querySelectorAll(".transcript-row").forEach((node) => {
    const row = project?.rows.find((item) => item.id === node.dataset.id);
    node.classList.toggle(
      "playing",
      Boolean(row && row.start <= time && time <= row.end),
    );
  });
}

function checkCompatibility() {
  const webGpu = Boolean(navigator.gpu);
  const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "未提供";
  $("#compatibility").innerHTML =
    `<strong>${webGpu ? "支援 WebGPU，可使用 Large-v3 Turbo" : "不支援 WebGPU，高準確模式會自動改用 Small"}</strong>・` +
    `邏輯核心 ${navigator.hardwareConcurrency || "未知"}・裝置記憶體 ${memory}`;
  if (!webGpu) {
    $("#aiRefineButton").disabled = true;
    $("#aiRefineButton").title = "此裝置不支援 WebGPU，仍可使用快速整理版";
  }
}

function transcriptForSummary() {
  return project.rows
    .map((row) => `${speakerName(row.speaker)}：${row.text}`)
    .join("\n");
}

function refineWithLocalAI() {
  if (!navigator.gpu) {
    alert("此裝置不支援 WebGPU，請使用快速整理版。");
    return;
  }
  summaryWorker?.terminate();
  project.quickContentBackup = structuredClone(
    project.content.mode === "quick"
      ? project.content
      : project.quickContentBackup || buildQuickContent(project.rows),
  );
  elements.aiStatus.hidden = false;
  elements.aiProgressBar.style.width = "0%";
  elements.aiStatusText.textContent = "準備本機摘要模型；第一次約需下載 786 MB";
  $("#aiRefineButton").disabled = true;
  summaryWorker = new Worker(new URL("./summary-worker.js", import.meta.url), {
    type: "module",
  });
  summaryWorker.onmessage = ({ data }) => {
    if (data.type === "progress") {
      elements.aiProgressBar.style.width = `${Math.max(3, (data.fraction || 0) * 100)}%`;
      elements.aiStatusText.textContent = data.message;
    }
    if (data.type === "error") {
      summaryWorker.terminate();
      summaryWorker = null;
      $("#aiRefineButton").disabled = false;
      elements.aiStatus.hidden = true;
      alert(`本機 AI 精修失敗，已保留快速整理版：${data.message}`);
    }
    if (data.type === "complete") {
      project.content = {
        summary: toTaiwanTraditional(data.content.summary),
        points: data.content.points.map((point) => ({
          title: toTaiwanTraditional(point.title),
          text: toTaiwanTraditional(point.text),
        })),
        mode: "ai",
      };
      summaryWorker.terminate();
      summaryWorker = null;
      $("#aiRefineButton").disabled = false;
      elements.aiProgressBar.style.width = "100%";
      elements.aiStatusText.textContent = "本機 AI 精修完成";
      setTimeout(() => {
        elements.aiStatus.hidden = true;
      }, 1800);
      renderContent();
      saveProjectSoon(true);
    }
  };
  summaryWorker.postMessage({
    type: "refine",
    transcript: transcriptForSummary(),
    quickContent: project.quickContentBackup,
  });
}

elements.file.addEventListener("change", () => handleFile(elements.file.files?.[0]));
elements.dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.dropZone.classList.add("dragging");
});
elements.dropZone.addEventListener("dragleave", () => elements.dropZone.classList.remove("dragging"));
elements.dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  elements.dropZone.classList.remove("dragging");
  handleFile(event.dataTransfer.files?.[0]);
});
$("#clearFileButton").addEventListener("click", () => {
  selectedFile = null;
  elements.file.value = "";
  elements.dropZone.hidden = false;
  elements.fileSummary.hidden = true;
  elements.start.disabled = true;
});
elements.start.addEventListener("click", runTranscription);
$("#cancelButton").addEventListener("click", () => {
  worker?.terminate();
  worker = null;
  stopTimer();
  setProcessing(false);
});
document.querySelectorAll("[data-seek]").forEach((button) => {
  button.addEventListener("click", () => {
    elements.player.currentTime = Math.max(
      0,
      elements.player.currentTime + Number(button.dataset.seek),
    );
  });
});
$("#playPauseButton").addEventListener("click", () =>
  elements.player.paused ? elements.player.play() : elements.player.pause(),
);
elements.player.addEventListener("timeupdate", updatePlayingRow);
$("#addSpeakerButton").addEventListener("click", () => {
  const speaker = createSpeaker(`SPEAKER_${String(project.speakers.length).padStart(2, "0")}`, project.speakers.length);
  project.speakers.push(speaker);
  renderSpeakers();
  renderRows();
  saveProjectSoon();
});
$("#replaceAllButton").addEventListener("click", () => {
  const find = $("#findText").value;
  if (!find) return;
  const replace = $("#replaceText").value;
  project.rows.forEach((row) => {
    row.text = row.text.split(find).join(replace);
  });
  renderRows();
  saveProjectSoon();
});
$("#exportOpenButton").addEventListener("click", () => elements.exportDialog.showModal());
$("#exportButton").addEventListener("click", (event) => {
  event.preventDefault();
  exportTranscript().catch((error) => alert(`匯出失敗：${error.message}`));
});
$("#projectExportButton").addEventListener("click", exportProject);
$("#projectImport").addEventListener("change", async (event) => {
  try {
    await importProject(event.target.files?.[0]);
  } catch (error) {
    alert(error.message);
  }
});
$("#clearLocalDataButton").addEventListener("click", async () => {
  if (!confirm("確定清除目前瀏覽器內保存的逐字稿專案？已下載的檔案不受影響。")) return;
  await clearActiveProject();
  location.reload();
});
elements.summaryText.addEventListener("input", () => {
  ensureContent(project);
  project.content.summary = elements.summaryText.value;
  saveProjectSoon();
});
$("#aiRefineButton").addEventListener("click", refineWithLocalAI);
$("#restoreQuickButton").addEventListener("click", () => {
  project.content = structuredClone(
    project.quickContentBackup || buildQuickContent(project.rows),
  );
  project.content.mode = "quick";
  renderContent();
  saveProjectSoon(true);
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  $("#installButton").hidden = false;
});
$("#installButton").addEventListener("click", async () => {
  await deferredInstallPrompt?.prompt();
  deferredInstallPrompt = null;
  $("#installButton").hidden = true;
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(console.error);
}

checkCompatibility();
loadActiveProject()
  .then(async (saved) => {
    if (!saved?.rows?.length) return;
    if (convertProjectToTraditional(saved)) {
      await saveActiveProject(saved);
    }
    ensureContent(saved);
    $("#restoreMessage").textContent = `${saved.title}，最後儲存於 ${new Date(saved.updatedAt).toLocaleString("zh-TW")}。恢復後需重新選取原影音才能播放。`;
    elements.restoreDialog.showModal();
    elements.restoreDialog.addEventListener(
      "close",
      () => {
        if (elements.restoreDialog.returnValue === "restore") {
          project = saved;
          selectedFile = null;
          showEditor();
        }
      },
      { once: true },
    );
  })
  .catch(console.error);
