// Elementos do DOM
const foodList = document.getElementById('foodList');
const cleaningList = document.getElementById('cleaningList');
const descItem = document.getElementById('desc');
const category = document.getElementById('category');
const btnNew = document.getElementById('btnNew');
const addItem = document.querySelector('.add-item');
const editDesc = document.getElementById('editDesc');
const editCategory = document.getElementById('editCategory');
const editPurchased = document.getElementById('editPurchased');
const monthSelect = document.getElementById('month');
const yearSelect = document.getElementById('year');

let items = [];
let editIndex = null;
let itemIndexToDelete = null;

// Função para gerar opções de ano
function generateYearOptions() {
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    for (let year = 2025; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;
}

// Função para obter o mês atual
function getCurrentMonth() {
    const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return monthNames[new Date().getMonth()];
}

// Inicializar mês e ano
function initializeMonthAndYear() {
    let month = monthSelect.value || getCurrentMonth();
    let year = yearSelect.value || new Date().getFullYear();
    monthSelect.value = month;
    yearSelect.value = year;
    return { month, year };
}

generateYearOptions();
let { month, year } = initializeMonthAndYear();

// Atualizar lista ao mudar mês ou ano
monthSelect.addEventListener('change', function () {
    month = this.value;
    loadItems(year, month);
});

yearSelect.addEventListener('change', function () {
    year = this.value;
    loadItems(year, month);
});

// Atualizar rodapé
document.getElementById('copy').innerHTML = `Ⓒ CFP - Controle Financeiro Pessoal - ${new Date().getFullYear()} - Todos os direitos reservados.`;

// Modal para adicionar item
const modalNewItem = () => {
    document.querySelector('.add-modal').classList.toggle('visible');
};

if (addItem) {
    addItem.addEventListener('click', () => {
        modalNewItem();
    });
}

document.querySelector('.close').onclick = () => {
    modalNewItem();
};

// Adicionar novo item
btnNew.onclick = () => {
    if (descItem.value === '') {
        return newToast('error', 'Preencha a descrição do item.');
    }

    const initialLength = items.length;

    items.push({
        description: descItem.value,
        category: category.value,
        purchased: false
    });

    const sts = setItemsBD(year, month);
    loadItems(year, month);

    descItem.value = '';

    if (items.length > initialLength) {
        setTimeout(() => {
            modalNewItem();
        }, 1000);
        newToast('success', 'Item adicionado com sucesso.');
    }
};

// Modal para editar item
document.getElementById('closeModal').onclick = () => {
    document.querySelector('.edit-modal').classList.toggle('visible');
};

// Editar item
function editItem(index) {
    editIndex = index;
    const item = items[index];
    editDesc.value = item.description;
    editCategory.value = item.category;
    editPurchased.checked = item.purchased;
    document.querySelector('.edit-modal').classList.toggle('visible');
}

function saveEdit() {
    if (editDesc.value === '') {
        return newToast('error', 'Preencha a descrição do item.');
    }

    items[editIndex].description = editDesc.value;
    items[editIndex].category = editCategory.value;
    items[editIndex].purchased = editPurchased.checked;

    const sts = setItemsBD(year, month);
    loadItems(year, month);

    document.querySelector('.edit-modal').classList.toggle('visible');
    newToast(sts ? 'success' : 'error', sts ? 'Item editado com sucesso.' : 'Erro ao editar o item.');
}

// Inserir item na tabela
function insertItem(item, index) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${item.description}</td>
        <td class="columnType">
            ${item.purchased
                ? '<i class="fa-solid fa-check-circle" title="Comprado"></i>'
                : '<i class="fa-solid fa-circle" title="Não comprado"></i>'
            }
        </td>
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
    return tr;
}

// Carregar itens
function loadItems(year, month) {
    items = getItemsBD(year, month);
    foodList.innerHTML = '';
    cleaningList.innerHTML = '';

    items.forEach((item, index) => {
        const tr = insertItem(item, index);
        if (item.category === 'Alimentos') {
            foodList.appendChild(tr);
        } else {
            cleaningList.appendChild(tr);
        }
    });
}

// Obter itens do localStorage
const getItemsBD = (year, month) => {
    const data = JSON.parse(localStorage.getItem(`db_shopping_${year}`)) || {
        year: year,
        active_month: month,
        months: {}
    };

    if (!data.months[month]) {
        data.months[month] = { items: [] };
        localStorage.setItem(`db_shopping_${year}`, JSON.stringify(data));
    }

    return data.months[month].items || [];
};

// Salvar itens no localStorage
const setItemsBD = (year, month) => {
    try {
        const data = JSON.parse(localStorage.getItem(`db_shopping_${year}`)) || {
            year: year,
            active_month: month,
            months: {}
        };

        data.months[month] = data.months[month] || { items: [] };
        data.months[month].items = items;
        data.active_month = month;

        localStorage.setItem(`db_shopping_${year}`, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
        return false;
    }
};

// Excluir item
const deleteModal = document.querySelector('.delete-modal');

function deleteItem(index) {
    itemIndexToDelete = index;
    deleteModal.classList.toggle('active');
}

document.querySelector('.confirm').addEventListener('click', () => {
    if (itemIndexToDelete !== null) {
        items.splice(itemIndexToDelete, 1);
        const sts = setItemsBD(year, month);
        loadItems(year, month);
        newToast(sts ? 'success' : 'error', sts ? 'Item removido com sucesso.' : 'Erro ao remover o item.');
        itemIndexToDelete = null;
    }
    deleteModal.classList.toggle('active');
});

document.querySelector('.cancel').addEventListener('click', () => {
    itemIndexToDelete = null;
    deleteModal.classList.toggle('active');
});

// Função para exibir toast
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

// Fechar modais ao clicar fora
window.onclick = function (event) {
    if (event.target.classList.contains('add-modal')) {
        document.querySelector('.add-modal').classList.toggle('visible');
    }
    if (event.target.classList.contains('edit-modal')) {
        document.querySelector('.edit-modal').classList.toggle('visible');
    }
    if (event.target.classList.contains('delete-modal')) {
        document.querySelector('.delete-modal').classList.toggle('active');
    }
};

// Carregar itens ao iniciar
loadItems(year, month);