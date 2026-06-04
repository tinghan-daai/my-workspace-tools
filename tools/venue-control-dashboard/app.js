const storageKey = "venue-control-dashboard-v1";

const seedItems = [
  ["指示牌", 1, "活動會場方向", "2", "60x160", "", "待確認", "中"],
  ["指示牌", 2, "化妝室", "1", "60x160", "", "待確認", "中"],
  ["指示牌", 3, "報到處", "2", "60x160", "", "待確認", "中"],
  ["迴廊區帆布", 4, "歷史牆", "1", "450x250", "510x285", "設計中", "高"],
  ["迴廊區帆布", 5, "服務台背板", "1", "400x300", "460x335", "設計中", "高"],
  ["迴廊區帆布", 6, "形象牆", "1", "300x300", "360x335", "設計中", "高"],
  ["迴廊區帆布", 7, "議程表", "1", "118x200 易拉展", "", "設計中", "高"],
  ["迴廊區帆布", 8, "講師牆", "1", "550x225", "610x260", "設計中", "高"],
  ["舞台區", 9, "舞台前緣帆布", "1", "1300x49", "", "未開始", "高"],
  ["舞台區", 10, "講台珍珠板", "1", "80x106", "", "未開始", "高"],
  ["舞台區", 11, "講師引言人桌牌", "5", "25x16", "", "未開始", "高"],
  ["舞台區", 12, "麥克風牌", "5", "13x6", "", "未開始", "高"],
  ["座椅區", 13, "拍照布條", "1", "750x80", "", "未開始", "中"],
  ["座椅區", 14, "拍照手舉牌", "1式", "裁型", "", "未開始", "中"],
  ["座椅區", 15, "倒數計時珍珠板", "3", "A3", "", "未開始", "中"],
  ["座椅區", 16, "簽名軸", "1", "110x40", "", "未開始", "中"],
  ["座椅區", 17, "座椅貼", "1式", "14.85x10.5", "紙張輸出不印", "未開始", "中"],
  ["座椅區", 18, "與會者識別證", "250", "8x13", "紙張輸出不印", "未開始", "中"],
  ["座椅區", 19, "貴賓餐敘桌牌", "約10", "20x7", "紙張輸出不印", "未開始", "中"],
];

const statuses = ["未開始", "設計中", "待確認", "已送印", "已完成", "卡關"];
const priorities = ["高", "中", "低"];
const categoryOffsets = {
  舞台區: 3,
  迴廊區帆布: 5,
  指示牌: 6,
  座椅區: 8,
};

const els = {
  totalCount: document.querySelector("#totalCount"),
  doneCount: document.querySelector("#doneCount"),
  riskCount: document.querySelector("#riskCount"),
  weekDueCount: document.querySelector("#weekDueCount"),
  unassignedCount: document.querySelector("#unassignedCount"),
  visibleCount: document.querySelector("#visibleCount"),
  priorityList: document.querySelector("#priorityList"),
  itemRows: document.querySelector("#itemRows"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  riskFilter: document.querySelector("#riskFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  exportCsv: document.querySelector("#exportCsv"),
  resetData: document.querySelector("#resetData"),
};

let items = loadItems();

function isoDateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildSeed() {
  return seedItems.map(([category, seq, title, quantity, size, truss, status, priority]) => ({
    id: seq,
    category,
    seq,
    title,
    quantity,
    size,
    truss,
    status,
    priority,
    owner: "",
    deadline: isoDateAfter(categoryOffsets[category] || 7),
    nextStep: "填負責人、確認稿件與送印節點",
    updatedAt: "",
  }));
}

function loadItems() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return buildSeed();
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : buildSeed();
  } catch {
    return buildSeed();
  }
}

function saveItems() {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

function daysLeft(item) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(`${item.deadline}T00:00:00`);
  return Math.round((deadline - today) / 86400000);
}

function riskFor(item) {
  if (item.status === "已完成") return "綠燈";
  if (item.status === "卡關") return "紅燈";
  const left = daysLeft(item);
  if (left < 0) return "紅燈";
  if (left <= 2) return "黃燈";
  return "綠燈";
}

function filteredItems() {
  const q = els.searchInput.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  const risk = els.riskFilter.value;
  const category = els.categoryFilter.value;

  return items.filter((item) => {
    const text = [item.category, item.title, item.owner, item.nextStep, item.size, item.truss].join(" ").toLowerCase();
    return (!q || text.includes(q))
      && (status === "all" || item.status === status)
      && (risk === "all" || riskFor(item) === risk)
      && (category === "all" || item.category === category);
  });
}

function renderFilters() {
  const categories = [...new Set(items.map((item) => item.category))];
  els.categoryFilter.innerHTML = `<option value="all">全部</option>${categories.map((category) => `<option>${escapeHtml(category)}</option>`).join("")}`;
}

function renderKpis() {
  const risks = items.map(riskFor);
  els.totalCount.textContent = items.length;
  els.doneCount.textContent = items.filter((item) => item.status === "已完成").length;
  els.riskCount.textContent = risks.filter((risk) => risk === "紅燈" || risk === "黃燈").length;
  els.weekDueCount.textContent = items.filter((item) => item.status !== "已完成" && daysLeft(item) >= 0 && daysLeft(item) <= 7).length;
  els.unassignedCount.textContent = items.filter((item) => !item.owner.trim()).length;
}

function renderPriorityList() {
  const urgent = [...items]
    .filter((item) => item.status !== "已完成")
    .sort((a, b) => {
      const riskRank = { 紅燈: 0, 黃燈: 1, 綠燈: 2 };
      const priorityRank = { 高: 0, 中: 1, 低: 2 };
      return riskRank[riskFor(a)] - riskRank[riskFor(b)]
        || daysLeft(a) - daysLeft(b)
        || priorityRank[a.priority] - priorityRank[b.priority]
        || a.seq - b.seq;
    })
    .slice(0, 7);

  els.priorityList.innerHTML = urgent.map((item) => `
    <article class="priority-card">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.category)} #${item.seq}</span>
      <span>${escapeHtml(item.status)}</span>
      <span>${item.deadline}（${daysLeft(item)} 天）</span>
      <div class="${riskClass(riskFor(item))} risk-pill">${riskFor(item)}</div>
    </article>
  `).join("");
}

function renderTable() {
  const visible = filteredItems();
  els.visibleCount.textContent = `${visible.length} 筆`;
  if (!visible.length) {
    els.itemRows.innerHTML = `<tr><td colspan="11">${document.querySelector("#emptyState").content.firstElementChild.outerHTML}</td></tr>`;
    return;
  }

  els.itemRows.innerHTML = visible.map((item) => `
    <tr data-id="${item.id}">
      <td>${escapeHtml(item.category)}</td>
      <td>${item.seq}</td>
      <td class="title-cell">
        ${escapeHtml(item.title)}
        <div class="muted">${escapeHtml(item.truss || "無 TRUSS 備註")}</div>
      </td>
      <td>${escapeHtml(item.quantity)}</td>
      <td>${escapeHtml(item.size)}</td>
      <td>
        <select data-field="status" aria-label="${escapeHtml(item.title)} 狀態">
          ${statuses.map((status) => `<option ${status === item.status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
      <td>
        <select data-field="priority" aria-label="${escapeHtml(item.title)} 優先級">
          ${priorities.map((priority) => `<option ${priority === item.priority ? "selected" : ""}>${priority}</option>`).join("")}
        </select>
      </td>
      <td><input data-field="owner" value="${escapeAttr(item.owner)}" placeholder="負責人" /></td>
      <td><input data-field="deadline" type="date" value="${escapeAttr(item.deadline)}" /></td>
      <td><span class="${riskClass(riskFor(item))} risk-pill">${riskFor(item)}</span><div class="muted">${daysLeft(item)} 天</div></td>
      <td><textarea data-field="nextStep" placeholder="下一步">${escapeHtml(item.nextStep)}</textarea></td>
    </tr>
  `).join("");
}

function render() {
  renderKpis();
  renderPriorityList();
  renderTable();
}

function updateItem(id, field, value) {
  items = items.map((item) => item.id === id ? { ...item, [field]: value, updatedAt: new Date().toISOString() } : item);
  saveItems();
  render();
}

function exportCsv() {
  const headers = ["類別", "序", "內容", "數量", "尺寸", "TRUSS", "狀態", "優先級", "負責人", "期限", "剩餘天數", "風險", "下一步", "更新時間"];
  const rows = items.map((item) => [
    item.category,
    item.seq,
    item.title,
    item.quantity,
    item.size,
    item.truss,
    item.status,
    item.priority,
    item.owner,
    item.deadline,
    daysLeft(item),
    riskFor(item),
    item.nextStep,
    item.updatedAt,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "台日長照論壇_會場設計物管制清單.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function riskClass(risk) {
  if (risk === "紅燈") return "risk-red";
  if (risk === "黃燈") return "risk-yellow";
  return "risk-green";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

els.itemRows.addEventListener("change", (event) => {
  const target = event.target;
  const row = target.closest("tr[data-id]");
  if (!row || !target.dataset.field) return;
  updateItem(Number(row.dataset.id), target.dataset.field, target.value);
});

for (const el of [els.searchInput, els.statusFilter, els.riskFilter, els.categoryFilter]) {
  el.addEventListener("input", render);
  el.addEventListener("change", render);
}

els.exportCsv.addEventListener("click", exportCsv);
els.resetData.addEventListener("click", () => {
  const confirmed = window.confirm("要重設所有本機編輯資料嗎？");
  if (!confirmed) return;
  items = buildSeed();
  saveItems();
  renderFilters();
  render();
});

renderFilters();
render();
