const tbody = document.querySelector("tbody");
const descItem = document.querySelector("#desc");
const amount = document.querySelector("#amount");
const type = document.querySelector("#type");
const btnNew = document.querySelector("#btnNew");
const addItem = document.querySelector('.add-item');

const incomes = document.querySelector(".incomes");
const expenses = document.querySelector(".expenses");
const total = document.querySelector(".total");
const major = document.querySelector(".major");

let editDesc = document.getElementById("editDesc");
let editAmount = document.getElementById("editAmount");
let editType = document.getElementById("editType");

let items;
let editIndex;

document.getElementById('copy').innerHTML = `&#9400; CFP - Controle Financeiro Pessoal - ${new Date().getFullYear()} - Todos os direitos reservados.`;

const modalNewItem = () => {
  document.querySelector('.add-modal').classList.toggle('visible');
}

addItem.addEventListener('click', () => {
  modalNewItem();
});

document.querySelector(".close").onclick = function () {
  modalNewItem();
};

btnNew.onclick = () => {
  if (descItem.value === "" || amount.value === "" || type.value === "") {
    return newToast('error', 'Preencha todos os campos.');
  }

  const initialLength = items.length;

  items.push({
    pago: false,
    desc: descItem.value,
    amount: Math.abs(amount.value).toFixed(2),
    type: type.value,    
  });

  setItensBD();

  loadItens();

  descItem.value = "";
  amount.value = "";

  if (items.length > initialLength) {
    setTimeout(() => {
      modalNewItem();
    }, 1000);
    newToast('success', 'Item adicionado com sucesso.');
  }
};

document.getElementById("closeModal").onclick = function () {
  document.querySelector(".edit-modal").classList.toggle('visible');
};

function editItem(index) {
  editIndex = index;

  const item = items[index];
  const typeEntrace = document.querySelector(".edit-modal-content-switch");

  editDesc.value = item.desc;
  editAmount.value = item.amount;
  editType.value = item.type;
  document.getElementById("editPago").checked = item.pago ?? false;

  item.type === "entrada" ? typeEntrace.classList.add("hidden") : typeEntrace.classList.remove("hidden");

  document.querySelector(".edit-modal").classList.toggle('visible');
}

function saveEdit() {
  items[editIndex].pago = document.getElementById("editPago").checked;
  items[editIndex].desc = editDesc.value;
  items[editIndex].amount = Number(editAmount.value);
  items[editIndex].type = editType.value;  

  const sts = setItensBD();
  loadItens();

  document.querySelector(".edit-modal").classList.toggle('visible');
  newToast(sts ? 'success' : 'error', sts ? 'Item editado com sucesso.' : 'Erro ao editar o item.');
}

function insertItem(item, index) {
  const tbody = document.querySelector("tbody");
  const formattedAmount = Number(item.amount).toFixed(2);
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td class="columnType">${item.type === "entrada"
      ? '<i class="fa-solid fa-circle-up" title="Entradas"></i>'
      : '<i class="fa-solid fa-circle-down" title="Saídas"></i>'
    }</td>
    <td>${item.desc}</td>
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
  
  const addItemRow = tbody.querySelector("tr.item");
  tbody.insertBefore(tr, addItemRow);
}

function loadItens() {
  items = getItensBD();
  tbody.innerHTML = "";
  items.forEach((item, index) => {
    insertItem(item, index);
  });

  getTotals();
}

function getTotals() {
  const amountIncomes = items
    .filter((item) => item.type === "entrada")
    .map((transaction) => Number(transaction.amount));

  const amountExpenses = items
    .filter((item) => item.type === "saida")
    .map((transaction) => Number(transaction.amount));

  const totalIncomes = amountIncomes
    .reduce((acc, cur) => acc + cur, 0)
    .toFixed(2);

  const totalExpenses = Math.abs(
    amountExpenses.reduce((acc, cur) => acc + cur, 0)
  ).toFixed(2);

  const totalItems = (totalIncomes - totalExpenses).toFixed(2);

  const incomesMaxValue = Math.max(
    ...items
      .filter((item) => item.type === "entrada")
      .map((transaction) => Number(transaction.amount)), 0
  ).toFixed(2);

  incomes.innerHTML = totalIncomes;
  expenses.innerHTML = totalExpenses;
  total.innerHTML = totalItems;
  major.innerHTML = incomesMaxValue;

}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function loadItemsForMonth(monthKey) {
  const storedItems = JSON.parse(localStorage.getItem(`db_items_${monthKey}`)) ?? [];
  items = storedItems;
  loadItens();
}

const getItensBD = () => {
  const monthKey = getCurrentMonthKey();
  return JSON.parse(localStorage.getItem(`db_items_${monthKey}`)) ?? [];
};

const setItensBD = () => {
  const monthKey = getCurrentMonthKey();
  try {
    localStorage.setItem(`db_items_${monthKey}`, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error("Erro ao salvar no localStorage:", error);
    return false;
  }
};

let itemIndexToDelete = null;

const deleteModal = document.querySelector('.delete-modal');
function deleteItem(index) {
  itemIndexToDelete = index;
  deleteModal.classList.toggle('active');
}

document.querySelector('.confirm').addEventListener('click', function () {
  if (itemIndexToDelete !== null) {
    items.splice(itemIndexToDelete, 1);

    const sts = setItensBD();
    loadItens();

    newToast(sts ? 'success' : 'error', sts ? 'Item removido com sucesso.' : 'Erro ao remover o item.');
    itemIndexToDelete = null;
  }
  deleteModal.classList.toggle('active');
});

document.querySelector('.cancel').addEventListener('click', function () {
  itemIndexToDelete = null;
  deleteModal.classList.toggle('active');
});

loadItens();

function populateMonthSelect() {
  const select = document.getElementById("monthSelect");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, currentMonth - i - 1, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const option = document.createElement("option");
    option.value = monthKey;
    option.textContent = `${monthNames[month]} de ${year}`;
    select.appendChild(option);
  }

  select.value = getCurrentMonthKey();
}

function changeMonth(monthKey) {
  loadItemsForMonth(monthKey);
}

populateMonthSelect();

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

  main.appendChild(toast);
  toast.appendChild(fa);
  toast.appendChild(msg);

  setTimeout(() => {
    toast.classList.add(sts);
    setTimeout(() => {
      toast.classList.remove(sts);
      toast.remove();
    }, 10000);
  }, 300);
}

window.onclick = function (event) {
  if (event.target.classList.contains("edit-modal")) {
    document.querySelector(".edit-modal").classList.toggle('visible');    
  }

  if(event.target.classList.contains("add-modal")){
    document.querySelector('.add-modal').classList.toggle('visible');
  }
};
