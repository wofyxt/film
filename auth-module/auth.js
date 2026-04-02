const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

// ==================== РЕГИСТРАЦИЯ ====================
async function registerUser(username, email, password) {
  try {
    // Проверка существования пользователя
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      // 🔄 Добавляем код ошибки
      throw { 
        message: 'Пользователь уже существует', 
        code: 'USER_EXISTS' 
      };
    }

    // Валидация пароля (рекомендую добавить)
    if (password.length < 6) {
      throw { 
        message: 'Пароль должен быть не менее 6 символов', 
        code: 'WEAK_PASSWORD' 
      };
    }

    // Хэширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    // 🔄 Возвращаем в формате { success, data }
    return { 
      success: true, 
      data: { user: newUser.rows[0] } 
    };
    
  } catch (error) {
    // 🔄 Приводим ошибки к единому формату
    if (error.code) {
      throw error; // Уже в нужном формате
    }
    throw { 
      message: error.message || 'Ошибка регистрации', 
      code: 'REGISTRATION_ERROR' 
    };
  }
}

// ==================== ВХОД ====================
async function loginUser(email, password) {
  try {
    // Поиск пользователя
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw { 
        message: 'Неверный email или пароль', 
        code: 'AUTH_INVALID' 
      };
    }

    const user = result.rows[0];

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw { 
        message: 'Неверный email или пароль', 
        code: 'AUTH_INVALID' 
      };
    }

    // Создание токена
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 🔄 Возвращаем в формате { success, data: { token, user } }
    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    };
    
  } catch (error) {
    if (error.code) {
      throw error;
    }
    throw { 
      message: error.message || 'Ошибка входа', 
      code: 'LOGIN_ERROR' 
    };
  }
}

module.exports = { registerUser, loginUser };