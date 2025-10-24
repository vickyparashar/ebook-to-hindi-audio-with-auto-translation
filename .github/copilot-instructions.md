# AI-Powered Audiobook Translator - Development Guide

## Project Status: ✅ Production Ready (80/80 Tests Passing)

This Python application translates PDF/EPUB files from English to Hindi and streams them as audiobooks. The system uses async processing to prefetch 3 pages ahead while the current page plays.

## Quick Start for AI Agents

**Run the app:**
```bash
python src/app.py  # Starts Flask on http://localhost:5000
```

**Key Architecture Points:**
- `src/app.py` - Flask server with global `current_pipeline` state (NO auto-reloader)
- `src/parser.py` - Extracts text from PDF/EPUB (0-indexed pages)  
- `src/translator.py` - English→Hindi with custom SSL bypass & caching
- `src/tts.py` - gTTS audio generation with MD5-based filenames
- `src/pipeline.py` - ThreadPoolExecutor for async prefetching (max_workers=2)
- `cache/` - Stores `translations.json` and `{md5hash}.mp3` files

## Critical Implementation Details

### 1. Translation with SSL Bypass (src/translator.py)
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

### 2. Audio File Path Resolution (src/app.py)
```python
# Pipeline stores relative paths, Flask needs absolute
audio_path = page_data['audio_path']  # e.g., "cache\abc123.mp3"
if not os.path.isabs(audio_path):
    audio_path = os.path.abspath(audio_path)  # CRITICAL for send_file()
```
**Why:** Flask's `send_file()` fails on relative paths when called from `src/` subdirectory.

### 3. Flask Auto-Reloader Disabled & Global State Pattern
```python
# Global pipeline instance (src/app.py)
current_pipeline = None

app.run(debug=True, use_reloader=False)  # MUST be False
```
**Why:** Auto-reload resets `current_pipeline` global variable, losing all processing state. The global pattern enables stateful processing across HTTP requests without session management.

### 4. Async Prefetching Architecture (src/pipeline.py)
```python
# ThreadPoolExecutor with max_workers=2 prevents resource exhaustion
self.executor = ThreadPoolExecutor(max_workers=2)

# Prefetch 3 pages ahead using future-based async processing
for i in range(1, self.prefetch_count + 1):
    if page_num + i < self.total_pages:
        self.executor.submit(self.process_page, page_num + i)
```
**Pattern:** Process page N while pages N+1, N+2, N+3 generate in background threads. Uses `threading.Lock()` for thread-safe state management.

### 5. Translation Caching (src/translator.py)
```python
cache_key = hashlib.md5(text.encode('utf-8')).hexdigest()
# Stored in cache/translations.json as {hash: translated_text}
```
**Why:** Avoid re-translating same content. Key by MD5 hash, not page number.

### 6. Audio File Naming (src/tts.py)
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

## Frontend Architecture (templates/index.html, static/)
- **Vanilla JavaScript** - No frameworks, ~270 lines in `app.js`
- **Global State Pattern** - Variables like `currentPage`, `totalPages` stored globally
- **Gradient Purple Theme** - CSS with animations, responsive design
- **Drag-drop Upload** - HTML5 File API with visual feedback (`dragover`/`dragleave` classes)
- **Audio Element** - Native HTML5 `<audio>` for streaming MP3 playback
- **Auto-advance** - `audioElement.addEventListener('ended', nextPage)` for seamless flow
- **Error Handling** - Visual error states with retry mechanisms

### Project Structure (Recommended)
```
ai-translate/
├── books/              # Input PDF/EPUB files
├── cache/             # Translated text and audio cache
├── src/
│   ├── parser.py      # PDF/EPUB text extraction
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
python test_audio_debug.py       # Test pipeline components individually
python test_components.py        # Unit tests for individual modules
```

**Test File:** "The Alchemist mini.pdf" in `books/` folder (7 pages)
**Debug Pattern:** Use `test_audio_debug.py` to test specific pages without full UI flow

### Smoke Testing with Playwright MCP (80/80 PASSING ✅)
**Test execution:** Use Playwright MCP browser tools for comprehensive E2E testing
```javascript
// Example test flow
await page.goto('http://localhost:5000/');
await page.getByText('📚 Drop your book here').click();
await fileChooser.setFiles(['books/The Alchemist mini.pdf']);
await page.waitForTimeout(5000);  // Wait for processing
```

**Status tracking:** Update `atomic-smoke-tests.md` after each test run
- 14 test categories: Server, Upload, Parsing, Translation, TTS, Player, etc.
- All 80 tests currently passing ✅
- Tests are numbered (T0001-T0080) with detailed descriptions
- Re-run complete test suite after any core component changes

## Known Fixes & Gotchas

1. **Windows Unicode Console**: Removed emoji from server startup logs to prevent encoding errors
2. **pyttsx3 Replaced with gTTS**: Original TTS had Windows compatibility issues, gTTS requires internet but is cross-platform reliable
3. **SSL Bypass Required**: Corporate networks block SSL verification - must use custom `SSLAdapter` with `verify=False` for translations
4. **Path Resolution Critical**: Always use `os.path.abspath()` before Flask's `send_file()` - relative paths fail from `src/` subdirectory
5. **No Auto-Reload**: `use_reloader=False` prevents losing `current_pipeline` global state on code changes
6. **MD5 Cache Keys**: Both translation and audio files use content-based MD5 hashes as filenames for effective deduplication

## Project Structure (Actual)
```
ai-translate/
├── books/              # Input: The Alchemist mini.pdf (7 pages)
├── cache/              # Output: translations.json + *.mp3 files
├── src/
│   ├── app.py         # Flask routes (/upload, /process/<n>, /audio/<n>)
│   ├── parser.py      # BookParser class (PDF/EPUB)
│   ├── translator.py  # TranslationService with SSL bypass
│   ├── tts.py         # TTSEngine using gTTS
│   └── pipeline.py    # ProcessingPipeline (ThreadPoolExecutor)
├── static/
│   ├── css/style.css  # Gradient purple theme
│   └── js/app.js      # Player controls (~270 lines)
├── templates/
│   └── index.html     # Single-page app
├── atomic-smoke-tests.md   # 80 test cases (all passing)
└── requirements.txt        # 7 dependencies (no API keys)
```

## Performance Considerations
- Target: Audio ready for next page before current page finishes playing
- Prefetch 2-3 pages ahead to handle variable processing times
- Use connection pooling for translation API requests
- Consider audio compression to reduce file size/latency

## Reference Files
- `prd.md`: Full product requirements and user experience goals
- `books/`: Contains sample file "The Alchemist mini.pdf" for testing
