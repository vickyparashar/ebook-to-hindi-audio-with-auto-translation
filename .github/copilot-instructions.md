# AI-Powered Audiobook Translator - Development Guide

## Project Status: ✅ Production Ready & Deployed (100% Test Pass Rate)

This Python application translates PDF/EPUB/TXT files from English to Hindi and streams them as audiobooks. The system uses async processing to prefetch 3 pages ahead while the current page plays, with auto-play, auto-advance, and variable speed control for hands-free listening.

**Production Deployment:** https://ebook-to-hindi-audio-with-auto.onrender.com/ (Render.com)

**Latest Update (Oct 28, 2025):** 
- ✅ PWA (Progressive Web App) fully implemented and deployed
- ✅ Service worker active with offline caching
- ✅ Installable on iPhone/iPad via "Add to Home Screen"
- ✅ All 32/32 comprehensive tests passing (Playwright)
- ✅ iOS Safari compatibility verified with autoplay policies
- ✅ Rate limiting handled with exponential backoff on production

## Quick Start for AI Agents

**Local Development:**
```bash
python src/app.py  # Starts Flask on http://localhost:5000
```

**Production Deployment (Render):**
- Auto-deploys from `feature/auto-play` branch when pushed to GitHub
- Uses Gunicorn WSGI server with 120s timeout, 2 workers
- Environment detection: `RENDER` env var triggers `/tmp` filesystem usage
- See `render.yaml` for configuration

**Key Architecture Points:**
- `src/app.py` - Flask server with Render environment detection (uses `/tmp` for ephemeral filesystem)
- `src/parser.py` - Extracts text from PDF/EPUB/TXT (0-indexed pages, **250-word max per TXT page**)
- `src/translator.py` - English→Hindi with custom SSL bypass & caching
- `src/tts.py` - gTTS audio generation with **exponential backoff retry** (5 attempts: 5s→10s→20s→40s→80s)
- `src/pipeline.py` - ThreadPoolExecutor for async prefetching with rate-limit delays
- `cache/` - Stores `translations.json` and `{md5hash}.mp3` files (memory-based on Render)
- `static/js/app.js` - Vanilla JS with iOS Safari autoplay workarounds
- **Mobile-ready:** iOS detection, user interaction tracking, touch optimizations

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

### 3. Flask Auto-Reloader Disabled
```python
app.run(debug=True, use_reloader=False)  # MUST be False
```
**Why:** Auto-reload resets `current_pipeline` global variable, losing all processing state.

### 4. Async Prefetching (src/pipeline.py)
```python
# Prefetch 3 pages ahead using ThreadPoolExecutor
executor.submit(self.process_page, page_num + i)
```
**Pattern:** Process page N while pages N+1, N+2, N+3 generate in background threads.

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

### 7. Text File Smart Pagination (src/parser.py)
```python
# Split by paragraphs (double newlines) or sentences
# Break into small pages (200-250 words max for faster processing)
MAX_WORDS_PER_PAGE = 250
# If single paragraph is too large, split it by sentences
sentences = para.replace('! ', '!|').replace('? ', '?|').replace('. ', '.|').split('|')
```
**Why:** TXT files lack native page structure. Smart pagination with **250-word maximum** ensures fast processing, reasonable audio lengths, and natural breaks. Large paragraphs are automatically split by sentences to prevent huge pages that slow down translation/TTS.

### 8. Playback Speed Control (static/js/app.js, templates/index.html)
```javascript
// Speed slider: 50-200 (0.5x to 2.0x), step 10
speedSlider.addEventListener('input', (e) => {
    const speed = e.target.value / 100;
    audioElement.playbackRate = speed;
    speedValue.textContent = speed.toFixed(1) + 'x';
});
```
**Why:** Users need variable reading speeds for comprehension or time-saving. HTML5 Audio API supports this natively.

### 9. Render Deployment & Rate Limiting (src/tts.py, src/app.py, render.yaml)
```python
# Environment detection for Render's ephemeral filesystem
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/tmp/books') if os.environ.get('RENDER') else 'books'
CACHE_FOLDER = os.environ.get('CACHE_FOLDER', '/tmp/cache') if os.environ.get('RENDER') else 'cache'

# Exponential backoff for gTTS rate limits on Render
max_retries = 5
base_delay = 5  # Start with 5 seconds
for attempt in range(max_retries):
    try:
        time.sleep(2)  # Initial delay on Render
        tts = gTTS(text=text, lang='hi', slow=False)
        # ... generate audio
        break
    except Exception as tts_error:
        if "429" in str(tts_error) or "Too Many Requests" in str(tts_error):
            delay = base_delay * (2 ** attempt)  # 5, 10, 20, 40, 80 seconds
            time.sleep(delay)
```
**Why:** Render's shared IP hits Google TTS rate limits. Must use exponential backoff (5→10→20→40→80s) and initial 2s delay. Production uses Gunicorn with 120s timeout to handle long retries.

### 10. iOS Safari Autoplay Compatibility (static/js/app.js)
```javascript
// Detect iOS and track user interactions
isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
hasUserInteracted = false;

// Set flag on ANY user interaction (click, upload, etc.)
uploadArea.addEventListener('click', () => { hasUserInteracted = true; });

// Conditional autoplay in loadPage()
if (hasUserInteracted) {
    playAudio();  // Auto-play on desktop or after iOS user gesture
} else if (isIOS) {
    playPauseBtn.textContent = '▶️';
    console.log('iOS: Waiting for user interaction to play');
}
```
**Why:** iOS Safari blocks `audio.play()` without prior user gesture. Solution: detect iOS, track any user interaction, then enable autoplay. First page requires manual play tap, subsequent pages auto-play.

### 11. Progressive Web App (PWA) Support (static/, templates/)
```javascript
// Service Worker Registration (static/js/app.js)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/sw.js')
        .then(reg => console.log('Service Worker registered:', reg.scope))
        .catch(err => console.log('Registration failed:', err));
}

// Service Worker Caching Strategy (static/sw.js)
const CACHE_NAME = 'audiobook-translator-v1';
const urlsToCache = ['/', '/static/css/style.css', '/static/js/app.js', '/static/manifest.json'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});
```

```json
// PWA Manifest (static/manifest.json)
{
  "name": "AI-Powered Audiobook Translator",
  "short_name": "AudioBook",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#667eea",
  "icons": [
    {"src": "/static/icon-192.svg", "sizes": "192x192", "type": "image/svg+xml"},
    {"src": "/static/icon-512.svg", "sizes": "512x512", "type": "image/svg+xml"}
  ]
}
```

```html
<!-- PWA Meta Tags (templates/index.html) -->
<link rel="manifest" href="{{ url_for('static', filename='manifest.json') }}">
<link rel="apple-touch-icon" href="{{ url_for('static', filename='icon-192.svg') }}">
<meta name="theme-color" content="#667eea">
```

**Why:** PWA enables "Add to Home Screen" on iPhone/iPad for native-like experience. Service worker provides offline caching and faster loading. SVG icons used for scalability and small file size. Standalone display mode removes Safari UI for immersive experience.

**Installation:** Open in Safari → Share → Add to Home Screen → Purple headphone icon appears on home screen.

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
