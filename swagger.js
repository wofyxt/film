// swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FILM API',
      version: '1.0.0',
      description: 'API для сайта с фильмами. Поддерживает регистрацию, вход, оценку фильмов.',
      contact: {
        name: 'Разработчик',
        email: 'dev@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Локальный сервер разработки'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', example: 'user' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Movie: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Матрица' },
            description: { type: 'string', example: 'Хакер узнаёт правду о реальности' },
            year: { type: 'integer', example: 1999 },
            genre_id: { type: 'integer', example: 5 },
            poster_url: { type: 'string', example: 'https://image.tmdb.org/poster.jpg' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Genre: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Боевик' }
          }
        },
        Rating: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            movie_id: { type: 'integer', example: 5 },
            rating: { type: 'integer', minimum: 1, maximum: 10, example: 8 },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Пользователь уже существует' },
                code: { type: 'string', example: 'USER_EXISTS' }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./server/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;