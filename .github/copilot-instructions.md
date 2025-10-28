# AI-Powered Audiobook Translator - Development Guide

## Project Status: ✅ Production Ready (100% Test Pass Rate)

This Python application translates PDF/EPUB/TXT files from English to Hindi and streams them as audiobooks. The system uses async processing to prefetch 3 pages ahead while the current page plays, with auto-play, auto-advance, and variable speed control for hands-free listening.

**Latest Update:** All features tested at atomic, minor, and major levels with Playwright - 32/32 tests passing.

## Quick Start for AI Agents

**Run the app:**
```bash
python src/app.py  # Starts Flask on http://localhost:5000
```

**Key Architecture Points:**
- `src/app.py` - Flask server (no auto-reloader to preserve state)
- `src/parser.py` - Extracts text from PDF/EPUB/TXT (0-indexed pages, smart TXT pagination)
- `src/translator.py` - English→Hindi with custom SSL bypass & caching
- `src/tts.py` - gTTS audio generation with MD5-based filenames
- `src/pipeline.py` - ThreadPoolExecutor for async prefetching
- `cache/` - Stores `translations.json` and `{md5hash}.mp3` files
- `static/js/app.js` - Vanilla JS with auto-play/auto-advance logic

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
# Split by paragraphs (double newlines) or ~500 word chunks
paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
# Group small paragraphs into pages
for para in paragraphs:
    para_words = len(para.split())
    if word_count + para_words > 500 and current_page:
        pages.append('\n\n'.join(current_page))
        current_page = [para]
```
**Why:** TXT files lack native page structure. Smart pagination ensures reasonable audio lengths and natural breaks.

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

## Current Stack (All Dependencies Working)
- **Flask 3.0.0** - Web server (no auto-reload)
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

### Smoke Testing with Playwright MCP (80/80 PASSING ✅)
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
│   └── js/app.js      # Player controls (~270 lines)
├── templates/
│   └── index.html     # Single-page app
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
- `FEATURE_IMPLEMENTATION.md`: Detailed docs on TXT support, auto-play, auto-advance
- `USAGE_GUIDE.md`: User-friendly how-to guide for new features
- `books/`: Sample files - "The Alchemist mini.pdf" (7 pages), "test_story.txt"
