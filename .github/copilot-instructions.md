# Hindi Audiobook Library - Development Guide

## Project Status: ✅ Production Ready - Library System with iPhone Optimization

This Python application is a **personal audiobook library** that converts PDF/EPUB books to Hindi audiobooks with persistent progress tracking and iPhone-optimized UI. The architecture has evolved from single-upload tool to a full-featured library management system.

🌐 **Live Demo**: https://ebook-to-hindi-audio-with-auto.onrender.com/

## Quick Start for AI Agents

**Run the app:**
```bash
python src/app.py  # Starts Flask on http://localhost:5000
```

**Key Architecture - Library-Based System:**
- `src/app.py` - Flask server with TWO global states: `current_pipeline` + `book_library` (NO auto-reloader)
- `src/book_library.py` - **NEW** Persistent storage using `cache/books.json` with CRUD operations
- `src/parser.py` - Extracts text from PDF/EPUB (0-indexed pages)
- `src/translator.py` - English→Hindi with custom SSL bypass & caching
- `src/tts.py` - gTTS audio generation with MD5-based filenames + in-memory cache
- `src/pipeline.py` - ThreadPoolExecutor for async prefetching (max_workers=2)
- `cache/books.json` - **NEW** Library database with progress tracking per book
- `cache/translations.json` + `cache/*.mp3` - Translation and audio caches

**Critical Paradigm Shift:** From stateless single-upload to stateful multi-book library with resume capability.

## Critical Implementation Details

### 1. Library-Based Global State Pattern (src/app.py) **NEW ARCHITECTURE**
```python
# TWO global instances for stateful library management
current_pipeline = None  # Active book's processing pipeline
book_library = None      # Persistent library manager

# Initialize on startup
if __name__ == '__main__':
    book_library = BookLibrary(CACHE_FOLDER)
    app.run(debug=True, use_reloader=False)  # MUST be False
```
**Why:** 
- `book_library` persists across all requests for library CRUD operations
- `current_pipeline` switches when user opens different books
- Global state avoids session management complexity for single-user personal library
- Auto-reload would reset both globals, losing library state AND pipeline state

### 2. Book Library CRUD with JSON Storage (src/book_library.py) **NEW COMPONENT**
```python
class BookLibrary:
    def __init__(self, cache_dir='cache'):
        self.library_file = os.path.join(cache_dir, 'books.json')
        self.library = self._load_library()  # Load on init
    
    def add_book(self, filename, filepath, total_pages) -> str:
        book_id = hashlib.md5(filename.encode()).hexdigest()[:12]
        self.library[book_id] = {
            'id': book_id,
            'filename': filename,
            'current_page': 0,
            'progress_percent': 0.0,
            'last_read': None,
            'completed': False
        }
        self._save_library()  # Immediate persistence
        return book_id
```
**Pattern:** Every mutation immediately calls `_save_library()` for durability. Book IDs are MD5-based for deterministic regeneration.

### 3. Progress Tracking Integration (src/app.py routes) **NEW WORKFLOW**
```python
@app.route('/process/<int:page_num>')
def process_page(page_num):
    # ... process page ...
    
    # Auto-update progress after successful page load
    if hasattr(current_pipeline, 'book_path'):
        for book_id, book in book_library.library.items():
            if book['filepath'] == current_pipeline.book_path:
                book_library.update_progress(book_id, page_num)
                break
```
**Why:** Progress auto-saves on every page navigation. Resume functionality requires no explicit save button.

### 4. Translation with SSL Bypass (src/translator.py)
```python
# Corporate networks require custom SSL adapter
class SSLAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        kwargs['cert_reqs'] = ssl.CERT_NONE
        return super().init_poolmanager(*args, **kwargs)

# Direct API calls to bypass deep-translator SSL issues
url = f'https://translate.googleapis.com/translate_a/single?...'
response = self.session.get(url, verify=False)
```
**Why:** Corporate proxies break SSL verification. Must use custom session with SSL disabled.

### 5. Audio File Path Resolution (src/app.py)
```python
# Pipeline stores relative paths, Flask needs absolute
audio_path = page_data['audio_path']  # e.g., "cache\abc123.mp3"
if not os.path.isabs(audio_path):
    audio_path = os.path.abspath(audio_path)  # CRITICAL for send_file()
```
**Why:** Flask's `send_file()` fails on relative paths when called from `src/` subdirectory.

### 6. Flask Auto-Reloader Disabled (Critical for Library State)
```python
# Global pipeline instance (src/app.py)
current_pipeline = None

app.run(debug=True, use_reloader=False)  # MUST be False
```
**Why:** Auto-reload resets `current_pipeline` global variable, losing all processing state. The global pattern enables stateful processing across HTTP requests without session management.

### 7. Async Prefetching Architecture (src/pipeline.py)
```python
# ThreadPoolExecutor with max_workers=2 prevents resource exhaustion
self.executor = ThreadPoolExecutor(max_workers=2)

# Prefetch 3 pages ahead using future-based async processing
for i in range(1, self.prefetch_count + 1):
    if page_num + i < self.total_pages:
        self.executor.submit(self.process_page, page_num + i)
```
**Pattern:** Process page N while pages N+1, N+2, N+3 generate in background threads. Uses `threading.Lock()` for thread-safe state management.

### 8. Translation Caching (src/translator.py)
```python
cache_key = hashlib.md5(text.encode('utf-8')).hexdigest()
# Stored in cache/translations.json as {hash: translated_text}
```
**Why:** Avoid re-translating same content. Key by MD5 hash, not page number.

### 9. Audio File Naming (src/tts.py)
```python
cache_key = hashlib.md5(text.encode('utf-8')).hexdigest()
audio_path = os.path.join(self.cache_dir, f"{cache_key}.mp3")
```
**Why:** Files named by content hash (e.g., `c460d0bae6ed6a67da99df8f8ac0f76d.mp3`) for deduplication.

## Current Stack (All Dependencies Working)
- **Flask 3.0.0** - Web server (no auto-reload)
- **PyPDF2 3.0.1** - PDF parsing (0-indexed: `reader.pages[page_num]`)
- **ebooklib 0.18** - EPUB parsing with BeautifulSoup
- **deep-translator 1.11.4** - Google Translate with custom SSL bypass
- **gTTS 2.5.4** - Hindi audio generation (replaced pyttsx3 for cross-platform)

## Frontend Architecture (templates/index.html, static/) **LIBRARY-BASED UI**
- **Vanilla JavaScript** - No frameworks, ~400 lines in `app.js` for library management
- **iPhone 16 Optimized** - iOS design system with CSS variables (`--primary-color: #007AFF`)
- **Library Grid** - Card-based book display with progress indicators and statistics
- **Modal Upload** - Backdrop blur modal instead of drag-drop upload area
- **Touch Controls** - 44px minimum tap targets, gesture-optimized interactions
- **Circular Progress** - SVG-based progress ring in player with stroke animations
- **Native Audio** - HTML5 `<audio>` for streaming with auto-advance on `ended` event
- **Progress Sync** - Auto-saves reading position on every page navigation

### Project Structure (Actual)
```
hindi-audiobook-library/
├── books/                    # Input PDF/EPUB files  
├── cache/                    # Library & audio cache
│   ├── books.json           # Persistent library storage (NEW)
│   ├── translations.json    # Translation cache
│   └── *.mp3               # Generated audio files (MD5 named)
├── src/
│   ├── app.py              # Flask server with library routes
│   ├── book_library.py     # Book persistence & progress tracking (NEW)
│   ├── parser.py           # PDF/EPUB text extraction
│   ├── translator.py       # Translation with SSL bypass
│   ├── tts.py              # Text-to-speech with memory cache
│   └── pipeline.py         # Async prefetch coordinator
├── static/
│   ├── css/style.css       # iPhone-optimized design system (REDESIGNED)
│   └── js/app.js           # Library management & player controls (REWRITTEN)
├── templates/
│   └── index.html          # Single-page library application (REDESIGNED)
├── .github/
│   └── copilot-instructions.md  # This file
└── README.md               # Updated with library features
```

## Critical Workflows

### Setup & Testing
```bash
pip install -r requirements.txt  # Installs Flask, PyPDF2, gTTS, deep-translator, ebooklib
python src/app.py                # Starts on http://localhost:5000 (no auto-reload)
python test_audio_debug.py       # Test pipeline components individually
python test_components.py        # Unit tests for individual modules
```

**Test File:** "The Alchemist mini.pdf" in `books/` folder (7 pages)
**Debug Pattern:** Use `test_audio_debug.py` to test specific pages without full UI flow

### Testing with Playwright MCP
**Browser automation:** Use Playwright MCP tools for comprehensive E2E testing
```javascript
// Library interface test
await page.goto('http://localhost:5000/');
await page.getByRole('button', { name: '+' }).click();  // Open upload modal
await page.getByRole('button', { name: 'Browse Files' }).click();
await fileChooser.setFiles(['books/The Alchemist mini.pdf']);
await page.waitForTimeout(3000);  // Wait for upload

// Verify book appears in library
await page.getByText('The Alchemist mini').click();  // Open book
await page.getByRole('button', { name: '▶' }).click();  // Play audio
```

**Mobile testing focus:** Test on iPhone viewport sizes, touch interactions, modal animations

## Known Fixes & Gotchas

1. **Windows Unicode Console**: Removed emoji from server startup logs to prevent encoding errors
2. **pyttsx3 Replaced with gTTS**: Original TTS had Windows compatibility issues, gTTS requires internet but is cross-platform reliable
3. **SSL Bypass Required**: Corporate networks block SSL verification - must use custom `SSLAdapter` with `verify=False` for translations
4. **Path Resolution Critical**: Always use `os.path.abspath()` before Flask's `send_file()` - relative paths fail from `src/` subdirectory
5. **No Auto-Reload**: `use_reloader=False` prevents losing `current_pipeline` global state on code changes
6. **MD5 Cache Keys**: Both translation and audio files use content-based MD5 hashes as filenames for effective deduplication

## Key API Routes (src/app.py)

### Library Management
- `GET /library` - Returns all books with progress stats
- `POST /book/<book_id>/open` - Opens book and initializes pipeline
- `POST /book/<book_id>/progress` - Updates reading progress
- `DELETE /book/<book_id>` - Deletes book from library

### Audio Processing (Legacy + New)
- `POST /upload` - Upload PDF/EPUB and add to library
- `GET /process/<int:page_num>` - Process page and auto-save progress
- `GET /audio/<int:page_num>` - Serve audio file for page
- `GET /status` - Get current processing status

## Critical Workflows

### Local Development
```bash
# Setup
pip install -r requirements.txt
python src/app.py  # http://localhost:5000

# Testing
python test_audio_debug.py  # Component testing
python test_components.py   # Unit tests
```

### Deployment to Render
- **Platform**: Render.com (free tier available)
- **Live URL**: https://ebook-to-hindi-audio-with-auto.onrender.com/
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python src/app.py`
- **Auto-deploy**: Enabled on `main` branch commits
- **Persistence**: `cache/books.json` persists on Render disk
- **Cold start**: Free tier spins down after inactivity (~30-60s first request)

### iPhone Testing Workflow
1. Deploy to Render or run locally with ngrok/tunnel
2. Open Safari on iPhone 16
3. Test library grid, modal upload, book management
4. Verify touch targets (44px minimum), gestures, animations
5. Test "Add to Home Screen" for PWA-like experience
6. Validate circular progress, player controls, auto-advance

## Performance Considerations
- Target: Audio ready for next page before current page finishes playing
- Prefetch 3 pages ahead for seamless transitions
- MD5-based deduplication prevents duplicate translations/audio
- Library loads instantly (<1s for 100+ books via JSON)
- Memory-efficient: Audio streams from disk, not held in RAM

## Reference Files
- `prd.md`: Full product requirements and user experience goals
- `books/`: Contains sample file "The Alchemist mini.pdf" for testing
- `README.md`: Complete deployment guide and feature documentation
