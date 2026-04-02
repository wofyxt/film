const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const { registerUser, loginUser } = require('../auth-module/auth');
const pool = require('../auth-module/db.js');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.static(path.join(__dirname, '..')));

// ==================== КЭШИРОВАНИЕ ====================

// Кэш для публичных GET-запросов (5 минут)
app.use((req, res, next) => {
  // Кэшируем только GET-запросы к публичным данным
  if (req.method === 'GET' && !req.url.startsWith('/api/users/me')) {
    // Устанавливаем заголовки для кэширования
    res.set('Cache-Control', 'public, max-age=300'); // 5 минут
  }
  next();
});

// Для авторизованных запросов — не кэшируем
app.use('/api/users/me', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});
/**
 * @swagger
 * /api/movies:
 *   get:
 *     summary: Получить список всех фильмов
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Список фильмов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     movies:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Movie'
 *   post:
 *     summary: Создать новый фильм
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - year
 *             properties:
 *               title:
 *                 type: string
 *                 example: Новый фильм
 *               description:
 *                 type: string
 *                 example: Описание фильма
 *               year:
 *                 type: integer
 *                 example: 2024
 *               genre_id:
 *                 type: integer
 *                 example: 1
 *               poster_url:
 *                 type: string
 *                 example: https://image.tmdb.org/poster.jpg
 *     responses:
 *       201:
 *         description: Фильм создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     movie:
 *                       $ref: '#/components/schemas/Movie'
 */
// Создание фильма (не кэшируем!)
app.post('/api/movies', async (req, res) => {
  // ❌ Запрещаем кэширование
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  
  try {
    const { title, description, year, genre_id, poster_url } = req.body;
    const result = await pool.query(
      `INSERT INTO movies (title, description, year, genre_id, poster_url) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, year, genre_id, poster_url]
    );
    
    res.status(201).json({ 
      success: true, 
      data: { movie: result.rows[0] } 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message, code: 'CREATE_MOVIE_FAILED' } 
    });
  }
});




/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка регистрации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// ✅ API роуты
app.post('/api/users', async (req, res) => {
   res.set('Cache-Control', 'no-store'); // ❌ Не кэшируем
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
/**
 * @swagger
 * /api/auth/token:
 *   post:
 *     summary: Вход пользователя (получение JWT токена)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Неверный email или пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/auth/token', async (req, res) => {
   res.set('Cache-Control', 'no-store'); // ❌ Не кэшируем
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
/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Получить данные текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Неавторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/users/me', (req, res) => {
   res.set('Cache-Control', 'no-store, no-cache'); // ❌ Не кэшируем
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: { message: 'No token' } });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, data: { user: decoded } });
  } catch (error) {
    res.status(401).json({ success: false, error: { message: 'Invalid token' } });
  }
});
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
    
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ success: true, data: { movies: result.rows } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

app.get('/api/movies', async (req, res) => {
  const { genre_id, year_from, year_to, rating_from } = req.query;
  
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
  
  try {
    const result = await pool.query(sql, params);
    
    // Преобразуем avg_rating в число или null
    const movies = result.rows.map(movie => ({
      ...movie,
      avg_rating: movie.avg_rating ? parseFloat(movie.avg_rating) : null
    }));
    
    res.set('Cache-Control', 'public, max-age=300');
    
    // ✅ ИСПРАВЛЕНО: добавлено data:
    res.json({ 
      success: true, 
      data: { movies } 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message, code: 'FETCH_MOVIES_FAILED' } 
    });
  }
});
// ==================== ОДИН ФИЛЬМ ====================
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
    
    // Получим средний рейтинг
    const ratingResult = await pool.query(
      'SELECT AVG(rating) as avg_rating FROM ratings WHERE movie_id = $1',
      [id]
    );
    
    const movie = result.rows[0];
    movie.avg_rating = ratingResult.rows[0].avg_rating 
      ? parseFloat(ratingResult.rows[0].avg_rating).toFixed(1) 
      : null;
    
    res.set('Cache-Control', 'public, max-age=600');
    res.json({ success: true, data: { movie } });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message, code: 'FETCH_MOVIE_FAILED' } 
    });
  }
});


// ==================== ОЦЕНКИ ====================
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
    
    // Если указан movie_id — фильтруем по фильму
    if (movie_id) {
      sql += ` AND r.movie_id = $${params.length + 1}`;
      params.push(movie_id);
    }
    
    sql += ' ORDER BY r.created_at DESC';
    
    const result = await pool.query(sql, params);
    
    res.set('Cache-Control', 'no-cache');
    res.json({ success: true, data: { ratings: result.rows } });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message, code: 'FETCH_RATINGS_FAILED' } 
    });
  }
});

// Создание оценки
app.post('/api/ratings', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  
  try {
    const { movie_id, rating, review } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: { message: 'Требуется авторизация', code: 'UNAUTHORIZED' } 
      });
    }
    
    // Получаем user_id из токена
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
app.get('/api/genres', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genres ORDER BY name');
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('ETag', `"${result.rows.length}"`);
    
    // ✅ ИСПРАВЛЕНО: добавлено data:
    res.json({ 
      success: true, 
      data: { genres: result.rows } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message, code: 'FETCH_GENRES_FAILED' } 
    });
  }
});

// ==================== СПИСКИ ПОЛЬЗОВАТЕЛЯ ====================

// Получить все списки пользователя
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
    
    // ✅ ИСПРАВЛЕНО: добавлено data:
    res.json({ 
      success: true, 
      data: { lists: result.rows } 
    });
    
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

// Добавить фильм в список
app.post('/api/lists', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  
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
    
    // ✅ ИСПРАВЛЕНО: добавлено data:
    res.status(201).json({ 
      success: true, 
      data: { list: result.rows[0] } 
    });
    
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
  res.set('Cache-Control', 'no-store');
  
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});
