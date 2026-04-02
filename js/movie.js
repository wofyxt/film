// js/movie.js

document.addEventListener('DOMContentLoaded', async () => {
  updateAuthLink();
  
  const params = new URLSearchParams(window.location.search);
  const movieId = params.get('id');
  
  if (!movieId) {
    window.location.href = '/index.html';
    return;
  }
  
  await loadMovie(movieId);
  await loadReviews(movieId);
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
      logout();
    };
  }
}

async function loadMovie(id) {
  try {
    const { movie } = await API.getMovie(id);
    document.title = `${movie.title} — FILMHUB`;
    
    const page = document.getElementById('movieDetail');
    page.innerHTML = `
      <div class="movie-header">
        <img src="${movie.poster_url || '/assets/no-poster.jpg'}" alt="${movie.title}" class="poster">
        
        <div class="movie-info">
          <h1>${movie.title}</h1>
          <div class="meta">
            <span>${movie.year}</span>
            <span>•</span>
            <span>${movie.genre_name || 'Жанр не указан'}</span>
            <span>•</span>
            <span class="rating">★ ${movie.avg_rating || 'N/A'}/10</span>
          </div>
          
          <p class="description">${movie.description || 'Описание отсутствует'}</p>
          
          <div class="actions">
            <button class="btn btn-primary" onclick="watchTrailer()">▶ Трейлер</button>
            <button class="btn btn-outline" onclick="addToList(${movie.id}, 'watchlist')">+ Буду смотреть</button>
            <button class="btn btn-outline" onclick="addToList(${movie.id}, 'favorites')">❤ В избранное</button>
          </div>
        </div>
      </div>
      
      <div class="reviews-section">
        <h2>Отзывы и оценки</h2>
        
        ${API.getToken() ? `
          <form id="reviewForm" class="review-form">
            <h3>Оставить отзыв</h3>
            <select id="ratingInput" required>
              <option value="">Выберите оценку</option>
              ${[...Array(10)].map((_, i) => `<option value="${i+1}">${i+1} ★</option>`).join('')}
            </select>
            <textarea id="reviewInput" placeholder="Ваш отзыв..." rows="4"></textarea>
            <button type="submit" class="btn btn-primary">Отправить</button>
          </form>
        ` : '<p><a href="/login.html">Войдите</a>, чтобы оставить отзыв</p>'}
        
        <div id="reviewsList" class="reviews-list"></div>
      </div>
    `;
    
    // Обработчик формы отзыва
    document.getElementById('reviewForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      submitReview(id);
    });
    
  } catch (error) {
    document.getElementById('movieDetail').innerHTML = `
      <div class="error">
        <h2>Фильм не найден</h2>
        <a href="/index.html" class="btn">← Вернуться к каталогу</a>
      </div>
    `;
  }
}

async function loadReviews(movieId) {
  try {
    const { ratings } = await API.getRatings(movieId);
    const list = document.getElementById('reviewsList');
    
    if (!ratings || ratings.length === 0) {
      list.innerHTML = '<p class="no-reviews">Пока нет отзывов</p>';
      return;
    }
    
    list.innerHTML = ratings.map(r => `
      <div class="review">
        <div class="review-header">
          <span class="author">${r.username || 'Аноним'}</span>
          <span class="rating">${r.rating} ★</span>
        </div>
        ${r.review ? `<p>${r.review}</p>` : ''}
        <small class="date">${new Date(r.created_at).toLocaleDateString()}</small>
      </div>
    `).join('');
    
  } catch (e) {
    console.error('Ошибка загрузки отзывов');
  }
}

async function submitReview(movieId) {
  const rating = document.getElementById('ratingInput').value;
  const review = document.getElementById('reviewInput').value.trim();
  
  try {
    await API.addRating(movieId, rating, review);
    alert('Спасибо за отзыв!');
    document.getElementById('reviewForm').reset();
    loadReviews(movieId);
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
}

function addToList(movieId, listType) {
  if (!API.getToken()) {
    alert('Войдите, чтобы сохранять фильмы');
    window.location.href = '/login.html';
    return;
  }
  
  API.addToList(movieId, listType)
    .then(() => {
      const names = {
        'watchlist': 'Буду смотреть',
        'favorites': 'Избранное'
      };
      alert(`Добавлено в "${names[listType]}"`);
    })
    .catch(error => {
      alert('Ошибка: ' + error.message);
    });
}

function watchTrailer() {
  alert('Трейлер будет добавлен позже');
  // Здесь можно открыть модальное окно с iframe YouTube
}