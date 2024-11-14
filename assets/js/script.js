// src/main.js
document.addEventListener("DOMContentLoaded", () => {
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

  let items = getItensBD();
  let editIndex;

  // Modal toggle functions
  const modalNewItem = () => document.querySelector('.add-modal').classList.toggle('visible');
  addItem.addEventListener('click', modalNewItem);
  document.querySelector(".close").addEventListener('click', modalNewItem);

  btnNew.addEventListener('click', () => {
    if (descItem.value === "" || amount.value === "" || type.value === "") {
      return newToast('error', 'Preencha todos os campos.');
    }

    const initialLength = items.length;
    items.push({
      desc: descItem.value,
      amount: Math.abs(amount.value).toFixed(2),
      type: type.value,
    });

    setItensBD();
    loadItens();
    descItem.value = "";
    amount.value = "";

    if (items.length > initialLength) {
      setTimeout(modalNewItem, 1000);
      newToast('success', 'Item adicionado com sucesso.');
    }
  });

  document.getElementById("closeModal").addEventListener("click", () => {
    document.querySelector(".edit-modal").classList.toggle('visible');
  });

  function editItem(index) {
    editIndex = index;
    const item = items[index];
    editDesc.value = item.desc;
    editAmount.value = item.amount;
    editType.value = item.type;
    document.querySelector(".edit-modal").classList.toggle('visible');
  }

  function saveEdit() {
    items[editIndex].desc = editDesc.value;
    items[editIndex].amount = Number(editAmount.value);
    items[editIndex].type = editType.value;

    const sts = setItensBD();
    loadItens();
    document.querySelector(".edit-modal").classList.toggle('visible');
    newToast(sts ? 'success' : 'error', sts ? 'Item editado com sucesso.' : 'Erro ao editar o item.');
  }

  function insertItem(item, index) {
    let tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.desc}</td>
      <td>R$ ${item.amount}</td>
      <td class="columnType">${item.type === "entrada"
        ? '<i class="fa-solid fa-circle-up" title="Entradas"></i>'
        : '<i class="fa-solid fa-circle-down" title="Saídas"></i>'
      }</td>
      <td class="columnAction">
        <button onclick="editItem(${index})"
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
      </td>
      <td class="columnAction">
        <button onclick="deleteItem(${index})">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
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
    const amountIncomes = items.filter((item) => item.type === "entrada").map((transaction) => Number(transaction.amount));
    const amountExpenses = items.filter((item) => item.type === "saida").map((transaction) => Number(transaction.amount));

    const totalIncomes = amountIncomes.reduce((acc, cur) => acc + cur, 0).toFixed(2);
    const totalExpenses = Math.abs(amountExpenses.reduce((acc, cur) => acc + cur, 0)).toFixed(2);
    const totalItems = (totalIncomes - totalExpenses).toFixed(2);
    const incomesMaxValue = Math.max(...amountIncomes, 0).toFixed(2);

    incomes.innerHTML = totalIncomes;
    expenses.innerHTML = totalExpenses;
    total.innerHTML = totalItems;
    major.innerHTML = incomesMaxValue;
  }

  const getItensBD = () => JSON.parse(localStorage.getItem("db_items")) ?? [];

  const setItensBD = () => {
    try {
      localStorage.setItem("db_items", JSON.stringify(items));
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

  document.querySelector('.confirm').addEventListener('click', () => {
    if (itemIndexToDelete !== null) {
      items.splice(itemIndexToDelete, 1);
      const sts = setItensBD();
      loadItens();
      newToast(sts ? 'success' : 'error', sts ? 'Item removido com sucesso.' : 'Erro ao remover o item.');
      itemIndexToDelete = null;
    }
    deleteModal.classList.toggle('active');
  });

  document.querySelector('.cancel').addEventListener('click', () => {
    itemIndexToDelete = null;
    deleteModal.classList.toggle('active');
  });

  loadItens();

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
});