const STORAGE_KEY = "neotrack-expenses-v1";

const form = document.getElementById("expense-form");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const notesInput = document.getElementById("notes");
const statusMsg = document.getElementById("status-msg");
const typeToggle = document.getElementById("type-toggle");

const listEl = document.getElementById("expense-list");
const emptyStateEl = document.getElementById("empty-state");
const filterChips = document.querySelectorAll(".chip");

const summaryBalance = document.getElementById("summary-balance");
const summaryBalanceTrend = document.getElementById("summary-balance-trend");
const summaryIncome = document.getElementById("summary-income");
const summaryIncomeCount = document.getElementById("summary-income-count");
const summaryExpense = document.getElementById("summary-expense");
const summaryExpenseCount = document.getElementById("summary-expense-count");
const summaryExpenseTrend = document.getElementById("summary-expense-trend");

const breakdownList = document.getElementById("breakdown-list");

let currentType = "expense";
let currentFilter = "all";
let expenses = loadExpenses();

// Initialize
dateInput.valueAsDate = new Date();
renderAll();

// Event listeners
typeToggle.addEventListener("click", (e) => {
  if (!e.target.matches(".toggle")) return;
  document.querySelectorAll(".toggle").forEach((btn) => {
    btn.classList.toggle("active", btn === e.target);
  });
  currentType = e.target.dataset.type;
});

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filterChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter;
    renderList();
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value || new Date().toISOString().slice(0, 10);
  const notes = notesInput.value.trim();

  if (!title || !amount || amount <= 0) {
    setStatus("Please enter a valid title and amount.", "error");
    return;
  }

  const newEntry = {
    id: Date.now(),
    title,
    amount,
    category,
    date,
    notes,
    type: currentType,
    createdAt: new Date().toISOString(),
  };

  expenses.unshift(newEntry);
  saveExpenses();
  renderAll();

  form.reset();
  dateInput.valueAsDate = new Date();
  setStatus("Transaction saved.", "ok");
});

// Core functions
function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse expenses", e);
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function formatCurrency(value) {
  return "₹" + Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function setStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className = "status " + (type || "");
  if (msg) {
    setTimeout(() => {
      statusMsg.textContent = "";
      statusMsg.className = "status";
    }, 2500);
  }
}

function renderAll() {
  renderSummary();
  renderList();
  renderBreakdown();
}

function renderList() {
  listEl.innerHTML = "";
  const filtered = currentFilter === "all" 
    ? expenses 
    : expenses.filter((e) => e.type === currentFilter);

  if (!filtered.length) {
    emptyStateEl.style.display = "block";
    return;
  }
  emptyStateEl.style.display = "none";

  filtered.slice(0, 10).forEach((entry) => {
    const row = document.createElement("div");
    row.className = "table-row";

    // Main content
    const main = document.createElement("div");
    main.className = "expense-main";
    const titleEl = document.createElement("div");
    titleEl.className = "expense-title";
    titleEl.textContent = entry.title;
    const meta = document.createElement("div");
    meta.className = "expense-meta";
    const d = new Date(entry.date || entry.createdAt);
    meta.textContent = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }) + (entry.notes ? " • " + entry.notes : "");
    main.append(titleEl, meta);

    // Category
    const cat = document.createElement("div");
    const catBadge = document.createElement("div");
    catBadge.className = "badge badge-category";
    catBadge.textContent = entry.category;
    cat.appendChild(catBadge);

    // Amount
    const amountDiv = document.createElement("div");
    const amtBadge = document.createElement("div");
    amtBadge.className = "badge badge-amount " + (entry.type === "expense" ? "expense" : "income");
    const sign = entry.type === "expense" ? "-" : "+";
    amtBadge.textContent = sign + formatCurrency(entry.amount).slice(1);
    amountDiv.appendChild(amtBadge);

    // Delete button
    const actions = document.createElement("div");
    const delBtn = document.createElement("button");
    delBtn.className = "btn-icon";
    delBtn.innerHTML = "×";
    delBtn.title = "Delete";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Delete this transaction?")) {
        expenses = expenses.filter((e) => e.id !== entry.id);
        saveExpenses();
        renderAll();
      }
    });
    actions.appendChild(delBtn);

    row.append(main, cat, amountDiv, actions);
    listEl.appendChild(row);
  });
}

function renderSummary() {
  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const incomeCount = expenses.filter((e) => e.type === "income").length;

  const totalExpense = expenses
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);
  const expenseCount = expenses.filter((e) => e.type === "expense").length;

  const balance = totalIncome - totalExpense;

  summaryIncome.textContent = formatCurrency(totalIncome);
  summaryIncomeCount.textContent = `${incomeCount} ${incomeCount === 1 ? "entry" : "entries"}`;

  summaryExpense.textContent = formatCurrency(totalExpense);
  summaryExpenseCount.textContent = `${expenseCount} ${expenseCount === 1 ? "entry" : "entries"}`;

  summaryBalance.textContent = formatCurrency(balance);

  const expensePctOfIncome = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;
  summaryExpenseTrend.querySelector("span").textContent = expensePctOfIncome + "%";

  // Balance trend (last 5 vs previous 5)
  const lastTen = expenses.slice(0, 10);
  if (lastTen.length >= 4) {
    const mid = Math.floor(lastTen.length / 2);
    const recent = lastTen.slice(0, mid);
    const prev = lastTen.slice(mid);
    
    const balRecent = sumType(recent, "income") - sumType(recent, "expense");
    const balPrev = sumType(prev, "income") - sumType(prev, "expense");
    const diff = balPrev ? ((balRecent - balPrev) / Math.abs(balPrev)) * 100 : 0;
    const rounded = Math.round(diff);
    summaryBalanceTrend.querySelector("span").textContent = (rounded >= 0 ? "+" : "") + rounded + "%";
    summaryBalanceTrend.classList.toggle("down", rounded < 0);
  }
}

function sumType(arr, type) {
  return arr.filter((e) => e.type === type).reduce((sum, e) => sum + e.amount, 0);
}

function renderBreakdown() {
  breakdownList.innerHTML = "";

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthlyExpenses = expenses.filter(
    (e) => e.type === "expense" && (e.date || e.createdAt).startsWith(monthKey)
  );

  if (!monthlyExpenses.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No expenses yet this month.";
    breakdownList.appendChild(empty);
    return;
  }

  const totalsByCategory = {};
  monthlyExpenses.forEach((e) => {
    totalsByCategory[e.category] = (totalsByCategory[e.category] || 0) + e.amount;
  });

  const total = Object.values(totalsByCategory).reduce((sum, v) => sum + v, 0);
  const sorted = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1]);

  sorted.slice(0, 4).forEach(([category, value], index) => {
    const row = document.createElement("div");
    row.className = "breakdown-item";

    const left = document.createElement("div");
    left.className = "breakdown-left";
    
    const dot = document.createElement("div");
    dot.className = `dot ${index === 0 ? "alert" : index === 1 ? "alt" : ""}`;
    
    const catName = document.createElement("span");
    catName.textContent = category;
    
    left.append(dot, catName);

    const right = document.createElement("div");
    const amount = document.createElement("span");
    amount.textContent = formatCurrency(value);
    const pct = document.createElement("span");
    pct.className = "percentage";
    pct.textContent = `(${Math.round((value / total) * 100)}%)`;
    right.append(amount, pct);

    row.append(left, right);
    breakdownList.appendChild(row);
  });
}
