// build-docx.js — 一次搞懂 AI 代理人 (報告)
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, LevelFormat, PageNumber,
  Table, TableRow, TableCell, BorderStyle, WidthType, ShadingType,
  PageOrientation, TabStopType, TabStopPosition,
} = require("docx");

const FONT = "Microsoft JhengHei";
const NAVY = "1E2761";
const CYAN = "0891B2";
const AMBER = "B45309";
const MUTED = "475569";
const TEXT = "0F172A";
const RULE = "CBD5E1";

// ---------- helpers ----------
const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 120, line: 320 },
    ...opts.paragraph,
    children: [new TextRun({ text, font: FONT, size: 22, color: TEXT, ...opts.run })],
  });

const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: FONT, size: 36, bold: true, color: NAVY })],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, font: FONT, size: 28, bold: true, color: NAVY })],
  });

const h3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: CYAN })],
  });

const bullet = (text, indent = 0) =>
  new Paragraph({
    numbering: { reference: "bullets", level: indent },
    spacing: { after: 80, line: 300 },
    children: [new TextRun({ text, font: FONT, size: 22, color: TEXT })],
  });

const numbered = (text) =>
  new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { after: 80, line: 300 },
    children: [new TextRun({ text, font: FONT, size: 22, color: TEXT })],
  });

const richP = (runs, opts = {}) =>
  new Paragraph({
    spacing: { after: 120, line: 320 },
    ...opts.paragraph,
    children: runs.map((r) =>
      new TextRun({
        font: FONT, size: 22, color: TEXT,
        ...r,
      })
    ),
  });

const calloutBox = (lines) => {
  const border = { style: BorderStyle.SINGLE, size: 4, color: CYAN };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9360, type: WidthType.DXA },
            borders: { top: border, bottom: border, left: border, right: border },
            shading: { fill: "ECFEFF", type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 240, right: 240 },
            children: lines.map((l) =>
              new Paragraph({
                spacing: { after: 60, line: 300 },
                children: [
                  new TextRun({
                    text: l,
                    font: FONT, size: 22, color: TEXT,
                  }),
                ],
              })
            ),
          }),
        ],
      }),
    ],
  });
};

const tableHeader = (text) =>
  new Paragraph({
    spacing: { after: 0, line: 280 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: "FFFFFF" })],
  });

const tableCellText = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 0, line: 280 },
    children: [new TextRun({ text, font: FONT, size: 22, color: TEXT, ...opts })],
  });

function buildProductTable() {
  const border = { style: BorderStyle.SINGLE, size: 4, color: RULE };
  const borders = { top: border, bottom: border, left: border, right: border };
  const headFill = NAVY;
  const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };

  const headRow = new TableRow({
    tableHeader: true,
    children: [
      ["產品", 2200], ["定位", 2400], ["特色", 4760],
    ].map(([txt, w]) =>
      new TableCell({
        width: { size: w, type: WidthType.DXA },
        borders, shading: { fill: headFill, type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [tableHeader(txt)],
      })
    ),
  });

  const data = [
    ["Claude Code", "終端機裡的工程師", "讀檔、改程式、跑測試；長任務最強"],
    ["Cursor", "AI 強化的 IDE", "對話式寫程式、整段重構"],
    ["ChatGPT Agent", "桌面任務自動化", "上網查、訂機票、下單"],
    ["Manus", "通用自主代理", "丟一個目標讓它自己交件"],
    ["Devin", "AI 軟體工程師", "從需求拆票到部署一條龍"],
    ["n8n / Make", "流程自動化", "把 AI 模組接成可重用的工作流"],
  ];

  const rows = data.map(([name, role, note]) =>
    new TableRow({
      children: [
        [name, 2200, true], [role, 2400, false], [note, 4760, false],
      ].map(([txt, w, bold]) =>
        new TableCell({
          width: { size: w, type: WidthType.DXA },
          borders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [tableCellText(txt, bold ? { bold: true, color: NAVY } : {})],
        })
      ),
    })
  );

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 2400, 4760],
    rows: [headRow, ...rows],
  });
}

function buildComparisonTable() {
  const border = { style: BorderStyle.SINGLE, size: 4, color: RULE };
  const borders = { top: border, bottom: border, left: border, right: border };
  const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };

  const headRow = new TableRow({
    tableHeader: true,
    children: [
      ["面向", 1800, NAVY], ["普通 LLM", 3780, "475569"], ["AI 代理人", 3780, CYAN],
    ].map(([txt, w, fill]) =>
      new TableCell({
        width: { size: w, type: WidthType.DXA },
        borders, shading: { fill, type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [tableHeader(txt)],
      })
    ),
  });

  const data = [
    ["互動方式", "你問一句，它答一句", "給目標即可，自己拆解規劃"],
    ["能用工具？", "只能輸出文字", "可讀檔、寫檔、上網、呼叫 API"],
    ["失敗怎麼辦", "你得自己改 Prompt 重問", "會自我反思、重試"],
    ["記憶", "離開對話就忘", "可保留長期事實 / 偏好"],
    ["執行型態", "單回合對話", "多步迴圈，直到任務完成"],
  ];

  const rows = data.map(([k, a, b], i) =>
    new TableRow({
      children: [
        [k, 1800, { bold: true }], [a, 3780, {}], [b, 3780, {}],
      ].map(([txt, w, runOpts]) =>
        new TableCell({
          width: { size: w, type: WidthType.DXA },
          borders,
          shading: { fill: i % 2 === 0 ? "F8FAFC" : "FFFFFF", type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [tableCellText(txt, runOpts)],
        })
      ),
    })
  );

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1800, 3780, 3780],
    rows: [headRow, ...rows],
  });
}

// ---------- doc ----------
const doc = new Document({
  creator: "Tinghan Lai",
  title: "一次搞懂 AI 代理人",
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: FONT, color: NAVY },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: FONT, color: NAVY },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: FONT, color: CYAN },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 480, hanging: 240 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 960, hanging: 240 } } } },
        ],
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 480, hanging: 240 } } } },
        ],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 4 },
            },
            children: [
              new TextRun({ text: "一次搞懂 AI 代理人 · 內訓報告", font: FONT, size: 18, color: MUTED }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: "Tinghan Lai · 2026.05", font: FONT, size: 18, color: MUTED }),
              new TextRun({ text: "\t第 ", font: FONT, size: 18, color: MUTED }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: MUTED }),
              new TextRun({ text: " 頁 / 共 ", font: FONT, size: 18, color: MUTED }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 18, color: MUTED }),
              new TextRun({ text: " 頁", font: FONT, size: 18, color: MUTED }),
            ],
          }),
        ],
      }),
    },
    children: [
      // ---------- title block ----------
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({ text: "INTERNAL BRIEFING · 2026.05", font: FONT, size: 18, color: AMBER, bold: true, characterSpacing: 40 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({ text: "一次搞懂 AI 代理人", font: FONT, size: 56, bold: true, color: NAVY }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: AMBER, space: 6 } },
        children: [
          new TextRun({ text: "From ChatGPT to Agent — 給同事的 10 分鐘入門", font: FONT, size: 24, italic: true, color: MUTED }),
        ],
      }),

      // ---------- 摘要 ----------
      h2("摘要"),
      richP([
        { text: "「" },
        { text: "AI 代理人 (AI Agent)", bold: true, color: NAVY },
        { text: "」是 2025 年起最熱的關鍵字。簡單講，它就是一個會" },
        { text: "自己拆解任務、規劃步驟、操作工具、邊做邊修正", bold: true, color: NAVY },
        { text: "的 AI 系統 — 不是只會聊天的對話模型。" },
      ]),
      richP([
        { text: "本報告濃縮 10 個重點，幫你 " },
        { text: "10 分鐘建立完整的代理人世界觀", bold: true },
        { text: "：什麼是、怎麼運作、有哪些、能幫我們做什麼、要當心什麼、怎麼開始。" },
      ]),

      // ---------- 1. 為什麼現在要懂 ----------
      h2("一、為什麼現在你必須懂"),
      p("過去三年，AI 從「會聊天」走到「會做事」。這不是另一個流行詞，而是工作型態正在被重塑："),
      bullet("2022：ChatGPT 問世 — 對話式 AI 走入大眾。"),
      bullet("2023：GPT-4 / Claude 2 — 工具呼叫、長文本理解。"),
      bullet("2024：Function Calling 成熟 — AI 開始能用工具。"),
      bullet("2025：Agent 產品爆發 — Claude Code、Manus、Devin 等紛紛上線，產業稱為「Agent 元年」。"),
      bullet("2026：你我的日常工具 — 不懂代理人，等於 2010 年不會用智慧手機。"),
      richP([
        { text: "重點不是「會不會被取代」，而是「" },
        { text: "你會不會用這個新工具，把自己升級成會駕馭它的人", bold: true, color: NAVY },
        { text: "」。" },
      ]),

      // ---------- 2. 什麼是 ----------
      h2("二、什麼是 AI 代理人？"),
      richP([
        { text: "一句話定義：", bold: true },
        { text: "給它一個目標，它會自己拆解、規劃、執行、修正，直到目標達成。" },
      ]),
      p("和你常用的 ChatGPT 對話介面差別在哪？"),
      buildComparisonTable(),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("")] }),
      richP([
        { text: "比喻：", bold: true },
        { text: "普通 LLM 像「客服信箱」，你寫一封它回一封；AI 代理人像「實習生」，你交付任務、它自己跑流程，跑完帶結果回來。" },
      ]),

      // ---------- 3. 四大組件 ----------
      h2("三、AI 代理人的四大組件"),
      p("拆開來看，每個代理人都由四塊組成。少了任何一塊，就只是「會講話的玩具」："),
      h3("1. 大腦 (LLM)"),
      p("Claude、GPT、Gemini 等大型語言模型。負責理解、推理、產生決策。它是代理人的「思考核心」。"),
      h3("2. 工具 (Tools)"),
      p("讀檔、寫檔、執行終端機指令、上網搜尋、呼叫外部 API、操作瀏覽器⋯⋯ 工具是代理人「伸出去的手」，決定它能做哪些事。"),
      h3("3. 記憶 (Memory)"),
      bullet("短期：當前對話／當次任務的脈絡。"),
      bullet("長期：跨會話保留的事實、偏好、風格 — 例如「我是慈濟醫院的同仁」、「報告要繁中」。"),
      h3("4. 規劃 (Planning)"),
      p("把一個大目標 (例如「整理 50 份回饋表」) 拆成具體步驟，依序執行，遇到狀況再動態調整路線。"),

      // ---------- 4. 怎麼運作 ----------
      h2("四、它是怎麼運作的？— ReAct 迴圈"),
      p("代理人不是「一次答完」，而是不斷重複以下四步，直到目標達成："),
      numbered("觀察：讀現況、收集資訊（讀檔、看上一步結果）。"),
      numbered("思考：拆解任務、選擇下一步要用哪個工具。"),
      numbered("行動：呼叫工具、執行那一步。"),
      numbered("反思：結果對嗎？要不要改路？要不要重試？"),
      calloutBox([
        "重點：每一步的結果，會回頭餵給下一步的思考。",
        "這就是為什麼它能「自己解問題」 — 而不是傻傻地按死腳本跑。",
      ]),

      // ---------- 5. 主流產品 ----------
      h2("五、目前主流 AI 代理人盤點"),
      p("我們不需要全部都用，但要知道生態長什麼樣子。"),
      buildProductTable(),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("")] }),
      richP([
        { text: "建議起手式：", bold: true, color: NAVY },
        { text: "ChatGPT (聊天) → Claude (寫作 / 分析) → Claude Code 或 Manus (代理人)。從輕到重。" },
      ]),

      // ---------- 6. 應用 ----------
      h2("六、我們的工作可以怎麼用？"),
      h3("備課與教材製作"),
      p("把 PDF 丟給代理人，它能幫你抓重點、生講義、做題庫；甚至產出投影片大綱、學習單草稿。"),
      h3("批改與回饋"),
      p("依評分標準產生評語草稿。第一稿由代理人寫，老師只做最後潤飾與品質把關 — 一致性高、初稿很省時。"),
      h3("行政與表單"),
      p("整理公文、彙整成績、產出會議紀要、跑重複性流程 (重新命名檔案、合併試算表、轉檔)。"),
      h3("學生個別化指導"),
      p("依學生程度生成差異化練習題；做課後隨身助教，學生不怕被問煩，老師也省下重複講解時間。"),

      // ---------- 7. 限制 ----------
      h2("七、別急著上路：限制與風險"),
      bullet("幻覺 (Hallucination)：言之鑿鑿但是錯的。關鍵內容（成績、名字、引用）務必人工核對。"),
      bullet("隱私／資料外流：學生姓名、身份證、成績不要直接丟到外部模型。需要時先去識別化。"),
      bullet("成本與時間：代理人會跑很多步，API 費用 / 時間都比單次聊天高，要有預算意識。"),
      bullet("過度依賴：讓它做事、別讓它替你思考。判斷力不能外包；最終決策還是人。"),
      richP([
        { text: "原則：", bold: true, color: AMBER },
        { text: "把「重複、規則明確、可驗證」的工作交給它；把「判斷、關係、溫度」留給人。" },
      ]),

      // ---------- 8. 三步驟入門 ----------
      h2("八、三步驟，從零到代理人"),
      h3("Step 1 — 把 Prompt 寫好"),
      p("練習清楚表達需求：身份、目標、限制、輸出格式。這是後面所有事情的地基。"),
      bullet("可用工具：ChatGPT、Claude、Gemini。"),
      h3("Step 2 — 用 AI 助理上手"),
      p("讓它陪你想、整理、寫初稿。人是駕駛，AI 是副駕。建立「對 AI 描述任務」的肌肉記憶。"),
      bullet("可用工具：ChatGPT、Claude、NotebookLM (餵資料給它讀)。"),
      h3("Step 3 — 試試 AI 代理人"),
      p("丟一個小目標讓它自己跑：整理一個資料夾、做一份統計、生一份草稿。先從低風險、可驗證的任務開始。"),
      bullet("可用工具：Claude Code、Manus、Cursor。"),

      // ---------- 9. 結語 ----------
      h2("九、結語"),
      richP([
        { text: "與其取代你，不如增強你。", bold: true, color: NAVY, size: 28 },
      ]),
      p("AI 代理人不是來搶飯碗，是來幫你把雜事打包。把重複交給它，把判斷與溫度留給人。"),
      p("這場變化是長期的、不可逆的。早一點開始試、早一點建立工作習慣，就能把這波紅利留在自己手上。"),
      p("有任何想試的場景或問題，歡迎隨時來找我聊。"),

      // ---------- 結尾署名 ----------
      new Paragraph({
        spacing: { before: 360, after: 0 },
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "— Tinghan · 2026.05", font: FONT, size: 20, italic: true, color: MUTED }),
        ],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("tools/ai-agent-intro/AI代理人入門報告.docx", buf);
  console.log("OK: tools/ai-agent-intro/AI代理人入門報告.docx");
});
