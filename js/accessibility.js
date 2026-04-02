// js/accessibility.js
(function() {
  const STORAGE_FONT_SIZE = 'accessibility_font_size';
  const STORAGE_FONT_FAMILY = 'accessibility_font_family';
  const STORAGE_COLOR_SCHEME = 'accessibility_color_scheme';
  
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
  let currentColorScheme = 'white-black'; // исходная тёмная тема по умолчанию
  
  function applyFontSize(size) {
    document.body.classList.remove('font-size-150', 'font-size-200');
    if (size === 'large') {
      document.body.classList.add('font-size-150');
    } else if (size === 'xlarge') {
      document.body.classList.add('font-size-200');
    }
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
  
  function resetToDefault() {
    applyFontSize('normal');
    applyFontFamily('default');
    applyColorScheme('white-black');
  }
  
  function updateButtonsState() {
    const panel = document.getElementById('accessibilityToolbar');
    if (!panel) return;
    
    // Кнопки размера шрифта
    const sizeButtons = {
      normal: panel.querySelector('[data-size="normal"]'),
      large: panel.querySelector('[data-size="large"]'),
      xlarge: panel.querySelector('[data-size="xlarge"]')
    };
    for (const [size, btn] of Object.entries(sizeButtons)) {
      if (btn) {
        if (currentFontSize === size) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    }
    
    // Кнопки гарнитуры
    const familyButtons = {
      default: panel.querySelector('[data-family="default"]'),
      arial: panel.querySelector('[data-family="arial"]'),
      times: panel.querySelector('[data-family="times"]')
    };
    for (const [family, btn] of Object.entries(familyButtons)) {
      if (btn) {
        if (currentFontFamily === family) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    }
    
    // Кнопки цветовых схем
    const schemeButtons = {
      'black-white': panel.querySelector('[data-scheme="black-white"]'),
      'white-black': panel.querySelector('[data-scheme="white-black"]'),
      'blue-cyan': panel.querySelector('[data-scheme="blue-cyan"]')
    };
    for (const [scheme, btn] of Object.entries(schemeButtons)) {
      if (btn) {
        if (currentColorScheme === scheme) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    }
  }
  
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
      
      toolbar.querySelector('.close-panel').addEventListener('click', () => {
        toolbar.setAttribute('hidden', '');
        const toggleBtn = document.querySelector('.accessibility-toggle');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
      });
    }
    
    const toggleBtn = document.querySelector('.accessibility-toggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.addEventListener('click', () => {
        const panel = document.getElementById('accessibilityToolbar');
        if (panel.hasAttribute('hidden')) {
          panel.removeAttribute('hidden');
          toggleBtn.setAttribute('aria-expanded', 'true');
          const firstBtn = panel.querySelector('.accessibility-btn');
          if (firstBtn) firstBtn.focus();
        } else {
          panel.setAttribute('hidden', '');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });
      
      document.addEventListener('keydown', (e) => {
        const panel = document.getElementById('accessibilityToolbar');
        if (e.key === 'Escape' && panel && !panel.hasAttribute('hidden')) {
          panel.setAttribute('hidden', '');
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.focus();
        }
      });
    }
  }
  
  function loadStoredSettings() {
    const savedSize = localStorage.getItem(STORAGE_FONT_SIZE);
    if (savedSize && FONT_SIZES.includes(savedSize)) currentFontSize = savedSize;
    else currentFontSize = 'normal';
    
    const savedFamily = localStorage.getItem(STORAGE_FONT_FAMILY);
    if (savedFamily && FONT_FAMILIES.includes(savedFamily)) currentFontFamily = savedFamily;
    else currentFontFamily = 'default';
    
    const savedScheme = localStorage.getItem(STORAGE_COLOR_SCHEME);
    if (savedScheme && COLOR_SCHEMES.includes(savedScheme)) currentColorScheme = savedScheme;
    else currentColorScheme = 'white-black';
    
    // Применяем классы
    document.body.classList.remove('font-size-150', 'font-size-200', 'font-default', 'font-arial', 'font-times');
    const sizeClass = sizeClassMap[currentFontSize];
    if (sizeClass) document.body.classList.add(sizeClass);
    const familyClass = familyClassMap[currentFontFamily];
    if (familyClass) document.body.classList.add(familyClass);
    
    document.body.classList.remove('color-scheme-black-white', 'color-scheme-white-black', 'color-scheme-blue-cyan');
    const schemeClass = schemeClassMap[currentColorScheme];
    if (schemeClass) document.body.classList.add(schemeClass);
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    loadStoredSettings();
    initAccessibilityPanel();
    updateButtonsState();
  });
})();