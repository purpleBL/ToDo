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

let sortable = null;
let dragEnabled = false;

function saveTodosToStorage() {
  const todos = [];
  document.querySelectorAll('.todoWrapper').forEach(wrapper => {
    const input = wrapper.querySelector('.todoInput');
    const checked = wrapper.querySelector('.todoCheckbox').checked;
    const text = input.value;
    const height = input.scrollHeight;
    todos.push({ text, checked, height });
  });
  localStorage.setItem('todos', JSON.stringify(todos));
}

function createTodoElement(todo) {
  const wrapper = document.createElement('div');
  wrapper.className = 'todoWrapper';

  const deleteBtn = document.createElement('div');
  deleteBtn.className = 'deleteBtn';
  deleteBtn.textContent = 'Удалить';

  const item = document.createElement('div');
  item.className = 'todoItem';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'todoCheckbox';
  checkbox.checked = todo.checked;

  const input = document.createElement('textarea');
  input.className = 'todoInput';
  input.placeholder = '';
  input.value = todo.text || '';
  input.rows = 1;
  input.spellcheck = false;
  input.maxLength = 200;

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

  checkbox.addEventListener('change', () => {
    input.classList.toggle('checked', checkbox.checked);
    input.readOnly = checkbox.checked || dragEnabled;
    saveTodosToStorage();
  });

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

  if (checkbox.checked) {
    input.classList.add('checked');
    input.readOnly = true;
  }

  item.appendChild(checkbox);
  item.appendChild(input);
  item.appendChild(sortIcon);
  wrapper.appendChild(item);
  wrapper.appendChild(deleteBtn);
  todoList.prepend(wrapper);

  // Swipe события
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

  // Клик мышкой в зону удаления
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
  const hasItems = todoList.querySelectorAll('.todoWrapper').length > 0;
  toggleDragBtn.disabled = !hasItems;
  clearAllBtn.disabled = !hasItems;
  toggleDragBtn.style.opacity = hasItems ? '1' : '0.1';
  clearAllBtn.style.opacity = hasItems ? '1' : '0.1';
  toggleDragBtn.style.cursor = hasItems ? 'pointer' : 'not-allowed';
  clearAllBtn.style.cursor = hasItems ? 'pointer' : 'not-allowed';
}

function createTodoItem() {
  if (dragEnabled) return;
  const todo = { text: '', checked: false, height: 48 };
  const wrapper = createTodoElement(todo);
  todoList.prepend(wrapper);
  const input = wrapper.querySelector('.todoInput');
  input.focus();
  updateButtonsState();
  saveTodosToStorage();
}

addBtn.addEventListener('click', createTodoItem);

toggleDragBtn.addEventListener('click', () => {
  dragEnabled = !dragEnabled;
  toggleDragBtn.classList.toggle('sortingActive', dragEnabled);

  document.querySelectorAll('.todoItem').forEach(item => {
    const input = item.querySelector('.todoInput');
    const checkbox = item.querySelector('.todoCheckbox');
    item.classList.toggle('sorting', dragEnabled);
    item.classList.remove('swiped');
    input.readOnly = dragEnabled || checkbox.checked;
    checkbox.disabled = dragEnabled;
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

updateButtonsState();
loadTodosFromStorage();