# 🎧 AI-Powered Audiobook Translator

Convert PDF, EPUB, and TXT files into Hindi audiobooks with real-time translation and streaming playback.

**🌐 Live Demo:** https://ebook-to-hindi-audio-with-auto.onrender.com/

## ✨ Features

- 📚 **Multi-format Support**: PDF, EPUB, and TXT files
- 📄 **Smart TXT Pagination**: Large text files automatically split into 250-word pages for fast processing
- 🌐 **English to Hindi Translation**: Automatic page-by-page translation
- 🎵 **Text-to-Speech**: Convert translated text to clear Hindi audio
- ▶️ **Auto-Play**: Audio starts automatically when page loads
- ⏭️ **Auto-Advance**: Automatically moves to next page when audio ends
- ⚡ **Playback Speed Control**: Adjust reading speed from 0.5x to 2.0x
- 📚 **Bookshelf Management**: Browse, load, and delete books from library
- 🔄 **Async Processing**: Background preparation of upcoming pages (3 pages ahead)
- 🎨 **Modern UI**: Beautiful gradient purple theme with smooth animations
- 📱 **Mobile-Ready**: Full iOS Safari support with touch optimizations
- 💾 **Smart Caching**: Resume where you left off with translation & audio caching
- 🙌 **Hands-Free Experience**: Seamless continuous playback across all pages
- ☁️ **Cloud Deployed**: Production-ready on Render.com with auto-deployment

## 🚀 Quick Start

### Live Demo
Visit **https://ebook-to-hindi-audio-with-auto.onrender.com/** to use the app immediately!

**Note:** iOS users - tap the play button on the first page to enable autoplay for subsequent pages.

### Local Development

#### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

#### Installation

1. **Clone the repository**
```bash
git clone https://github.com/vickyparashar/ebook-to-hindi-audio-with-auto-translation.git
cd ebook-to-hindi-audio-with-auto-translation
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Run the application**
```bash
python src/app.py
```

4. **Open in browser**
```
http://localhost:5000
```

### Production Deployment (Render)

The app auto-deploys to Render.com from the `feature/auto-play` branch:

1. **Fork/Clone** the repository
2. **Connect to Render** via GitHub integration
3. **Configure** using included `render.yaml`
4. **Deploy** - Render automatically builds and deploys

See `render.yaml` for deployment configuration details.

## 📦 Dependencies

All dependencies are **free and open-source** with **no API keys required**:

- **Flask 3.0.0** - Lightweight web framework
- **Gunicorn 21.2.0** - Production WSGI server (for Render deployment)
- **PyPDF2 3.0.1** - PDF text extraction
- **ebooklib 0.18** - EPUB parsing with BeautifulSoup
- **deep-translator 1.11.4** - Google Translate (free, no API key)
- **gTTS 2.5.4** - Google Text-to-Speech for Hindi audio with retry logic
- **ThreadPoolExecutor** - Asynchronous background processing

## 🎯 How It Works

1. **Upload**: Drag & drop a PDF/EPUB file or browse to select
2. **Processing**: App extracts text, translates to Hindi, and generates audio
3. **Playback**: Listen immediately while subsequent pages process in background
4. **Navigate**: Use player controls to pause, skip, or adjust volume

## 📁 Project Structure

```
ai-translate/
├── books/              # Input PDF/EPUB files
├── cache/             # Translated text & audio cache
├── src/
│   ├── app.py         # Flask web server
│   ├── parser.py      # PDF/EPUB text extraction
│   ├── translator.py  # Translation service
│   ├── tts.py         # Text-to-speech engine
│   └── pipeline.py    # Async processing coordinator
├── static/            # CSS, JavaScript
├── templates/         # HTML templates
├── atomic-smoke-tests.md  # Test cases (80 tests)
├── prd.md            # Product requirements
└── README.md
```

## 🧪 Testing

The project includes comprehensive testing at multiple levels - **ALL PASSING ✅**

**Comprehensive Test Suite:**
- ✅ **Atomic Level** (7 tests): Component-level testing (parsers, translators, TTS)
- ✅ **Minor Level** (15 tests): Feature integration testing
- ✅ **Major Level** (10 tests): End-to-end workflows

**Total: 32/32 Tests PASSED** 🎉

**Legacy Smoke Tests:**
- ✅ 80 atomic smoke tests using Playwright MCP
- ✅ Covers all features: upload, parsing, translation, TTS, playback, UI/UX

See `COMPREHENSIVE_TEST_REPORT.md` and `atomic-smoke-tests.md` for complete test details.

## 🛠️ Development

### Architecture
- **Modular Design**: Separate parsing, translation, TTS, and playback
- **Async Pipeline**: Process pages 2-3 ahead of current playback
- **Caching Strategy**: Store translations and audio for resume capability

### Key Workflows
- Upload → Parse → Translate → Generate Audio → Play
- Background prefetch for seamless page transitions
- Smart caching for instant resume

See `.github/copilot-instructions.md` for detailed development guidelines.

## 📝 Configuration

No configuration needed! The app works out-of-the-box with:
- **Translation**: deep-translator with Google Translate (free, no API key)
- **TTS**: gTTS for high-quality Hindi audio (free, no API key)
- **Storage**: Local filesystem caching (cache/ folder)
- **SSL**: Custom bypass for corporate network environments

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## 📄 License

This project is open-source and available under the MIT License.

## ✨ Current Status

**🎉 Production Ready - All Features Working!**

- ✅ PDF/EPUB parsing with multi-page support
- ✅ English → Hindi translation with smart caching
- ✅ High-quality Hindi audio generation (gTTS)
- ✅ Real-time streaming playback
- ✅ Async prefetching (3 pages ahead)
- ✅ Beautiful responsive UI with gradient purple theme
- ✅ Complete playback controls (play/pause, next/prev, volume)
- ✅ Auto-advance to next page when audio completes
- ✅ Progress tracking with time display
- ✅ Error handling and graceful degradation
- ✅ Fast performance (<2s page loads, <3s translation)

## 🎯 Future Roadmap

- [ ] Support for more target languages (Spanish, French, etc.)
- [ ] Multiple TTS voice options
- [ ] Batch processing multiple books
- [ ] Export audiobook files for offline listening
- [ ] Cloud storage integration
- [ ] User accounts and preferences

## 🐛 Known Issues

**None!** All tests passing. The application is production-ready.

**Recent Improvements:**
- ✅ Smart TXT pagination (250-word max pages for fast processing)
- ✅ Large text files automatically split into manageable chunks
- ✅ Mobile-responsive design (works on phones and tablets)
- ✅ Streaming mode - no upfront parsing, on-demand page processing
- ✅ Auto-play and auto-advance for hands-free listening
- ✅ Playback speed control (0.5x to 2.0x)

**Earlier Fixes:**
- ✅ Replaced pyttsx3 with gTTS for cross-platform compatibility
- ✅ Implemented custom SSL bypass for corporate networks
- ✅ Fixed audio file path resolution (relative → absolute)
- ✅ Disabled Flask auto-reloader to prevent state loss
- ✅ Removed Unicode emojis for Windows terminal compatibility

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Note**: This project uses only free, open-source tools requiring no API keys or accounts. Perfect for personal use!
