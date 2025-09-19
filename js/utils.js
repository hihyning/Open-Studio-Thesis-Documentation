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

// Draggable functionality for post-it note style images - modeled after images.js
function initDraggableGallery(containerId = 'draggableContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const draggableElements = container.querySelectorAll('.draggable-image');
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalClose = document.getElementById('modalClose');
  
  // Store positions for each element
  const elementPositions = {};

  // Make all draggable elements (images and text post-its) draggable and clickable
  draggableElements.forEach((element, index) => {
    setupDragHandlers(element, index);
  });

  // Modal events
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
      closeModal();
    }
  });

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  function setupDragHandlers(element, index) {
    let isDragging = false;
    let hasMoved = false;
    let startX, startY, startLeft, startTop;
    const DRAG_THRESHOLD = 2; // Minimum pixels to move before considering it a drag
    
    // Create unique identifier for element (use src for images, content for text)
    const elementId = element.src || element.textContent.trim().substring(0, 50);
    
    // Set initial position if not already set
    if (!elementPositions[elementId]) {
      elementPositions[elementId] = { left: 0, top: 0 };
    }
    
    element.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return; // Only left mouse button
      
      isDragging = false;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      startLeft = rect.left - containerRect.left;
      startTop = rect.top - containerRect.top;
      
      element.style.position = 'absolute';
      element.style.left = startLeft + 'px';
      element.style.top = startTop + 'px';
      element.setPointerCapture(e.pointerId);
      
      e.preventDefault();
    });
    
    element.addEventListener('pointermove', (e) => {
      if (!element.hasPointerCapture(e.pointerId)) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Check if we've moved enough to consider it a drag
      if (distance > DRAG_THRESHOLD && !hasMoved) {
        hasMoved = true;
        isDragging = true;
        element.classList.add('dragging');
        element.dataset.wasDragged = 'true'; // Mark that this was a drag operation
      }
      
      if (isDragging) {
        // Follow cursor more closely - use direct cursor position
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const newLeft = e.clientX - containerRect.left - (rect.width / 2);
        const newTop = e.clientY - containerRect.top - (rect.height / 2);
        
        element.style.left = newLeft + 'px';
        element.style.top = newTop + 'px';
      }
    });
    
    element.addEventListener('pointerup', (e) => {
      if (!element.hasPointerCapture(e.pointerId)) return;
      
      element.releasePointerCapture(e.pointerId);
      
      if (isDragging) {
        // Save position only if we actually dragged
        const left = parseInt(element.style.left);
        const top = parseInt(element.style.top);
        elementPositions[elementId] = { left, top };
        
        // Add some random rotation for post-it effect
        const rotation = (Math.random() - 0.5) * 6; // -3 to +3 degrees
        element.style.transform = `rotate(${rotation}deg)`;
      } else {
        // It was a click, not a drag - open modal (only for images)
        if (element.src) {
          openModal(element.src, element.alt);
        }
      }
      
      // Reset drag state
      isDragging = false;
      hasMoved = false;
      element.classList.remove('dragging');
    });
    
    // Also handle click events for modal (only if not dragged and only for images)
    element.addEventListener('click', (e) => {
      // Check if this was a drag operation
      if (element.dataset.wasDragged === 'true') {
        element.dataset.wasDragged = 'false'; // Reset for next interaction
        return; // Don't open modal if it was a drag
      }
      // Only open modal for images, not text post-its
      if (element.src) {
        openModal(element.src, element.alt);
      }
    });
  }

  function openModal(src, alt) {
    modalImage.src = src;
    modalImage.alt = alt;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  return {
    reset: () => {
      draggableElements.forEach(element => {
        element.style.position = '';
        element.style.left = '';
        element.style.top = '';
        element.style.zIndex = '';
        element.style.transform = '';
        const elementId = element.src || element.textContent.trim().substring(0, 50);
        delete elementPositions[elementId];
      });
    }
  };
}

// Auto-initialize draggable gallery when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('draggableContainer')) {
    initDraggableGallery();
  }
});

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
  fadeOut,
  initDraggableGallery
};
