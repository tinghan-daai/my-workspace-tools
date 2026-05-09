// build-pptx.js — 一次搞懂 AI 代理人 (10 slides)
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaBrain,
  FaToolbox,
  FaDatabase,
  FaProjectDiagram,
  FaEye,
  FaLightbulb,
  FaPlay,
  FaSyncAlt,
  FaCode,
  FaTerminal,
  FaCommentDots,
  FaRobot,
  FaUserCog,
  FaSitemap,
  FaBookOpen,
  FaCheckSquare,
  FaClipboardList,
  FaUserGraduate,
  FaExclamationTriangle,
  FaUserShield,
  FaCoins,
  FaUnlink,
  FaPenNib,
  FaHandshake,
  FaRocket,
} = require("react-icons/fa");

// ---------- Palette ----------
const NAVY = "1E2761";
const NAVY_DEEP = "111A47";
const CYAN = "0891B2";
const CYAN_LIGHT = "CFFAFE";
const AMBER = "F59E0B";
const SAND = "FEF3C7";
const BG = "F8FAFC";
const CARD = "FFFFFF";
const TEXT = "0F172A";
const MUTED = "64748B";
const LINE = "E2E8F0";

const FONT_HEAD = "Microsoft JhengHei";
const FONT_BODY = "Microsoft JhengHei";

// ---------- Icon helper ----------
function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}
async function ico(IconComponent, hex = "0F172A") {
  const svg = renderIconSvg(IconComponent, "#" + hex, 256);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}

// ---------- Helpers ----------
const makeShadow = () => ({
  type: "outer",
  color: "000000",
  blur: 8,
  offset: 2,
  angle: 90,
  opacity: 0.08,
});

function addFooter(slide, n, total = 10) {
  slide.addShape("line", {
    x: 0.5, y: 5.35, w: 9, h: 0,
    line: { color: LINE, width: 0.75 },
  });
  slide.addText("一次搞懂 AI 代理人", {
    x: 0.5, y: 5.4, w: 5, h: 0.25,
    fontFace: FONT_BODY, fontSize: 9, color: MUTED, margin: 0,
  });
  slide.addText(`${n} / ${total}`, {
    x: 8.5, y: 5.4, w: 1, h: 0.25,
    fontFace: FONT_BODY, fontSize: 9, color: MUTED, align: "right", margin: 0,
  });
}

function addPageTitle(slide, title, kicker) {
  if (kicker) {
    slide.addText(kicker, {
      x: 0.5, y: 0.35, w: 9, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, color: CYAN, bold: true,
      charSpacing: 4, margin: 0,
    });
  }
  slide.addText(title, {
    x: 0.5, y: kicker ? 0.65 : 0.45, w: 9, h: 0.7,
    fontFace: FONT_HEAD, fontSize: 28, bold: true, color: TEXT, margin: 0,
  });
  slide.addShape("rect", {
    x: 0.5, y: kicker ? 1.32 : 1.12, w: 0.6, h: 0.06,
    fill: { color: AMBER }, line: { color: AMBER },
  });
}

// ============================================================
async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625
  pres.author = "Tinghan Lai";
  pres.title = "一次搞懂 AI 代理人";

  // pre-render icons
  const I = {
    brain: await ico(FaBrain, "FFFFFF"),
    tools: await ico(FaToolbox, "FFFFFF"),
    db: await ico(FaDatabase, "FFFFFF"),
    plan: await ico(FaProjectDiagram, "FFFFFF"),

    eye: await ico(FaEye, "FFFFFF"),
    bulb: await ico(FaLightbulb, "FFFFFF"),
    play: await ico(FaPlay, "FFFFFF"),
    sync: await ico(FaSyncAlt, "FFFFFF"),

    code: await ico(FaCode, NAVY),
    terminal: await ico(FaTerminal, NAVY),
    chat: await ico(FaCommentDots, NAVY),
    robot: await ico(FaRobot, NAVY),
    cog: await ico(FaUserCog, NAVY),
    site: await ico(FaSitemap, NAVY),

    book: await ico(FaBookOpen, "FFFFFF"),
    check: await ico(FaCheckSquare, "FFFFFF"),
    clip: await ico(FaClipboardList, "FFFFFF"),
    grad: await ico(FaUserGraduate, "FFFFFF"),

    warn: await ico(FaExclamationTriangle, AMBER),
    shield: await ico(FaUserShield, AMBER),
    coin: await ico(FaCoins, AMBER),
    unlink: await ico(FaUnlink, AMBER),

    pen: await ico(FaPenNib, "FFFFFF"),
    shake: await ico(FaHandshake, "FFFFFF"),
    rocket: await ico(FaRocket, "FFFFFF"),
  };

  // ============ Slide 1: 封面 ============
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };

    // diagonal accent block (left)
    s.addShape("rect", {
      x: 0, y: 0, w: 0.4, h: 5.625,
      fill: { color: CYAN }, line: { color: CYAN },
    });
    // amber dot grid decoration
    for (let i = 0; i < 6; i++) {
      s.addShape("ellipse", {
        x: 8.6 + (i % 3) * 0.25, y: 0.5 + Math.floor(i / 3) * 0.25,
        w: 0.1, h: 0.1, fill: { color: AMBER }, line: { color: AMBER },
      });
    }

    s.addText("INTERNAL BRIEFING · 2026", {
      x: 0.9, y: 1.2, w: 8, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, color: AMBER, bold: true,
      charSpacing: 8, margin: 0,
    });
    s.addText("一次搞懂 AI 代理人", {
      x: 0.9, y: 1.6, w: 8, h: 1.3,
      fontFace: FONT_HEAD, fontSize: 54, bold: true, color: "FFFFFF", margin: 0,
    });
    s.addText("From ChatGPT to Agent", {
      x: 0.9, y: 2.85, w: 8, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 22, color: CYAN_LIGHT, italic: true, margin: 0,
    });
    s.addShape("rect", {
      x: 0.9, y: 3.5, w: 0.5, h: 0.04,
      fill: { color: AMBER }, line: { color: AMBER },
    });
    s.addText(
      [
        { text: "為同事準備的", options: { color: "CBD5E1", fontSize: 14 } },
        { text: " 10 分鐘 ", options: { color: AMBER, fontSize: 14, bold: true } },
        { text: "入門簡報", options: { color: "CBD5E1", fontSize: 14 } },
      ],
      { x: 0.9, y: 3.65, w: 8, h: 0.4, fontFace: FONT_BODY, margin: 0 }
    );

    s.addText("Tinghan Lai · 2026.05", {
      x: 0.9, y: 5.0, w: 8, h: 0.3,
      fontFace: FONT_BODY, fontSize: 10, color: "94A3B8", margin: 0,
    });
  }

  // ============ Slide 2: 為什麼現在要懂 ============
  {
    const s = pres.addSlide();
    s.background = { color: BG };
    addPageTitle(s, "為什麼現在你必須懂 AI 代理人", "01 · 趨勢");

    // Big stat callout
    s.addShape("rect", {
      x: 0.5, y: 1.7, w: 4.0, h: 3.2,
      fill: { color: NAVY }, line: { color: NAVY },
      shadow: makeShadow(),
    });
    s.addText("2025", {
      x: 0.5, y: 1.85, w: 4.0, h: 0.7,
      fontFace: FONT_HEAD, fontSize: 56, bold: true, color: AMBER,
      align: "center", margin: 0,
    });
    s.addText("被產業稱為", {
      x: 0.5, y: 2.6, w: 4.0, h: 0.3,
      fontFace: FONT_BODY, fontSize: 13, color: CYAN_LIGHT,
      align: "center", margin: 0,
    });
    s.addText("Agent 元年", {
      x: 0.5, y: 2.9, w: 4.0, h: 0.6,
      fontFace: FONT_HEAD, fontSize: 32, bold: true, color: "FFFFFF",
      align: "center", margin: 0,
    });
    s.addText("OpenAI、Anthropic、Google、Manus\n陸續推出可自主行動的代理人產品", {
      x: 0.5, y: 3.6, w: 4.0, h: 1.0,
      fontFace: FONT_BODY, fontSize: 11, color: "CBD5E1",
      align: "center", margin: 0,
    });

    // Right: timeline
    const tx = 5.0;
    const items = [
      ["2022", "ChatGPT 問世", "對話式 AI 走入大眾"],
      ["2023", "GPT-4 / Claude 2", "工具呼叫、長文本"],
      ["2024", "Function Calling 成熟", "AI 開始能用工具"],
      ["2025", "Agent 產品爆發", "Claude Code、Manus、Devin"],
      ["2026", "你我的日常工具", "現在 ⟵ 你在這裡"],
    ];
    items.forEach(([y, head, sub], i) => {
      const ty = 1.75 + i * 0.7;
      const isLast = i === items.length - 1;
      s.addShape("ellipse", {
        x: tx, y: ty + 0.05, w: 0.28, h: 0.28,
        fill: { color: isLast ? AMBER : CYAN },
        line: { color: isLast ? AMBER : CYAN },
      });
      if (i < items.length - 1) {
        s.addShape("line", {
          x: tx + 0.14, y: ty + 0.33, w: 0, h: 0.42,
          line: { color: LINE, width: 1.5 },
        });
      }
      s.addText(y, {
        x: tx + 0.4, y: ty - 0.02, w: 0.7, h: 0.3,
        fontFace: FONT_HEAD, fontSize: 13, bold: true,
        color: isLast ? AMBER : NAVY, margin: 0,
      });
      s.addText(head, {
        x: tx + 1.1, y: ty - 0.02, w: 3.4, h: 0.3,
        fontFace: FONT_HEAD, fontSize: 13, bold: true, color: TEXT, margin: 0,
      });
      s.addText(sub, {
        x: tx + 1.1, y: ty + 0.22, w: 3.4, h: 0.3,
        fontFace: FONT_BODY, fontSize: 10, color: MUTED, margin: 0,
      });
    });

    addFooter(s, 2);
  }

  // ============ Slide 3: 什麼是 AI 代理人 ============
  {
    const s = pres.addSlide();
    s.background = { color: BG };
    addPageTitle(s, "什麼是 AI 代理人？", "02 · 定義");

    // tagline
    s.addText(
      [
        { text: "一句話：", options: { color: MUTED, fontSize: 14 } },
        { text: "給它一個", options: { color: TEXT, fontSize: 16, bold: true } },
        { text: "目標", options: { color: AMBER, fontSize: 16, bold: true } },
        { text: "，它會自己", options: { color: TEXT, fontSize: 16, bold: true } },
        { text: "拆解、規劃、執行、修正", options: { color: CYAN, fontSize: 16, bold: true } },
        { text: "。", options: { color: TEXT, fontSize: 16, bold: true } },
      ],
      { x: 0.5, y: 1.55, w: 9, h: 0.45, fontFace: FONT_BODY, margin: 0 }
    );

    // Two-column comparison
    const col1x = 0.5, col2x = 5.15, colW = 4.35, colY = 2.2, colH = 2.95;

    // Card A: 普通 LLM
    s.addShape("rect", {
      x: col1x, y: colY, w: colW, h: colH,
      fill: { color: CARD }, line: { color: LINE, width: 1 },
      shadow: makeShadow(),
    });
    s.addShape("rect", {
      x: col1x, y: colY, w: colW, h: 0.5,
      fill: { color: "F1F5F9" }, line: { color: "F1F5F9" },
    });
    s.addText("普通 LLM (對話模型)", {
      x: col1x + 0.2, y: colY + 0.05, w: colW - 0.4, h: 0.4,
      fontFace: FONT_HEAD, fontSize: 14, bold: true, color: MUTED, margin: 0,
    });
    s.addText(
      [
        { text: "你問一句、它答一句", options: { bullet: true, breakLine: true, color: TEXT } },
        { text: "只能用文字回應", options: { bullet: true, breakLine: true, color: TEXT } },
        { text: "無法跨步驟、不會自我修正", options: { bullet: true, breakLine: true, color: TEXT } },
        { text: "離開對話就忘", options: { bullet: true, color: TEXT } },
      ],
      {
        x: col1x + 0.3, y: colY + 0.7, w: colW - 0.6, h: colH - 0.85,
        fontFace: FONT_BODY, fontSize: 13, color: TEXT, paraSpaceAfter: 6,
      }
    );

    // Card B: AI 代理人
    s.addShape("rect", {
      x: col2x, y: colY, w: colW, h: colH,
      fill: { color: CARD }, line: { color: CYAN, width: 1.5 },
      shadow: makeShadow(),
    });
    s.addShape("rect", {
      x: col2x, y: colY, w: colW, h: 0.5,
      fill: { color: CYAN }, line: { color: CYAN },
    });
    s.addText("AI 代理人 (Agent)", {
      x: col2x + 0.2, y: colY + 0.05, w: colW - 0.4, h: 0.4,
      fontFace: FONT_HEAD, fontSize: 14, bold: true, color: "FFFFFF", margin: 0,
    });
    s.addText(
      [
        { text: "理解目標 → 自己規劃任務", options: { bullet: true, breakLine: true, color: TEXT, bold: true } },
        { text: "會用工具：上網、讀檔、寫程式", options: { bullet: true, breakLine: true, color: TEXT } },
        { text: "迴圈執行 → 失敗會重試", options: { bullet: true, breakLine: true, color: TEXT } },
        { text: "可以記得脈絡、跨會話延續", options: { bullet: true, color: TEXT } },
      ],
      {
        x: col2x + 0.3, y: colY + 0.7, w: colW - 0.6, h: colH - 0.85,
        fontFace: FONT_BODY, fontSize: 13, color: TEXT, paraSpaceAfter: 6,
      }
    );

    addFooter(s, 3);
  }

  // ============ Slide 4: 四大組件 ============
  {
    const s = pres.addSlide();
    s.background = { color: BG };
    addPageTitle(s, "AI 代理人的四大組件", "03 · 解剖");

    const cards = [
      { icon: I.brain, title: "大腦 (LLM)", body: "Claude、GPT、Gemini —\n負責理解、推理、產生決策", color: NAVY },
      { icon: I.tools, title: "工具 (Tools)", body: "讀檔、寫檔、執行指令、\n上網搜尋、呼叫 API", color: CYAN },
      { icon: I.db, title: "記憶 (Memory)", body: "短期：當前對話脈絡\n長期：跨會話的事實 / 偏好", color: NAVY },
      { icon: I.plan, title: "規劃 (Planning)", body: "把大目標拆成小步驟，\n依序執行、邊做邊修正", color: CYAN },
    ];

    const grid = [
      [0.5, 1.7], [5.15, 1.7],
      [0.5, 3.55], [5.15, 3.55],
    ];
    const cw = 4.35, ch = 1.7;

    cards.forEach((c, i) => {
      const [x, y] = grid[i];
      s.addShape("rect", {
        x, y, w: cw, h: ch,
        fill: { color: CARD }, line: { color: LINE, width: 1 },
        shadow: makeShadow(),
      });
      // colored icon circle
      s.addShape("ellipse", {
        x: x + 0.3, y: y + 0.35, w: 1.0, h: 1.0,
        fill: { color: c.color }, line: { color: c.color },
      });
      s.addImage({
        data: c.icon, x: x + 0.55, y: y + 0.6, w: 0.5, h: 0.5,
      });
      s.addText(c.title, {
        x: x + 1.5, y: y + 0.3, w: cw - 1.7, h: 0.4,
        fontFace: FONT_HEAD, fontSize: 16, bold: true, color: TEXT, margin: 0,
      });
      s.addText(c.body, {
        x: x + 1.5, y: y + 0.75, w: cw - 1.7, h: ch - 0.85,
        fontFace: FONT_BODY, fontSize: 11, color: MUTED, margin: 0,
      });
    });

    addFooter(s, 4);
  }

  // ============ Slide 5: ReAct 迴圈 ============
  {
    const s = pres.addSlide();
    s.background = { color: BG };
    addPageTitle(s, "它怎麼運作？— ReAct 迴圈", "04 · 機制");

    s.addText("代理人不是一次答完，而是「觀察 → 思考 → 行動 → 反思」反覆跑，直到目標達成。", {
      x: 0.5, y: 1.55, w: 9, h: 0.4,
      fontFace: FONT_BODY, fontSize: 13, color: MUTED, margin: 0,
    });

    // 4 steps in horizontal flow
    const steps = [
      { icon: I.eye, title: "觀察", sub: "讀現況\n收集資訊", color: NAVY },
      { icon: I.bulb, title: "思考", sub: "拆解任務\n選擇工具", color: CYAN },
      { icon: I.play, title: "行動", sub: "呼叫工具\n執行步驟", color: AMBER },
      { icon: I.sync, title: "反思", sub: "結果對嗎？\n要不要改路", color: NAVY },
    ];

    const startX = 0.6, stepW = 1.95, gap = 0.15, y = 2.25;
    steps.forEach((st, i) => {
      const x = startX + i * (stepW + gap + 0.3);
      // arrow between
      if (i > 0) {
        const ax = x - gap - 0.3;
        s.addShape("rtTriangle", {
          x: ax, y: y + 1.0, w: 0.3, h: 0.4,
          fill: { color: LINE }, line: { color: LINE },
          rotate: 90,
        });
      }
      s.addShape("rect", {
        x, y, w: stepW, h: 2.4,
        fill: { color: CARD }, line: { color: LINE, width: 1 },
        shadow: makeShadow(),
      });
      // top color band
      s.addShape("rect", {
        x, y, w: stepW, h: 0.12,
        fill: { color: st.color }, line: { color: st.color },
      });
      // icon circle
      s.addShape("ellipse", {
        x: x + (stepW - 0.95) / 2, y: y + 0.3, w: 0.95, h: 0.95,
        fill: { color: st.color }, line: { color: st.color },
      });
      s.addImage({
        data: st.icon, x: x + (stepW - 0.5) / 2, y: y + 0.525, w: 0.5, h: 0.5,
      });
      // step number
      s.addText(`STEP ${i + 1}`, {
        x, y: y + 1.32, w: stepW, h: 0.25,
        fontFace: FONT_BODY, fontSize: 9, color: MUTED, align: "center",
        charSpacing: 4, margin: 0,
      });
      s.addText(st.title, {
        x, y: y + 1.55, w: stepW, h: 0.35,
        fontFace: FONT_HEAD, fontSize: 18, bold: true, color: TEXT,
        align: "center", margin: 0,
      });
      s.addText(st.sub, {
        x, y: y + 1.92, w: stepW, h: 0.45,
        fontFace: FONT_BODY, fontSize: 10, color: MUTED,
        align: "center", margin: 0,
      });
    });

    // bottom note
    s.addShape("rect", {
      x: 0.5, y: 4.85, w: 9, h: 0.4,
      fill: { color: SAND }, line: { color: SAND },
    });
    s.addText("⮕ 這就是為什麼它能「自己解問題」：每一步的結果，會回頭餵給下一步的思考。", {
      x: 0.7, y: 4.88, w: 8.6, h: 0.35,
      fontFace: FONT_BODY, fontSize: 11, color: "78350F", italic: true, margin: 0,
    });

    addFooter(s, 5);
  }

  // ============ Slide 6: 主流產品 ============
  {
    const s = pres.addSlide();
    s.background = { color: BG };
    addPageTitle(s, "你已經在用 (或快用上) 的 AI 代理人", "05 · 盤點");

    const items = [
      { icon: I.code, name: "Claude Code", role: "終端機裡的工程師", note: "讀檔、改程式、跑測試", color: NAVY },
      { icon: I.terminal, name: "Cursor", role: "AI 強化的 IDE", note: "對話式寫程式、重構", color: NAVY },
      { icon: I.chat, name: "ChatGPT Agent", role: "桌面任務自動化", note: "上網查、訂機票、下單", color: NAVY },
      { icon: I.robot, name: "Manus", role: "通用自主代理", note: "丟一個目標，它會交件", color: NAVY },
      { icon: I.cog, name: "Devin", role: "AI 軟體工程師", note: "從需求到部署一條龍", color: NAVY },
      { icon: I.site, name: "n8n / Make", role: "流程自動化", note: "把代理人接成工作流", color: NAVY },
    ];

    // 3 cols × 2 rows
    const cols = 3, gap = 0.2, marginX = 0.5;
    const totalW = 10 - marginX * 2;
    const cw = (totalW - gap * (cols - 1)) / cols;
    const ch = 1.5;
    const startY = 1.7;

    items.forEach((it, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = marginX + c * (cw + gap);
      const y = startY + r * (ch + gap);

      s.addShape("rect", {
        x, y, w: cw, h: ch,
        fill: { color: CARD }, line: { color: LINE, width: 1 },
        shadow: makeShadow(),
      });
      // left accent bar
      s.addShape("rect", {
        x, y, w: 0.08, h: ch,
        fill: { color: CYAN }, line: { color: CYAN },
      });
      // icon
      s.addShape("rect", {
        x: x + 0.25, y: y + 0.25, w: 0.55, h: 0.55,
        fill: { color: CYAN_LIGHT }, line: { color: CYAN_LIGHT },
      });
      s.addImage({
        data: it.icon, x: x + 0.32, y: y + 0.32, w: 0.4, h: 0.4,
      });
      s.addText(it.name, {
        x: x + 0.95, y: y + 0.18, w: cw - 1.05, h: 0.35,
        fontFace: FONT_HEAD, fontSize: 14, bold: true, color: TEXT, margin: 0,
      });
      s.addText(it.role, {
        x: x + 0.95, y: y + 0.52, w: cw - 1.05, h: 0.3,
        fontFace: FONT_BODY, fontSize: 10, color: CYAN, bold: true, margin: 0,
      });
      s.addText(it.note, {
        x: x + 0.25, y: y + 0.95, w: cw - 0.4, h: 0.45,
        fontFace: FONT_BODY, fontSize: 10, color: MUTED, margin: 0,
      });
    });

    addFooter(s, 6);
  }

  // ============ Slide 7: 工作場景應用 ============
  {
    const s = pres.addSlide();
    s.background = { color: BG };
    addPageTitle(s, "我們的工作可以怎麼用？", "06 · 應用");

    const rows = [
      { icon: I.book, title: "備課與教材製作", desc: "抓重點、生講義、做題庫；把 PDF 讀完幫你整理重點", color: NAVY },
      { icon: I.check, title: "批改與回饋", desc: "依評分標準產生評語草稿；一致性高、初稿很省時", color: CYAN },
      { icon: I.clip, title: "行政與表單", desc: "整理公文、彙整成績、產出會議紀要、跑重複性流程", color: NAVY },
      { icon: I.grad, title: "學生個別化指導", desc: "依學生程度生成練習題；做隨身助教、不會被問煩", color: CYAN },
    ];

    const startY = 1.7, rowH = 0.85, gap = 0.05;
    rows.forEach((r, i) => {
      const y = startY + i * (rowH + gap);
      s.addShape("rect", {
        x: 0.5, y, w: 9, h: rowH,
        fill: { color: CARD }, line: { color: LINE, width: 0.75 },
      });
      s.addShape("ellipse", {
        x: 0.7, y: y + 0.15, w: 0.55, h: 0.55,
        fill: { color: r.color }, line: { color: r.color },
      });
      s.addImage({
        data: r.icon, x: 0.78, y: y + 0.225, w: 0.4, h: 0.4,
      });
      s.addText(r.title, {
        x: 1.45, y: y + 0.1, w: 7.9, h: 0.35,
        fontFace: FONT_HEAD, fontSize: 15, bold: true, color: TEXT, margin: 0,
      });
      s.addText(r.desc, {
        x: 1.45, y: y + 0.45, w: 7.9, h: 0.35,
        fontFace: FONT_BODY, fontSize: 11, color: MUTED, margin: 0,
      });
    });

    addFooter(s, 7);
  }

  // ============ Slide 8: 限制與風險 ============
  {
    const s = pres.addSlide();
    s.background = { color: BG };
    addPageTitle(s, "別急著上路：限制與風險", "07 · 警示");

    const cards = [
      { icon: I.warn, title: "幻覺", desc: "言之鑿鑿但是錯的；\n關鍵內容務必人工核對。" },
      { icon: I.shield, title: "隱私／資料外流", desc: "學生姓名、身份證、成績\n不要直接丟到外部模型。" },
      { icon: I.coin, title: "成本與時間", desc: "代理人會跑很多步，\nAPI 費用 / 時間都比聊天高。" },
      { icon: I.unlink, title: "過度依賴", desc: "讓它做事、別讓它替你思考；\n判斷力不能外包。" },
    ];

    const grid = [
      [0.5, 1.7], [5.15, 1.7],
      [0.5, 3.55], [5.15, 3.55],
    ];
    const cw = 4.35, ch = 1.7;
    cards.forEach((c, i) => {
      const [x, y] = grid[i];
      s.addShape("rect", {
        x, y, w: cw, h: ch,
        fill: { color: CARD }, line: { color: LINE, width: 1 },
        shadow: makeShadow(),
      });
      s.addShape("rect", {
        x, y, w: 0.08, h: ch,
        fill: { color: AMBER }, line: { color: AMBER },
      });
      s.addImage({
        data: c.icon, x: x + 0.3, y: y + 0.32, w: 0.55, h: 0.55,
      });
      s.addText(c.title, {
        x: x + 1.05, y: y + 0.3, w: cw - 1.2, h: 0.4,
        fontFace: FONT_HEAD, fontSize: 16, bold: true, color: TEXT, margin: 0,
      });
      s.addText(c.desc, {
        x: x + 0.3, y: y + 0.95, w: cw - 0.55, h: ch - 1.05,
        fontFace: FONT_BODY, fontSize: 11, color: MUTED, margin: 0,
      });
    });

    addFooter(s, 8);
  }

  // ============ Slide 9: 三步驟入門 ============
  {
    const s = pres.addSlide();
    s.background = { color: BG };
    addPageTitle(s, "三步驟，從零到代理人", "08 · 行動");

    const steps = [
      {
        n: "01", icon: I.pen, title: "把 Prompt 寫好",
        body: "練習清楚表達需求：\n身份、目標、限制、輸出格式。",
        tools: "ChatGPT · Claude · Gemini",
      },
      {
        n: "02", icon: I.shake, title: "用 AI 助理上手",
        body: "讓它陪你想、整理、寫初稿。\n人是駕駛、AI 是副駕。",
        tools: "ChatGPT · NotebookLM",
      },
      {
        n: "03", icon: I.rocket, title: "試試 AI 代理人",
        body: "丟一個小目標讓它自己跑：\n整理檔案、做表、生草稿。",
        tools: "Claude Code · Manus · Cursor",
      },
    ];

    const startX = 0.5, w = 3.0, gap = 0.25, y = 1.75, h = 3.4;
    steps.forEach((st, i) => {
      const x = startX + i * (w + gap);
      const isHighlight = i === 2;
      s.addShape("rect", {
        x, y, w, h,
        fill: { color: isHighlight ? NAVY : CARD },
        line: { color: isHighlight ? NAVY : LINE, width: 1 },
        shadow: makeShadow(),
      });
      // step number watermark
      s.addText(st.n, {
        x: x + 0.3, y: y + 0.2, w: 1.5, h: 0.6,
        fontFace: FONT_HEAD, fontSize: 32, bold: true,
        color: isHighlight ? AMBER : "E2E8F0", margin: 0,
      });
      // icon top right
      s.addShape("ellipse", {
        x: x + w - 0.95, y: y + 0.3, w: 0.6, h: 0.6,
        fill: { color: isHighlight ? AMBER : CYAN },
        line: { color: isHighlight ? AMBER : CYAN },
      });
      s.addImage({
        data: st.icon, x: x + w - 0.85, y: y + 0.4, w: 0.4, h: 0.4,
      });
      s.addText(st.title, {
        x: x + 0.3, y: y + 1.0, w: w - 0.6, h: 0.45,
        fontFace: FONT_HEAD, fontSize: 17, bold: true,
        color: isHighlight ? "FFFFFF" : TEXT, margin: 0,
      });
      s.addText(st.body, {
        x: x + 0.3, y: y + 1.55, w: w - 0.6, h: 1.1,
        fontFace: FONT_BODY, fontSize: 11,
        color: isHighlight ? "CBD5E1" : MUTED, margin: 0,
      });
      // tag
      s.addShape("rect", {
        x: x + 0.3, y: y + h - 0.6, w: w - 0.6, h: 0.4,
        fill: { color: isHighlight ? "FFFFFF" : CYAN_LIGHT },
        line: { color: isHighlight ? "FFFFFF" : CYAN_LIGHT },
      });
      s.addText(st.tools, {
        x: x + 0.3, y: y + h - 0.6, w: w - 0.6, h: 0.4,
        fontFace: FONT_BODY, fontSize: 9.5,
        color: isHighlight ? NAVY : NAVY,
        align: "center", valign: "middle", bold: true, margin: 0,
      });
    });

    addFooter(s, 9);
  }

  // ============ Slide 10: 結語 ============
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };

    // background dots
    for (let i = 0; i < 12; i++) {
      const r = Math.random();
      s.addShape("ellipse", {
        x: 8.0 + (i % 4) * 0.4, y: 0.5 + Math.floor(i / 4) * 0.4,
        w: 0.08, h: 0.08,
        fill: { color: i % 3 === 0 ? AMBER : CYAN, transparency: 50 },
        line: { color: i % 3 === 0 ? AMBER : CYAN },
      });
    }

    s.addText("TAKEAWAY", {
      x: 0.7, y: 0.8, w: 8, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, color: AMBER, bold: true,
      charSpacing: 8, margin: 0,
    });
    s.addText("與其取代你，", {
      x: 0.7, y: 1.3, w: 9, h: 1.0,
      fontFace: FONT_HEAD, fontSize: 48, bold: true, color: "FFFFFF", margin: 0,
    });
    s.addText("不如增強你。", {
      x: 0.7, y: 2.25, w: 9, h: 1.0,
      fontFace: FONT_HEAD, fontSize: 48, bold: true, color: AMBER, margin: 0,
    });
    s.addShape("rect", {
      x: 0.7, y: 3.4, w: 0.6, h: 0.05,
      fill: { color: CYAN }, line: { color: CYAN },
    });
    s.addText(
      "AI 代理人不是來搶飯碗，是來幫你把雜事打包。\n把重複交給它，把判斷與溫度留給人。",
      {
        x: 0.7, y: 3.6, w: 8.5, h: 0.9,
        fontFace: FONT_BODY, fontSize: 16, color: "CBD5E1",
        italic: true, margin: 0,
      }
    );

    s.addText("歡迎一起試試。問題、想試的場景，隨時找我聊。", {
      x: 0.7, y: 4.85, w: 8.5, h: 0.4,
      fontFace: FONT_BODY, fontSize: 12, color: "94A3B8", margin: 0,
    });
    s.addText("Tinghan · 2026.05", {
      x: 0.7, y: 5.2, w: 8.5, h: 0.3,
      fontFace: FONT_BODY, fontSize: 10, color: "64748B", margin: 0,
    });
  }

  await pres.writeFile({ fileName: "tools/ai-agent-intro/AI代理人入門簡報.pptx" });
  console.log("OK: tools/ai-agent-intro/AI代理人入門簡報.pptx");
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
