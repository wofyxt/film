// js/api.js
const API = {
  baseURL: '/api',
  
  getToken() {
    return localStorage.getItem('token');
  },
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Ошибка API');
      }
      
      return data.data;
    } catch (error) {
      console.error(`API Error ${endpoint}:`, error);
      throw error;
    }
  },
  
  // ФИЛЬМЫ
  getMovies(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/movies?${params}`);
  },
  
  getMovie(id) {
    return this.request(`/movies/${id}`);
  },
  
  searchMovies(query) {
    return this.request(`/movies/search?q=${encodeURIComponent(query)}`);
  },
  
  // ЖАНРЫ
  getGenres() {
    return this.request('/genres');
  },
  
  // ОЦЕНКИ
  addRating(movieId, rating, review = '') {
    return this.request('/ratings', {
      method: 'POST',
      body: JSON.stringify({ movie_id: movieId, rating, review })
    });
  },
  
  getRatings(movieId) {
    return this.request(`/ratings?movie_id=${movieId}`);
  },
  
  // СПИСКИ
  addToList(movieId, listType) {
    return this.request('/lists', {
      method: 'POST',
      body: JSON.stringify({ movie_id: movieId, list_type: listType })
    });
  },
  
  getUserLists() {
    return this.request('/lists');
  },
  removeFromList(movieId, listType) {
  return this.request(`/api/lists/${movieId}/${listType}`, {
    method: 'DELETE'
  });
}
};



// Делаем доступным глобально
window.API = API;