// js/lists.js

let currentList = 'watchlist'; // Текущий активный список

document.addEventListener('DOMContentLoaded', () => {
  // Проверка авторизации
  if (!API.getToken()) {
    window.location.href = '/login.html';
    return;
  }
  
  updateAuthLink();
  setupTabs();
  loadCurrentList();
});

// В js/movies.js, js/movie.js, js/lists.js — после DOMContentLoaded:

// Бургер-меню (только для .site-header)
const menuToggle = document.querySelector('.site-header .menu-toggle');
const siteNav = document.querySelector('.site-header .site-nav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !expanded);
    siteNav.classList.toggle('active');
    menuToggle.textContent = expanded ? '☰' : '✕';
  });
  
  // Закрыть меню при клике на ссылку
  siteNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        siteNav.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.textContent = '☰';
      }
    });
  });
}

function updateAuthLink() {
  const authLink = document.getElementById('authLink');
  if (API.getToken()) {
    authLink.textContent = 'Выйти';
    authLink.href = '#';
    authLink.onclick = (e) => {
      e.preventDefault();
      if (typeof logout === 'function') logout();
    };
  }
}

// Настройка табов
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Убираем активный класс со всех табов
      tabs.forEach(t => t.classList.remove('active'));
      // Добавляем активный класс нажатому
      tab.classList.add('active');
      // Обновляем текущий список
      currentList = tab.dataset.list;
      // Загружаем список
      loadCurrentList();
    });
  });
}

// Загрузка текущего списка
async function loadCurrentList() {
  const container = document.getElementById('moviesList');
  container.innerHTML = '<div class="loading">Загрузка...</div>';
  
  try {
    const { lists } = await API.getUserLists();
    
    // Фильтруем фильмы по текущему списку
    const filteredMovies = lists.filter(item => item.list_type === currentList);
    
    if (filteredMovies.length === 0) {
      showEmptyList();
      updateTabCounts(lists);
      return;
    }
    
    renderMovies(filteredMovies);
    updateTabCounts(lists);
    
  } catch (error) {
    container.innerHTML = `
      <div class="error">
        <p>Ошибка загрузки списков: ${error.message}</p>
        <a href="/index.html" class="btn">Вернуться к каталогу</a>
      </div>
    `;
  }
}

// Показать пустой список
function showEmptyList() {
  const container = document.getElementById('moviesList');
  
  const messages = {
    'watchlist': {
      title: 'Список пуст',
      text: 'Добавьте фильмы, которые хотите посмотреть',
      buttonText: 'Перейти к каталогу'
    },
    'favorites': {
      title: 'Нет избранных',
      text: 'Отмечайте фильмы сердечком, чтобы добавить сюда',
      buttonText: 'Найти фильмы'
    },
    'watched': {
      title: 'Пока ничего не просмотрено',
      text: 'Отмечайте фильмы как просмотренные',
      buttonText: 'Смотреть каталог'
    }
  };
  
  const msg = messages[currentList];
  
  container.innerHTML = `
    <div class="empty-list">
      <h3>${msg.title}</h3>
      <p>${msg.text}</p>
      <a href="/index.html" class="btn">${msg.buttonText}</a>
    </div>
  `;
}

// Обновление счётчиков на табах
function updateTabCounts(lists) {
  const counts = {
    'watchlist': 0,
    'favorites': 0,
    'watched': 0
  };
  
  lists.forEach(item => {
    if (counts[item.list_type] !== undefined) {
      counts[item.list_type]++;
    }
  });
  
  document.querySelectorAll('.tab').forEach(tab => {
    const listType = tab.dataset.list;
    const count = counts[listType];
    tab.textContent = `${getTabName(listType)} (${count})`;
  });
}

function getTabName(type) {
  const names = {
    'watchlist': 'Буду смотреть',
    'favorites': 'Избранное',
    'watched': 'Просмотрено'
  };
  return names[type] || type;
}

// Рендер фильмов
function renderMovies(movies) {
  const container = document.getElementById('moviesList');
  
  container.innerHTML = movies.map(item => `
    <div class="movie-card">
      <img src="${item.poster_url || '/assets/no-poster.jpg'}" alt="${escapeHtml(item.title)}">
      <div class="movie-info">
        <h3 class="title">${escapeHtml(item.title)}</h3>
        <div class="meta">
          <span>${item.year}</span>
        </div>
        <div class="movie-actions">
          ${getMoveButtons(item.movie_id, item.list_type)}
          <button class="btn-remove" onclick="removeFromList(${item.movie_id}, '${item.list_type}')">✕</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Кнопки для перемещения между списками
function getMoveButtons(movieId, currentType) {
  const lists = ['watchlist', 'favorites', 'watched'];
  const otherLists = lists.filter(type => type !== currentType);
  
  const labels = {
    'watchlist': 'В буду смотреть',
    'favorites': 'В избранное',
    'watched': 'Просмотрено'
  };
  
  return otherLists.map(type => `
    <button class="btn-move" onclick="moveToList(${movieId}, '${type}')">
      ${labels[type]}
    </button>
  `).join('');
}

// Удалить из списка
async function removeFromList(movieId, listType) {
  if (!confirm('Удалить фильм из списка?')) return;
  
  try {
    await API.removeFromList(movieId, listType);
    loadCurrentList();
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
}

// Переместить в другой список
async function moveToList(movieId, newListType) {
  try {
    // Добавляем в новый список
    await API.addToList(movieId, newListType);
    // Удаляем из текущего (опционально, можно оставить в обоих)
    // await API.removeFromList(movieId, currentList);
    
    const names = {
      'watchlist': 'Буду смотреть',
      'favorites': 'Избранное',
      'watched': 'Просмотрено'
    };
    
    alert(`Фильм добавлен в "${names[newListType]}"`);
    loadCurrentList();
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
}

// Экранирование HTML (защита от XSS)
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
