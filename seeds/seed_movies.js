const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'film_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Тестовые данные
const genres = [
  'Боевик', 'Комедия', 'Драма', 'Ужасы', 'Фантастика', 
  'Приключения', 'Триллер', 'Мелодрама', 'Аниме', 'Документальный'
];

const movies = [
  // Боевики
  { 
    title: 'Терминатор 2: Судный день', 
    year: 1991, 
    genre: 'Боевик', 
    description: 'Киборг защищает мальчика от продвинутого терминатора.', 
    rating: 8.5,
    poster_url: 'https://images.iptv.rt.ru/images/ct91rkbir4sqiatd9ce0.jpg'
  },
  { 
    title: 'Матрица', 
    year: 1999, 
    genre: 'Боевик', 
    description: 'Хакер узнаёт правду о реальности.', 
    rating: 8.7,
    poster_url: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'
  },
  { 
    title: 'Джон Уик', 
    year: 2014, 
    genre: 'Боевик', 
    description: 'Легендарный киллер выходит на пенсию.', 
    rating: 7.4,
    poster_url: 'https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg'
  },
  { 
    title: 'Безумный Макс: Дорога ярости', 
    year: 2015, 
    genre: 'Боевик', 
    description: 'Постапокалиптическая погоня.', 
    rating: 8.1,
    poster_url: 'https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg'
  },
  { 
    title: 'Крепкий орешек', 
    year: 1988, 
    genre: 'Боевик', 
    description: 'Полицейский против террористов.', 
    rating: 8.2,
    poster_url: 'https://image.tmdb.org/t/p/w500/yFzHkXfKs3VYRNgC0VYpNz3pJWu.jpg'
  },
  
  // Комедии
  { 
    title: 'Мальчишник в Вегасе', 
    year: 2009, 
    genre: 'Комедия', 
    description: 'Три друга теряют жениха.', 
    rating: 7.7,
    poster_url: 'https://image.tmdb.org/t/p/w500/uluhlXubGu1VxU63X9VHCLWDAYP.jpg'
  },
  { 
    title: '1+1', 
    year: 2011, 
    genre: 'Комедия', 
    description: 'Невероятная дружба аристократа и парня из гетто.', 
    rating: 8.5,
    poster_url: 'https://image.tmdb.org/t/p/w500/323BP0itpxTsO0skTwdnVmf7YC9.jpg'
  },
  { 
    title: 'День сурка', 
    year: 1993, 
    genre: 'Комедия', 
    description: 'Человек проживает один день много раз.', 
    rating: 8.0,
    poster_url: 'https://image.tmdb.org/t/p/w500/gCgt1WARPZaXnq523CsqjEubEsV.jpg'
  },
  { 
    title: 'Маска', 
    year: 1994, 
    genre: 'Комедия', 
    description: 'Скромный банкир находит магическую маску.', 
    rating: 6.9,
    poster_url: 'https://image.tmdb.org/t/p/w500/5nXjZDn3GzEFcmz5E0mVlKz1b7Y.jpg'
  },
  { 
    title: 'Один дома', 
    year: 1990, 
    genre: 'Комедия', 
    description: 'Мальчик защищает дом от грабителей.', 
    rating: 7.7,
    poster_url: 'https://image.tmdb.org/t/p/w500/onTSipZ8R3amEw7977phT8FLVEX.jpg'
  },
  
  // Драмы
  { 
    title: 'Побег из Шоушенка', 
    year: 1994, 
    genre: 'Драма', 
    description: 'Невиновный заключённый планирует побег.', 
    rating: 9.3,
    poster_url: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'
  },
  { 
    title: 'Форрест Гамп', 
    year: 1994, 
    genre: 'Драма', 
    description: 'История простого парня с большим сердцем.', 
    rating: 8.8,
    poster_url: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg'
  },
  { 
    title: 'Зелёная миля', 
    year: 1999, 
    genre: 'Драма', 
    description: 'Тюремщик и заключённый с даром.', 
    rating: 8.6,
    poster_url: 'https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmIo52R.jpg'
  },
  { 
    title: 'Список Шиндлера', 
    year: 1993, 
    genre: 'Драма', 
    description: 'Промышленник спасает евреев.', 
    rating: 8.9,
    poster_url: 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pTXMYXKd.jpg'
  },
  { 
    title: 'Бойцовский клуб', 
    year: 1999, 
    genre: 'Драма', 
    description: 'Подпольные бои и раздвоение личности.', 
    rating: 8.8,
    poster_url: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg'
  },
  
  // Ужасы
  { 
    title: 'Сияние', 
    year: 1980, 
    genre: 'Ужасы', 
    description: 'Семья в изолированном отеле.', 
    rating: 8.4,
    poster_url: 'https://image.tmdb.org/t/p/w500/b6ko0IKC8MdYBBPkkA1aBPLe2yz.jpg'
  },
  { 
    title: 'Чужой', 
    year: 1979, 
    genre: 'Ужасы', 
    description: 'Космический корабль и хищник.', 
    rating: 8.5,
    poster_url: 'https://image.tmdb.org/t/p/w500/vfrAkDpZ5g9Xn0V8bLfMoFjGf1p.jpg'
  },
  { 
    title: 'Заклятие', 
    year: 2013, 
    genre: 'Ужасы', 
    description: 'Семья сталкивается с демонами.', 
    rating: 7.5,
    poster_url: 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujFHT7Z6lFX.jpg'
  },
  { 
    title: 'Пила: Игра на выживание', 
    year: 2004, 
    genre: 'Ужасы', 
    description: 'Люди в смертельных ловушках.', 
    rating: 7.6,
    poster_url: 'https://image.tmdb.org/t/p/w500/9rZyqXU8g0K0k1xPJU5mJ5qOQs.jpg'
  },
  { 
    title: 'Астрал', 
    year: 2010, 
    genre: 'Ужасы', 
    description: 'Мальчик впадает в кому и видит астрал.', 
    rating: 6.8,
    poster_url: 'https://image.tmdb.org/t/p/w500/dRZKbMj7OKdXpJhgmK8m1UfFJpE.jpg'
  },
  
  // Фантастика
  { 
    title: 'Интерстеллар', 
    year: 2014, 
    genre: 'Фантастика', 
    description: 'Путешествие через червоточину.', 
    rating: 8.6,
    poster_url: 'https://image.tmdb.org/t/p/w500/gEU2QniL6C8z14uVhK2R4vH8O8n.jpg'
  },
  { 
    title: 'Начало', 
    year: 2010, 
    genre: 'Фантастика', 
    description: 'Кража идей из снов.', 
    rating: 8.8,
    poster_url: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'
  },
  { 
    title: 'Бегущий по лезвию 2049', 
    year: 2017, 
    genre: 'Фантастика', 
    description: 'Охотник на репликантов.', 
    rating: 8.0,
    poster_url: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg'
  },
  { 
    title: 'Гравитация', 
    year: 2013, 
    genre: 'Фантастика', 
    description: 'Астронавты в открытом космосе.', 
    rating: 7.7,
    poster_url: 'https://image.tmdb.org/t/p/w500/uAzx06b3lKsGPHqQEAXl3Fb5Bm3.jpg'
  },
  { 
    title: 'Прибытие', 
    year: 2016, 
    genre: 'Фантастика', 
    description: 'Контакт с инопланетянами.', 
    rating: 7.9,
    poster_url: 'https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg'
  },
  
  // Приключения
  { 
    title: 'Индиана Джонс: В поисках утраченного ковчега', 
    year: 1981, 
    genre: 'Приключения', 
    description: 'Археолог ищет ковчег завета.', 
    rating: 8.4,
    poster_url: 'https://image.tmdb.org/t/p/w500/ceG9VzoRAVGwivFU403Wc3AHRys.jpg'
  },
  { 
    title: 'Пираты Карибского моря', 
    year: 2003, 
    genre: 'Приключения', 
    description: 'Капитан Джек Воробей.', 
    rating: 8.0,
    poster_url: 'https://image.tmdb.org/t/p/w500/j8x93v9K8pMhbVjC1XzWpvYlQhV.jpg'
  },
  { 
    title: 'Властелин колец: Братство Кольца', 
    year: 2001, 
    genre: 'Приключения', 
    description: 'Хоббит несёт Кольцо.', 
    rating: 8.8,
    poster_url: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg'
  },
  { 
    title: 'Парк Юрского периода', 
    year: 1993, 
    genre: 'Приключения', 
    description: 'Динозавры в парке развлечений.', 
    rating: 8.1,
    poster_url: 'https://image.tmdb.org/t/p/w500/9i3plLl89DHMz7mahksDaAo7vHY.jpg'
  },
  { 
    title: 'Назад в будущее', 
    year: 1985, 
    genre: 'Приключения', 
    description: 'Путешествие во времени на DeLorean.', 
    rating: 8.5,
    poster_url: 'https://image.tmdb.org/t/p/w500/fNOH9f9aA7XRTzl1sCjw5eH4u2M.jpg'
  },
  
  // Триллеры
  { 
    title: 'Семь', 
    year: 1995, 
    genre: 'Триллер', 
    description: 'Детективы ищут серийного убийцу.', 
    rating: 8.6,
    poster_url: 'https://image.tmdb.org/t/p/w500/6yoghtyTpznpBik8EngEmJskVUO.jpg'
  },
  { 
    title: 'Молчание ягнят', 
    year: 1991, 
    genre: 'Триллер', 
    description: 'Агент ФБР и Ганнибал Лектер.', 
    rating: 8.6,
    poster_url: 'https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg'
  },
  { 
    title: 'Остров проклятых', 
    year: 2010, 
    genre: 'Триллер', 
    description: 'Расследование в психбольнице.', 
    rating: 8.2,
    poster_url: 'https://image.tmdb.org/t/p/w500/kve20tXwUZpu4uUX8wkRv8H7nF.jpg'
  },
  { 
    title: 'Престиж', 
    year: 2006, 
    genre: 'Триллер', 
    description: 'Соперничество иллюзионистов.', 
    rating: 8.5,
    poster_url: 'https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg'
  },
  { 
    title: 'Исчезнувшая', 
    year: 2014, 
    genre: 'Триллер', 
    description: 'Жена исчезает в годовщину.', 
    rating: 8.1,
    poster_url: 'https://image.tmdb.org/t/p/w500/lv5xShBIDPe7m4ufdlV0IAc7Avw.jpg'
  },
  
  // Мелодрамы
  { 
    title: 'Титаник', 
    year: 1997, 
    genre: 'Мелодрама', 
    description: 'Любовь на тонущем корабле.', 
    rating: 7.8,
    poster_url: 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg'
  },
  { 
    title: 'Дневник памяти', 
    year: 2004, 
    genre: 'Мелодрама', 
    description: 'История любви через годы.', 
    rating: 7.8,
    poster_url: 'https://image.tmdb.org/t/p/w500/qom1SZSENdmHFNZBXbtJAU0WTlC.jpg'
  },
  { 
    title: 'Ла-Ла Ленд', 
    year: 2016, 
    genre: 'Мелодрама', 
    description: 'Мюзикл о мечтах и любви.', 
    rating: 8.0,
    poster_url: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWWwo7POvZxZ4gQOZSv.jpg'
  },
  { 
    title: 'Красотка', 
    year: 1990, 
    genre: 'Мелодрама', 
    description: 'Бизнесмен и девушка по вызову.', 
    rating: 7.0,
    poster_url: 'https://image.tmdb.org/t/p/w500/fLQdOXp7l5LlCEjDZdXAUVwMxV.jpg'
  },
  { 
    title: 'До встречи с тобой', 
    year: 2016, 
    genre: 'Мелодрама', 
    description: 'Необычная любовь и сложные решения.', 
    rating: 7.4,
    poster_url: 'https://image.tmdb.org/t/p/w500/Ia3dzM5LnCjHQqxldQXZMuGQf3.jpg'
  },
  
  // Аниме
  { 
    title: 'Унесённые призраками', 
    year: 2001, 
    genre: 'Аниме', 
    description: 'Девочка в мире духов.', 
    rating: 8.6,
    poster_url: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUKhdpgEgtx.jpg'
  },
  { 
    title: 'Твоё имя', 
    year: 2016, 
    genre: 'Аниме', 
    description: 'Двое меняются телами.', 
    rating: 8.4,
    poster_url: 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg'
  },
  { 
    title: 'Ходячий замок', 
    year: 2004, 
    genre: 'Аниме', 
    description: 'Девушка превращена в старуху.', 
    rating: 8.2,
    poster_url: 'https://image.tmdb.org/t/p/w500/TkTPELv4kC3u1lkloush2hXtYF.jpg'
  },
  { 
    title: 'Акира', 
    year: 1988, 
    genre: 'Аниме', 
    description: 'Киберпанк в Токио.', 
    rating: 8.0,
    poster_url: 'https://image.tmdb.org/t/p/w500/gQB8Y5RCMkv2WZSXpP1qVDPp9g.jpg'
  },
  { 
    title: 'Принцесса Мононоке', 
    year: 1997, 
    genre: 'Аниме', 
    description: 'Борьба природы и цивилизации.', 
    rating: 8.4,
    poster_url: 'https://image.tmdb.org/t/p/w500/jHWmNr7m544fJ8eItsfNk8fs2Ed.jpg'
  },
  
  // Документальные
  { 
    title: 'Земляне', 
    year: 2005, 
    genre: 'Документальный', 
    description: 'Отношение человека к животным.', 
    rating: 8.6,
    poster_url: 'https://image.tmdb.org/t/p/w500/8J1l4VfMlQhYz8k1l4VfMlQhYz8.jpg'
  },
  { 
    title: 'Дом', 
    year: 2009, 
    genre: 'Документальный', 
    description: 'Красота и проблемы Земли.', 
    rating: 8.5,
    poster_url: 'https://image.tmdb.org/t/p/w500/2h00HrZs89SL3tXB4nbKdCsE8XJ.jpg'
  },
  { 
    title: 'Океаны', 
    year: 2009, 
    genre: 'Документальный', 
    description: 'Подводный мир.', 
    rating: 7.9,
    poster_url: 'https://image.tmdb.org/t/p/w500/7nMl9Y7i5l4VfMlQhYz8k1l4VfM.jpg'
  },
  { 
    title: 'Планета Земля', 
    year: 2006, 
    genre: 'Документальный', 
    description: 'Природа нашей планеты.', 
    rating: 9.4,
    poster_url: 'https://image.tmdb.org/t/p/w500/8J1l4VfMlQhYz8k1l4VfMlQhYz8.jpg'
  },
  { 
    title: 'Космос: Пространство и время', 
    year: 2014, 
    genre: 'Документальный', 
    description: 'Путешествие по вселенной.', 
    rating: 9.3,
    poster_url: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg'
  },
];
async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Начинаем заполнение базы данных...');

    // 1. Очищаем таблицы
    console.log('🗑️  Очистка таблиц...');
    await client.query('TRUNCATE TABLE ratings, movies, genres, users RESTART IDENTITY CASCADE');

    // 2. Добавляем жанры
    console.log('📚 Добавление жанров...');
    for (const genre of genres) {
      await client.query(
        'INSERT INTO genres (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [genre]
      );
    }

    // 3. Создаём тестового пользователя
    console.log('👤 Создание тестового пользователя...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(
      `INSERT INTO users (username, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      ['testuser', 'test@example.com', hashedPassword, 'user']
    );
    await client.query(
      `INSERT INTO users (username, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      ['admin', 'admin@example.com', hashedPassword, 'admin']
    );

    // 4. Добавляем фильмы
    console.log('🎬 Добавление фильмов...');
    for (const movie of movies) {
      // Получаем ID жанра
      const genreResult = await client.query(
        'SELECT id FROM genres WHERE name = $1',
        [movie.genre]
      );
      
      const genreId = genreResult.rows[0]?.id;
      
      if (genreId) {
        await client.query(
          `INSERT INTO movies (title, description, year, genre_id, poster_url) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            movie.title,
            movie.description,
            movie.year,
            genreId,
            movie.poster_url 
          ]
        );
      }
    }

    // 5. Добавляем тестовые оценки
    console.log('⭐ Добавление оценок...');
    const userResult = await client.query('SELECT id FROM users WHERE email = $1', ['test@example.com']);
    const userId = userResult.rows[0].id;
    
    const moviesResult = await client.query('SELECT id FROM movies');
    const movieIds = moviesResult.rows.map(row => row.id);
    
    // Создаём 20 случайных оценок
    for (let i = 0; i < 20; i++) {
      const randomMovieId = movieIds[Math.floor(Math.random() * movieIds.length)];
      const randomRating = Math.floor(Math.random() * 10) + 1;
      
      await client.query(
        `INSERT INTO ratings (user_id, movie_id, rating) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (user_id, movie_id) DO NOTHING`,
        [userId, randomMovieId, randomRating]
      );
    }

    console.log('✅ База данных успешно заполнена!');
    console.log(`📊 Итого: ${movies.length} фильмов, ${genres.length} жанров, 2 пользователя, 20 оценок`);
    
  } catch (error) {
    console.error('❌ Ошибка при заполнении БД:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();