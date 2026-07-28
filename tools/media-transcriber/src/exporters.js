function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

export function formatClock(seconds, milliseconds = false) {
  const safe = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const base = `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  return milliseconds
    ? `${base},${pad(Math.round((safe % 1) * 1000), 3)}`
    : base;
}

function speakerName(project, id) {
  return project.speakers.find((speaker) => speaker.id === id)?.name || id;
}

function orderedRows(project) {
  return [...project.rows].sort((a, b) => a.start - b.start);
}

function layoutRows(project, layout) {
  const rows = orderedRows(project);
  if (layout !== "speaker") return rows;
  return [...rows].sort((a, b) => {
    const speakerDifference = speakerName(project, a.speaker).localeCompare(
      speakerName(project, b.speaker),
      "zh-Hant",
    );
    return speakerDifference || a.start - b.start;
  });
}

export function buildPlainText(project, options) {
  const rows = layoutRows(project, options.layout);
  const content = project.content || { summary: "", points: [] };
  const heading = [
    project.title || "影音逐字稿",
    "",
    "摘要",
    content.summary || "未提供",
    "",
    "五項核心重點",
    ...(content.points || []).map(
      (point, index) => `${index + 1}. ${point.title}\n${point.text}`,
    ),
    "",
    "完整逐字稿",
    "",
  ];
  const transcript = rows
    .map((row) => {
      const time = options.includeTimestamps
        ? `[${formatClock(row.start)}] `
        : "";
      return `${time}${speakerName(project, row.speaker)}：\n${row.text}`;
    })
    .join("\n\n");
  return [...heading, transcript].join("\n");
}

export function buildMarkdown(project, options) {
  const status = options.reviewed ? "已人工校對" : "AI 辨識初稿，需人工校對";
  const metadata = [
    `# ${project.title || "影音逐字稿"}`,
    "",
    `- 原始檔案：${project.file?.name || "未提供"}`,
    `- 建立時間：${new Date(project.createdAt).toLocaleString("zh-TW")}`,
    `- 狀態：${status}`,
    "",
    "## 摘要",
    "",
    project.content?.summary || "未提供",
    "",
    "## 五項核心重點",
    "",
    ...(project.content?.points || []).flatMap((point, index) => [
      `### ${index + 1}. ${point.title}`,
      "",
      point.text,
      "",
    ]),
    "## 完整逐字稿",
    "",
  ];
  const rows = layoutRows(project, options.layout).flatMap((row) => [
    `## ${options.includeTimestamps ? `${formatClock(row.start)}｜` : ""}${speakerName(project, row.speaker)}`,
    "",
    row.text,
    "",
  ]);
  return [...metadata, ...rows].join("\n");
}

function splitSubtitle(text, maximum = 24) {
  const compact = text.replace(/\s+/g, "");
  if (compact.length <= maximum) return compact;
  const chunks = [];
  for (let index = 0; index < compact.length; index += maximum) {
    chunks.push(compact.slice(index, index + maximum));
  }
  return chunks.slice(0, 2).join("\n");
}

export function buildSrt(project) {
  const rows = orderedRows(project);
  return rows
    .map((row, index) => {
      const start = formatClock(row.start, true);
      const nextStart = rows[index + 1]?.start;
      const naturalEnd = Math.max(row.start + 0.35, row.end);
      const safeEnd =
        nextStart == null
          ? naturalEnd
          : Math.max(row.start + 0.12, Math.min(naturalEnd, nextStart - 0.01));
      const end = formatClock(safeEnd, true);
      return `${index + 1}\n${start} --> ${end}\n${splitSubtitle(row.text)}`;
    })
    .join("\n\n");
}

export async function buildDocx(project, options) {
  const {
    AlignmentType,
    Document,
    Footer,
    Header,
    HeadingLevel,
    Packer,
    PageNumber,
    Paragraph,
    TextRun,
  } = await import("docx");
  const status = options.reviewed ? "已人工校對" : "AI 辨識初稿，需人工校對";
  const children = [
    new Paragraph({
      text: project.title || "影音逐字稿",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `原始檔案：${project.file?.name || "未提供"}` }),
        new TextRun({ text: `　｜　狀態：${status}` }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
  ];
  if (project.content?.summary) {
    children.push(
      new Paragraph({
        text: "摘要",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: project.content.summary })],
        spacing: { after: 240, line: 360 },
      }),
      new Paragraph({
        text: "五項核心重點",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 180, after: 120 },
      }),
    );
    for (const [index, point] of (project.content.points || []).entries()) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${point.title}`,
              bold: true,
              color: "123B3A",
            }),
          ],
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: point.text })],
          spacing: { after: 140, line: 360 },
        }),
      );
    }
    children.push(
      new Paragraph({
        text: "完整逐字稿",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }),
    );
  }
  for (const row of layoutRows(project, options.layout)) {
    const label = `${options.includeTimestamps ? `${formatClock(row.start)}｜` : ""}${speakerName(project, row.speaker)}`;
    children.push(
      new Paragraph({
        children: [new TextRun({ text: label, bold: true, color: "123B3A" })],
        spacing: { before: 180, after: 70 },
      }),
      new Paragraph({
        children: [new TextRun({ text: row.text })],
        spacing: { after: 150, line: 360 },
      }),
    );
  }
  const document = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Noto Sans TC", size: 24 },
        },
      },
    },
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                text: "影音逐字稿｜本機 AI 轉錄",
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun("第 "),
                  new TextRun({ children: [PageNumber.CURRENT] }),
                  new TextRun(" 頁"),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  return Packer.toBlob(document);
}

export function downloadBlob(content, filename, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
