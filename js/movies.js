// js/movies.js

document.addEventListener('DOMContentLoaded', async () => {
  updateAuthLink();
  await loadGenres();
  await loadMovies();
  
  document.getElementById('searchForm').addEventListener('submit', handleSearch);
  document.getElementById('applyFilters').addEventListener('click', applyFilters);
  document.getElementById('resetFilters').addEventListener('click', resetFilters);
});

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

async function loadGenres() {
  try {
    const { genres } = await API.getGenres();
    const select = document.getElementById('genreFilter');
    genres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre.id;
      option.textContent = genre.name;
      select.appendChild(option);
    });
  } catch (e) {
    console.error('Не удалось загрузить жанры');
  }
}

async function loadMovies(filters = {}) {
  const container = document.getElementById('moviesContainer');
  container.innerHTML = '<div class="loading">Загрузка...</div>';
  
  try {
    const { movies } = await API.getMovies(filters);
    
    if (movies.length === 0) {
      container.innerHTML = '<p class="no-results">Фильмы не найдены</p>';
      return;
    }
    
    // ✅ ИСПРАВЛЕНО: movie.avg_rating вместо movie.rating
    container.innerHTML = movies.map(movie => `
      <div class="movie-card" onclick="openMovie(${movie.id})">
        <img src="${movie.poster_url || '/assets/no-poster.jpg'}" alt="${escapeHtml(movie.title)}">
        <div class="movie-info">
          <h3 class="title">${escapeHtml(movie.title)}</h3>
          <div class="meta">
            <span>${movie.year}</span>
            <span class="rating">★ ${movie.avg_rating || 'N/A'}</span>
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    container.innerHTML = '<p class="error">Ошибка загрузки фильмов</p>';
    console.error(error);
  }
}

async function handleSearch(e) {
  e.preventDefault();
  const query = document.getElementById('searchInput').value.trim();
  
  if (query.length < 2) {
    alert('Введите минимум 2 символа');
    return;
  }
  
  try {
    const { movies } = await API.searchMovies(query);
    renderMovies(movies);
  } catch (error) {
    alert('Ошибка поиска: ' + error.message);
  }
}

function applyFilters() {
  const filters = {};
  
  const genreId = document.getElementById('genreFilter').value;
  if (genreId) filters.genre_id = genreId;
  
  const yearFrom = document.getElementById('yearFrom').value;
  if (yearFrom) filters.year_from = yearFrom;
  
  const yearTo = document.getElementById('yearTo').value;
  if (yearTo) filters.year_to = yearTo;
  
  const ratingFrom = document.getElementById('ratingFrom').value;
  if (ratingFrom) filters.rating_from = ratingFrom;
  
  loadMovies(filters);
}

function resetFilters() {
  document.getElementById('genreFilter').value = '';
  document.getElementById('yearFrom').value = '';
  document.getElementById('yearTo').value = '';
  document.getElementById('ratingFrom').value = '';
  loadMovies();
}

function openMovie(id) {
  window.location.href = `/movie.html?id=${id}`;
}

// ✅ ИСПРАВЛЕНО: movie.avg_rating вместо movie.rating
function renderMovies(movies) {
  const container = document.getElementById('moviesContainer');
  
  if (movies.length === 0) {
    container.innerHTML = '<p class="no-results">Ничего не найдено</p>';
    return;
  }
  
  container.innerHTML = movies.map(movie => `
    <div class="movie-card" onclick="openMovie(${movie.id})">
      <img src="${movie.poster_url || '/assets/no-poster.jpg'}" alt="${escapeHtml(movie.title)}">
      <div class="movie-info">
        <h3 class="title">${escapeHtml(movie.title)}</h3>
        <div class="meta">
          <span>${movie.year}</span>
          <span class="rating">★ ${movie.avg_rating || 'N/A'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// Экранирование для защиты от XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


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