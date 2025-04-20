// ==============================
// Atribuições
// ==============================

// Elementos da tabela e formulário principal
const tbody = document.querySelector("tbody"),
      descItem = document.querySelector("#desc"),
      amount = document.querySelector("#amount"),
      type = document.querySelector("#type"),
      btnNew = document.querySelector("#btnNew"),
      addItem = document.querySelector('.add-item'),

// Elementos de totais e saldo
      incomes = document.querySelector(".incomes"),
      expenses = document.querySelector(".expenses"),
      total = document.querySelector(".total"),
      balance = document.querySelector(".balance"),

// Modal de confirmação de exclusão
      deleteModal = document.querySelector('.delete-modal');

// Elementos do formulário de edição
let editDesc = document.getElementById("editDesc"),
    editAmount = document.getElementById("editAmount"),
    editType = document.getElementById("editType"),

// Variáveis de controle
    items = [],
    editIndex,
    itemIndexToDelete = null;

// ==============================
// Funções auxiliares
// ==============================

function getCurrentMonth() {
    const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return monthNames[new Date().getMonth()];
}

function generateYearOptions() {
    const yearSelect = document.getElementById("year");
    const currentYear = new Date().getFullYear();

    yearSelect.innerHTML = "";
    for (let year = 2025; year <= currentYear; year++) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;
}

function initializeMonthAndYear() {
    let monthElement = document.getElementById("month");
    let yearElement = document.getElementById("year");

    let month = monthElement.value || getCurrentMonth();
    let year = yearElement.value || new Date().getFullYear();

    monthElement.value = month;
    yearElement.value = year;

    return { month, year };
}

function newToast(sts, message) {
    let main = document.querySelector('main');
    let existingToast = main.querySelector('.toast');
    if (existingToast) existingToast.remove();

    let toast = document.createElement('div');
    let fa = document.createElement('span');
    let msg = document.createElement('span');

    toast.classList.add('toast');
    fa.classList.add('fa-solid');
    msg.classList.add('msg');

    fa.classList.add(sts === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation');
    msg.innerText = message;

    toast.appendChild(fa);
    toast.appendChild(msg);
    main.appendChild(toast);

    setTimeout(() => {
        toast.classList.add(sts);
        setTimeout(() => {
            toast.classList.remove(sts);
            toast.remove();
        }, 10000);
    }, 300);
}

// ==============================
// Funções de modais
// ==============================

const modalNewItem = () => {
    document.querySelector('.add-modal').classList.toggle('visible');
};

// ==============================
// Banco de Dados (localStorage)
// ==============================

const getItensBD = (year, month) => {
    const data = JSON.parse(localStorage.getItem(`db_items_${year}`)) || {
        year: year,
        active_month: month,
        balance: 0,
        months: {}
    };

    if (!data.months[month]) {
        data.months[month] = { itens: [] };
        localStorage.setItem(`db_items_${year}`, JSON.stringify(data));
    }

    return data.months[month].itens || [];
};

const setItensBD = (year, month) => {
    try {
        const data = JSON.parse(localStorage.getItem(`db_items_${year}`)) || {
            year: year,
            active_month: month,
            balance: 0,
            months: {}
        };

        data.months[month] = data.months[month] || { itens: [] };
        data.months[month].itens = items;

        data.balance = Object.values(data.months).reduce((acc, monthData) => {
            return acc + monthData.itens.reduce((monthAcc, item) => {
                return item.type === "entrada" 
                    ? monthAcc + Number(item.amount)
                    : monthAcc - Number(item.amount);
            }, 0);
        }, 0);

        localStorage.setItem(`db_items_${year}`, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Erro ao salvar no localStorage:", error);
        return false;
    }
};

// ==============================
// Funções principais
// ==============================

function insertItem(item, index) {
    const formattedAmount = Number(item.amount).toFixed(2);
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td class="columnType">${item.type === "entrada"
            ? '<i class="fa-solid fa-circle-up" title="Entradas"></i>'
            : '<i class="fa-solid fa-circle-down" title="Saídas"></i>'
        }</td>
        <td>${item.description}</td>
        <td>R$ ${formattedAmount}</td>
        <td class="columnType">${item.type !== "entrada"
            ? item.pago
                ? '<i class="fa-solid fa-check-circle" title="Pago"></i>'
                : '<i class="fa-solid fa-circle" title="Não pago"></i>'
            : '<i class="fa-solid fa-circle-exclamation" title="Tipo Entrada"></i>'
        }</td>    
        <td class="columnAction">
            <button onclick="editItem(${index})" title="Editar">
                <i class="fa-solid fa-pen-to-square"></i>
            </button>
        </td>
        <td class="columnAction">
            <button onclick="deleteItem(${index})" title="Excluir">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </td>
    `;

    tbody.appendChild(tr);
}

function loadItens(year, month) {
    items = getItensBD(year, month);
    tbody.innerHTML = "";
    items.forEach((item, index) => insertItem(item, index));
    getTotals(year, month);   
}

function getTotals(year, month) {
    const amountIncomes = items
        .filter((item) => item.type === "entrada")
        .map((transaction) => Number(transaction.amount));

    const amountExpenses = items
        .filter((item) => item.type === "saida")
        .map((transaction) => Number(transaction.amount));

    const totalIncomes = amountIncomes.reduce((acc, cur) => acc + cur, 0).toFixed(2);
    const totalExpenses = amountExpenses.reduce((acc, cur) => acc + cur, 0).toFixed(2);
    const totalItems = (totalIncomes - totalExpenses).toFixed(2);

    const data = JSON.parse(localStorage.getItem(`db_items_${year}`)) || {
        year: year,
        active_month: month,
        balance: 0,
        months: {}
    };

    const amountBalance = Number(data.balance) || 0.00;

    incomes.innerHTML = totalIncomes;
    expenses.innerHTML = totalExpenses;
    total.innerHTML = totalItems;
    balance.innerText = amountBalance.toFixed(2);
}

function editItem(index) {
    editIndex = index;

    const item = items[index];
    const typeEntrace = document.querySelector(".edit-modal-content-switch");

    editDesc.value = item.description;
    editAmount.value = item.amount;
    editType.value = item.type;
    document.getElementById("editPago").checked = item.pago ?? false;

    typeEntrace.classList.toggle("hidden", item.type === "entrada");

    document.querySelector(".edit-modal").classList.toggle('visible');
}

function saveEdit() {
    items[editIndex].pago = document.getElementById("editPago").checked;
    items[editIndex].description = editDesc.value;
    items[editIndex].amount = Number(editAmount.value).toFixed(2);
    items[editIndex].type = editType.value;

    const sts = setItensBD(year, month);
    loadItens(year, month);

    document.querySelector(".edit-modal").classList.toggle('visible');
    newToast(sts ? 'success' : 'error', sts ? 'Item editado com sucesso.' : 'Erro ao editar o item.');
}

function deleteItem(index) {
    itemIndexToDelete = index;
    deleteModal.classList.toggle('active');
}

// ==============================
// Eventos
// ==============================

generateYearOptions();
let { month, year } = initializeMonthAndYear();

document.getElementById("month").addEventListener('change', function () {
    month = this.value;
    loadItens(year, month);
});

document.getElementById("year").addEventListener('change', function () {
    year = this.value;
    loadItens(year, month);
});

if (addItem) {
    addItem.addEventListener('click', modalNewItem);
}

document.querySelector(".close").onclick = modalNewItem;

btnNew.onclick = () => {
    if (descItem.value === "" || amount.value === "" || type.value === "") {
        return newToast('error', 'Preencha todos os campos.');
    }

    const initialLength = items.length;

    items.push({
        type: type.value,
        description: descItem.value,
        amount: Number(Math.abs(amount.value)).toFixed(2),
        pago: false
    });

    const sts = setItensBD(year, month);
    loadItens(year, month);

    descItem.value = "";
    amount.value = "";

    if (items.length > initialLength) {
        setTimeout(modalNewItem, 1000);
        newToast('success', 'Item adicionado com sucesso.');
    }
};

document.getElementById("closeModal").onclick = () => {
    document.querySelector(".edit-modal").classList.toggle('visible');
};

document.querySelector('.confirm').addEventListener('click', function () {
    if (itemIndexToDelete !== null) {
        items.splice(itemIndexToDelete, 1);
        const sts = setItensBD(year, month);
        loadItens(year, month);
        newToast(sts ? 'success' : 'error', sts ? 'Item removido com sucesso.' : 'Erro ao remover o item.');
        itemIndexToDelete = null;
    }
    deleteModal.classList.toggle('active');
});

document.querySelector('.cancel').addEventListener('click', function () {
    itemIndexToDelete = null;
    deleteModal.classList.toggle('active');
});

window.onclick = function (event) {
    if (event.target.classList.contains("edit-modal")) {
        document.querySelector(".edit-modal").classList.toggle('visible');
    }
    if (event.target.classList.contains("add-modal")) {
        document.querySelector('.add-modal').classList.toggle('visible');
    }
    if (event.target.classList.contains("delete-modal")) {
        document.querySelector('.delete-modal').classList.toggle('active');
    }
};

// ==============================
// Inicialização
// ==============================

loadItens(year, month);