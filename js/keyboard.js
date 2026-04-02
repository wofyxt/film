// js/keyboard.js
(function() {
  // 🔹 Глобальная инициализация клавиатурной доступности
  window.initKeyboardAccessibility = function() {
    setupCardKeyboard();
    setupTabKeyboard();
    setupMenuKeyboard();
    setupFormKeyboard();
  };

  // ✅ Карточки фильмов: Enter/Space вместо клика
  function setupCardKeyboard() {
    document.body.addEventListener('keydown', (e) => {
      const card = e.target.closest('.movie-card');
      if (!card) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = card.dataset.movieId;
        if (id) window.openMovie?.(id);
      }
    });
  }

  // ✅ Табы: стрелки ← → и фокус
  function setupTabKeyboard() {
    const tablists = document.querySelectorAll('[role="tablist"]');
    tablists.forEach(tablist => {
      const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
      tabs.forEach((tab, index) => {
        tab.addEventListener('keydown', (e) => {
          let newIndex = index;
          if (e.key === 'ArrowRight') newIndex = (index + 1) % tabs.length;
          else if (e.key === 'ArrowLeft') newIndex = (index - 1 + tabs.length) % tabs.length;
          else return;

          e.preventDefault();
          tabs[newIndex].focus();
          tabs[newIndex].click(); // Активируем таб фокусом
        });
      });
    });
  }

  // ✅ Бургер-меню: Escape, фокус, закрытие по клику вне
  function setupMenuKeyboard() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('active')) {
        nav.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '☰';
        toggle.focus(); // Возвращаем фокус на кнопку
      }
    });

    // Закрытие по клику вне меню
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('active') && 
          !nav.contains(e.target) && 
          !toggle.contains(e.target)) {
        nav.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '☰';
      }
    });
  }

  // ✅ Формы: фокус на ошибки при валидации
  function setupFormKeyboard() {
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (!form.classList.contains('review-form') && !form.classList.contains('filter-form')) return;
      
      // Если есть ошибки, переводим фокус на первое поле с ошибкой
      setTimeout(() => {
        const error = form.querySelector('[aria-invalid="true"]');
        if (error) error.focus();
      }, 100);
    });
  }
})();