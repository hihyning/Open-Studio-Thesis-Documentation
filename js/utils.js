// Query selectors
function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// LocalStorage helpers
function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to store in localStorage:', e);
  }
}

function load(key, fallback = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
    return fallback;
  }
}

// Generate unique ID
function uid() {
  return Math.random().toString(36).substr(2, 9);
}

// URL parameter helpers
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get('q') || '',
    cats: params.get('cats') ? params.get('cats').split(',') : [],
    tags: params.get('tags') ? params.get('tags').split(',') : [],
    logic: params.get('logic') || 'or',
    mode: params.get('mode') || 'grid',
    cols: parseInt(params.get('cols')) || 4,
    dateSort: params.get('dateSort') || 'newest'
  };
}

function updateUrlParams(params) {
  const url = new URL(window.location);
  Object.keys(params).forEach(key => {
    if (params[key] && params[key].length > 0) {
      url.searchParams.set(key, Array.isArray(params[key]) ? params[key].join(',') : params[key]);
    } else {
      url.searchParams.delete(key);
    }
  });
  window.history.replaceState({}, '', url);
}

// CSS custom property helpers
function setCSSVar(property, value) {
  document.documentElement.style.setProperty(property, value);
}

function getCSSVar(property) {
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
}

// Event helpers
function addEventListeners(element, events, handler) {
  events.forEach(event => {
    element.addEventListener(event, handler);
  });
}

// Focus trap for modal
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  });
}

// Animation helpers
function fadeIn(element, duration = 150) {
  element.style.opacity = '0';
  element.style.display = 'block';
  
  let start = performance.now();
  
  function animate(time) {
    let progress = (time - start) / duration;
    if (progress > 1) progress = 1;
    
    element.style.opacity = progress;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

function fadeOut(element, duration = 150) {
  let start = performance.now();
  const initialOpacity = parseFloat(getComputedStyle(element).opacity);
  
  function animate(time) {
    let progress = (time - start) / duration;
    if (progress > 1) progress = 1;
    
    element.style.opacity = initialOpacity * (1 - progress);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.style.display = 'none';
    }
  }
  
  requestAnimationFrame(animate);
}

// Export for use in other files
window.utils = {
  qs,
  qsa,
  debounce,
  store,
  load,
  uid,
  getUrlParams,
  updateUrlParams,
  setCSSVar,
  getCSSVar,
  addEventListeners,
  trapFocus,
  fadeIn,
  fadeOut
};
