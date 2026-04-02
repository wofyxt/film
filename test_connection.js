const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'film_db',      // ← Должно совпадать с .env
  password: '123',       // ← Ваш пароль
  port: 5432,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Ошибка подключения:', err.message);
  } else {
    console.log('✅ Подключение успешно!', res.rows[0].now);
  }
  pool.end();
});