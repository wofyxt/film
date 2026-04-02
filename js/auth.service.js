// ==================== РЕГИСТРАЦИЯ ====================
async function register(username, email, password) {
  try {
    console.log('📤 Регистрация:', { username, email });
    
    // ✅ НОВЫЙ АДРЕС (не /api/register!)
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    console.log('📥 Ответ сервера:', response.status);
    const data = await response.json();
    
    if (data.success) {
      alert('Регистрация успешна! Теперь войдите.');
      window.location.href = '/login.html';
    } else {
      alert(data.error?.message || 'Ошибка регистрации');
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
    alert('Ошибка соединения с сервером');
  }
}

// ==================== ВХОД ====================
async function login(email, password) {
  try {
    console.log('📤 Вход:', { email });
    
    // ✅ НОВЫЙ АДРЕС (не /api/login!)
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    console.log('📥 Ответ сервера:', response.status);
    const data = await response.json();
    
    if (data.success) {
      const token = data.data?.token || data.token;
      const user = data.data?.user || data.user;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = '/index.html';
    } else {
      alert(data.error?.message || 'Ошибка входа');
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
    alert('Ошибка соединения с сервером');
  }
}

// ==================== ВЫХОД ====================
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// ==================== ПРОВЕРКА АВТОРИЗАЦИИ ====================
async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const response = await fetch('/api/users/me', {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Ошибка проверки авторизации:', error);
    return false;
  }
}

// ==================== ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ====================
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}