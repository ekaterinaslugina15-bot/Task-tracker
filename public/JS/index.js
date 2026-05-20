 // API конфигурация - автоматически определяет адрес сервера
const API_URL = window.location.origin + '/api/tasks';
let authToken = null;
let currentSection = 'overdue';
let editingTaskId = null;
let isAuthorized = false;

// DOM элементы
const tasksContainer = document.getElementById('tasksContainer');
const currentSectionTitleSpan = document.getElementById('currentSectionTitle');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskDescInput = document.getElementById('taskDescInput');
const taskOwnerInput = document.getElementById('taskOwnerInput');
const taskDateInput = document.getElementById('taskDateInput');
const taskStatusSelect = document.getElementById('taskStatusSelect');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formError = document.getElementById('formError');
const formTitle = document.getElementById('formTitle');
const authStatusSpan = document.getElementById('authStatus');
const authButton = document.getElementById('authButton');

// Вспомогательные функции
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function getStatusLabel(status) {
  const map = { 
    overdue: 'Просрочена', 
    inprogress: 'В процессе', 
    today: 'На сегодня', 
    completed: 'Выполнена' 
  };
  return map[status] || status;
}

// API функции
async function fetchTasks() {
  try {
    const url = currentSection === 'all' 
      ? API_URL 
      : `${API_URL}?status=${currentSection}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Ошибка загрузки задач');
    
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('fetchTasks error:', error);
    showError('Не удалось загрузить задачи');
    return [];
  }
}

async function createTask(taskData) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo_token_2024'
      },
      body: JSON.stringify(taskData)
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Ошибка создания');
    
    return result.success ? result.data : null;
  } catch (error) {
    console.error('createTask error:', error);
    showError(error.message);
    return null;
  }
}

async function updateTask(id, taskData) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo_token_2024'
      },
      body: JSON.stringify(taskData)
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Ошибка обновления');
    
    return result.success ? result.data : null;
  } catch (error) {
    console.error('updateTask error:', error);
    showError(error.message);
    return null;
  }
}

async function deleteTask(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer demo_token_2024'
      }
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Ошибка удаления');
    
    return result.success;
  } catch (error) {
    console.error('deleteTask error:', error);
    showError(error.message);
    return false;
  }
}

// Рендеринг задач
async function renderCurrentSection() {
  if (!tasksContainer) return;
  
  tasksContainer.innerHTML = '<div class="empty-message">⏳ Загрузка задач...</div>';
  
  const tasks = await fetchTasks();
  
  if (tasks.length === 0) {
    tasksContainer.innerHTML = `<div class="empty-message">📭 В этом разделе пока нет задач. Добавьте новую</div>`;
    return;
  }
  
  tasksContainer.innerHTML = tasks.map(task => `
    <div class="task-card" data-task-id="${task._id}">
      <div class="task-header">
        <div class="task-title">📌 ${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span>👤 ${escapeHtml(task.owner || '—')}</span>
          <span>📅 ${escapeHtml(task.date || '—')}</span>
          <span>🏷️ ${getStatusLabel(task.status)}</span>
        </div>
      </div>
      <div class="task-desc">${escapeHtml(task.description || 'Нет описания')}</div>
      <div class="task-actions">
        <button class="edit-btn" data-id="${task._id}" data-action="edit">✏️ Изменить</button>
        <button class="delete-btn" data-id="${task._id}" data-action="delete">🗑️ Удалить</button>
      </div>
    </div>
  `).join('');
  
  // Привязка обработчиков
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      startEditTask(id);
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (confirm('Удалить задачу?')) {
        if (await deleteTask(id)) {
          await renderCurrentSection();
        }
      }
    });
  });
}

async function startEditTask(id) {
  if (!isAuthorized) {
    alert('⚠️ Для изменения задачи необходимо авторизоваться');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const result = await response.json();
    
    if (!result.success) throw new Error('Задача не найдена');
    
    const task = result.data;
    editingTaskId = id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskOwnerInput.value = task.owner || '';
    taskDateInput.value = task.date || '';
    taskStatusSelect.value = task.status;
    formTitle.innerText = '✏️ Редактирование задачи';
    formError.innerText = '';
    
    document.getElementById('formPanel').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('startEditTask error:', error);
    alert('Не удалось загрузить задачу для редактирования');
  }
}

// Сохранение задачи
async function saveTask() {
  const title = taskTitleInput.value.trim();
  if (!title) {
    formError.innerText = 'Название задачи обязательно';
    return;
  }
  
  const taskData = {
    title: title,
    description: taskDescInput.value.trim() || '',
    owner: taskOwnerInput.value.trim() || 'Не указан',
    date: taskDateInput.value.trim() || '',
    status: taskStatusSelect.value
  };
  
  let success = false;
  
  if (editingTaskId) {
    const updated = await updateTask(editingTaskId, taskData);
    success = !!updated;
  } else {
    const created = await createTask(taskData);
    success = !!created;
  }
  
  if (success) {
    clearForm();
    await renderCurrentSection();
    formError.innerText = '';
  }
}

// Очистка формы
function clearForm() {
  taskTitleInput.value = '';
  taskDescInput.value = '';
  taskOwnerInput.value = '';
  taskDateInput.value = '';
  taskStatusSelect.value = 'today';
  editingTaskId = null;
  formTitle.innerText = '➕ Добавить новую задачу';
  formError.innerText = '';
}

function showError(message) {
  formError.innerText = message;
  setTimeout(() => {
    if (formError.innerText === message) formError.innerText = '';
  }, 3000);
}

function updateSectionTitle() {
  const titles = {
    overdue: '📛 Просроченные задачи',
    inprogress: '⚙️ Делаю сейчас (в процессе)',
    today: '📅 Задачи на сегодня',
    completed: '✅ Выполненные задачи',
    all: '🗂️ Все задачи (полный список)'
  };
  if (currentSectionTitleSpan) {
    currentSectionTitleSpan.innerText = titles[currentSection] || 'Задачи';
  }
}

function setSection(section) {
  currentSection = section;
  updateSectionTitle();
  renderCurrentSection();
  
  document.querySelectorAll('.section-btn').forEach(btn => {
    if (btn.getAttribute('data-section') === section) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Авторизация
function toggleAuth() {
  isAuthorized = !isAuthorized;
  if (isAuthorized) {
    authToken = 'demo_token_2024';
    authStatusSpan.innerHTML = '✅ Авторизован (Свободный доступ для демо)';
    authButton.innerHTML = '🚪 Выйти';
    authButton.style.background = '#475569';
  } else {
    authToken = null;
    authStatusSpan.innerHTML = '🔒 Не авторизован';
    authButton.innerHTML = '🔑 Войти';
    authButton.style.background = '#1e293b';
    clearForm();
  }
}

// Инициализация навигации
function initNavigation() {
  const btns = document.querySelectorAll('.section-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      if (section) setSection(section);
    });
  });
}

// Обработчики событий
if (saveTaskBtn) {
  saveTaskBtn.addEventListener('click', () => {
    if (!isAuthorized) {
      alert('Необходимо авторизоваться, чтобы добавлять или изменять задачи');
      return;
    }
    saveTask();
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener('click', clearForm);
}

if (authButton) {
  authButton.addEventListener('click', toggleAuth);
}

// Инициализация
async function init() {
  initNavigation();
  setSection('overdue');
}

init();