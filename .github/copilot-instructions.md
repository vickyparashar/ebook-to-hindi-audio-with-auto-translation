# AI-Powered Audiobook Translator - AI Agent Development Guide

## Project Status: ✅ Production Ready & Deployed (100% Test Pass Rate)

This Flask web application converts PDF/EPUB/TXT files to Hindi audiobooks using real-time translation and text-to-speech. The architecture centers around async processing pipeline with prefetching for seamless audio playback and auto-advance functionality.

**Production:** https://ebook-to-hindi-audio-with-auto.onrender.com/  
**Live Deployment:** Auto-deploys from `feature/auto-play` branch  
**Testing:** 100% pass rate (36/36 tests across atomic/integration/e2e levels)

## 🎯 Essential Architecture for AI Agents

### Core Processing Pipeline Flow
1. **Upload** (`POST /upload`) → Saves file, initializes `ProcessingPipeline`
2. **Page Request** (`GET /process/<page_num>`) → Triggers processing + prefetch
3. **Audio Serve** (`GET /audio/<page_num>`) → Streams MP3 from memory/disk
4. **Frontend Auto-play** (`static/js/app.js`) → Manages seamless page transitions

### Critical Global State Pattern
```python
# src/app.py - NEVER modify without understanding implications
current_pipeline = None  # Global ProcessingPipeline instance

# Pattern: Initialize on upload, persist across requests
@app.route('/upload', methods=['POST'])
def upload_file():
    global current_pipeline
    current_pipeline = ProcessingPipeline(filepath, app.config['CACHE_FOLDER'])
```

### Environment-Aware Configuration
```python
# src/app.py - Platform detection pattern
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/tmp/books') if os.environ.get('RENDER') else 'books'
CACHE_FOLDER = os.environ.get('CACHE_FOLDER', '/tmp/cache') if os.environ.get('RENDER') else 'cache'

# Why: Render uses ephemeral filesystem (/tmp/), local uses persistent directories
```

## 🔧 Critical Development Patterns

### 1. Flask Route Architecture (src/app.py)
```python
# Request Flow: Upload → Process → Audio
@app.route('/upload', methods=['POST'])     # Initialize pipeline
@app.route('/process/<int:page_num>')       # Translate + prefetch
@app.route('/audio/<int:page_num>')         # Stream MP3
@app.route('/books', methods=['GET'])       # List bookshelf
@app.route('/books/<filename>/load')        # Load from bookshelf
```

### 2. ProcessingPipeline State Management (src/pipeline.py)
```python
# Pattern: Async prefetching with ThreadPoolExecutor
class ProcessingPipeline:
    def get_page_with_prefetch(self, page_num):
        page_data = self.get_page(page_num)      # Current page
        self.prefetch_pages(page_num + 1)        # Background: +1, +2, +3
        return page_data
```

### 3. Content-Based Caching Strategy
```python
# Translation cache: MD5 hash → Hindi text
cache_key = hashlib.md5(text.encode('utf-8')).hexdigest()  # "abc123.mp3"
# Audio files named by content hash for deduplication across books
```

### 4. Corporate SSL Bypass (src/translator.py)
```python
# Required for corporate networks blocking deep-translator
class SSLAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        kwargs['cert_reqs'] = ssl.CERT_NONE
        return super().init_poolmanager(*args, **kwargs)
```

### 5. Flask Path Resolution Pattern
```python
# Flask send_file() requires absolute paths from src/ subdirectory
audio_path = page_data['audio_path']  # "cache\abc123.mp3"
if not os.path.isabs(audio_path):
    audio_path = os.path.abspath(audio_path)  # CRITICAL
return send_file(audio_path, mimetype='audio/mpeg')
```

### 6. iOS Safari Autoplay Compliance (static/js/app.js)
```javascript
// Required: Track user interaction for Safari autoplay policy
let hasUserInteracted = false;
let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

uploadArea.addEventListener('click', () => {
    hasUserInteracted = true;  // Enable autoplay after user gesture
});

// Conditional autoplay in loadPage()
if (hasUserInteracted || !isIOS) {
    playAudio();  // Auto-play allowed
}
```

## 🚀 Essential Development Workflows

### Local Development Setup
```bash
python src/app.py                    # Starts Flask server
# NEVER use: app.run(use_reloader=True)  # Breaks global pipeline state
```

### Testing Workflows
```bash
python test_features.py             # Integration tests (server must be running)
python run_100_checkpoint_tests.py  # Automated test suite (22/22 passing)
```
**Note:** All tests require Flask server running on localhost:5000

### Deployment Pattern (render.yaml)
```yaml
# Auto-deploys from feature/auto-play branch
buildCommand: pip install -r requirements.txt
startCommand: gunicorn src.app:app --timeout 120 --workers 2
```
Environment detection: `RENDER` env var → `/tmp/` filesystem usage
## ⚠️ Critical Gotchas & Platform-Specific Patterns

### 1. Render Production Rate Limiting (src/tts.py)
```python
# Exponential backoff for gTTS on shared Render IPs
max_retries = 5
base_delay = 5  # 5→10→20→40→80 seconds
for attempt in range(max_retries):
    try:
        time.sleep(2 if os.environ.get('RENDER') else 0)  # Initial delay
        tts = gTTS(text=text, lang='hi', slow=False)
        break
    except Exception as e:
        if "429" in str(e):  # Rate limited
            delay = base_delay * (2 ** attempt)
            time.sleep(delay)
```
**Why:** Render's shared IP hits Google TTS limits. Production requires retry logic.

### 2. Global Pipeline State Management
```python
# CRITICAL: Global state persists across HTTP requests
current_pipeline = None  # DO NOT modify without understanding implications

# Pattern: One pipeline per uploaded file
@app.route('/upload', methods=['POST'])
def upload_file():
    global current_pipeline
    current_pipeline = ProcessingPipeline(filepath, cache_dir)  # Replaces previous
```
**Why:** Flask auto-reload resets globals. Must use `use_reloader=False`.

### 3. Memory vs Disk Audio Serving
```python
# Render: Serve from memory (ephemeral filesystem)
audio_data = current_pipeline.tts.get_audio_data(translated_text)
if audio_data:
    return send_file(audio_data, mimetype='audio/mpeg')  # BytesIO

# Local: Fallback to disk
return send_file(os.path.abspath(audio_path), mimetype='audio/mpeg')
```
**Pattern:** Memory-first for production, disk fallback for local development.

## 📁 Current Stack (All Dependencies Working)
- **Flask 3.0.0** - Web server (no auto-reload)
- **Gunicorn 21.2.0** - Production WSGI server (Render deployment)
- **PyPDF2 3.0.1** - PDF parsing (0-indexed: `reader.pages[page_num]`)
- **ebooklib 0.18** - EPUB parsing with BeautifulSoup
- **deep-translator 1.11.4** - Google Translate with custom SSL bypass
- **gTTS 2.5.4** - Hindi audio generation (replaced pyttsx3 for cross-platform)

## 🏗️ Project Structure (Essential Files)
```
src/
├── app.py         # Flask routes + global state management
├── pipeline.py    # ProcessingPipeline: ThreadPoolExecutor + prefetch logic
├── parser.py      # BookParser: PDF/EPUB/TXT extraction (250-word TXT pages)
├── translator.py  # TranslationService: SSL bypass + MD5 caching
└── tts.py         # TTSEngine: gTTS + exponential backoff retry

static/js/app.js   # Vanilla JS: iOS autoplay + user interaction tracking
cache/             # translations.json + {md5hash}.mp3 files
books/             # Input files (local) or /tmp/books (Render)
render.yaml        # Production deployment config
```

## 🔧 Critical Testing Patterns
- **Integration tests:** `python test_features.py` (requires server running)
- **Automated suite:** `python run_100_checkpoint_tests.py` (22/22 passing)
- **Playwright testing:** Use MCP browser tools for UI/UX validation
- **Sample files:** `books/test_story.txt` (2 pages), `books/The Alchemist mini.pdf` (7 pages)

## 🚨 Known Issues & Fixes (Essential for AI Agents)

1. **Windows Unicode Console**: Removed emoji from server startup (`print("AI-Powered...")` not `print("🎧 AI-Powered...")`)
2. **pyttsx3 Replaced**: Windows compatibility issues led to gTTS adoption (internet required but reliable)
3. **SSL Bypass Required**: Corporate networks need custom `SSLAdapter` and `verify=False`
4. **Path Resolution**: Always use `os.path.abspath()` before `send_file()` in Flask routes
5. **No Auto-Reload**: `use_reloader=False` prevents losing `current_pipeline` state
6. **Render Ephemeral Filesystem**: Must use `/tmp/` for uploads/cache on Render (files lost between deployments)
7. **Rate Limiting on Render**: Free tier shares IPs, hitting Google TTS limits - requires exponential backoff
8. **iOS Autoplay Restriction**: Safari requires user gesture before audio.play() - track `hasUserInteracted` flag
9. **Gunicorn Timeout**: Set to 120s to handle TTS retry delays (default 30s causes timeouts)
10. **Memory-based Audio**: On Render, serve audio from memory cache via `BytesIO` (disk may not persist)

## Current Stack (All Dependencies Working)
- **Flask 3.0.0** - Web server (no auto-reload)
- **Gunicorn 21.2.0** - Production WSGI server (Render deployment)
- **PyPDF2 3.0.1** - PDF parsing (0-indexed: `reader.pages[page_num]`)
- **ebooklib 0.18** - EPUB parsing with BeautifulSoup
- **deep-translator 1.11.4** - Google Translate with custom SSL bypass
- **gTTS 2.5.4** - Hindi audio generation (replaced pyttsx3 for cross-platform)

## Frontend Architecture (templates/index.html, static/)
- **Vanilla JavaScript** - No frameworks, ~270 lines in `app.js`
- **Gradient Purple Theme** - CSS with animations, responsive design
- **Drag-drop upload** - HTML5 File API with visual feedback
- **Audio Element** - Native HTML5 `<audio>` for streaming MP3 playback
- **Auto-Play** - `playAudio()` called automatically in `loadPage()` function
- **Auto-Advance** - `audioElement.addEventListener('ended', nextPage)` with 500ms delay
- **Speed Control** - `audioElement.playbackRate` adjustable from 0.5x to 2.0x
- **PWA Support** - Service worker, manifest.json, installable on iPhone/iPad

### Project Structure (Recommended)
```
ai-translate/
├── books/              # Input PDF/EPUB/TXT files
├── cache/             # Translated text and audio cache
├── src/
│   ├── parser.py      # PDF/EPUB/TXT text extraction
│   ├── translator.py  # Translation service wrapper
│   ├── tts.py         # Text-to-speech engine
│   ├── pipeline.py    # Async processing coordinator
│   └── app.py         # Web server entry point
├── static/            # CSS, JS for mini player
├── templates/         # HTML templates
├── requirements.txt   # Python dependencies
└── prd.md            # Product requirements
```

## Critical Workflows

### Setup & Testing
```bash
pip install -r requirements.txt  # Installs Flask, PyPDF2, gTTS, deep-translator, ebooklib
python src/app.py                # Starts on http://localhost:5000 (no auto-reload)
python test_audio_debug.py       # Test pipeline components
```

**Test File:** "The Alchemist mini.pdf" in `books/` folder (7 pages)

### Testing New Features
```bash
python test_parser_features.py  # Test TXT parsing & existing formats
python test_features.py          # Integration tests (server must be running)
```

**Sample Files:**
- `books/The Alchemist mini.pdf` - 7 pages (PDF)
- `books/test_story.txt` - Sample text file for TXT testing

### Comprehensive Testing with Playwright (32/32 PASSING ✅)
**Latest Results:** See `COMPREHENSIVE_TEST_REPORT.md` for full details

**Test execution:** Use Playwright MCP browser tools
```javascript
// Upload and test file
await page.goto('http://localhost:5000/');
await page.getByText('📚 Drop your book here').click();
await fileChooser.setFiles(['books/test_story.txt']);
await page.waitForTimeout(15000);  // Wait for processing

// Verify auto-play
const pauseBtn = await page.getByRole('button', { name: '⏸️' });
// If pause button visible, auto-play is working

// Test speed control
await page.locator('#speed-slider').click();
const speedDisplay = await page.locator('#speed-value').textContent();
// Should show "1.0x", "1.5x", etc.
```

**Test Coverage:**
- Atomic: 7 tests (parsers, components) - 100% pass
- Minor: 15 tests (feature integration) - 100% pass  
- Major: 10 tests (end-to-end workflows) - 100% pass

### Smoke Testing with Playwright MCP (Legacy - 80/80 PASSING ✅)
**Test execution:** Use Playwright MCP browser tools
```javascript
// Example test flow
await page.goto('http://localhost:5000/');
await page.getByText('📚 Drop your book here').click();
await fileChooser.setFiles(['books/The Alchemist mini.pdf']);
await page.waitForTimeout(5000);  // Wait for processing
```

**Status tracking:** Update `atomic-smoke-tests.md` after each test
- 14 categories: Server, Upload, Parsing, Translation, TTS, Player, etc.
- All 80 tests currently passing
- Re-run tests after any core component changes

## Known Fixes & Gotchas

1. **Windows Unicode Console**: Removed emoji from server startup (`print("AI-Powered...")` not `print("🎧 AI-Powered...")`)
2. **pyttsx3 Replaced**: Windows compatibility issues led to gTTS adoption (internet required but reliable)
3. **SSL Bypass Required**: Corporate networks need custom `SSLAdapter` and `verify=False`
4. **Path Resolution**: Always use `os.path.abspath()` before `send_file()` in Flask routes
5. **No Auto-Reload**: `use_reloader=False` prevents losing `current_pipeline` state
6. **Render Ephemeral Filesystem**: Must use `/tmp/` for uploads/cache on Render (files lost between deployments)
7. **Rate Limiting on Render**: Free tier shares IPs, hitting Google TTS limits - requires exponential backoff
8. **iOS Autoplay Restriction**: Safari requires user gesture before audio.play() - track `hasUserInteracted` flag
9. **Gunicorn Timeout**: Set to 120s to handle TTS retry delays (default 30s causes timeouts)
10. **Memory-based Audio**: On Render, serve audio from memory cache via `BytesIO` (disk may not persist)
11. **PWA Icons**: SVG icons used in manifest.json for scalability - supported by modern iOS Safari (13+)
12. **Mobile Page Indicator Visibility**: Must use `display: block !important` in mobile CSS to prevent hiding - purple color, bold font for readability

## Project Structure (Actual)
```
ai-translate/
├── books/              # Input: The Alchemist mini.pdf (7 pages), test_story.txt
├── cache/              # Output: translations.json + *.mp3 files
├── src/
│   ├── app.py         # Flask routes (/upload, /process/<n>, /audio/<n>)
│   ├── parser.py      # BookParser class (PDF/EPUB/TXT)
│   ├── translator.py  # TranslationService with SSL bypass
│   ├── tts.py         # TTSEngine using gTTS
│   └── pipeline.py    # ProcessingPipeline (ThreadPoolExecutor)
├── static/
│   ├── css/style.css  # Gradient purple theme
│   ├── js/app.js      # Player controls (~270 lines)
│   ├── manifest.json  # PWA manifest for installability
│   ├── sw.js          # Service worker for offline caching
│   ├── icon-192.svg   # PWA app icon (192x192)
│   └── icon-512.svg   # PWA app icon (512x512)
├── templates/
│   └── index.html     # Single-page app with PWA meta tags
├── test_parser_features.py  # Parser unit tests
├── test_features.py         # Integration tests
├── atomic-smoke-tests.md    # 80 test cases (all passing)
└── requirements.txt         # 7 dependencies (no API keys)
```

## Performance Considerations
- Target: Audio ready for next page before current page finishes playing
- Prefetch 2-3 pages ahead to handle variable processing times
- Use connection pooling for translation API requests
- Consider audio compression to reduce file size/latency

## Reference Files
- `prd.md`: Full product requirements and user experience goals
- `FEATURE_IMPLEMENTATION.md`: Detailed docs on TXT support, auto-play, auto-advance, speed control
- `PWA_IMPLEMENTATION.md`: Progressive Web App installation guide and technical details
- `USAGE_GUIDE.md`: User-friendly how-to guide for new features
- `COMPREHENSIVE_TEST_REPORT.md`: Complete testing results (atomic/minor/major levels, 32/32 passing)
- `atomic-smoke-tests.md`: 80 legacy smoke test cases (all passing)
- `render.yaml`: Production deployment configuration for Render.com
- `requirements.txt`: Pinned dependencies (Flask, PyPDF2, gTTS, deep-translator, ebooklib, gunicorn)
- `books/`: Sample files - "The Alchemist mini.pdf" (7 pages), "test_story.txt"
