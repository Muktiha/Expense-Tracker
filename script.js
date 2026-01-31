let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let totalBudget = JSON.parse(localStorage.getItem("budget")) || 0;
let chart;

function setBudget() {
    const amount = parseFloat(document.getElementById("totalAmount").value);
    if (isNaN(amount)) return alert("Enter valid budget");
    totalBudget = amount;
    localStorage.setItem("budget", totalBudget);
    updateUI();
}

function addExpense() {
    const desc = document.getElementById("desc").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;

    if (!desc || isNaN(amount)) return alert("Enter valid details");

    expenses.push({ desc, amount, category });
    localStorage.setItem("expenses", JSON.stringify(expenses));

    document.getElementById("desc").value = "";
    document.getElementById("amount").value = "";

    updateUI();
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    updateUI();
}

function updateUI() {
    let totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    let balance = totalBudget - totalExpense;

    document.getElementById("budget").textContent = "₹" + totalBudget;
    document.getElementById("expense").textContent = "₹" + totalExpense;
    document.getElementById("balance").textContent = "₹" + balance;

    renderExpenses();
    updateChart();
}

function renderExpenses() {
    const list = document.getElementById("expense-list");
    list.innerHTML = "";

    expenses.slice(-5).reverse().forEach((e, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${e.desc} - ₹${e.amount} (${e.category})
            <button class="delete" onclick="deleteExpense(${expenses.length - 1 - i})">X</button>
        `;
        list.appendChild(li);
    });
}

function updateChart() {
    let categoryTotals = {};

    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("chart"), {
        type: "doughnut",
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: [
                    "#818cf8",
                    "#34d399",
                    "#fbbf24",
                    "#fb7185",
                    "#60a5fa"
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        color: "#e5e7eb",
                        padding: 12
                    }
                }
            }
        }
    });
}

updateUI();
