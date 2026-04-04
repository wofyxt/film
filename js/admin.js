// js/admin.js
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof initKeyboardAccessibility === 'function') initKeyboardAccessibility();

  // 1. Логика для страницы входа
  if (window.location.pathname.includes('admin-login.html')) {
    initAdminLogin();
    return;
  }

  // 2. Проверка авторизации для основной панели
  if (!API.getToken()) {
    window.location.href = '/admin-login.html';
    return;
  }
  
  // Инициализация интерфейса
  initAdminTabs();
  loadAdminSection('movies');

  // Выход
  updateAuthLink()
});

function updateAuthLink() {
  const authLink = document.getElementById('adminLogoutLink');
  if (API.getToken()) {
    authLink.textContent = 'Выйти';
    authLink.href = '#';
    authLink.onclick = (e) => {
      e.preventDefault();
      logout();
    };
  }
}

// 🔐 Вход админа
function initAdminLogin() {
  const form = document.getElementById('adminLoginForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    try {
      // Бэкенд должен проверять роль admin на этом эндпоинте
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (data.success) {
        const token = data.data?.token || data.token;
        localStorage.setItem('admin_token', token); // Отдельный ключ для админки
        localStorage.setItem('token', token); // Для совместимости с API.request
        window.location.href = '/admin.html';
      } else {
        showAlert(data.error?.message || 'Доступ запрещен. Проверьте данные.', 'error');
      }
    } catch (err) {
      showAlert('Ошибка соединения с сервером', 'error');
    }
  });
}

// 🔄 Переключение вкладок
function initAdminTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      document.querySelectorAll('.admin-section').forEach(sec => sec.hidden = true);
      const panelId = tab.getAttribute('aria-controls');
      document.getElementById(panelId).hidden = false;

      loadAdminSection(tab.dataset.section);
    });
  });
}

// 📦 Загрузка данных секций
async function loadAdminSection(section) {
  const containerMap = {
    movies: 'moviesTableContainer',
    comments: 'commentsTableContainer',
    users: 'usersTableContainer'
  };
  const container = document.getElementById(containerMap[section]);
  if (!container) return;

  container.innerHTML = '<p class="loading">Загрузка...</p>';

  try {
    let data;
    switch(section) {
      case 'movies': data = await API.request('/admin/movies'); break;
      case 'comments': data = await API.request('/admin/comments'); break;
      case 'users': data = await API.request('/admin/users'); break;
    }

    if (section === 'movies') renderMoviesTable(data.movies, container);
    else if (section === 'comments') renderCommentsTable(data.comments, container);
    else if (section === 'users') renderUsersTable(data.users, container);
  } catch (error) {
    container.innerHTML = `<p class="error" role="alert">Ошибка загрузки: ${escapeHtml(error.message)}</p>`;
  }
}

// 🎬 Таблица фильмов
function renderMoviesTable(movies, container) {
  if (!movies || movies.length === 0) {
    container.innerHTML = '<p>Фильмы не найдены. Добавьте первый фильм!</p>';
    return;
  }

  let html = `<table class="admin-table" aria-label="Список фильмов">
    <thead><tr><th>ID</th><th>Название</th><th>Год</th><th>Жанр</th><th>Действия</th></tr></thead>
    <tbody>`;
  movies.forEach(m => {
    html += `<tr>
      <td>${m.id}</td>
      <td>${escapeHtml(m.title)}</td>
      <td>${m.year}</td>
      <td>${escapeHtml(m.genre || '—')}</td>
      <td class="admin-actions">
        <button class="btn btn-sm btn-edit" aria-label="Редактировать ${escapeHtml(m.title)}" 
          onclick="openMovieModal(${m.id}, '${escapeHtml(m.title)}', ${m.year}, '${escapeHtml(m.genre)}', '${m.poster_url || ''}', '${escapeHtml(m.description || '')}')">✏️</button>
        <button class="btn btn-sm btn-danger" aria-label="Удалить ${escapeHtml(m.title)}" onclick="deleteMovie(${m.id})">🗑️</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

// 💬 Таблица комментариев
function renderCommentsTable(comments, container) {
  if (!comments || comments.length === 0) {
    container.innerHTML = '<p>Комментариев пока нет</p>';
    return;
  }
  let html = `<table class="admin-table" aria-label="Список комментариев">
    <thead><tr><th>Фильм</th><th>Пользователь</th><th>Текст</th><th>Дата</th><th>Действия</th></tr></thead>
    <tbody>`;
  comments.forEach(c => {
    html += `<tr>
      <td>${escapeHtml(c.movie_title)}</td>
      <td>${escapeHtml(c.username)}</td>
      <td>${escapeHtml(c.text)}</td>
      <td>${new Date(c.created_at).toLocaleDateString()}</td>
      <td class="admin-actions">
        <button class="btn btn-sm btn-danger" aria-label="Удалить комментарий" onclick="deleteComment(${c.id})">🗑️</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

// 👥 Таблица пользователей
function renderUsersTable(users, container) {
  if (!users || users.length === 0) {
    container.innerHTML = '<p>Пользователи не найдены</p>';
    return;
  }
  let html = `<table class="admin-table" aria-label="Список пользователей">
    <thead><tr><th>ID</th><th>Имя</th><th>Email</th><th>Дата регистрации</th></tr></thead>
    <tbody>`;
  users.forEach(u => {
    html += `<tr>
      <td>${u.id}</td>
      <td>${escapeHtml(u.username)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${new Date(u.created_at).toLocaleDateString()}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

// 📝 CRUD Фильмов
const movieModal = document.getElementById('movieModal');
const movieForm = document.getElementById('movieForm');

document.getElementById('addMovieBtn')?.addEventListener('click', () => {
  document.getElementById('modalTitle').textContent = 'Добавить фильм';
  movieForm.reset();
  document.getElementById('movieId').value = '';
  movieModal.showModal();
});

document.getElementById('closeModalBtn')?.addEventListener('click', () => movieModal.close());

movieForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('movieId').value;
  const payload = {
    title: document.getElementById('movieTitle').value,
    year: document.getElementById('movieYear').value,
    genre: document.getElementById('movieGenre').value,
    poster_url: document.getElementById('moviePoster').value,
    description: document.getElementById('movieDesc').value
  };

  try {
    if (id) {
      await API.request(`/admin/movies/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      announceMessage('Фильм успешно обновлен');
    } else {
      await API.request('/admin/movies', { method: 'POST', body: JSON.stringify(payload) });
      announceMessage('Фильм успешно добавлен');
    }
    movieModal.close();
    loadAdminSection('movies');
  } catch (error) {
    announceMessage(`Ошибка: ${error.message}`, true);
  }
});

window.openMovieModal = function(id, title, year, genre, poster, desc) {
  document.getElementById('modalTitle').textContent = 'Редактировать фильм';
  document.getElementById('movieId').value = id;
  document.getElementById('movieTitle').value = title;
  document.getElementById('movieYear').value = year;
  document.getElementById('movieGenre').value = genre;
  document.getElementById('moviePoster').value = poster || '';
  document.getElementById('movieDesc').value = desc || '';
  movieModal.showModal();
};

window.deleteMovie = async function(id) {
  if (!confirm('Вы уверены, что хотите удалить этот фильм?')) return;
  try {
    await API.request(`/admin/movies/${id}`, { method: 'DELETE' });
    loadAdminSection('movies');
    announceMessage('Фильм удален');
  } catch (error) {
    announceMessage(`Ошибка: ${error.message}`, true);
  }
};

window.deleteComment = async function(id) {
  if (!confirm('Удалить этот комментарий?')) return;
  try {
    await API.request(`/admin/comments/${id}`, { method: 'DELETE' });
    loadAdminSection('comments');
    announceMessage('Комментарий удален');
  } catch (error) {
    announceMessage(`Ошибка: ${error.message}`, true);
  }
};

// 🛠 Утилиты
function showAlert(msg, type = 'error') {
  const alert = document.getElementById('alert');
  if (alert) {
    alert.textContent = msg;
    alert.className = `alert show alert-${type}`;
    setTimeout(() => alert.className = 'alert', 3000);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}