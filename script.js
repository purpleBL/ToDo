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

function updateButtonsState() {
  const hasItems = todoList.querySelectorAll('.todoWrapper').length > 0;

  if (!hasItems) {
    toggleDragBtn.disabled = true;
    clearAllBtn.disabled = true;
    toggleDragBtn.style.opacity = '0.1';
    clearAllBtn.style.opacity = '0.1';
    toggleDragBtn.style.cursor = 'not-allowed';
    clearAllBtn.style.cursor = 'not-allowed';
  } else {
    toggleDragBtn.disabled = false;
    clearAllBtn.disabled = false;
    toggleDragBtn.style.opacity = '1';
    clearAllBtn.style.opacity = '1';
    toggleDragBtn.style.cursor = 'pointer';
    clearAllBtn.style.cursor = 'pointer';
  }
}

function createTodoItem() {
  if (dragEnabled) return;

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

  const input = document.createElement('textarea');
input.className = 'todoInput';
input.placeholder = '';
input.rows = 1; // корректная установка строки

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
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

  item.appendChild(checkbox);
  item.appendChild(input);
  item.appendChild(sortIcon);
  wrapper.appendChild(item);
  wrapper.appendChild(deleteBtn);
  todoList.prepend(wrapper);

  input.focus();

  let startX = 0;
  let isSwiped = false;

  item.addEventListener('touchstart', e => {
    if (dragEnabled) return;
    startX = e.touches[0].clientX;
    isSwiped = item.classList.contains('swiped');
  });

  item.addEventListener('touchmove', e => {
    if (dragEnabled) return;
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

  deleteBtn.addEventListener('click', () => {
    todoList.removeChild(wrapper);
    updateButtonsState();
  });

  checkbox.addEventListener('change', () => {
    input.classList.toggle('checked', checkbox.checked);
    input.readOnly = checkbox.checked || dragEnabled;
  });

  if (dragEnabled) {
    item.classList.add('sorting');
  }

  updateButtonsState();
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
});

// Вызываем на старте
updateButtonsState();

// === PWA и постоянное хранилище ===
window.addEventListener('load', () => {
  // Регистрация Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker зарегистрирован:', registration);
      })
      .catch(error => {
        console.error('Ошибка при регистрации Service Worker:', error);
      });
  }

  // Заявка на постоянное хранилище
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => {
      console.log(granted ? 'Постоянное хранилище предоставлено.' : 'Постоянное хранилище не предоставлено.');
    });
  }
});