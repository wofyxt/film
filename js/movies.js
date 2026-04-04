// js/movies.js

// 🔒 Функция экранирования (защита от XSS + безопасные alt-тексты)
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 🍔 Бургер-меню (только для .site-header)
function initBurgerMenu() {
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
}

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', async () => {
  updateAuthLink();
  initBurgerMenu(); // ✅ Инициализация бургера
  await loadGenres();
  await loadMovies();
  
  document.getElementById('searchForm')?.addEventListener('submit', handleSearch);
  document.getElementById('applyFilters')?.addEventListener('click', applyFilters);
  document.getElementById('resetFilters')?.addEventListener('click', resetFilters);
   if (typeof initKeyboardAccessibility === 'function') initKeyboardAccessibility();
});

function updateAuthLink() {
  const authLink = document.getElementById('authLink');
  if (API.getToken()) {
    authLink.textContent = 'Выйти';
    authLink.href = '#';
    authLink.onclick = (e) => {
      e.preventDefault();
      logout();
    };
  }
}

async function loadGenres() {
  try {
    const { genres } = await API.getGenres();
    const select = document.getElementById('genreFilter');
    if (!select) return;
    
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
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Загрузка...</div>';
  
  try {
    const { movies } = await API.getMovies(filters);
    
    if (!movies || movies.length === 0) {
      container.innerHTML = '<p class="no-results">Фильмы не найдены</p>';
      return;
    }
      // ✅ ГЛОБАЛЬНАЯ ОБРАБОТКА КЛИКОВ И КЛАВИАТУРЫ ДЛЯ КАРТОЧЕК
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.movie-card');
    if (card?.dataset.movieId) window.openMovie(card.dataset.movieId);
  });

  document.addEventListener('keydown', (e) => {
    const card = e.target.closest('.movie-card');
    // Enter или Space на сфокусированной карточке
    if (card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); // 🔑 Обязательно: блокирует скролл страницы при нажатии Пробела
      if (card.dataset.movieId) window.openMovie(card.dataset.movieId);
    }
  });
    // ✅ Рендер карточек с безопасными alt-текстами
    container.innerHTML = movies.map(movie => {
      // Безопасное экранирование для alt
      const title = escapeHtml(movie.title);
      const year = movie.year || '';
      const poster = movie.poster_url || '/assets/no-poster.jpg';
      const rating = movie.avg_rating || 'N/A';
      const id = movie.id;
      
     // В movies.map() замените возврат на:
return `
  <article 
    class="movie-card" 
    tabindex="0" 
    role="button" 
    aria-label="Открыть фильм: ${title} (${year} год)" 
    data-movie-id="${id}"
  >
    <img class="observed-img"
      data-src="${poster}" 
      src=""
      alt="Постер фильма: ${title} (${year} год)" 
     
      width="200"
      height="300"
    >
    <div class="movie-info">
      <h3 class="title">${title}</h3>
      <div class="meta">
        <span>${year}</span>
        <span class="rating">★ ${rating}</span>
      </div>
    </div>
  </article>
`;
    }).join('');
    
initLazyLoading();

  } catch (error) {
    container.innerHTML = '<p class="error">Ошибка загрузки фильмов</p>';
    console.error('Ошибка loadMovies:', error);
  }
}

async function handleSearch(e) {
  e.preventDefault();
  const query = document.getElementById('searchInput')?.value.trim();
  
  if (!query || query.length < 2) {
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
  
  const genreFilter = document.getElementById('genreFilter');
  const yearFrom = document.getElementById('yearFrom');
  const yearTo = document.getElementById('yearTo');
  const ratingFrom = document.getElementById('ratingFrom');
  
  if (genreFilter?.value) filters.genre_id = genreFilter.value;
  if (yearFrom?.value) filters.year_from = yearFrom.value;
  if (yearTo?.value) filters.year_to = yearTo.value;
  if (ratingFrom?.value) filters.rating_from = ratingFrom.value;
  
  loadMovies(filters);
}

function resetFilters() {
  const genreFilter = document.getElementById('genreFilter');
  const yearFrom = document.getElementById('yearFrom');
  const yearTo = document.getElementById('yearTo');
  const ratingFrom = document.getElementById('ratingFrom');
  
  if (genreFilter) genreFilter.value = '';
  if (yearFrom) yearFrom.value = '';
  if (yearTo) yearTo.value = '';
  if (ratingFrom) ratingFrom.value = '';
  
  loadMovies();
}

// ✅ Глобальная функция для onclick
window.openMovie = function(id) {
  window.location.href = `/movie.html?id=${id}`;
};

// ✅ Рендер для поиска (дублирует loadMovies)
function renderMovies(movies) {
  const container = document.getElementById('moviesContainer');
  if (!container) return;
  
  if (!movies || movies.length === 0) {
    container.innerHTML = '<p class="no-results">Ничего не найдено</p>';
    return;
  }
  
  container.innerHTML = movies.map(movie => {
    const title = escapeHtml(movie.title);
    const year = movie.year || '';
    const poster = movie.poster_url || '/assets/no-poster.jpg';
    const rating = movie.avg_rating || 'N/A';
    const id = movie.id;
    
   // В movies.map() замените возврат на:
return `
  <article 
    class="movie-card" 
    tabindex="0" 
    role="button" 
    aria-label="Открыть фильм: ${title} (${year} год)" 
    data-movie-id="${id}"
  >
    <img 
    class="observed-img"
      data-src="${poster}"
      src="" 
      alt="Постер фильма: ${title} (${year} год)" 
      width="200"
      height="300"
    >
    <div class="movie-info">
      <h3 class="title">${title}</h3>
      <div class="meta">
        <span>${year}</span>
        <span class="rating">★ ${rating}</span>
      </div>
    </div>
  </article>
`;
  }).join('');
   initLazyLoading();
}

// lazy-images.js
document.addEventListener('DOMContentLoaded', () => {
  const images = document.querySelectorAll('.observed-img');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src; // Подставляем реальный src
          img.classList.add('loaded');
          obs.unobserve(img); // Отключаем наблюдение после загрузки
        }
      });
    }, {
      rootMargin: '50px 0px', // Начинаем грузить за 50px до появления
      threshold: 0.1
    });

    images.forEach(img => observer.observe(img));
  } else {
    // Фолбэк для старых браузеров: грузим сразу
    images.forEach(img => img.src = img.dataset.src);
  }
});
// Глобальная функция для ленивой загрузки
function initLazyLoading() {
  const images = document.querySelectorAll('.observed-img');
  console.log(`🔍 Найдено изображений для lazy loading: ${images.length}`);
  
  if (!('IntersectionObserver' in window)) {
    images.forEach(img => {
      if (img.dataset.src) img.src = img.dataset.src;
    });
    return;
  }
  
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        
        // 🔥 Добавляем задержку перед загрузкой (медленнее появление)
        setTimeout(() => {
          img.src = img.dataset.src;
          
          img.onload = () => {
            // Плавное появление картинки
            img.style.transition = 'opacity 1.5s ease-in';
            img.classList.add('loaded');
          };
          
          img.onerror = () => {
            img.classList.add('error');
            console.error('Не удалось загрузить:', img.dataset.src);
          };
          
        }, index * 100); // Каждая следующая картинка загружается на 100ms позже
        
        obs.unobserve(img);
      }
    });
  }, {
    rootMargin: '100px 0px', /* Начинаем грузить ЗАРАНЕЕ (было 50px) */
    threshold: 0.01
  });
  
  images.forEach(img => observer.observe(img));
}