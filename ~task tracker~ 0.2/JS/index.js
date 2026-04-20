  // генерация ID
  function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 6);
  }

  // Текущий выбранный раздел
  let currentSection = "overdue"; 
  // Режим редактирования 
  let editingTaskId = null;

  // Авторизация 
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

 
  function persistTasks() {
    localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
  }
  function loadTasksFromStorage() {
    const stored = localStorage.getItem('kanban_tasks');
    if (stored) {
      tasks = JSON.parse(stored);
    } else {
     
      persistTasks();
    }
  }
  loadTasksFromStorage();

  
  function getTasksBySection(section) {
    if (section === 'all') return [...tasks];
    if (section === 'completed') return tasks.filter(t => t.status === 'completed');
    if (section === 'overdue') return tasks.filter(t => t.status === 'overdue');
    if (section === 'inprogress') return tasks.filter(t => t.status === 'inprogress');
    if (section === 'today') return tasks.filter(t => t.status === 'today');
    return tasks;
  }

 
  function renderCurrentSection() {
    let filtered = getTasksBySection(currentSection);
    // сортировка по дате 
    filtered.sort((a,b) => (a.date || '').localeCompare(b.date || ''));
    if (filtered.length === 0) {
      tasksContainer.innerHTML = `<div class="empty-message"> В этом разделе пока нет задач. Добавьте новую </div>`;
      return;
    }
    tasksContainer.innerHTML = filtered.map(task => `
      <div class="task-card" data-task-id="${task.id}">
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
          <button class="edit-btn" data-id="${task.id}" data-action="edit">✏️ Изменить</button>
          <button class="delete-btn" data-id="${task.id}" data-action="delete">🗑️ Удалить</button>
        </div>
      </div>
    `).join('');

    // кнопки редактирования/удаления
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        startEditTask(id);
      });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Удалить задачу?')) {
          deleteTaskById(id);
        }
      });
    });
  }

  function getStatusLabel(status) {
    const map = { overdue: 'Просрочена', inprogress: 'В процессе', today: 'На сегодня', completed: 'Выполнена' };
    return map[status] || status;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
      return c;
    });
  }


  function updateSectionTitle() {
    const titles = {
      overdue: '📛 Просроченные задачи',
      inprogress: '⚙️ Делаю сейчас (в процессе)',
      today: '📅 Задачи на сегодня',
      completed: '✅ Выполненные задачи',
      all: '🗂️ Все задачи (полный список)'
    };
    currentSectionTitleSpan.innerText = titles[currentSection] || 'Задачи';
  }

  // добавление / сохранение (создание или обновление)
  function saveTask() {
    const title = taskTitleInput.value.trim();
    if (!title) {
      formError.innerText = 'Название задачи обязательно';
      return;
    }
    const description = taskDescInput.value.trim() || '';
    const owner = taskOwnerInput.value.trim() || 'Не указан';
    const date = taskDateInput.value.trim() || '';
    const status = taskStatusSelect.value;

    if (editingTaskId) {
      // изменяем существующую
      const index = tasks.findIndex(t => t.id === editingTaskId);
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          title: title,
          description: description,
          owner: owner,
          date: date,
          status: status
        };
      }
      editingTaskId = null;
      formTitle.innerText = '➕ Добавить новую задачу';
    } else {
      // новая задача
      const newTask = {
        id: generateId(),
        title: title,
        description: description,
        owner: owner,
        date: date,
        status: status,
        rawOwner: owner
      };
      tasks.push(newTask);
    }
    persistTasks();
    clearForm();
    renderCurrentSection(); 
    formError.innerText = '';
  }

  function startEditTask(id) {
    if (!isAuthorized) {
      alert('⚠️ Для изменения задачи необходимо авторизоваться (нажмите кнопку "Войти")');
      return;
    }
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingTaskId = id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskOwnerInput.value = task.owner || '';
    taskDateInput.value = task.date || '';
    taskStatusSelect.value = task.status;
    formTitle.innerText = '✏️ Редактирование задачи';
    formError.innerText = '';
   
    document.getElementById('formPanel').scrollIntoView({ behavior: 'smooth' });
  }

  function deleteTaskById(id) {
    if (!isAuthorized) {
      alert('Авторизуйтесь для удаления задач');
      return;
    }
    tasks = tasks.filter(t => t.id !== id);
    persistTasks();
    if (editingTaskId === id) {
      clearForm();
    }
    renderCurrentSection();
  }

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

  // смена раздела
  function setSection(section) {
    currentSection = section;
    updateSectionTitle();
    renderCurrentSection();
    // подсветка активной кнопки
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
      authStatusSpan.innerHTML = '✅ Авторизован (Пользователь: cutlet09 )';
      authButton.innerHTML = '🚪 Выйти';
      authButton.style.background = '#475569';
    } else {
      authStatusSpan.innerHTML = '🔒 Не авторизован';
      authButton.innerHTML = '🔑 Войти';
      authButton.style.background = '#1e293b';
     
      clearForm();
    }
   
    renderCurrentSection();
  }

  // инициализация навигации
  function initNavigation() {
    const btns = document.querySelectorAll('.section-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.getAttribute('data-section');
        if (section) setSection(section);
      });
    });
  }

  
  saveTaskBtn.addEventListener('click', () => {
    if (!isAuthorized) {
      alert('Необходимо авторизоваться, чтобы добавлять или изменять задачи');
      return;
    }
    saveTask();
  });
  cancelEditBtn.addEventListener('click', () => {
    clearForm();
  });

  authButton.addEventListener('click', toggleAuth);

 
  function init() {
    initNavigation();
    setSection('overdue');  
   
    if (!tasks.some(t => t.status === 'completed')) {
      tasks.push({
        id: 'completed_example1',
        title: 'Согласование бюджета',
        description: 'Бюджет 2016 утвержден на совещании',
        owner: 'Финансовый отдел',
        date: '15.02.2016',
        status: 'completed',
        rawOwner: 'Финансовый отдел'
      });
      tasks.push({
        id: 'completed_example2',
        title: 'Встреча с СДО (Единый центр)',
        description: 'Предложения направлены заказчику',
        owner: 'Руководитель',
        date: '14.02.2016',
        status: 'completed',
        rawOwner: 'Руководитель'
      });
      persistTasks();
    }
    renderCurrentSection();
  }

  init();