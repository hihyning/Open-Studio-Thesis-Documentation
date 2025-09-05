# Thesis Lab — Open Documentation & 256 Images

A digital research space for exploring visual documentation and archival practices. Built with vanilla HTML, CSS, and JavaScript.

## Features

- **256 Images Browser**: Grid and freeform "mess" modes for exploring image collections
- **Advanced Filtering**: Search by title, creator, categories, and tags with AND/OR logic
- **Drag & Drop**: Reposition images in mess mode with persistent storage
- **Modal Detail View**: Are.na-style image details with full metadata
- **Responsive Design**: Works on desktop and mobile devices
- **State Persistence**: All preferences and positions saved in localStorage
- **Deep Linking**: Shareable URLs with filters and direct image links

## Tech Stack

- **Frontend**: Vanilla HTML + CSS + JavaScript (no frameworks)
- **Fonts**: IBM Plex Mono (via Google Fonts)
- **Storage**: localStorage for user preferences and mess positions
- **Assets**: Local `/assets/` directory for images

## Project Structure

```
/
├─ index.html                 # Home page
├─ images.html                # 256 images browser
├─ /css/
│   ├─ base.css               # Design system & utilities
│   └─ images.css             # Images page styles
├─ /js/
│   ├─ images.js              # Main application logic
│   └─ utils.js               # Helper functions
├─ /data/
│   └─ images.json            # Image metadata (256 entries)
├─ /assets/                   # Image files
└─ /icons/                    # UI icons (if needed)
```

## Getting Started

1. **Clone or download** this repository
2. **Start a local server** (required for CORS):
   ```bash
   python3 -m http.server 8000
   # or
   npx serve .
   ```
3. **Open** `http://localhost:8000` in your browser
4. **Generate placeholder images** (optional):
   - Open `test-server.html` in your browser
   - Click "Generate Images" to create 256 placeholder images
   - Save them to the `/assets/` directory

## Usage

### Grid Mode (Default)
- Images arranged in a responsive CSS Grid
- Adjust columns with the slider (2-10 columns)
- Click images to view details in modal

### Mess Mode
- Switch to freeform positioning
- Drag images to reposition them
- Positions are automatically saved and restored
- Switch back to Grid to reset layout

### Filtering & Search
- **Search**: Type to search titles, creators, categories, and tags
- **Filter Panel**: Multi-select categories and tags
- **Logic Toggle**: AND (must match all) or OR (match any) filtering
- **Clear All**: Reset all filters

### Modal Details
- Click any image to open detailed view
- Shows full metadata: title, creator, year, source link
- Displays categories and tags as pills
- Shows notes if available
- Keyboard accessible (ESC to close, Tab navigation)

## Data Schema

Images are stored in `/data/images.json` with this structure:

```json
{
  "id": "img-001",
  "src": "assets/001.jpg",
  "title": "Image Title",
  "creator": "Creator Name",
  "year": 2023,
  "credit_url": "https://example.com/source",
  "categories": ["Category 1", "Category 2"],
  "tags": ["#tag1", "#tag2"],
  "notes": "Optional notes"
}
```

## Design System

### Colors
- Background: `#FAF8F2` (warm off-white)
- Text: `#0B0B0B` (near-black)
- Muted: `#9A9A9A`
- Lines: `#D9D4C9` (for grid dots)

### Typography
- Font: IBM Plex Mono
- Sizes: 20px/16px/14px/12px hierarchy
- Letter spacing: 0.01em

### Layout
- Max width: 1200px
- Grid dots: 18px spacing
- Border radius: 12px
- Gap: 12px

## Browser Support

- Modern browsers with ES6+ support
- CSS Grid and CSS Custom Properties
- Pointer Events API for drag & drop
- localStorage for state persistence

## Development

The codebase is organized for maintainability:

- **utils.js**: Reusable helper functions
- **images.js**: Main application logic with clear separation of concerns
- **CSS**: Modular styles with design tokens
- **No build process**: Pure vanilla implementation

## License

Open source - feel free to use and modify for your own projects.
