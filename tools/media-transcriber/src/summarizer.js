const sentenceEnd = /[。！？!?]/;
const stopWords = new Set([
  "我們", "大家", "這個", "那個", "就是", "因為", "所以", "然後", "可以",
  "今天", "一個", "一些", "以及", "但是", "如果", "已經", "還是", "可能",
]);

function cleanText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([，。！？；：、])/g, "$1")
    .trim();
}

function splitLongText(text, maximum = 62) {
  const clean = cleanText(text);
  if (!clean) return [];
  const natural = clean
    .split(/(?<=[。！？!?；;])\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const result = [];
  for (const part of natural) {
    if (part.length <= maximum) {
      result.push(sentenceEnd.test(part.at(-1)) ? part : `${part}。`);
      continue;
    }
    let remaining = part;
    while (remaining.length > maximum) {
      const candidates = [
        remaining.lastIndexOf("，", maximum),
        remaining.lastIndexOf("、", maximum),
        remaining.lastIndexOf(" ", maximum),
      ];
      const splitAt = Math.max(...candidates, Math.floor(maximum * 0.65));
      const piece = remaining.slice(0, splitAt + 1).trim();
      result.push(sentenceEnd.test(piece.at(-1)) ? piece : `${piece.replace(/[，、 ]+$/, "")}。`);
      remaining = remaining.slice(splitAt + 1).trim();
    }
    if (remaining) {
      result.push(sentenceEnd.test(remaining.at(-1)) ? remaining : `${remaining}。`);
    }
  }
  return result;
}

export function organizeTranscriptRows(rows) {
  const organized = [];
  for (const row of rows) {
    const parts = splitLongText(row.text);
    if (!parts.length) continue;
    const duration = Math.max(0.1, row.end - row.start);
    let consumed = 0;
    parts.forEach((text, index) => {
      const ratio = text.length / parts.reduce((sum, part) => sum + part.length, 0);
      const start = row.start + duration * consumed;
      consumed += ratio;
      organized.push({
        ...row,
        id: index === 0 ? row.id : crypto.randomUUID(),
        start,
        end: index === parts.length - 1 ? row.end : row.start + duration * consumed,
        text,
      });
    });
  }
  return organized;
}

function sentencesFromRows(rows) {
  return rows
    .flatMap((row) => splitLongText(row.text, 90))
    .map((text, index) => ({ text, index }))
    .filter(({ text }) => text.length >= 10);
}

function keywords(sentences) {
  const frequency = new Map();
  const combined = sentences.map(({ text }) => text).join("");
  const tokens = combined.match(/[\p{Script=Han}]{2,6}|[A-Za-z][A-Za-z0-9-]{2,}/gu) || [];
  for (const token of tokens) {
    if (stopWords.has(token)) continue;
    frequency.set(token, (frequency.get(token) || 0) + 1);
  }
  return frequency;
}

function scoreSentences(sentences) {
  const frequency = keywords(sentences);
  const total = Math.max(1, sentences.length);
  return sentences.map((sentence) => {
    let score = sentence.index < 3 ? 2.5 : 0;
    if (sentence.index >= total - 2) score += 1.5;
    for (const [word, count] of frequency) {
      if (sentence.text.includes(word)) score += Math.min(3, count) * 0.45;
    }
    score += Math.min(1.5, sentence.text.length / 60);
    return { ...sentence, score };
  });
}

function pointTitle(text, index) {
  const compact = text.replace(/[，。！？；：、\s]/g, "");
  return compact.slice(0, 12) || `重點 ${index + 1}`;
}

export function buildQuickContent(rows) {
  const scored = scoreSentences(sentencesFromRows(rows));
  if (!scored.length) {
    return {
      summary: "目前沒有足夠的逐字稿內容可供整理。",
      points: Array.from({ length: 5 }, (_, index) => ({
        title: `重點 ${index + 1}`,
        text: "待補充",
      })),
      mode: "quick",
    };
  }
  const selected = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(8, scored.length))
    .sort((a, b) => a.index - b.index);
  let summary = "";
  for (const sentence of selected) {
    if (summary.length >= 260) break;
    summary += sentence.text;
  }
  summary = summary.slice(0, 330);
  if (!sentenceEnd.test(summary.at(-1))) summary += "。";

  const points = [...scored]
    .sort((a, b) => b.score - a.score)
    .filter((item, index, list) =>
      list.findIndex((other) =>
        other.text.slice(0, 14) === item.text.slice(0, 14)) === index)
    .slice(0, 5)
    .map((item, index) => ({
      title: pointTitle(item.text, index),
      text: item.text,
    }));
  while (points.length < 5) {
    points.push({ title: `重點 ${points.length + 1}`, text: "待補充" });
  }
  return { summary, points, mode: "quick" };
}

