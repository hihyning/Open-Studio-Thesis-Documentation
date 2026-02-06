// Main application state
let images = [];
let filteredImages = [];
let allCategories = new Set();
let allTags = new Set();
let currentMode = 'grid';
let currentFilters = {
  q: '',
  categories: [],
  tags: [],
  logic: 'or',
  dateSort: 'oldest'
};
let messPositions = {};
let savedScrollPosition = 0;
let isClosingModal = false;
let isInitialLoad = true;

// DOM elements
const elements = {
  search: null,
  filterBtn: null,
  filterPanel: null,
  categoryFilters: null,
  tagFilters: null,
  clearFilters: null,
  modeToggle: null,
  columnsSlider: null,
  columnsValue: null,
  logicToggle: null,
  dateSortToggle: null,
  shuffleBtn: null,
  gridContainer: null,
  modal: null,
  modalClose: null,
  modalImage: null,
  modalTitle: null,
  modalCredit: null,
  modalYear: null,
  modalLink: null,
  modalCategories: null,
  modalTags: null,
  modalNotes: null
};

// Initialize the application
async function init() {
  try {
    // Load images data
    const response = await fetch('./data/images.json');
    images = await response.json();
    
    // Extract categories and tags
    images.forEach(item => {
      if (item.categories) {
        item.categories.forEach(cat => allCategories.add(cat));
      }
      if (item.tags) {
        item.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    // Initialize DOM elements
    initializeElements();
    
    // Set search placeholder with live source count
    updateSearchPlaceholder();
    
    // Restore state from localStorage and URL
    restoreState();
    
    // Setup event listeners
    setupEventListeners();
    
    // Render initial view
    renderFilters();
    applyFilters();
    
    // Handle hash navigation
    handleHashNavigation();
    
  } catch (error) {
    console.error('Failed to initialize:', error);
    showError('Failed to load images data');
  }
}

function updateSearchPlaceholder() {
  if (elements.search) {
    const total = images.length;
    elements.search.placeholder = `Search from ${total} sources...`;
  }
}

function initializeElements() {
  elements.search = utils.qs('#search');
  elements.filterBtn = utils.qs('#filter-btn');
  elements.filterPanel = utils.qs('#filter-panel');
  elements.categoryFilters = utils.qs('#category-filters');
  elements.tagFilters = utils.qs('#tag-filters');
  elements.clearFilters = utils.qs('#clear-filters');
  elements.modeToggle = utils.qs('#mode-toggle');
  elements.columnsSlider = utils.qs('#columns-slider');
  elements.columnsValue = utils.qs('#columns-value');
  elements.logicToggle = utils.qs('#logic-toggle');
  elements.dateSortToggle = utils.qs('#date-sort-toggle');
  elements.shuffleBtn = utils.qs('#shuffle-btn');
  elements.gridContainer = utils.qs('#grid-container');
  elements.modal = utils.qs('#modal');
  elements.modalClose = utils.qs('#modal-close');
  elements.modalImage = utils.qs('#modal-image');
  elements.modalTitle = utils.qs('#modal-image-title');
  elements.modalCredit = utils.qs('#modal-image-credit');
  elements.modalYear = utils.qs('#modal-image-year');
  elements.modalLink = utils.qs('#modal-image-link');
  elements.modalCategories = utils.qs('#modal-categories');
  elements.modalTags = utils.qs('#modal-tags');
  elements.modalNotes = utils.qs('#modal-notes');
}

function restoreState() {
  // Load from localStorage
  const savedPrefs = utils.load('uiPrefs', {});
  messPositions = utils.load('messPositions-v1', {});
  
  // Load from URL params
  const urlParams = utils.getUrlParams();
  
  // Apply restored state
  currentMode = urlParams.mode || savedPrefs.mode || 'grid';
  currentFilters.q = urlParams.q || savedPrefs.q || '';
  currentFilters.categories = urlParams.cats || savedPrefs.categories || [];
  currentFilters.tags = urlParams.tags || savedPrefs.tags || [];
  currentFilters.logic = urlParams.logic || savedPrefs.logic || 'or';
  currentFilters.dateSort = urlParams.dateSort || savedPrefs.dateSort || 'oldest';
  
  const cols = urlParams.cols || savedPrefs.cols || 4;
  utils.setCSSVar('--cols', cols);
  
  // Update UI elements
  if (elements.search) elements.search.value = currentFilters.q;
  if (elements.columnsSlider) elements.columnsSlider.value = cols;
  if (elements.columnsValue) elements.columnsValue.textContent = cols;
  if (elements.modeToggle) updateModeButton();
  if (elements.logicToggle) elements.logicToggle.textContent = currentFilters.logic.toUpperCase();
  if (elements.dateSortToggle) elements.dateSortToggle.textContent = currentFilters.dateSort === 'newest' ? 'Newest' : 'Oldest';
  
  // Set initial margin-right based on columns
  if (cols == 8) {
    document.body.style.marginRight = '200px';
  } else {
    document.body.style.marginRight = '0px';
  }
}

function setupEventListeners() {
  // Search
  if (elements.search) {
    elements.search.addEventListener('input', utils.debounce(handleSearch, 150));
  }
  
  // Filter panel
  if (elements.filterBtn) {
    elements.filterBtn.addEventListener('click', toggleFilterPanel);
  }
  
  // Close filter panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!elements.filterPanel.contains(e.target) && !elements.filterBtn.contains(e.target)) {
      elements.filterPanel.classList.remove('open');
    }
  });
  
  // Clear filters
  if (elements.clearFilters) {
    elements.clearFilters.addEventListener('click', clearAllFilters);
  }
  
  // Mode dropdown
  if (elements.modeToggle) {
    elements.modeToggle.addEventListener('click', toggleDropdown);
    
    // Add event listeners for dropdown options
    const modeOptions = document.querySelectorAll('.mode-option');
    modeOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = e.target.dataset.mode;
        selectMode(mode);
        hideDropdown();
      });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.mode-dropdown')) {
        hideDropdown();
      }
    });
  }
  
  // Columns slider
  if (elements.columnsSlider) {
    elements.columnsSlider.addEventListener('input', handleColumnsChange);
  }
  
  // Logic toggle
  if (elements.logicToggle) {
    elements.logicToggle.addEventListener('click', toggleLogic);
  }
  
  // Date sort toggle
  if (elements.dateSortToggle) {
    elements.dateSortToggle.addEventListener('click', toggleDateSort);
  }
  
  // Shuffle button
  if (elements.shuffleBtn) {
    elements.shuffleBtn.addEventListener('click', shuffleImages);
  }
  
  // Modal
  if (elements.modalClose) {
    elements.modalClose.addEventListener('click', closeModal);
  }
  
  if (elements.modal) {
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal || e.target.classList.contains('modal-backdrop')) {
        closeModal();
      }
    });
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
  
  // Hash change
  window.addEventListener('hashchange', handleHashNavigation);
}

function renderFilters() {
  // Render category filters
  if (elements.categoryFilters) {
    elements.categoryFilters.innerHTML = '';
    Array.from(allCategories).sort().forEach(category => {
      const label = document.createElement('label');
      label.className = 'filter-option';
      label.innerHTML = `
        <input type="checkbox" value="${category}" ${currentFilters.categories.includes(category) ? 'checked' : ''}>
        <span>${category}</span>
      `;
      label.addEventListener('change', handleFilterChange);
      elements.categoryFilters.appendChild(label);
    });
  }
  
  // Render tag filters
  if (elements.tagFilters) {
    elements.tagFilters.innerHTML = '';
    Array.from(allTags).sort().forEach(tag => {
      const label = document.createElement('label');
      label.className = 'filter-option';
      label.innerHTML = `
        <input type="checkbox" value="${tag}" ${currentFilters.tags.includes(tag) ? 'checked' : ''}>
        <span>${tag}</span>
      `;
      label.addEventListener('change', handleFilterChange);
      elements.tagFilters.appendChild(label);
    });
  }
}

function handleSearch(e) {
  currentFilters.q = e.target.value.toLowerCase();
  applyFilters();
  saveState();
}

function handleFilterChange(e) {
  const value = e.target.value;
  const type = e.target.closest('#category-filters') ? 'categories' : 'tags';
  
  if (e.target.checked) {
    if (!currentFilters[type].includes(value)) {
      currentFilters[type].push(value);
    }
  } else {
    currentFilters[type] = currentFilters[type].filter(item => item !== value);
  }
  
  applyFilters();
  saveState();
}

function clearAllFilters() {
  currentFilters.q = '';
  currentFilters.categories = [];
  currentFilters.tags = [];
  
  if (elements.search) elements.search.value = '';
  
  // Uncheck all filter checkboxes
  utils.qsa('input[type="checkbox"]', elements.filterPanel).forEach(cb => {
    cb.checked = false;
  });
  
  applyFilters();
  saveState();
}

function toggleFilterPanel() {
  elements.filterPanel.classList.toggle('open');
}

function toggleDropdown() {
  const dropdown = document.querySelector('.mode-options');
  dropdown.classList.toggle('show');
}

function hideDropdown() {
  const dropdown = document.querySelector('.mode-options');
  dropdown.classList.remove('show');
}

function selectMode(mode) {
  if (mode === 'stack') {
    // Navigate to stack.html
    window.location.href = 'stack.html';
    return;
  }
  
  currentMode = mode;
  updateModeButton();
  
  if (currentMode === 'mess') {
    elements.gridContainer.classList.add('mess');
    elements.gridContainer.classList.remove('grid');
    restoreMessPositions();
  } else {
    elements.gridContainer.classList.add('grid');
    elements.gridContainer.classList.remove('mess');
    saveMessPositions();
  }
  
  renderImages();
  saveState();
}

function updateModeButton() {
  const modeText = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
  elements.modeToggle.textContent = `VIEW IN: ${modeText}`;
}

function handleColumnsChange(e) {
  const cols = e.target.value;
  utils.setCSSVar('--cols', cols);
  elements.columnsValue.textContent = cols;
  
  // Add margin-right only when columns are at 8
  if (cols == 8) {
    document.body.style.marginRight = '200px';
  } else {
    document.body.style.marginRight = '0px';
  }
  
  saveState();
}

function toggleLogic() {
  currentFilters.logic = currentFilters.logic === 'or' ? 'and' : 'or';
  elements.logicToggle.textContent = currentFilters.logic.toUpperCase();
  applyFilters();
  saveState();
}

function toggleDateSort() {
  currentFilters.dateSort = currentFilters.dateSort === 'newest' ? 'oldest' : 'newest';
  elements.dateSortToggle.textContent = currentFilters.dateSort === 'newest' ? 'Newest' : 'Oldest';
  applyFilters();
  saveState();
}

function shuffleImages() {
  if (currentMode === 'grid') {
    // For grid mode: shuffle the order of filteredImages array
    for (let i = filteredImages.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filteredImages[i], filteredImages[j]] = [filteredImages[j], filteredImages[i]];
    }
    renderImages();
  } else {
    // For mess mode: randomize positions of all cards
    randomizeMessPositions();
  }
}

function randomizeMessPositions() {
  const cards = utils.qsa('.card');
  const containerWidth = elements.gridContainer.offsetWidth;
  const containerHeight = Math.max(elements.gridContainer.offsetHeight, window.innerHeight);
  const cardWidth = 120; // Match CSS width
  const cardHeight = 120; // Approximate card height
  
  const maxLeft = Math.max(0, containerWidth - cardWidth);
  const maxTop = Math.max(0, containerHeight - cardHeight);
  
  cards.forEach(card => {
    // Generate random position
    const left = Math.random() * maxLeft;
    const top = Math.random() * maxTop;
    
    // Apply position
    card.style.left = left + 'px';
    card.style.top = top + 'px';
    
    // Save position
    const id = card.dataset.id;
    messPositions[id] = { left, top };
  });
  
  // Save positions
  saveMessPositions();
}

function applyFilters() {
  filteredImages = images.filter(item => {
    // Text search
    if (currentFilters.q) {
      const haystack = [
        item.title || '',
        item.creator || '',
        ...(item.categories || []),
        ...(item.tags || [])
      ].join(' ').toLowerCase();
      
      if (!haystack.includes(currentFilters.q)) {
        return false;
      }
    }
    
    // Category and tag filters
    if (currentFilters.categories.length > 0 || currentFilters.tags.length > 0) {
      const hasCategory = currentFilters.categories.length === 0 || 
        (currentFilters.logic === 'and' 
          ? currentFilters.categories.every(cat => item.categories?.includes(cat))
          : currentFilters.categories.some(cat => item.categories?.includes(cat)));
      
      const hasTag = currentFilters.tags.length === 0 || 
        (currentFilters.logic === 'and'
          ? currentFilters.tags.every(tag => item.tags?.includes(tag))
          : currentFilters.tags.some(tag => item.tags?.includes(tag)));
      
      if (currentFilters.logic === 'and') {
        return hasCategory && hasTag;
      } else {
        return hasCategory || hasTag;
      }
    }
    
    return true;
  });
  
  // Sort by backend update order (using ID as proxy for when added/updated)
  filteredImages.sort((a, b) => {
    // Extract numeric part from ID (e.g., "img-001" -> 1, "img-256" -> 256)
    const idA = parseInt(a.id.split('-')[1]) || 0;
    const idB = parseInt(b.id.split('-')[1]) || 0;
    
    if (currentFilters.dateSort === 'newest') {
      return idB - idA; // Newest added/updated first (higher ID numbers)
    } else {
      return idA - idB; // Oldest added/updated first (lower ID numbers)
    }
  });
  
  // Shuffle on initial load
  if (isInitialLoad) {
    for (let i = filteredImages.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filteredImages[i], filteredImages[j]] = [filteredImages[j], filteredImages[i]];
    }
    isInitialLoad = false;
  }
  
  renderImages();
}

function renderImages() {
  if (!elements.gridContainer) return;
  
  // Create document fragment for performance
  const fragment = document.createDocumentFragment();
  
  filteredImages.forEach(item => {
    const card = createImageCard(item);
    fragment.appendChild(card);
  });
  
  // Clear and append
  elements.gridContainer.innerHTML = '';
  elements.gridContainer.appendChild(fragment);
  
  // Apply mess positions if in mess mode
  if (currentMode === 'mess') {
    restoreMessPositions();
  }
}

function createImageCard(item) {
  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('data-id', item.id);
  
  const categoriesHtml = (item.categories || []).map(cat => 
    `<span class="pill">${cat}</span>`
  ).join('');
  
  const creditHtml = item.credit_url ? 
    `<a href="${item.credit_url}" target="_blank" rel="noopener">${item.creator || 'Unknown'}</a>` :
    (item.creator || 'Unknown');
  
  // Check if it's a video or image
  const isVideo = item.type === 'video';
  const mediaHtml = isVideo 
    ? `<video src="${item.src}" autoplay muted loop playsinline class="card-media"></video>`
    : `<img src="${item.src}" alt="${item.title || 'Image'}" loading="lazy" decoding="async" class="card-media">`;
  
  card.innerHTML = `
    ${mediaHtml}
    <div class="meta">
      <div class="title">${item.title || 'Untitled'}</div>
      <div class="credit">${creditHtml} · ${item.year || 'Unknown'}</div>
      <div class="pills">${categoriesHtml}</div>
    </div>
  `;
  
  // Add click handler for modal (only if not dragged)
  card.addEventListener('click', (e) => {
    // Check if this was a drag operation
    if (card.dataset.wasDragged === 'true') {
      card.dataset.wasDragged = 'false'; // Reset for next interaction
      return; // Don't open modal if it was a drag
    }
    openModal(item.id);
  });
  
  // Add drag handlers for mess mode
  if (currentMode === 'mess') {
    setupDragHandlers(card);
  }
  
  return card;
}

function setupDragHandlers(card) {
  let isDragging = false;
  let hasMoved = false;
  let startX, startY, startLeft, startTop;
  const DRAG_THRESHOLD = 5; // Minimum pixels to move before considering it a drag
  
  card.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // Only left mouse button
    
    isDragging = false;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = card.getBoundingClientRect();
    const containerRect = elements.gridContainer.getBoundingClientRect();
    startLeft = rect.left - containerRect.left;
    startTop = rect.top - containerRect.top;
    
    card.style.left = startLeft + 'px';
    card.style.top = startTop + 'px';
    card.setPointerCapture(e.pointerId);
    
    e.preventDefault();
  });
  
  card.addEventListener('pointermove', (e) => {
    if (!card.hasPointerCapture(e.pointerId)) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Check if we've moved enough to consider it a drag
    if (distance > DRAG_THRESHOLD && !hasMoved) {
      hasMoved = true;
      isDragging = true;
      card.classList.add('dragging');
      card.dataset.wasDragged = 'true'; // Mark that this was a drag operation
    }
    
    if (isDragging) {
      const newLeft = Math.max(0, Math.min(startLeft + deltaX, elements.gridContainer.offsetWidth - card.offsetWidth));
      const newTop = Math.max(0, Math.min(startTop + deltaY, elements.gridContainer.offsetHeight - card.offsetHeight));
      
      card.style.left = newLeft + 'px';
      card.style.top = newTop + 'px';
    }
  });
  
  card.addEventListener('pointerup', (e) => {
    if (!card.hasPointerCapture(e.pointerId)) return;
    
    card.releasePointerCapture(e.pointerId);
    
    if (isDragging) {
      // Save position only if we actually dragged
      const left = parseInt(card.style.left);
      const top = parseInt(card.style.top);
      messPositions[card.dataset.id] = { left, top };
      saveMessPositions();
    }
    
    // Reset drag state
    isDragging = false;
    hasMoved = false;
    card.classList.remove('dragging');
  });
}

function saveMessPositions() {
  utils.store('messPositions-v1', messPositions);
}

function restoreMessPositions() {
  utils.qsa('.card').forEach((card, index) => {
    const id = card.dataset.id;
    const pos = messPositions[id];
    
    if (pos) {
      // Use saved position
      card.style.left = pos.left + 'px';
      card.style.top = pos.top + 'px';
    } else {
      // Generate initial random position for new cards
      const containerWidth = elements.gridContainer.offsetWidth;
      const containerHeight = Math.max(elements.gridContainer.offsetHeight, window.innerHeight);
      const cardWidth = 120; // Match CSS width
      const cardHeight = 120; // Approximate card height
      
      const maxLeft = Math.max(0, containerWidth - cardWidth);
      const maxTop = Math.max(0, containerHeight - cardHeight);
      
      // Use index to create a more spread out initial layout
      const left = Math.min(maxLeft, (index * 130) % (maxLeft + 1));
      const top = Math.min(maxTop, Math.floor((index * 130) / (maxLeft + 1)) * 130);
      
      card.style.left = left + 'px';
      card.style.top = top + 'px';
      
      // Save the initial position
      messPositions[id] = { left, top };
    }
  });
  
  // Save any new positions
  saveMessPositions();
}

function openModal(itemId) {
  const item = images.find(i => i.id === itemId);
  if (!item) return;
  
  // Save current scroll position
  savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  
  // Check if it's a video or image
  const isVideo = item.type === 'video';
  
  // Update modal content
  if (isVideo) {
    // Hide the image element and create a video element
    elements.modalImage.style.display = 'none';
    
    // Check if video element already exists
    let videoElement = elements.modalImage.parentNode.querySelector('video');
    if (!videoElement) {
      videoElement = document.createElement('video');
      videoElement.className = 'modal-image';
      videoElement.style.width = '100%';
      videoElement.style.height = 'auto';
      videoElement.style.maxHeight = '70vh';
      videoElement.style.objectFit = 'contain';
      videoElement.style.display = 'block';
      elements.modalImage.parentNode.appendChild(videoElement);
    }
    
    videoElement.src = item.src;
    videoElement.controls = true;
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.loop = true;
    videoElement.style.display = 'block';
  } else {
    // Show the image element and hide any video element
    elements.modalImage.style.display = 'block';
    
    // Hide any existing video element
    const videoElement = elements.modalImage.parentNode.querySelector('video');
    if (videoElement) {
      videoElement.style.display = 'none';
    }
    
    elements.modalImage.src = item.src;
    elements.modalImage.alt = item.title || 'Image';
  }
  
  elements.modalTitle.textContent = item.title || 'Untitled';
  elements.modalCredit.textContent = item.creator || 'Unknown';
  elements.modalYear.textContent = item.year || 'Unknown';
  elements.modalLink.href = item.credit_url || '#';
  elements.modalLink.style.display = item.credit_url ? 'inline' : 'none';
  
  // Categories
  elements.modalCategories.innerHTML = (item.categories || []).map(cat => 
    `<span class="pill">${cat}</span>`
  ).join('');
  
  // Tags
  elements.modalTags.innerHTML = (item.tags || []).map(tag => 
    `<span class="pill">${tag}</span>`
  ).join('');
  
  // Notes
  elements.modalNotes.textContent = item.notes || '';
  elements.modalNotes.style.display = item.notes ? 'block' : 'none';
  
  // Show modal
  elements.modal.classList.add('open');
  elements.modal.setAttribute('aria-labelledby', 'modal-title');
  
  // Trigger animation after a small delay to ensure display is set
  requestAnimationFrame(() => {
    const dialog = elements.modal.querySelector('.dialog');
    if (dialog) {
      dialog.style.transform = 'translateX(0)';
    }
  });
  
  // Focus trap
  utils.trapFocus(elements.modal);
  
  // Update URL hash
  window.location.hash = imageId;
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  isClosingModal = true;
  const dialog = elements.modal.querySelector('.dialog');
  if (dialog) {
    // Start slide-out animation to the left
    dialog.style.transform = 'translateX(-100%)';
    
    // Wait for animation to complete before hiding modal
    setTimeout(() => {
      elements.modal.classList.remove('open');
      elements.modal.removeAttribute('aria-labelledby');
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Clear hash using history API to prevent scroll
      history.replaceState(null, null, window.location.pathname + window.location.search);
      
      // Restore scroll position after a brief delay to ensure hash change is processed
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: savedScrollPosition,
            left: 0,
            behavior: 'instant'
          });
          isClosingModal = false;
        });
      });
    }, 300); // Match the CSS transition duration
  } else {
    // Fallback if dialog not found
    elements.modal.classList.remove('open');
    elements.modal.removeAttribute('aria-labelledby');
    document.body.style.overflow = '';
    
    // Clear hash using history API to prevent scroll
    history.replaceState(null, null, window.location.pathname + window.location.search);
    
    // Restore scroll position after a brief delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedScrollPosition,
          left: 0,
          behavior: 'instant'
        });
        isClosingModal = false;
      });
    });
  }
}

function handleKeyboard(e) {
  if (e.key === 'Escape') {
    if (elements.modal.classList.contains('open')) {
      closeModal();
    } else if (elements.filterPanel.classList.contains('open')) {
      elements.filterPanel.classList.remove('open');
    }
  }
}

function handleHashNavigation() {
  // Don't handle hash navigation if we're in the process of closing a modal
  if (isClosingModal) return;
  
  const hash = window.location.hash.slice(1);
  if (hash && images.find(item => item.id === hash)) {
    openModal(hash);
  }
}

function saveState() {
  const prefs = {
    mode: currentMode,
    q: currentFilters.q,
    categories: currentFilters.categories,
    tags: currentFilters.tags,
    logic: currentFilters.logic,
    dateSort: currentFilters.dateSort,
    cols: parseInt(utils.getCSSVar('--cols'))
  };
  
  utils.store('uiPrefs', prefs);
  
  // Update URL
  utils.updateUrlParams({
    q: currentFilters.q,
    cats: currentFilters.categories,
    tags: currentFilters.tags,
    logic: currentFilters.logic,
    dateSort: currentFilters.dateSort,
    mode: currentMode,
    cols: prefs.cols
  });
}

function showError(message) {
  console.error(message);
  // Could add a toast notification here
}

// Info button functionality
function initInfoButton() {
  const infoBtn = document.getElementById('info-btn');
  const infoCard = document.getElementById('info-card');
  const closeInfo = document.querySelector('.close-info');

  if (!infoBtn || !infoCard || !closeInfo) return;

  infoBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    infoCard.classList.toggle('show');
  });

  closeInfo.addEventListener('click', function() {
    infoCard.classList.remove('show');
  });

  document.addEventListener('click', function(e) {
    if (!infoCard.contains(e.target) && e.target !== infoBtn) {
      infoCard.classList.remove('show');
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    initInfoButton();
  });
} else {
  init();
  initInfoButton();
}
