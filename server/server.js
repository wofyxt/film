require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const { registerUser, loginUser } = require('../auth-module/auth');
const pool = require('../auth-module/db.js');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');
const { createClient } = require('redis');

const app = express();
let redisClient = null;
let redisReady = false;

// Проверка обязательных переменных окружения
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not defined in .env');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Статические файлы из корня проекта (на уровень выше)
app.use(express.static(path.join(__dirname, '..')));

// ==================== КЭШИРОВАНИЕ (заголовки) ====================
// Для публичных GET-запросов (кроме /api/users/me)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api/users/me')) {
    res.set('Cache-Control', 'public, max-age=300');
  } else {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  next();
});

// ==================== РОУТЫ ====================

// Регистрация
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = await registerUser(username, email, password);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: error.message, code: 'REGISTRATION_FAILED' }
    });
  }
});

// Логин
app.post('/api/auth/token', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: error.message, code: 'LOGIN_FAILED' }
    });
  }
});

// Текущий пользователь
app.get('/api/users/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: { message: 'No token provided' } });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, data: { user: decoded } });
  } catch (error) {
    res.status(401).json({ success: false, error: { message: 'Invalid token' } });
  }
});

// Поиск фильмов
app.get('/api/movies/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json({ success: true, data: { movies: [] } });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM movies 
       WHERE title ILIKE $1 OR description ILIKE $1 
       ORDER BY year DESC`,
      [`%${q}%`]
    );
    res.json({ success: true, data: { movies: result.rows } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// Список фильмов с фильтрацией
app.get('/api/movies', async (req, res) => {
  const { genre_id, year_from, year_to, rating_from } = req.query;

  // 🔑 Уникальный ключ кэша: меняется только при изменении параметров
  const cacheKey = `movies:list:${JSON.stringify({ genre_id, year_from, year_to })}`;

  try {
    // 🔄 Оборачиваем запрос к БД в кэш-утилиту
    const movies = await getOrCache(cacheKey, 60, async () => {
      // 👇 Ваша оригинальная логика (ничего не меняем внутри)
      let sql = `
        SELECT m.*, g.name as genre_name,
               ROUND(AVG(r.rating)::numeric, 1) as avg_rating
        FROM movies m
        LEFT JOIN genres g ON m.genre_id = g.id
        LEFT JOIN ratings r ON m.id = r.movie_id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (genre_id) {
        sql += ` AND m.genre_id = $${paramIndex++}`;
        params.push(parseInt(genre_id));
      }
      if (year_from) {
        sql += ` AND m.year >= $${paramIndex++}`;
        params.push(parseInt(year_from));
      }
      if (year_to) {
        sql += ` AND m.year <= $${paramIndex++}`;
        params.push(parseInt(year_to));
      }

      sql += ' GROUP BY m.id, g.name ORDER BY m.year DESC';
      const result = await pool.query(sql, params);

      return result.rows.map(movie => ({
        ...movie,
        avg_rating: movie.avg_rating ? parseFloat(movie.avg_rating) : null
      }));
    });

    // 📤 Отдаём ответ
    res.set('Cache-Control', 'public, max-age=120');
    res.json({ success: true, data: { movies } });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: 'FETCH_MOVIES_FAILED' }
    });
  }
});

// Один фильм
app.get('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT m.*, g.name as genre_name 
       FROM movies m 
       LEFT JOIN genres g ON m.genre_id = g.id 
       WHERE m.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Фильм не найден', code: 'MOVIE_NOT_FOUND' }
      });
    }
    const ratingResult = await pool.query(
      'SELECT AVG(rating) as avg_rating FROM ratings WHERE movie_id = $1',
      [id]
    );
    const movie = result.rows[0];
    movie.avg_rating = ratingResult.rows[0].avg_rating
      ? parseFloat(ratingResult.rows[0].avg_rating).toFixed(1)
      : null;
    res.json({ success: true, data: { movie } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: 'FETCH_MOVIE_FAILED' }
    });
  }
});

// Создание фильма (только для админа, но проверка не требуется)
app.post('/api/movies', async (req, res) => {
  try {
    const { title, description, year, genre_id, poster_url } = req.body;
    const result = await pool.query(
      `INSERT INTO movies (title, description, year, genre_id, poster_url) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, year, genre_id, poster_url]
    );
    res.status(201).json({ success: true, data: { movie: result.rows[0] } });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: error.message, code: 'CREATE_MOVIE_FAILED' }
    });
  }
});

// Оценки
app.get('/api/ratings', async (req, res) => {
  const { movie_id } = req.query;
  try {
    let sql = `
      SELECT r.*, u.username 
      FROM ratings r 
      LEFT JOIN users u ON r.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    if (movie_id) {
      sql += ` AND r.movie_id = $${params.length + 1}`;
      params.push(movie_id);
    }
    sql += ' ORDER BY r.created_at DESC';
    const result = await pool.query(sql, params);
    res.json({ success: true, data: { ratings: result.rows } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: 'FETCH_RATINGS_FAILED' }
    });
  }
});

app.post('/api/ratings', async (req, res) => {
  try {
    const { movie_id, rating, review } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Требуется авторизация', code: 'UNAUTHORIZED' }
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const result = await pool.query(
      `INSERT INTO ratings (user_id, movie_id, rating, review) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id, movie_id) 
       DO UPDATE SET rating = $3, review = $4, created_at = NOW()
       RETURNING *`,
      [userId, movie_id, rating, review || null]
    );
    res.status(201).json({ success: true, data: { rating: result.rows[0] } });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: { message: 'Неверный токен', code: 'INVALID_TOKEN' }
      });
    }
    res.status(400).json({
      success: false,
      error: { message: error.message, code: 'CREATE_RATING_FAILED' }
    });
  }
});

// Жанры
app.get('/api/genres', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genres ORDER BY name');
    res.json({ success: true, data: { genres: result.rows } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: 'FETCH_GENRES_FAILED' }
    });
  }
});

// Списки пользователя
app.get('/api/lists', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Требуется авторизация', code: 'UNAUTHORIZED' }
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const result = await pool.query(
      `SELECT ml.*, m.title, m.year, m.poster_url, m.description
       FROM movie_lists ml 
       JOIN movies m ON ml.movie_id = m.id 
       WHERE ml.user_id = $1 
       ORDER BY ml.created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: { lists: result.rows } });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: { message: 'Неверный токен', code: 'INVALID_TOKEN' }
      });
    }
    res.status(500).json({
      success: false,
      error: { message: error.message, code: 'FETCH_LISTS_FAILED' }
    });
  }
});

app.post('/api/lists', async (req, res) => {
  try {
    const { movie_id, list_type } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Требуется авторизация', code: 'UNAUTHORIZED' }
      });
    }
    const validTypes = ['watchlist', 'favorites', 'watched'];
    if (!validTypes.includes(list_type)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Неверный тип списка', code: 'INVALID_LIST_TYPE' }
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const result = await pool.query(
      `INSERT INTO movie_lists (user_id, movie_id, list_type) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, movie_id, list_type) DO NOTHING 
       RETURNING *`,
      [userId, movie_id, list_type]
    );
    if (result.rows.length === 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'Фильм уже в списке', code: 'ALREADY_IN_LIST' }
      });
    }
    res.status(201).json({ success: true, data: { list: result.rows[0] } });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: { message: 'Неверный токен', code: 'INVALID_TOKEN' }
      });
    }
    res.status(400).json({
      success: false,
      error: { message: error.message, code: 'ADD_TO_LIST_FAILED' }
    });
  }
});

app.delete('/api/lists/:movieId/:listType', async (req, res) => {
  try {
    const { movieId, listType } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Требуется авторизация', code: 'UNAUTHORIZED' }
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    await pool.query(
      `DELETE FROM movie_lists 
       WHERE user_id = $1 AND movie_id = $2 AND list_type = $3`,
      [userId, movieId, listType]
    );
    res.json({ success: true, message: 'Удалено из списка' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: { message: 'Неверный токен', code: 'INVALID_TOKEN' }
      });
    }
    res.status(500).json({
      success: false,
      error: { message: error.message, code: 'REMOVE_FROM_LIST_FAILED' }
    });
  }
});

// ==================== REDIS (опционально) ====================
// Если Redis настроен, подключаемся и используем для кэширования.
// Но чтобы не ломать сервер при недоступности Redis, сделаем graceful fallback.


async function initRedis() {
  if (!process.env.REDIS_URL) {
    console.log('ℹ️ Redis not configured, skipping cache layer');
    return;
  }
  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));
    redisClient.on('connect', () => console.log('🔄 Redis connecting...'));
    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
      redisReady = true;
    });
    await redisClient.connect();
  } catch (err) {
    console.error('⚠️ Failed to connect to Redis, continuing without cache:', err.message);
    redisClient = null;
  }
}

// Функция-обёртка для кэширования (если Redis доступен)
// ==================== RAM-КЭШ (стабильно для разработки) ====================
const memoryCache = new Map();

async function getOrCache(key, ttlSec, fetchFn) {
  // 1️⃣ Проверяем RAM-кэш
  const cached = memoryCache.get(key);
  if (cached && cached.expires > Date.now()) {
    console.log(`📦 RAM-КЭШ-ХИТ! ${key}`); // ← ← ← ЭТО ВЫ ХОТИТЕ ВИДЕТЬ
    return cached.data;
  }
  
  // 2️⃣ Кэш устарел → запрос к БД
  console.log(`🗄 Запрос к БД (кэш-мисс)...`);
  const data = await fetchFn();
  
  // 3️⃣ Сохраняем в RAM
  memoryCache.set(key, {
    data,
    expires: Date.now() + ttlSec * 1000
  });
  console.log(`💾 Записано в RAM-кэш: ${key} (TTL: ${ttlSec}s)`);
  
  return data;
}

// Очистка кэша при изменении данных
function invalidateCache(prefix) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
      console.log(`🗑 Очищен кэш: ${key}`);
    }
  }
}
// Опционально: можно заменить некоторые GET-маршруты на кэшируемые версии,
// но оставим как есть для простоты. Если хотите кэшировать /api/movies или /api/genres,
// раскомментируйте код ниже и замените существующие обработчики.
/*
app.get('/api/movies', async (req, res) => {
  const movies = await getOrCache('cache:movies:list', 120, async () => {
    const result = await pool.query('SELECT id, title, year FROM movies ORDER BY year DESC');
    return result.rows;
  });
  res.json({ success: true, data: { movies } });
});
*/

// ==================== ЗАПУСК СЕРВЕРА ====================
const PORT = process.env.PORT || 3000;

async function startServer() {
  await initRedis();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
