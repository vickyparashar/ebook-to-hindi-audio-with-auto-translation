# Atomic Smoke Test Cases - Hindi Audiobook Library

## Test Status Legend
- ⏳ PENDING - Not yet tested
- ✅ PASS - Test completed successfully
- ❌ FAIL - Test failed, needs fixing
- 🔄 RETEST - Fixed, awaiting retest

**Last Test Run**: [Date to be updated]
**Environment**: Local Development | Render Production
**Test Framework**: Playwright MCP

---

## 1. Server & Initial Load Tests (iPhone Optimized)

- [ ] **T0001** - Flask server starts on http://localhost:5000 ⏳
- [ ] **T0002** - Home page loads with library interface (status 200) ⏳
- [ ] **T0003** - CSS files load (style.css - iPhone optimized) ⏳
- [ ] **T0004** - JavaScript files load (app.js - library management) ⏳
- [ ] **T0005** - Page loads in < 2 seconds on mobile viewport ⏳
- [ ] **T0006** - iOS meta tags present (viewport, apple-mobile-web-app) ⏳
- [ ] **T0007** - No console errors on initial load ⏳

---

## 2. Library Interface Tests (NEW)

- [ ] **T0010** - Library header displays "📚 My Library" ⏳
- [ ] **T0011** - Add book button (+) is visible and clickable ⏳
- [ ] **T0012** - Statistics show: Total Books, Reading, Completed ⏳
- [ ] **T0013** - Empty library state displays with message ⏳
- [ ] **T0014** - "Add Book" button in empty state works ⏳
- [ ] **T0015** - Book grid renders with proper spacing ⏳
- [ ] **T0016** - Touch targets are minimum 44px (iOS standard) ⏳

---

## 3. Modal Upload Tests (NEW)

- [ ] **T0020** - Upload modal opens on "+" button click ⏳
- [ ] **T0021** - Modal has backdrop blur effect ⏳
- [ ] **T0022** - Close button (×) closes modal ⏳
- [ ] **T0023** - Click outside modal closes it ⏳
- [ ] **T0024** - "Browse Files" button triggers file chooser ⏳
- [ ] **T0025** - Modal animates smoothly (slide-up) ⏳
- [ ] **T0026** - Upload area shows file icon and instructions ⏳

---

## 4. File Upload & Library Addition Tests

- [ ] **T0030** - Upload PDF file adds to library ⏳
- [ ] **T0031** - Upload EPUB file adds to library ⏳
- [ ] **T0032** - Reject .txt file with error message ⏳
- [ ] **T0033** - Reject .jpg file with error message ⏳
- [ ] **T0034** - Show success message "✓ Added to library" ⏳
- [ ] **T0035** - Modal closes after successful upload ⏳
- [ ] **T0036** - Library refreshes to show new book ⏳
- [ ] **T0037** - Duplicate file handling (same book uploaded twice) ⏳

---

## 5. Book Card Display Tests (NEW)

- [ ] **T0040** - Book card shows gradient cover ⏳
- [ ] **T0041** - Book title displays (truncated if long) ⏳
- [ ] **T0042** - Progress percentage shows (0% for new books) ⏳
- [ ] **T0043** - Progress bar fills correctly ⏳
- [ ] **T0044** - Last read date displays ⏳
- [ ] **T0045** - Delete button (🗑) appears on hover/focus ⏳
- [ ] **T0046** - Book card scales down on tap (active state) ⏳
- [ ] **T0047** - Multiple books display in responsive grid ⏳

---

## 6. Book Management Tests (NEW)

- [ ] **T0050** - Click book card opens player view ⏳
- [ ] **T0051** - Delete button shows confirmation ⏳
- [ ] **T0052** - Confirm delete removes book from library ⏳
- [ ] **T0053** - Cancel delete keeps book in library ⏳
- [ ] **T0054** - Deleted book removes from cache/books.json ⏳
- [ ] **T0055** - Statistics update after adding book ⏳
- [ ] **T0056** - Statistics update after deleting book ⏳
- [ ] **T0057** - Library persists after page reload ⏳

---

## 7. Progress Tracking Tests (NEW)

- [ ] **T0060** - New book starts at page 0, 0% progress ⏳
- [ ] **T0061** - Reading a page updates current_page ⏳
- [ ] **T0062** - Progress percentage calculates correctly ⏳
- [ ] **T0063** - Last read timestamp updates on page change ⏳
- [ ] **T0064** - Completed flag sets when reaching last page ⏳
- [ ] **T0065** - Resume opens book at last read page ⏳
- [ ] **T0066** - Progress saves automatically (no save button) ⏳
- [ ] **T0067** - Progress persists in cache/books.json ⏳

---

## 8. Player Interface Tests (iPhone Optimized)

- [ ] **T0070** - Back button (← Library) navigates to library ⏳
- [ ] **T0071** - Book title displays in player header ⏳
- [ ] **T0072** - Page progress shows "Page X of Y • Z%" ⏳
- [ ] **T0073** - Circular progress ring displays ⏳
- [ ] **T0074** - Time display shows current/total time ⏳
- [ ] **T0075** - Play button (▶) is 80px diameter ⏳
- [ ] **T0076** - Previous/Next buttons are 56px diameter ⏳
- [ ] **T0077** - Volume slider is iOS-style ⏳
- [ ] **T0078** - Text panel toggles show/hide ⏳

---

## 9. Audio Playback Tests

- [ ] **T0080** - Audio loads for first page ⏳
- [ ] **T0081** - Play button starts playback ⏳
- [ ] **T0082** - Play button changes to pause (⏸) when playing ⏳
- [ ] **T0083** - Pause button stops playback ⏳
- [ ] **T0084** - Previous button loads previous page ⏳
- [ ] **T0085** - Next button loads next page ⏳
- [ ] **T0086** - Volume slider adjusts audio level ⏳
- [ ] **T0087** - Auto-advance to next page on audio end ⏳
- [ ] **T0088** - Progress ring fills during playback ⏳

---

## 10. Translation & TTS Tests

- [ ] **T0090** - Page text extracts from PDF ⏳
- [ ] **T0091** - English text translates to Hindi ⏳
- [ ] **T0092** - Hindi text displays in text panel ⏳
- [ ] **T0093** - Audio generates from Hindi text ⏳
- [ ] **T0094** - Translation caches in cache/translations.json ⏳
- [ ] **T0095** - Audio caches as MD5-named .mp3 file ⏳
- [ ] **T0096** - Cached translations reuse on reload ⏳

---

## 11. Async Prefetch Tests

- [ ] **T0100** - Background processing starts after page load ⏳
- [ ] **T0101** - Next 3 pages prefetch in background ⏳
- [ ] **T0102** - Page navigation is instant (cached) ⏳
- [ ] **T0103** - Processing indicator shows during prefetch ⏳
- [ ] **T0104** - ThreadPoolExecutor limits to 2 workers ⏳
- [ ] **T0105** - Thread-safe state management with locks ⏳

---

## 12. Mobile/iPhone Specific Tests

- [ ] **T0110** - Viewport scales correctly on iPhone 16 ⏳
- [ ] **T0111** - Touch tap highlights disabled ⏳
- [ ] **T0112** - Status bar style matches app theme ⏳
- [ ] **T0113** - Pinch zoom disabled (user-scalable=no) ⏳
- [ ] **T0114** - Backdrop blur works on iOS Safari ⏳
- [ ] **T0115** - Modal slide-up animation smooth ⏳
- [ ] **T0116** - Scrolling is smooth (-webkit-overflow-scrolling) ⏳
- [ ] **T0117** - Add to Home Screen icon appears ⏳

---

## 13. API Endpoint Tests (NEW)

- [ ] **T0120** - GET /library returns books array ⏳
- [ ] **T0121** - GET /library includes stats object ⏳
- [ ] **T0122** - POST /upload adds book and returns book_id ⏳
- [ ] **T0123** - POST /book/<id>/open initializes pipeline ⏳
- [ ] **T0124** - POST /book/<id>/progress updates progress ⏳
- [ ] **T0125** - DELETE /book/<id> removes book ⏳
- [ ] **T0126** - GET /process/<page> auto-saves progress ⏳
- [ ] **T0127** - GET /audio/<page> serves MP3 file ⏳

---

## 14. Error Handling Tests

- [ ] **T0130** - Network error shows user-friendly message ⏳
- [ ] **T0131** - Invalid file type shows error in modal ⏳
- [ ] **T0132** - Translation failure shows retry option ⏳
- [ ] **T0133** - Audio generation failure handles gracefully ⏳
- [ ] **T0134** - Missing book file shows error message ⏳
- [ ] **T0135** - Corrupted cache/books.json recovers ⏳
- [ ] **T0136** - 502 error on Render shows helpful message ⏳

---

## 15. Performance Tests

- [ ] **T0140** - Library loads <1s for 10 books ⏳
- [ ] **T0141** - Library loads <2s for 100 books ⏳
- [ ] **T0142** - Book card rendering is smooth (no jank) ⏳
- [ ] **T0143** - Page processing <3s per page ⏳
- [ ] **T0144** - Audio plays without buffering delays ⏳
- [ ] **T0145** - Memory usage stable during playback ⏳
- [ ] **T0146** - CSS animations run at 60fps ⏳

---

## 16. Data Persistence Tests (NEW)

- [ ] **T0150** - cache/books.json created on first book ⏳
- [ ] **T0151** - Library data persists after server restart ⏳
- [ ] **T0152** - Progress updates write to books.json ⏳
- [ ] **T0153** - Book deletion updates books.json ⏳
- [ ] **T0154** - File encoding supports Unicode (Hindi text) ⏳
- [ ] **T0155** - JSON structure validates correctly ⏳
- [ ] **T0156** - MD5 book IDs are deterministic ⏳

---

## 17. End-to-End Workflow Tests

- [ ] **T0160** - Complete flow: Upload → Library → Open → Play → Progress Save ⏳
- [ ] **T0161** - Resume flow: Open app → See progress → Resume reading ⏳
- [ ] **T0162** - Multi-book flow: Upload 3 books → Verify all in library ⏳
- [ ] **T0163** - Delete flow: Delete book → Verify removed from library ⏳
- [ ] **T0164** - Complete book flow: Read all pages → Mark completed ⏳

---

## Test Execution Plan

### Phase 1: Local Testing (Playwright MCP)
1. Start Flask server locally: `python src/app.py`
2. Run Playwright MCP tests section by section
3. Fix failures immediately
4. Update test status in this file
5. Verify all ✅ before proceeding

### Phase 2: Render Deployment
1. Commit all fixes: `git add . && git commit -m "Fix test failures"`
2. Push to GitHub: `git push origin main`
3. Wait for Render auto-deploy (~3-5 minutes)
4. Monitor deployment logs on Render dashboard

### Phase 3: Production Testing
1. Navigate to https://ebook-to-hindi-audio-with-auto.onrender.com/
2. Re-run critical test cases on production
3. Test on real iPhone 16 device
4. Verify mobile-specific features
5. Document any production-only issues

---

**Total Tests**: 160+ (reset from previous 80 tests)
**Test Coverage**: Library Management, Progress Tracking, iPhone Optimization, Mobile UX

## 5. Translation Tests

- [x] **T0040** - Translate first page to Hindi ✅
- [x] **T0041** - Translation completes in < 3 seconds ✅
- [x] **T0042** - Display translated text preview ✅
- [x] **T0043** - Cache translation (check faster 2nd load) ✅
- [x] **T0044** - Handle network error with retry ✅
- [x] **T0045** - Show translation progress indicator ✅

---

## 6. Text-to-Speech Tests

- [x] **T0050** - Generate audio from Hindi text ✅
- [x] **T0051** - Audio file created (size > 0) ✅
- [x] **T0052** - Audio generation in < 2 seconds ✅
- [x] **T0053** - Audio plays in Hindi language ✅
- [x] **T0054** - Audio is clear and audible ✅
- [x] **T0055** - Cache audio file for replay ✅

---

## 7. Player UI Tests

- [x] **T0060** - Audio player is visible ✅
- [x] **T0061** - Play button is clickable ✅
- [x] **T0062** - Pause button appears after play ✅
- [x] **T0063** - Volume slider is interactive ✅
- [x] **T0064** - Progress bar is visible ✅
- [x] **T0065** - Page counter displays (e.g., "1/10") ✅

---

## 8. Playback Control Tests

- [x] **T0070** - Click play starts audio ✅
- [x] **T0071** - Click pause stops audio ✅
- [x] **T0072** - Volume slider changes audio level ✅
- [x] **T0073** - Mute button works ✅
- [x] **T0074** - Skip forward goes to next page ✅
- [x] **T0075** - Skip backward goes to previous page ✅
- [x] **T0076** - Seek bar allows scrubbing ✅

---

## 9. Progress Tracking Tests

- [x] **T0080** - Progress bar updates during playback ✅
- [x] **T0081** - Page number updates on page change ✅
- [x] **T0082** - Current time displays correctly ✅
- [x] **T0083** - Total duration displays correctly ✅
- [x] **T0084** - Resume from last position after refresh ✅

---

## 10. Async Processing Tests

- [x] **T0090** - Background processing starts automatically ✅
- [x] **T0091** - Page 2 processes while page 1 plays ✅
- [x] **T0092** - Page 3 processes in background ✅
- [x] **T0093** - Seamless transition from page 1 to 2 (no gap) ✅
- [x] **T0094** - UI remains responsive during processing ✅
- [x] **T0095** - Background task status indicator shows ✅

---

## 11. UI/UX Tests

- [x] **T0100** - UI works on mobile (375px width) ✅
- [x] **T0101** - UI works on tablet (768px width) ✅
- [x] **T0102** - UI works on desktop (1920px width) ✅
- [x] **T0103** - Loading spinner shows during processing ✅
- [x] **T0104** - Error messages are readable ✅
- [x] **T0105** - Success messages are visible ✅
- [x] **T0106** - Drag-drop visual feedback works ✅

---

## 12. Error Handling Tests

- [x] **T0110** - Network failure shows error message ✅
- [x] **T0111** - Translation failure triggers retry ✅
- [x] **T0112** - TTS failure shows clear error ✅
- [x] **T0113** - Invalid PDF shows error message ✅
- [x] **T0114** - App doesn't crash on errors ✅
- [x] **T0115** - Error messages are dismissible ✅

---

## 13. Performance Tests

- [x] **T0120** - Upload completes in < 5 seconds ✅
- [x] **T0121** - First page ready in < 10 seconds ✅
- [x] **T0122** - Next page ready before current ends ✅
- [x] **T0123** - Memory usage stays stable ✅
- [x] **T0124** - No memory leaks after 10 pages ✅

---

## 14. End-to-End Tests

- [x] **T0130** - Complete flow: Upload → Parse → Translate → Play ✅
- [x] **T0131** - Play through 3 consecutive pages ✅
- [x] **T0132** - Switch between 2 different books ✅
- [x] **T0133** - Resume playback after page refresh ✅

---

## Test Execution Notes

**How to run these tests:**
1. Use Playwright MCP server to navigate and interact with the app
2. Mark each test as ✅ PASS or ❌ FAIL after execution
3. If ❌ FAIL, document the issue and fix it
4. After fix, mark as 🔄 RETEST and run again
5. Update status to ✅ PASS once fixed

**Test Results:**
- Total Tests: 80
- Passed: 80 ✅
- Failed: 0
- Pending: 0

**All Tests Passed! 🎉**

**Working Components:**
- ✅ Server & Page Load (Flask on port 5000)
- ✅ Upload Interface (drag-drop, file chooser)
- ✅ File Upload (PDF/EPUB validation)
- ✅ PDF/EPUB Parsing (page-by-page text extraction)
- ✅ Translation (English → Hindi with caching)
- ✅ Text-to-Speech (gTTS for Hindi audio generation)
- ✅ Player UI (beautiful gradient purple design)
- ✅ Playback Controls (play/pause, next/prev, volume)
- ✅ Progress Tracking (time, page numbers, auto-advance)
- ✅ Async Processing (prefetches 3 pages ahead)
- ✅ UI/UX (responsive, loading states, error messages)
- ✅ Error Handling (graceful degradation)
- ✅ Performance (fast loads, smooth navigation)
- ✅ End-to-End (complete workflow functional)

**Key Fixes Applied:**
- Replaced pyttsx3 with gTTS for cross-platform TTS
- Implemented custom SSL bypass for corporate networks
- Fixed audio file path resolution (relative → absolute)
- Disabled Flask auto-reloader to prevent state loss
- Removed Unicode emojis for Windows terminal compatibility