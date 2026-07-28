import * as ort from "onnxruntime-web";
import {
  DiarizationPipeline,
  ensureArtifacts,
} from "diarization-js";
import { pipeline as createPipeline } from "@huggingface/transformers";

ort.env.wasm.numThreads = self.crossOriginIsolated
  ? Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1))
  : 1;

const MODEL_BY_QUALITY = {
  fast: {
    model: "onnx-community/whisper-base_timestamped",
    device: "wasm",
    dtype: "q8",
  },
  standard: {
    model: "onnx-community/whisper-small_timestamped",
    device: "wasm",
    dtype: "q8",
  },
  accurate: {
    model: "onnx-community/whisper-large-v3-turbo",
    device: "webgpu",
    dtype: {
      encoder_model: "fp16",
      decoder_model_merged: "q4",
    },
  },
};

let diarizationPipeline = null;
const transcribers = new Map();

function send(type, data = {}) {
  self.postMessage({ type, ...data });
}

async function loadDiarization() {
  if (diarizationPipeline) return diarizationPipeline;
  const artifacts = await ensureArtifacts({
    onProgress({ file, fraction }) {
      send("progress", {
        stage: "models",
        fraction: Math.min(0.35, (fraction || 0) * 0.35),
        message: `下載講者模型：${file}`,
      });
    },
  });
  diarizationPipeline = await DiarizationPipeline.create({
    ort,
    ...artifacts,
    executionProviders: ["wasm"],
    batchYieldMs: 2,
  });
  return diarizationPipeline;
}

async function loadTranscriber(quality) {
  if (transcribers.has(quality)) return transcribers.get(quality);
  let config = MODEL_BY_QUALITY[quality] || MODEL_BY_QUALITY.standard;
  let effectiveQuality = quality;
  if (config.device === "webgpu" && !navigator.gpu) {
    config = MODEL_BY_QUALITY.standard;
    effectiveQuality = "standard";
    send("notice", {
      message: "此裝置不支援 WebGPU，已自動改用 Whisper Small。",
    });
  }
  const create = () => createPipeline("automatic-speech-recognition", config.model, {
    device: config.device,
    dtype: config.dtype,
    progress_callback(update) {
      const progress = Number(update.progress || 0) / 100;
      send("progress", {
        stage: "models",
        fraction: 0.35 + progress * 0.65,
        message: update.file ? `下載轉錄模型：${update.file}` : "載入轉錄模型",
      });
    },
  });
  const promise = create().catch(async (error) => {
    if (effectiveQuality !== "accurate") throw error;
    config = MODEL_BY_QUALITY.standard;
    send("notice", {
      message: "WebGPU 無法載入高準確模型，已自動改用 Whisper Small。",
    });
    return createPipeline("automatic-speech-recognition", config.model, {
      device: config.device,
      dtype: config.dtype,
    });
  });
  transcribers.set(quality, promise);
  return promise;
}

function buildPromptIds(transcriber, glossary) {
  const terms = String(glossary || "")
    .split(/[、,，;；\n]+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 40);
  if (!terms.length) return null;
  try {
    const text = `專有名詞：${terms.join("、")}`;
    const tokens = transcriber.tokenizer
      .encode(text, { add_special_tokens: false })
      .slice(-222);
    const startOfPrevious =
      transcriber.tokenizer.model.convert_tokens_to_ids(["<|startofprev|>"])[0];
    return [startOfPrevious, ...tokens];
  } catch {
    send("notice", {
      message: "目前模型無法套用專有名詞提示，仍會保留名詞供完成後校對。",
    });
    return null;
  }
}

function clamp(value, maximum) {
  return Math.max(0, Math.min(Number(value) || 0, maximum));
}

function assignSpeaker(chunk, diarizationSegments, duration) {
  const start = clamp(chunk.timestamp?.[0], duration);
  const end = clamp(chunk.timestamp?.[1] ?? start, duration);
  const midpoint = (start + end) / 2;
  let winner = diarizationSegments.find(
    (segment) => segment.start <= midpoint && midpoint <= segment.end,
  );
  if (!winner) {
    winner = diarizationSegments.reduce((closest, segment) => {
      const distance = Math.min(
        Math.abs(midpoint - segment.start),
        Math.abs(midpoint - segment.end),
      );
      return !closest || distance < closest.distance
        ? { ...segment, distance }
        : closest;
    }, null);
  }
  return {
    text: String(chunk.text || "").trim(),
    start,
    end,
    speaker: winner?.speaker || "SPEAKER_00",
  };
}

function mergeResults(transcript, diarization, duration) {
  const chunks = (transcript.chunks || [])
    .map((chunk) => assignSpeaker(chunk, diarization.segments || [], duration))
    .filter((chunk) => chunk.text);
  const rows = [];
  for (const chunk of chunks) {
    const previous = rows.at(-1);
    if (
      previous &&
      previous.speaker === chunk.speaker &&
      chunk.start - previous.end < 2.5
    ) {
      previous.end = chunk.end;
      previous.text = `${previous.text}${/^[，。！？、,.!?]/.test(chunk.text) ? "" : " "}${chunk.text}`.trim();
    } else {
      rows.push({
        id: crypto.randomUUID(),
        ...chunk,
      });
    }
  }
  return rows;
}

self.addEventListener("message", async (event) => {
  if (event.data?.type !== "run") return;
  const { audio, sampleRate, duration, quality, language, glossary } = event.data;
  try {
    send("progress", {
      stage: "models",
      fraction: 0,
      message: "準備本機模型",
    });
    // ONNX Runtime Web does not allow two inference sessions to execute at the
    // same time in one worker. Load both models here, but run ASR and
    // diarization sequentially below.
    const transcriber = await loadTranscriber(quality);
    const diarizer = await loadDiarization();

    send("progress", {
      stage: "transcribe",
      fraction: 0.05,
      message: "辨識文字與時間碼",
    });
    const promptIds = buildPromptIds(transcriber, glossary);
    const transcript = await transcriber(audio, {
      language,
      task: "transcribe",
      // The quantized large-v3-turbo browser export does not expose the
      // cross-attention tensors required for word-level alignment. Segment
      // timestamps still provide reliable speaker merging and SRT output.
      return_timestamps: quality === "accurate" ? true : "word",
      chunk_length_s: 30,
      stride_length_s: 5,
      ...(promptIds ? { prompt_ids: promptIds } : {}),
    });

    send("progress", {
      stage: "diarize",
      fraction: 0.05,
      message: "分析聲音特徵與講者",
    });
    let diarization;
    try {
      diarization = await diarizer.run(audio, sampleRate, {
        onProgress(update) {
          send("progress", {
            stage: "diarize",
            fraction: update.fraction,
            message: `講者分析：${update.step}`,
          });
        },
      });
    } catch (error) {
      send("notice", {
        message: "文字已辨識完成，但講者分析失敗；已先以單一講者保留逐字稿。",
      });
      diarization = {
        result: { segments: [], numSpeakers: 1 },
        metrics: {
          failed: true,
          error: error?.message || String(error),
        },
      };
    }
    send("progress", {
      stage: "merge",
      fraction: 0.9,
      message: "合併時間碼與講者",
    });
    const rows = mergeResults(transcript, diarization.result, duration);
    send("complete", {
      result: {
        rows,
        rawTranscript: transcript,
        rawDiarization: diarization.result,
        metrics: diarization.metrics,
      },
    });
  } catch (error) {
    send("error", {
      message: error?.message || String(error),
      stack: error?.stack || "",
    });
  }
});
