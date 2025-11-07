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

  // Special handling for sketch images in different containers
  if (containerId === 'draggableContainer') {
    // IndexSketch images - use IndexSketch modal
    const sketchImages = container.querySelectorAll('.draggable-image');
    sketchImages.forEach((sketchImage, index) => {
      // Override the click handler for sketch images
      sketchImage.addEventListener('click', function(e) {
        // Don't open modal if clicking on links
        if (e.target.tagName === 'A' || e.target.closest('a')) {
          return;
        }
        
        // Check if this was a drag operation
        if (sketchImage.dataset.wasDragged === 'true') {
          sketchImage.dataset.wasDragged = 'false';
          return;
        }
        
        console.log('Opening index sketch modal for image:', index);
        openIndexSketchModal(index);
      });
    });
  } else if (containerId === 'draggableContainer4') {
    // Thesis256Sketch images - use ThesisSketch modal
    const sketchImages = container.querySelectorAll('.draggable-image');
    sketchImages.forEach((sketchImage, index) => {
      // Override the click handler for sketch images
      sketchImage.addEventListener('click', function(e) {
        // Don't open modal if clicking on links
        if (e.target.tagName === 'A' || e.target.closest('a')) {
          return;
        }
        
        // Check if this was a drag operation
        if (sketchImage.dataset.wasDragged === 'true') {
          sketchImage.dataset.wasDragged = 'false';
          return;
        }
        
        console.log('Opening thesis sketch modal for image:', index);
        openSketchModal(index);
      });
    });
  }

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
    let startTime;
    const DRAG_THRESHOLD = 8; // Minimum pixels to move before considering it a drag
    const TIME_THRESHOLD = 150; // Minimum milliseconds to hold before considering it a drag
    
    // Create unique identifier for element (use src for images, content for text)
    const elementId = element.src || element.textContent.trim().substring(0, 50);
    
    // Set initial position if not already set
    if (!elementPositions[elementId]) {
      elementPositions[elementId] = { left: 0, top: 0 };
    }
    
    element.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return; // Only left mouse button
      
      // Check if the click is on a link - if so, don't start dragging
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        return; // Let the link handle the click
      }
      
      isDragging = false;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      startTime = Date.now();
      
      // Store initial position but don't change element positioning yet
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      startLeft = rect.left - containerRect.left;
      startTop = rect.top - containerRect.top;
      
      element.setPointerCapture(e.pointerId);
      
      e.preventDefault();
    });
    
    element.addEventListener('pointermove', (e) => {
      if (!element.hasPointerCapture(e.pointerId)) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const elapsedTime = Date.now() - startTime;
      
      // Check if we've moved enough AND held long enough to consider it a drag
      if (distance > DRAG_THRESHOLD && elapsedTime > TIME_THRESHOLD && !hasMoved) {
        hasMoved = true;
        isDragging = true;
        element.classList.add('dragging');
        element.dataset.wasDragged = 'true'; // Mark that this was a drag operation
        
        // Only set positioning when we've confirmed it's a drag
        element.style.position = 'absolute';
        element.style.left = startLeft + 'px';
        element.style.top = startTop + 'px';
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
        // It was a click, not a drag - reset any positioning and open modal (only for images)
        element.style.position = '';
        element.style.left = '';
        element.style.top = '';
        element.style.transform = '';
        
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
      // Don't interfere with link clicks
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        return; // Let the link handle the click
      }
      
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

// Image Carousel functionality
function initImageCarousel(containerId = 'draggableContainer3') {
  console.log('Initializing carousel for container:', containerId);
  
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Container not found:', containerId);
    return;
  }

  const carousel = container.querySelector('.image-carousel');
  if (!carousel) {
    console.error('Carousel not found in container');
    return;
  }

  const slides = carousel.querySelectorAll('.slide');
  const counter = carousel.querySelector('.slide-counter');
  
  console.log('Carousel elements found:', {
    slides: slides.length,
    counter: !!counter
  });
  
  if (slides.length === 0) {
    console.error('No slides found');
    return;
  }
  
  let currentSlide = 0;
  const totalSlides = slides.length;

  function updateSlide() {
    console.log('Updating slide to:', currentSlide, 'of', totalSlides);
    
    // Hide all slides first
    slides.forEach((slide, index) => {
      slide.style.display = 'none';
      slide.classList.remove('active');
    });
    
    // Show current slide
    if (slides[currentSlide]) {
      slides[currentSlide].style.display = 'block';
      slides[currentSlide].classList.add('active');
      console.log('Showing slide:', currentSlide);
    }
    
    if (counter) {
      counter.textContent = `Slide ${currentSlide + 1} of ${totalSlides}`;
    }
  }

  // Make carousel clickable to open modal
  carousel.addEventListener('click', function(e) {
    // Don't open modal if clicking on links
    if (e.target.tagName === 'A' || e.target.closest('a')) {
      return;
    }
    
    // Check if this was a drag operation
    if (carousel.dataset.wasDragged === 'true') {
      carousel.dataset.wasDragged = 'false';
      return;
    }
    
    console.log('Opening carousel modal for container:', containerId);
    openCarouselModal(container);
  });

  // Initialize
  console.log('Initializing carousel with first slide');
  updateSlide();

  return {
    currentSlide,
    totalSlides,
    updateSlide
  };
}

// Carousel Modal functionality
function initCarouselModal() {
  const carouselModal = document.getElementById('carouselModal');
  const carouselModalClose = document.getElementById('carouselModalClose');
  const carouselSlideContainer = carouselModal.querySelector('.carousel-slide-container');
  const carouselPrevBtn = carouselModal.querySelector('.carousel-prev-btn');
  const carouselNextBtn = carouselModal.querySelector('.carousel-next-btn');
  const carouselCounter = carouselModal.querySelector('.carousel-slide-counter');
  
  console.log('Carousel modal elements found:', {
    modal: !!carouselModal,
    close: !!carouselModalClose,
    slideContainer: !!carouselSlideContainer,
    prevBtn: !!carouselPrevBtn,
    nextBtn: !!carouselNextBtn,
    counter: !!carouselCounter
  });
  
  let currentModalSlide = 0;
  let totalModalSlides = 0;
  let carouselSlides = [];

  function updateModalSlide() {
    console.log('Updating modal slide to:', currentModalSlide);
    
    carouselSlides.forEach((slide, index) => {
      slide.style.display = 'none';
      slide.classList.remove('active');
    });
    
    if (carouselSlides[currentModalSlide]) {
      carouselSlides[currentModalSlide].style.display = 'block';
      carouselSlides[currentModalSlide].classList.add('active');
    }
    
    if (carouselCounter) {
      carouselCounter.textContent = `Slide ${currentModalSlide + 1} of ${totalModalSlides}`;
    }
  }

  function populateModalSlides(carouselElement) {
    // Clear existing slides
    carouselSlideContainer.innerHTML = '';
    carouselSlides = [];
    
    // Get all slides from the carousel
    const carouselSlidesSource = carouselElement.querySelectorAll('.slide');
    
    // Create corresponding slides in the modal
    carouselSlidesSource.forEach((sourceSlide, index) => {
      const modalSlide = document.createElement('img');
      modalSlide.src = sourceSlide.src;
      modalSlide.alt = sourceSlide.alt;
      modalSlide.className = 'carousel-slide';
      if (index === 0) {
        modalSlide.classList.add('active');
        modalSlide.style.display = 'block';
      } else {
        modalSlide.style.display = 'none';
      }
      carouselSlideContainer.appendChild(modalSlide);
      carouselSlides.push(modalSlide);
    });
    
    totalModalSlides = carouselSlides.length;
    currentModalSlide = 0;
    updateModalSlide();
    
    console.log('Populated modal with', totalModalSlides, 'slides');
  }

  function nextModalSlide() {
    console.log('Next slide clicked, current:', currentModalSlide, 'total:', totalModalSlides);
    currentModalSlide = (currentModalSlide + 1) % totalModalSlides;
    updateModalSlide();
  }

  function prevModalSlide() {
    console.log('Prev slide clicked, current:', currentModalSlide, 'total:', totalModalSlides);
    currentModalSlide = (currentModalSlide - 1 + totalModalSlides) % totalModalSlides;
    updateModalSlide();
  }

  // Event listeners
  if (carouselNextBtn) {
    console.log('Adding next button event listener');
    carouselNextBtn.addEventListener('click', function(e) {
      console.log('Next button clicked');
      e.preventDefault();
      e.stopPropagation();
      nextModalSlide();
    });
  } else {
    console.error('Next button not found');
  }

  if (carouselPrevBtn) {
    console.log('Adding prev button event listener');
    carouselPrevBtn.addEventListener('click', function(e) {
      console.log('Prev button clicked');
      e.preventDefault();
      e.stopPropagation();
      prevModalSlide();
    });
  } else {
    console.error('Prev button not found');
  }

  if (carouselModalClose) {
    carouselModalClose.addEventListener('click', closeCarouselModal);
  }

  // Close modal when clicking backdrop
  carouselModal.addEventListener('click', function(e) {
    if (e.target === carouselModal || e.target.classList.contains('modal-backdrop')) {
      closeCarouselModal();
    }
  });

  // Keyboard navigation
  carouselModal.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevModalSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextModalSlide();
    } else if (e.key === 'Escape') {
      closeCarouselModal();
    }
  });

  // Make modal focusable
  carouselModal.setAttribute('tabindex', '0');

  // Store function for use in openCarouselModal
  window.populateCarouselModal = populateModalSlides;

  return {
    next: nextModalSlide,
    prev: prevModalSlide,
    goToSlide: (index) => {
      if (index >= 0 && index < totalModalSlides) {
        currentModalSlide = index;
        updateModalSlide();
      }
    },
    populateSlides: populateModalSlides
  };
}

function openCarouselModal(carouselContainer) {
  const carouselModal = document.getElementById('carouselModal');
  if (carouselModal) {
    // Find the carousel element within the container
    const carousel = carouselContainer.querySelector('.image-carousel');
    if (carousel && window.populateCarouselModal) {
      // Populate modal with slides from this carousel
      window.populateCarouselModal(carousel);
    }
    
    carouselModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    carouselModal.focus();
  }
}

function closeCarouselModal() {
  const carouselModal = document.getElementById('carouselModal');
  if (carouselModal) {
    carouselModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Index Sketch Modal functionality
function initIndexSketchModal() {
  const indexSketchModal = document.getElementById('indexSketchModal');
  const indexSketchModalClose = document.getElementById('indexSketchModalClose');
  const indexSketchSlides = indexSketchModal.querySelectorAll('.sketch-slide');
  const indexSketchPrevBtn = indexSketchModal.querySelector('.sketch-prev-btn');
  const indexSketchNextBtn = indexSketchModal.querySelector('.sketch-next-btn');
  
  let currentIndexSketchSlide = 0;
  const totalIndexSketchSlides = indexSketchSlides.length;

  function updateIndexSketchSlide() {
    console.log('Updating index sketch slide to:', currentIndexSketchSlide);
    
    indexSketchSlides.forEach((slide, index) => {
      slide.style.display = 'none';
      slide.classList.remove('active');
    });
    
    if (indexSketchSlides[currentIndexSketchSlide]) {
      indexSketchSlides[currentIndexSketchSlide].style.display = 'block';
      indexSketchSlides[currentIndexSketchSlide].classList.add('active');
    }
  }

  function nextIndexSketchSlide() {
    currentIndexSketchSlide = (currentIndexSketchSlide + 1) % totalIndexSketchSlides;
    updateIndexSketchSlide();
  }

  function prevIndexSketchSlide() {
    currentIndexSketchSlide = (currentIndexSketchSlide - 1 + totalIndexSketchSlides) % totalIndexSketchSlides;
    updateIndexSketchSlide();
  }

  // Event listeners
  if (indexSketchNextBtn) {
    indexSketchNextBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      nextIndexSketchSlide();
    });
  }

  if (indexSketchPrevBtn) {
    indexSketchPrevBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      prevIndexSketchSlide();
    });
  }

  if (indexSketchModalClose) {
    indexSketchModalClose.addEventListener('click', closeIndexSketchModal);
  }

  // Close modal when clicking backdrop
  indexSketchModal.addEventListener('click', function(e) {
    if (e.target === indexSketchModal || e.target.classList.contains('modal-backdrop')) {
      closeIndexSketchModal();
    }
  });

  // Keyboard navigation
  indexSketchModal.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevIndexSketchSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndexSketchSlide();
    } else if (e.key === 'Escape') {
      closeIndexSketchModal();
    }
  });

  // Make modal focusable
  indexSketchModal.setAttribute('tabindex', '0');

  return {
    next: nextIndexSketchSlide,
    prev: prevIndexSketchSlide,
    goToSlide: (index) => {
      if (index >= 0 && index < totalIndexSketchSlides) {
        currentIndexSketchSlide = index;
        updateIndexSketchSlide();
      }
    }
  };
}

// Thesis Sketch Modal functionality
function initSketchModal() {
  const sketchModal = document.getElementById('sketchModal');
  const sketchModalClose = document.getElementById('sketchModalClose');
  const sketchSlides = sketchModal.querySelectorAll('.sketch-slide');
  const sketchPrevBtn = sketchModal.querySelector('.sketch-prev-btn');
  const sketchNextBtn = sketchModal.querySelector('.sketch-next-btn');
  
  let currentSketchSlide = 0;
  const totalSketchSlides = sketchSlides.length;

  function updateSketchSlide() {
    console.log('Updating sketch slide to:', currentSketchSlide);
    
    sketchSlides.forEach((slide, index) => {
      slide.style.display = 'none';
      slide.classList.remove('active');
    });
    
    if (sketchSlides[currentSketchSlide]) {
      sketchSlides[currentSketchSlide].style.display = 'block';
      sketchSlides[currentSketchSlide].classList.add('active');
    }
  }

  function nextSketchSlide() {
    currentSketchSlide = (currentSketchSlide + 1) % totalSketchSlides;
    updateSketchSlide();
  }

  function prevSketchSlide() {
    currentSketchSlide = (currentSketchSlide - 1 + totalSketchSlides) % totalSketchSlides;
    updateSketchSlide();
  }

  // Event listeners
  if (sketchNextBtn) {
    sketchNextBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      nextSketchSlide();
    });
  }

  if (sketchPrevBtn) {
    sketchPrevBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      prevSketchSlide();
    });
  }

  if (sketchModalClose) {
    sketchModalClose.addEventListener('click', closeSketchModal);
  }

  // Close modal when clicking backdrop
  sketchModal.addEventListener('click', function(e) {
    if (e.target === sketchModal || e.target.classList.contains('modal-backdrop')) {
      closeSketchModal();
    }
  });

  // Keyboard navigation
  sketchModal.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSketchSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSketchSlide();
    } else if (e.key === 'Escape') {
      closeSketchModal();
    }
  });

  // Make modal focusable
  sketchModal.setAttribute('tabindex', '0');

  return {
    next: nextSketchSlide,
    prev: prevSketchSlide,
    goToSlide: (index) => {
      if (index >= 0 && index < totalSketchSlides) {
        currentSketchSlide = index;
        updateSketchSlide();
      }
    }
  };
}

function openIndexSketchModal(startIndex = 0) {
  const indexSketchModal = document.getElementById('indexSketchModal');
  if (indexSketchModal) {
    // Set the starting slide index
    if (window.indexSketchModalInstance && window.indexSketchModalInstance.goToSlide) {
      window.indexSketchModalInstance.goToSlide(startIndex);
    }
    
    indexSketchModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    indexSketchModal.focus();
  }
}

function closeIndexSketchModal() {
  const indexSketchModal = document.getElementById('indexSketchModal');
  if (indexSketchModal) {
    indexSketchModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function openSketchModal(startIndex = 0) {
  const sketchModal = document.getElementById('sketchModal');
  if (sketchModal) {
    // Set the starting slide index
    if (window.sketchModalInstance && window.sketchModalInstance.goToSlide) {
      window.sketchModalInstance.goToSlide(startIndex);
    }
    
    sketchModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    sketchModal.focus();
  }
}

function closeSketchModal() {
  const sketchModal = document.getElementById('sketchModal');
  if (sketchModal) {
    sketchModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Toggle updates functionality
function initToggleUpdates() {
  const toggleButton = document.getElementById('toggleUpdates');
  const updatesList = document.getElementById('updatesList');
  
  if (!toggleButton || !updatesList) return;
  
  let isExpanded = false;
  
  toggleButton.addEventListener('click', () => {
    isExpanded = !isExpanded;
    
    if (isExpanded) {
      updatesList.style.display = 'block';
      toggleButton.textContent = '−';
      toggleButton.classList.add('expanded');
    } else {
      updatesList.style.display = 'none';
      toggleButton.textContent = '+';
      toggleButton.classList.remove('expanded');
    }
  });
  
  // Add hover effects
  toggleButton.addEventListener('mouseenter', () => {
    if (!isExpanded) {
      toggleButton.classList.add('hover');
    }
  });
  
  toggleButton.addEventListener('mouseleave', () => {
    if (!isExpanded) {
      toggleButton.classList.remove('hover');
    }
  });
}

// IAT Lab popup functionality
function initIATLabPopup() {
  const iatLabLink = document.getElementById('iatLabLink');
  const iatLabModal = document.getElementById('iatLabModal');
  const iatLabModalClose = document.getElementById('iatLabModalClose');
  const iatLabProceed = document.getElementById('iatLabProceed');
  
  if (!iatLabLink || !iatLabModal) return;
  
  let targetUrl = '';
  
  // Intercept link click
  iatLabLink.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    targetUrl = iatLabLink.href;
    iatLabModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  
  // Proceed link
  if (iatLabProceed) {
    iatLabProceed.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (targetUrl) {
        window.open(targetUrl, '_blank', 'noopener');
      }
      closeIATLabModal();
    });
  }
  
  // Close button
  if (iatLabModalClose) {
    iatLabModalClose.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeIATLabModal();
    });
  }
  
  // Close on backdrop click
  iatLabModal.addEventListener('click', function(e) {
    if (e.target === iatLabModal || e.target.classList.contains('modal-backdrop')) {
      closeIATLabModal();
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && iatLabModal.classList.contains('open')) {
      closeIATLabModal();
    }
  });
  
  function closeIATLabModal() {
    iatLabModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Auto-initialize draggable gallery when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing galleries...');
  
  // Initialize toggle updates
  initToggleUpdates();
  
  // Initialize IAT Lab popup
  initIATLabPopup();
  
  if (document.getElementById('draggableContainer')) {
    initDraggableGallery();
  }
  if (document.getElementById('draggableContainer2a')) {
    initDraggableGallery('draggableContainer2a');
  }
  if (document.getElementById('draggableContainer2')) {
    initDraggableGallery('draggableContainer2');
  }
  if (document.getElementById('draggableContainer2b')) {
    initDraggableGallery('draggableContainer2b');
  }
  if (document.getElementById('draggableContainer2c')) {
    initDraggableGallery('draggableContainer2c');
  }
  if (document.getElementById('draggableContainer3')) {
    console.log('Found draggableContainer3, initializing...');
    initDraggableGallery('draggableContainer3');
    
    // Add a small delay to ensure everything is ready
    setTimeout(() => {
      console.log('Initializing carousel after delay...');
      initImageCarousel('draggableContainer3');
    }, 100);
  }
  if (document.getElementById('draggableContainer3Cyanotype')) {
    console.log('Found draggableContainer3Cyanotype, initializing...');
    initDraggableGallery('draggableContainer3Cyanotype');
    
    // Add a small delay to ensure everything is ready
    setTimeout(() => {
      console.log('Initializing carousel after delay...');
      initImageCarousel('draggableContainer3Cyanotype');
    }, 100);
  }
  if (document.getElementById('draggableContainer4DesignHarder')) {
    console.log('Found draggableContainer4DesignHarder, initializing...');
    initDraggableGallery('draggableContainer4DesignHarder');
    
    // Add a small delay to ensure everything is ready
    setTimeout(() => {
      console.log('Initializing carousel after delay...');
      initImageCarousel('draggableContainer4DesignHarder');
    }, 100);
  }
  if (document.getElementById('draggableContainerThesisExchange2')) {
    console.log('Found draggableContainerThesisExchange2, initializing...');
    initDraggableGallery('draggableContainerThesisExchange2');
    
    // Add a small delay to ensure everything is ready
    setTimeout(() => {
      console.log('Initializing carousel after delay...');
      initImageCarousel('draggableContainerThesisExchange2');
    }, 100);
  }
  if (document.getElementById('draggableContainer4')) {
    initDraggableGallery('draggableContainer4');
  }
  
  // Initialize carousel modal
  if (document.getElementById('carouselModal')) {
    console.log('Initializing carousel modal...');
    initCarouselModal();
  }
  
  // Initialize index sketch modal
  if (document.getElementById('indexSketchModal')) {
    console.log('Initializing index sketch modal...');
    window.indexSketchModalInstance = initIndexSketchModal();
  }
  
  // Initialize thesis sketch modal
  if (document.getElementById('sketchModal')) {
    console.log('Initializing thesis sketch modal...');
    window.sketchModalInstance = initSketchModal();
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
  initDraggableGallery,
  initImageCarousel,
  initCarouselModal,
  openCarouselModal,
  closeCarouselModal,
  initIndexSketchModal,
  openIndexSketchModal,
  closeIndexSketchModal,
  initSketchModal,
  openSketchModal,
  closeSketchModal
};
