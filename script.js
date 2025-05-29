// Запрет зума iOS
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault());

let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) event.preventDefault();
  lastTouchEnd = now;
});

const addBtn = document.getElementById('addBtn');
const toggleDragBtn = document.getElementById('toggleDragBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const todoList = document.getElementById('todoList');

const confirmPopup = document.getElementById('confirmPopup');
const confirmDelete = document.getElementById('confirmDelete');
const cancelDelete = document.getElementById('cancelDelete');

const addShortText = document.getElementById('addShortText');
const addStandard = document.getElementById('addStandard');
const addNoCheckbox = document.getElementById('addNoCheckbox');

let sortable = null;
let dragEnabled = false;

function saveTodosToStorage() {
  const todos = [];
  document.querySelectorAll('.todoWrapper').forEach(wrapper => {
    const input = wrapper.querySelector('.todoInput');
    const checkbox = wrapper.querySelector('.todoCheckbox');
    const checked = checkbox ? checkbox.checked : false;
    const text = input.value;
    const height = input.scrollHeight;
    const hasCheckbox = !!checkbox;
    const maxLength = input.maxLength;
    const blockType = wrapper.dataset.type || 'standard';
    todos.push({ text, checked, height, hasCheckbox, maxLength, blockType });
  });
  localStorage.setItem('todos', JSON.stringify(todos));
}

function createTodoElement(todo) {
  const wrapper = document.createElement('div');
  wrapper.className = 'todoWrapper';
  wrapper.dataset.type = todo.blockType || 'standard';

  // Добавляем стили в зависимости от типа блока
  if (todo.blockType === 'short') wrapper.classList.add('shortTextBlock');
  if (todo.blockType === 'noCheckbox') wrapper.classList.add('noCheckboxBlock');
  if (todo.blockType === 'standard') wrapper.classList.add('standardBlock');

  const deleteBtn = document.createElement('div');
  deleteBtn.className = 'deleteBtn';
  deleteBtn.textContent = 'Удалить';

  const item = document.createElement('div');
  item.className = 'todoItem';

  let checkbox = null;
  if (todo.hasCheckbox) {
    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todoCheckbox';
    checkbox.checked = todo.checked;

    checkbox.addEventListener('change', () => {
      input.classList.toggle('checked', checkbox.checked);
      input.readOnly = checkbox.checked || dragEnabled;
      saveTodosToStorage();
    });

    item.appendChild(checkbox);
  }

  const input = document.createElement('textarea');
  input.className = 'todoInput';
  input.placeholder = '';
  input.value = todo.text || '';
  input.rows = 1;
  input.spellcheck = false;
  input.maxLength = todo.maxLength || 200;

  if (todo.height) {
    input.style.height = `${todo.height}px`;
  } else {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
  }

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
    saveTodosToStorage();
  });

  if (todo.checked) {
    input.classList.add('checked');
    input.readOnly = true;
  }

  const sortIcon = document.createElement('div');
  sortIcon.className = 'sortIcon';
  sortIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
         width="24" height="24" stroke-width="2">
      <path d="M4 8l16 0"></path>
      <path d="M4 16l16 0"></path>
    </svg>
  `;

  item.appendChild(input);
  item.appendChild(sortIcon);
  wrapper.appendChild(item);
  wrapper.appendChild(deleteBtn);
  todoList.prepend(wrapper);

  let startX = 0;
  let isSwiped = false;

  item.addEventListener('touchstart', e => {
    if (dragEnabled) return;
    const touch = e.touches[0];
    const rect = item.getBoundingClientRect();
    const touchX = touch.clientX;
    const startInSwipeZone = touchX >= rect.right - 56;
    if (!startInSwipeZone) {
      item.dataset.swipeAllowed = 'false';
      return;
    }
    startX = touchX;
    isSwiped = item.classList.contains('swiped');
    item.dataset.swipeAllowed = 'true';
  });

  item.addEventListener('touchmove', e => {
    if (dragEnabled || item.dataset.swipeAllowed !== 'true') return;
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    if (diff > 50 && !isSwiped) {
      item.classList.add('swiped');
      isSwiped = true;
    }
    if (diff < -30 && isSwiped) {
      item.classList.remove('swiped');
      isSwiped = false;
    }
  });

  item.addEventListener('click', e => {
    if (dragEnabled) return;
    const rect = item.getBoundingClientRect();
    const clickX = e.clientX;
    const isInSwipeZone = clickX >= rect.right - 56;
    if (isInSwipeZone) {
      item.classList.toggle('swiped');
    } else {
      item.classList.remove('swiped');
    }
  });

  deleteBtn.addEventListener('click', () => {
    todoList.removeChild(wrapper);
    updateButtonsState();
    saveTodosToStorage();
  });

  if (dragEnabled) {
    item.classList.add('sorting');
  }

  return wrapper;
}

function loadTodosFromStorage() {
  const todos = JSON.parse(localStorage.getItem('todos')) || [];
  todos.reverse().forEach(todo => {
    const wrapper = createTodoElement(todo);
    todoList.prepend(wrapper);
  });
  updateButtonsState();
}

function updateButtonsState() {
  const topBar = document.querySelector('.topBar');
  const topBarOpen = topBar.classList.contains('open');
  const hasItems = todoList.querySelectorAll('.todoWrapper').length > 0;

  const shouldEnable = hasItems && !topBarOpen;

  toggleDragBtn.disabled = !shouldEnable;
  clearAllBtn.disabled = !shouldEnable;
  toggleDragBtn.style.opacity = shouldEnable ? '1' : '0.1';
  clearAllBtn.style.opacity = shouldEnable ? '1' : '0.1';
  toggleDragBtn.style.cursor = shouldEnable ? 'pointer' : 'not-allowed';
  clearAllBtn.style.cursor = shouldEnable ? 'pointer' : 'not-allowed';
}

// === Создание задач ===

function createTodoItem(options = {}) {
  if (dragEnabled) return;
  const todo = {
    text: '',
    checked: false,
    height: 42,
    hasCheckbox: options.hasCheckbox ?? true,
    maxLength: options.maxLength ?? 200,
    blockType: options.blockType ?? 'standard'
  };
  const wrapper = createTodoElement(todo);
  const input = wrapper.querySelector('.todoInput');
  input.focus();
  updateButtonsState();
  saveTodosToStorage();
}

// === Открытие / Закрытие выбора типа ===
addBtn.addEventListener('click', () => {
  if (dragEnabled) return;

  addBtn.classList.toggle('rotate');
  const topBar = document.querySelector('.topBar');
  topBar.classList.toggle('open');
	updateButtonsState();

  const isOpen = topBar.classList.contains('open');

  clearAllBtn.disabled = isOpen;
  clearAllBtn.style.opacity = isOpen ? '0.1' : '1';
  clearAllBtn.style.cursor = isOpen ? 'not-allowed' : 'pointer';
	
	toggleDragBtn.disabled = isOpen;
	toggleDragBtn.style.opacity = isOpen ? '0.1' : '1';
  toggleDragBtn.style.cursor = isOpen ? 'not-allowed' : 'pointer';
});

addShortText.addEventListener('click', () => {
  createTodoItem({ hasCheckbox: false, maxLength: 200, blockType: 'short' });
});

addStandard.addEventListener('click', () => {
  createTodoItem({ hasCheckbox: true, maxLength: 200, blockType: 'standard' });
});

addNoCheckbox.addEventListener('click', () => {
  createTodoItem({ hasCheckbox: false, maxLength: 600, blockType: 'noCheckbox' });
});

// === Сортировка ===
toggleDragBtn.addEventListener('click', () => {
  dragEnabled = !dragEnabled;
  toggleDragBtn.classList.toggle('sortingActive', dragEnabled);

  document.querySelectorAll('.todoItem').forEach(item => {
    const input = item.querySelector('.todoInput');
    const checkbox = item.querySelector('.todoCheckbox');
    item.classList.toggle('sorting', dragEnabled);
    item.classList.remove('swiped');
    input.readOnly = dragEnabled || (checkbox && checkbox.checked);
    if (checkbox) checkbox.disabled = dragEnabled;
  });

  if (dragEnabled) {
    sortable = new Sortable(todoList, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      fallbackOnBody: true,
      swapThreshold: 0.65,
      handle: '.todoItem',
      onEnd: saveTodosToStorage
    });
    addBtn.disabled = true;
    addBtn.style.opacity = '0.1';
    addBtn.style.cursor = 'not-allowed';
    clearAllBtn.disabled = true;
    clearAllBtn.style.opacity = '0.1';
    clearAllBtn.style.cursor = 'not-allowed';
  } else {
    if (sortable) {
      sortable.destroy();
      sortable = null;
    }
    addBtn.disabled = false;
    addBtn.style.opacity = '1';
    addBtn.style.cursor = 'pointer';
    updateButtonsState();
  }
});

// === Очистка ===
clearAllBtn.addEventListener('click', () => {
  if (dragEnabled) return;
  confirmPopup.classList.remove('hidden');
});

cancelDelete.addEventListener('click', () => {
  confirmPopup.classList.add('hidden');
});

confirmDelete.addEventListener('click', () => {
  document.querySelectorAll('.todoWrapper').forEach(wrapper => wrapper.remove());
  confirmPopup.classList.add('hidden');
  updateButtonsState();
  saveTodosToStorage();
});

// === Инициализация ===
updateButtonsState();
loadTodosFromStorage();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });
    });
  });
}

function showUpdateBanner() {
  const banner = document.createElement('div');
  banner.className = 'updateBanner';
  banner.innerHTML = `
    <span>Обновление доступно</span>
    <button id="refreshBtn">Обновить</button>
  `;
  document.body.appendChild(banner);

  document.getElementById('refreshBtn').addEventListener('click', () => {
    window.location.reload(true);
  });
}

const rightBtn = document.getElementById("rightBtn");
const metaThemeColor = document.querySelector("meta[name=theme-color]");

rightBtn.addEventListener("click", () => {
  const isLight = document.documentElement.classList.toggle("light");

  // Сначала меняем фон body
  if (isLight) {
    document.body.style.backgroundColor = "#e3e3e3";
    requestAnimationFrame(() => {
      metaThemeColor.setAttribute("content", "#e3e3e3");
    });
  } else {
    document.body.style.backgroundColor = "#111212";
    requestAnimationFrame(() => {
      metaThemeColor.setAttribute("content", "#111212");
    });
  }
});