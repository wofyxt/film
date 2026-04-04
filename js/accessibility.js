// js/accessibility.js
(function() {
  const STORAGE_FONT_SIZE = 'accessibility_font_size';
  const STORAGE_FONT_FAMILY = 'accessibility_font_family';
  const STORAGE_COLOR_SCHEME = 'accessibility_color_scheme';
  const STORAGE_HIDE_IMAGES = 'accessibility_hide_images';
  
  const FONT_SIZES = ['normal', 'large', 'xlarge'];
  const FONT_FAMILIES = ['default', 'arial', 'times'];
  const COLOR_SCHEMES = ['black-white', 'white-black', 'blue-cyan'];
  
  const sizeClassMap = {
    'normal': '',
    'large': 'font-size-150',
    'xlarge': 'font-size-200'
  };
  const familyClassMap = {
    'default': 'font-default',
    'arial': 'font-arial',
    'times': 'font-times'
  };
  const schemeClassMap = {
    'black-white': 'color-scheme-black-white',
    'white-black': 'color-scheme-white-black',
    'blue-cyan': 'color-scheme-blue-cyan'
  };
  
  let currentFontSize = 'normal';
  let currentFontFamily = 'default';
  let currentColorScheme = 'white-black';
  let imagesHidden = false;
  let observer = null;
  let toggleButton = null;
  let toggleParent = null;
  let toggleNextSibling = null;
  let isMobileCached = null;
  
  const imageDataMap = new WeakMap();
  
  // ----- настройки шрифта и цвета -----
  function applyFontSize(size) {
    document.body.classList.remove('font-size-150', 'font-size-200');
    if (size === 'large') document.body.classList.add('font-size-150');
    else if (size === 'xlarge') document.body.classList.add('font-size-200');
    currentFontSize = size;
    localStorage.setItem(STORAGE_FONT_SIZE, size);
    updateButtonsState();
  }
  
  function applyFontFamily(family) {
    document.body.classList.remove('font-default', 'font-arial', 'font-times');
    const className = familyClassMap[family];
    if (className) document.body.classList.add(className);
    currentFontFamily = family;
    localStorage.setItem(STORAGE_FONT_FAMILY, family);
    updateButtonsState();
  }
  
  function applyColorScheme(scheme) {
    document.body.classList.remove('color-scheme-black-white', 'color-scheme-white-black', 'color-scheme-blue-cyan');
    const className = schemeClassMap[scheme];
    if (className) document.body.classList.add(className);
    currentColorScheme = scheme;
    localStorage.setItem(STORAGE_COLOR_SCHEME, scheme);
    updateButtonsState();
  }
  
  // ----- работа с изображениями -----
  function getAltText(img) {
    const alt = img.getAttribute('alt');
    if (alt && alt.trim() !== '') return alt.trim();
    return '[Изображение без описания]';
  }
  
  function replaceImageWithPlaceholder(img) {
    if (imageDataMap.has(img)) return;
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder';
    placeholder.textContent = getAltText(img);
    const originalDisplay = img.style.display;
    const originalVisibility = img.style.visibility;
    img.style.display = 'none';
    img.style.visibility = 'hidden';
    img.parentNode.insertBefore(placeholder, img.nextSibling);
    imageDataMap.set(img, { placeholder, originalDisplay, originalVisibility });
  }
  
  function restoreImageFromPlaceholder(img) {
    const data = imageDataMap.get(img);
    if (!data) return;
    img.style.display = data.originalDisplay;
    img.style.visibility = data.originalVisibility;
    if (data.placeholder && data.placeholder.parentNode) {
      data.placeholder.parentNode.removeChild(data.placeholder);
    }
    imageDataMap.delete(img);
  }
  
  function applyImagesVisibility() {
    const allImages = document.querySelectorAll('img');
    if (imagesHidden) {
      allImages.forEach(img => { if (!imageDataMap.has(img)) replaceImageWithPlaceholder(img); });
    } else {
      allImages.forEach(img => { if (imageDataMap.has(img)) restoreImageFromPlaceholder(img); });
    }
  }
  
  function setupMutationObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver((mutations) => {
      if (!imagesHidden) return;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'IMG') {
              if (!imageDataMap.has(node)) replaceImageWithPlaceholder(node);
            } else if (node.querySelectorAll) {
              node.querySelectorAll('img').forEach(img => {
                if (!imageDataMap.has(img)) replaceImageWithPlaceholder(img);
              });
            }
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  function toggleImagesVisibility() {
    imagesHidden = !imagesHidden;
    localStorage.setItem(STORAGE_HIDE_IMAGES, imagesHidden ? 'true' : 'false');
    applyImagesVisibility();
    updateButtonsState();
    if (imagesHidden && !observer) setupMutationObserver();
    else if (!imagesHidden && observer) { observer.disconnect(); observer = null; }
  }
  
  // ----- перемещение кнопки «глаз» в бургер-меню (без дублирования) -----
  function repositionAccessibilityToggle() {
    const toggle = document.querySelector('.accessibility-toggle');
    if (!toggle) return;
    
    const isMobile = window.innerWidth <= 768;
    if (isMobileCached === isMobile) return; // режим не изменился
    isMobileCached = isMobile;
    
    const navList = document.querySelector('.site-header .nav-list');
    if (!navList) return;
    
    // Сохраняем исходные родителя и соседа при первом вызове
    if (!toggleParent) {
      toggleParent = toggle.parentNode;
      toggleNextSibling = toggle.nextSibling;
    }
    
    if (isMobile) {
      // Проверяем, уже ли кнопка внутри navList (обёрнута в li)
      const parentLi = toggle.closest('li');
      if (parentLi && parentLi.parentNode === navList) {
        return; // уже на месте
      }
      // Удаляем из текущего места
      if (toggle.parentNode) toggle.parentNode.removeChild(toggle);
      // Создаём li и вставляем
      const li = document.createElement('li');
      li.className = 'nav-item-accessibility';
      li.appendChild(toggle);
      navList.appendChild(li);
      toggle.classList.add('nav-link');
      toggle.setAttribute('aria-label', 'Версия для слабовидящих (открыть панель)');
    } else {
      // Возвращаем в исходное место
      const parentLi = toggle.closest('li');
      if (parentLi) {
        // Извлекаем кнопку из li
        parentLi.parentNode.removeChild(parentLi);
      }
      if (toggleNextSibling && toggleNextSibling.parentNode === toggleParent) {
        toggleParent.insertBefore(toggle, toggleNextSibling);
      } else {
        toggleParent.appendChild(toggle);
      }
      toggle.classList.remove('nav-link');
      toggle.setAttribute('aria-label', 'Версия для слабовидящих');
    }
  }
  
  // ----- создание панели доступности -----
  function initAccessibilityPanel() {
    if (!document.getElementById('accessibilityToolbar')) {
      const toolbar = document.createElement('div');
      toolbar.id = 'accessibilityToolbar';
      toolbar.className = 'accessibility-toolbar';
      toolbar.setAttribute('hidden', '');
      toolbar.setAttribute('role', 'region');
      toolbar.setAttribute('aria-label', 'Панель управления доступностью');
      toolbar.innerHTML = `
        <div class="accessibility-group">
          <span>Размер шрифта:</span>
          <button class="accessibility-btn" data-size="normal" aria-label="Обычный размер шрифта">A</button>
          <button class="accessibility-btn" data-size="large" aria-label="Увеличенный размер шрифта (1.5x)">A+</button>
          <button class="accessibility-btn" data-size="xlarge" aria-label="Большой размер шрифта (2x)">A++</button>
        </div>
        <div class="accessibility-group">
          <span>Шрифт:</span>
          <button class="accessibility-btn" data-family="default" aria-label="Стандартный шрифт">Стандартный</button>
          <button class="accessibility-btn" data-family="arial" aria-label="Шрифт Arial">Arial</button>
          <button class="accessibility-btn" data-family="times" aria-label="Шрифт Times New Roman">Times</button>
        </div>
        <div class="accessibility-group">
          <span>Цветовая схема:</span>
          <button class="accessibility-btn scheme-btn" data-scheme="black-white" aria-label="Чёрный текст на белом фоне" style="background: #ffffff; color: #000000; border: 1px solid #000;">Ц</button>
          <button class="accessibility-btn scheme-btn" data-scheme="white-black" aria-label="Белый текст на чёрном фоне" style="background: #000000; color: #ffffff; border: 1px solid #fff;">Ц</button>
          <button class="accessibility-btn scheme-btn" data-scheme="blue-cyan" aria-label="Тёмно-синий текст на голубом фоне" style="background: #cce5ff; color: #000080; border: 1px solid #000080;">Ц</button>
        </div>
        <div class="accessibility-group">
          <span>Изображения:</span>
          <button class="accessibility-btn" data-hide-images aria-label="Скрыть изображения, показывать альтернативный текст">🖼️</button>
        </div>
        <button class="accessibility-btn close-panel" aria-label="Закрыть панель доступности">✕ Закрыть</button>
      `;
      document.body.appendChild(toolbar);
      
      toolbar.querySelectorAll('[data-size]').forEach(btn => {
        btn.addEventListener('click', () => {
          const size = btn.getAttribute('data-size');
          if (FONT_SIZES.includes(size)) applyFontSize(size);
        });
      });
      toolbar.querySelectorAll('[data-family]').forEach(btn => {
        btn.addEventListener('click', () => {
          const family = btn.getAttribute('data-family');
          if (FONT_FAMILIES.includes(family)) applyFontFamily(family);
        });
      });
      toolbar.querySelectorAll('[data-scheme]').forEach(btn => {
        btn.addEventListener('click', () => {
          const scheme = btn.getAttribute('data-scheme');
          if (COLOR_SCHEMES.includes(scheme)) applyColorScheme(scheme);
        });
      });
      toolbar.querySelector('[data-hide-images]')?.addEventListener('click', toggleImagesVisibility);
      toolbar.querySelector('.close-panel').addEventListener('click', () => {
        toolbar.setAttribute('hidden', '');
        const toggleBtn = document.querySelector('.accessibility-toggle');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
      });
    }
    
    toggleButton = document.querySelector('.accessibility-toggle');
    if (toggleButton) {
      toggleButton.setAttribute('aria-expanded', 'false');
      toggleButton.addEventListener('click', () => {
        const panel = document.getElementById('accessibilityToolbar');
        if (panel.hasAttribute('hidden')) {
          panel.removeAttribute('hidden');
          toggleButton.setAttribute('aria-expanded', 'true');
          const firstBtn = panel.querySelector('.accessibility-btn');
          if (firstBtn) firstBtn.focus();
        } else {
          panel.setAttribute('hidden', '');
          toggleButton.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', (e) => {
        const panel = document.getElementById('accessibilityToolbar');
        if (e.key === 'Escape' && panel && !panel.hasAttribute('hidden')) {
          panel.setAttribute('hidden', '');
          if (toggleButton) {
            toggleButton.setAttribute('aria-expanded', 'false');
            toggleButton.focus();
          }
        }
      });
    }
  }
  
  function updateButtonsState() {
    const panel = document.getElementById('accessibilityToolbar');
    if (!panel) return;
    const sizeBtns = {
      normal: panel.querySelector('[data-size="normal"]'),
      large: panel.querySelector('[data-size="large"]'),
      xlarge: panel.querySelector('[data-size="xlarge"]')
    };
    for (const [size, btn] of Object.entries(sizeBtns)) {
      if (btn) currentFontSize === size ? btn.classList.add('active') : btn.classList.remove('active');
    }
    const familyBtns = {
      default: panel.querySelector('[data-family="default"]'),
      arial: panel.querySelector('[data-family="arial"]'),
      times: panel.querySelector('[data-family="times"]')
    };
    for (const [family, btn] of Object.entries(familyBtns)) {
      if (btn) currentFontFamily === family ? btn.classList.add('active') : btn.classList.remove('active');
    }
    const schemeBtns = {
      'black-white': panel.querySelector('[data-scheme="black-white"]'),
      'white-black': panel.querySelector('[data-scheme="white-black"]'),
      'blue-cyan': panel.querySelector('[data-scheme="blue-cyan"]')
    };
    for (const [scheme, btn] of Object.entries(schemeBtns)) {
      if (btn) currentColorScheme === scheme ? btn.classList.add('active') : btn.classList.remove('active');
    }
    const hideImagesBtn = panel.querySelector('[data-hide-images]');
    if (hideImagesBtn) {
      imagesHidden ? hideImagesBtn.classList.add('active') : hideImagesBtn.classList.remove('active');
    }
  }
  
  function loadStoredSettings() {
    const savedSize = localStorage.getItem(STORAGE_FONT_SIZE);
    if (savedSize && FONT_SIZES.includes(savedSize)) currentFontSize = savedSize;
    const savedFamily = localStorage.getItem(STORAGE_FONT_FAMILY);
    if (savedFamily && FONT_FAMILIES.includes(savedFamily)) currentFontFamily = savedFamily;
    const savedScheme = localStorage.getItem(STORAGE_COLOR_SCHEME);
    if (savedScheme && COLOR_SCHEMES.includes(savedScheme)) currentColorScheme = savedScheme;
    const savedHideImages = localStorage.getItem(STORAGE_HIDE_IMAGES);
    imagesHidden = savedHideImages === 'true';
    
    document.body.classList.remove('font-size-150', 'font-size-200', 'font-default', 'font-arial', 'font-times');
    const sizeClass = sizeClassMap[currentFontSize];
    if (sizeClass) document.body.classList.add(sizeClass);
    const familyClass = familyClassMap[currentFontFamily];
    if (familyClass) document.body.classList.add(familyClass);
    document.body.classList.remove('color-scheme-black-white', 'color-scheme-white-black', 'color-scheme-blue-cyan');
    const schemeClass = schemeClassMap[currentColorScheme];
    if (schemeClass) document.body.classList.add(schemeClass);
    
    if (imagesHidden) {
      setTimeout(() => {
        applyImagesVisibility();
        setupMutationObserver();
      }, 0);
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    loadStoredSettings();
    initAccessibilityPanel();
    repositionAccessibilityToggle();
    updateButtonsState();
    window.addEventListener('resize', () => repositionAccessibilityToggle());
    
  });
})();