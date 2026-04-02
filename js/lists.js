// js/lists.js

let currentList = 'watchlist';

document.addEventListener('DOMContentLoaded', () => {
   if (typeof initKeyboardAccessibility === 'function') initKeyboardAccessibility();
  if (!API.getToken()) {
    window.location.href = '/login.html';
    return;
  }
  
  updateAuthLink();
  initBurgerMenu();
  setActiveNavLink();
  setupTabs();
  loadCurrentList();
});

// 🍔 Бургер-меню (дублируется для каждого файла)
function initBurgerMenu() {
  const menuToggle = document.querySelector('.site-header .menu-toggle');
  const siteNav = document.querySelector('.site-header .site-nav');
  
  if (menuToggle && siteNav) {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-controls', 'site-navigation');
    
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      const newExpanded = !expanded;
      
      menuToggle.setAttribute('aria-expanded', String(newExpanded));
      menuToggle.setAttribute('aria-label', newExpanded ? 'Закрыть меню навигации' : 'Открыть меню навигации');
      siteNav.classList.toggle('active');
      menuToggle.textContent = expanded ? '☰' : '✕';
      
      if (newExpanded && window.innerWidth < 768) {
        const firstLink = siteNav.querySelector('.nav-link');
        firstLink?.focus();
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteNav.classList.contains('active')) {
        siteNav.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Открыть меню навигации');
        menuToggle.textContent = '☰';
        menuToggle.focus();
      }
    });
    
    siteNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 768) {
          siteNav.classList.remove('active');
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.setAttribute('aria-label', 'Открыть меню навигации');
          menuToggle.textContent = '☰';
        }
      });
    });
  }
}

function updateAuthLink() {
  const authLink = document.getElementById('authLink');
  if (authLink) {
    if (API.getToken()) {
      authLink.textContent = 'Выйти';
      authLink.href = '#';
      authLink.onclick = (e) => {
        e.preventDefault();
        if (typeof logout === 'function') logout();
      };
    } else {
      authLink.textContent = 'Войти';
      authLink.href = '/login.html';
      authLink.onclick = null;
    }
  }
}

function setActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    link.removeAttribute('aria-current');
    const linkPath = link.getAttribute('href')?.split('/').pop();
    if (linkPath === currentPath) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// 🔹 Настройка табов с ARIA
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Обновляем ARIA-состояния
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      
      // Обновляем текущий список
      currentList = tab.dataset.list;
      loadCurrentList();
    });
    
    // Навигация стрелками между табами
    tab.addEventListener('keydown', (e) => {
      const tabArray = Array.from(tabs);
      const currentIndex = tabArray.indexOf(tab);
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextTab = tabArray[(currentIndex + 1) % tabArray.length];
        nextTab.focus();
        nextTab.click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevTab = tabArray[(currentIndex - 1 + tabArray.length) % tabArray.length];
        prevTab.focus();
        prevTab.click();
      }
    });
  });
}

async function loadCurrentList() {
  const container = document.getElementById('moviesList');
  if (!container) return;
  
  container.setAttribute('aria-busy', 'true');
  container.innerHTML = '<p class="loading" role="status">Загрузка...</p>';
  
  try {
    const { lists } = await API.getUserLists();
    const filteredMovies = lists.filter(item => item.list_type === currentList);
    
    if (filteredMovies.length === 0) {
      showEmptyList();
      updateTabCounts(lists);
      container.setAttribute('aria-busy', 'false');
      return;
    }
    
    renderMovies(filteredMovies);
    updateTabCounts(lists);
    
  } catch (error) {
    container.innerHTML = `
      <div class="error" role="alert">
        <p>Ошибка загрузки списков: ${escapeHtml(error.message)}</p>
        <a href="/index.html" class="btn">Вернуться к каталогу</a>
      </div>
    `;
  } finally {
    container.setAttribute('aria-busy', 'false');
  }
}

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

function updateTabCounts(lists) {
  const counts = { 'watchlist': 0, 'favorites': 0, 'watched': 0 };
  
  lists.forEach(item => {
    if (counts[item.list_type] !== undefined) {
      counts[item.list_type]++;
    }
  });
  
  document.querySelectorAll('.tab').forEach(tab => {
    const listType = tab.dataset.list;
    const count = counts[listType];
    const countSpan = tab.querySelector('.tab-count');
    if (countSpan) {
      countSpan.textContent = count;
      countSpan.setAttribute('aria-label', `${count} ${getCountLabel(count, listType)}`);
    }
  });
}

function getCountLabel(count, listType) {
  const labels = {
    'watchlist': count === 1 ? 'фильм' : count >= 2 && count <= 4 ? 'фильма' : 'фильмов',
    'favorites': count === 1 ? 'фильм' : count >= 2 && count <= 4 ? 'фильма' : 'фильмов',
    'watched': count === 1 ? 'фильм' : count >= 2 && count <= 4 ? 'фильма' : 'фильмов'
  };
  return labels[listType] || 'фильмов';
}

function getTabName(type) {
  const names = {
    'watchlist': 'Буду смотреть',
    'favorites': 'Избранное',
    'watched': 'Просмотрено'
  };
  return names[type] || type;
}

function renderMovies(movies) {
  const container = document.getElementById('moviesList');
  
  container.innerHTML = movies.map(item => {
    const title = escapeHtml(item.title);
    const year = item.year || '';
    const poster = item.poster_url || '/assets/no-poster.jpg';
    
    const altText = poster !== '/assets/no-poster.jpg'
      ? `Постер фильма «${title}», ${year} год`
      : 'Изображение постера отсутствует';
    
    return `
      <div class="movie-card" tabindex="0" role="article" data-movie-id="${item.movie_id}" aria-label="Фильм: ${title}, ${year} год">
        <img 
          src="${poster}" 
          alt="${altText}"
          loading="lazy"
          width="200"
          height="300"
          ${poster === '/assets/no-poster.jpg' ? 'role="presentation"' : ''}
        >
        <div class="movie-info">
          <h3 class="title">${title}</h3>
          <div class="meta">
            <span>${year}</span>
          </div>
          <div class="movie-actions">
            ${getMoveButtons(item.movie_id, item.list_type)}
            <button 
              class="btn-remove" 
              onclick="removeFromList(${item.movie_id}, '${item.list_type}')"
              aria-label="Удалить фильм «${title}» из списка"
            >✕</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getMoveButtons(movieId, currentType) {
  const lists = ['watchlist', 'favorites', 'watched'];
  const otherLists = lists.filter(type => type !== currentType);
  
  const labels = {
    'watchlist': 'В буду смотреть',
    'favorites': 'В избранное',
    'watched': 'Просмотрено'
  };
  
  return otherLists.map(type => `
    <button 
      class="btn-move" 
      onclick="moveToList(${movieId}, '${type}')"
      aria-label="Переместить фильм в список «${labels[type].replace('В ', '')}»"
    >
      ${labels[type]}
    </button>
  `).join('');
}

async function removeFromList(movieId, listType) {
  if (!confirm('Удалить фильм из списка?')) return;
  
  try {
    await API.removeFromList(movieId, listType);
    loadCurrentList();
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
}

async function moveToList(movieId, newListType) {
  try {
    await API.addToList(movieId, newListType);
    
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

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}