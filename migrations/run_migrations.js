const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // ← Загружаем .env

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'film',
  password: process.env.DB_PASSWORD || '123',
  port: process.env.DB_PORT || 5432,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    const migrationFiles = fs
      .readdirSync(__dirname)
      .filter(file => file.match(/^\d+.*\.sql$/))
      .sort();

    console.log('📁 Найдено миграций:', migrationFiles.length);

    for (const file of migrationFiles) {
      console.log(`🔄 Выполнение миграции: ${file}`);
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      
      // ✅ Выполняем ВЕСЬ SQL файл (и DROP, и CREATE)
      await client.query(sql);
      
      console.log(`✅ Миграция ${file} выполнена`);
    }

    console.log('🎉 Все миграции выполнены успешно!');
  } catch (error) {
    console.error('❌ Ошибка миграции:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();