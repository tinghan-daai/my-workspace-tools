import { pipeline } from "@huggingface/transformers";

const MODEL = "onnx-community/Qwen2.5-0.5B-Instruct";
let generatorPromise;

function send(type, data = {}) {
  self.postMessage({ type, ...data });
}

function chunksOf(text, maximum = 3600) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > maximum) {
    let splitAt = Math.max(
      remaining.lastIndexOf("。", maximum),
      remaining.lastIndexOf("\n", maximum),
    );
    if (splitAt < maximum * 0.6) splitAt = maximum;
    chunks.push(remaining.slice(0, splitAt + 1));
    remaining = remaining.slice(splitAt + 1);
  }
  if (remaining.trim()) chunks.push(remaining);
  return chunks;
}

function loadGenerator() {
  generatorPromise ??= pipeline("text-generation", MODEL, {
    device: "webgpu",
    dtype: "q4",
    progress_callback(update) {
      send("progress", {
        fraction: Number(update.progress || 0) / 100,
        message: update.file ? `下載摘要模型：${update.file}` : "載入摘要模型",
      });
    },
  });
  return generatorPromise;
}

function generatedText(output) {
  const value = output?.[0]?.generated_text;
  if (Array.isArray(value)) return value.at(-1)?.content || "";
  return String(value || "");
}

function cleanLine(value = "") {
  return value
    .replace(/^(?:[-*•]\s*|\d+[.、)]\s*|【?(?:重點)?\d+】?\s*)/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function usefulChinese(value = "") {
  const text = value.replace(/\s/g, "");
  if (text.length < 20) return false;
  const useful = (text.match(/[\p{Script=Han}A-Za-z0-9，。！？、；：]/gu) || [])
    .length;
  return useful / text.length >= 0.7;
}

function parsePoint(line) {
  const cleaned = cleanLine(line);
  if (!cleaned) return null;
  const parts = cleaned.split(/[｜|：:]/, 2).map((part) => part.trim());
  if (parts.length === 2 && parts.every(Boolean)) {
    return { title: parts[0].slice(0, 24), text: parts[1] };
  }
  return {
    title: cleaned.replace(/[，。；].*$/, "").slice(0, 18) || "內容重點",
    text: cleaned,
  };
}

function parseFinalContent(final, quickContent, partials) {
  const normalized = final.replace(/\r/g, "").trim();
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const markedSummary = normalized.match(
    /【摘要】([\s\S]*?)(?=【?(?:重點)?\s*1】?|^\s*(?:1[.、)]|[-*•]))/m,
  )?.[1]?.trim();
  const firstPointIndex = lines.findIndex((line) =>
    /^(?:【?(?:重點)?\s*\d+】?|\d+[.、)]|[-*•])/.test(line),
  );
  const naturalSummary = lines
    .slice(0, firstPointIndex > 0 ? firstPointIndex : Math.min(2, lines.length))
    .join("")
    .replace(/^【摘要】\s*/, "");
  const summaryCandidates = [
    markedSummary,
    naturalSummary,
    partials.join("").slice(0, 420),
    quickContent?.summary,
  ];
  const summary =
    summaryCandidates.find((candidate) => usefulChinese(candidate)) ||
    quickContent?.summary ||
    "";

  const markedPoints = Array.from({ length: 5 }, (_, index) => {
    const number = index + 1;
    const match = normalized.match(
      new RegExp(
        `【?(?:重點)?\\s*${number}】?\\s*([^\\n]+)`,
      ),
    );
    return match ? parsePoint(match[1]) : null;
  }).filter(Boolean);
  const listPoints = lines
    .filter((line) => /^(?:\d+[.、)]|[-*•])/.test(line))
    .map(parsePoint)
    .filter(Boolean);
  const aiPoints = markedPoints.length >= listPoints.length
    ? markedPoints
    : listPoints;
  const fallbackPoints = Array.isArray(quickContent?.points)
    ? quickContent.points
    : [];
  const points = Array.from({ length: 5 }, (_, index) => {
    const point = aiPoints[index] || fallbackPoints[index];
    return point
      ? { title: cleanLine(point.title), text: cleanLine(point.text) }
      : { title: `重點 ${index + 1}`, text: "請依逐字稿補充此項重點。" };
  });
  return { summary, points, mode: "ai" };
}

async function ask(generator, prompt, maxNewTokens) {
  const output = await generator(
    [
      {
        role: "system",
        content: "你是臺灣繁體中文編輯。忠於原文，不虛構，不更動人名、數字與醫療名詞。",
      },
      { role: "user", content: prompt },
    ],
    {
      max_new_tokens: maxNewTokens,
      do_sample: false,
      repetition_penalty: 1.08,
    },
  );
  return generatedText(output);
}

self.addEventListener("message", async (event) => {
  if (event.data?.type !== "refine") return;
  try {
    const generator = await loadGenerator();
    const chunks = chunksOf(event.data.transcript);
    const partials = [];
    for (let index = 0; index < chunks.length; index += 1) {
      send("progress", {
        fraction: index / Math.max(1, chunks.length),
        message: `整理第 ${index + 1}／${chunks.length} 段`,
      });
      partials.push(await ask(
        generator,
        `請將以下逐字稿濃縮為 120 至 180 字的忠實段落摘要，只輸出摘要：\n\n${chunks[index]}`,
        240,
      ));
    }
    const final = await ask(
      generator,
      `根據下列分段摘要整理內容。必須嚴格使用以下六行格式，不要 JSON、Markdown 或其他說明：
【摘要】約 300 字繁體中文摘要
【重點1】小標｜一至兩句說明
【重點2】小標｜一至兩句說明
【重點3】小標｜一至兩句說明
【重點4】小標｜一至兩句說明
【重點5】小標｜一至兩句說明

分段摘要：
${partials.join("\n\n")}`,
      700,
    );
    const content = parseFinalContent(
      final,
      event.data.quickContent,
      partials.filter(usefulChinese),
    );
    if (!usefulChinese(content.summary)) {
      throw new Error("模型未能產生可用的繁體中文摘要");
    }
    send("complete", { content });
  } catch (error) {
    send("error", { message: error?.message || String(error) });
  }
});
