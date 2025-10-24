// Hindi Audiobook Library App
let currentBook = null;
let currentPage = 0;
let totalPages = 0;
let audioElement = null;
let progressUpdateInterval = null;
let isPlaying = false;

// DOM Elements
const librarySection = document.getElementById('library-section');
const playerSection = document.getElementById('player-section');
const uploadModal = document.getElementById('upload-modal');
const bookGrid = document.getElementById('book-grid');
const emptyLibrary = document.getElementById('empty-library');

// Modal elements
const addBookBtn = document.getElementById('add-book-btn');
const closeModalBtn = document.getElementById('close-modal');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');

// Player elements
const backToLibraryBtn = document.getElementById('back-to-library');
const bookTitle = document.getElementById('book-title');
const currentPageSpan = document.getElementById('current-page');
const totalPagesSpan = document.getElementById('total-pages');
const progressPercentSpan = document.getElementById('progress-percent');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const volumeSlider = document.getElementById('volume-slider');
const currentTimeSpan = document.getElementById('current-time');
const totalTimeSpan = document.getElementById('total-time');
const translatedText = document.getElementById('translated-text');
const textToggle = document.getElementById('text-toggle');
const progressRing = document.getElementById('progress-ring');
const processingStatus = document.getElementById('processing-status');
const processingMessage = document.getElementById('processing-message');
const errorDisplay = document.getElementById('error-display');

// Stats elements
const totalBooksSpan = document.getElementById('total-books');
const inProgressBooksSpan = document.getElementById('in-progress-books');
const completedBooksSpan = document.getElementById('completed-books');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    audioElement = document.getElementById('audio-element');
    setupEventListeners();
    loadLibrary();
    console.log('📚 Hindi Audiobook Library initialized');
});

// Setup Event Listeners
function setupEventListeners() {
    // Modal controls
    if (addBookBtn) addBookBtn.addEventListener('click', openUploadModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeUploadModal);
    if (uploadModal) {
        uploadModal.addEventListener('click', (e) => {
            if (e.target === uploadModal) closeUploadModal();
        });
    }

    // File upload - proper handling for mobile
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);
    
    // Browse Files button
    const browseFilesBtn = document.getElementById('browse-files-btn');
    if (browseFilesBtn) {
        browseFilesBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            fileInput.click();
        });
    }
    
    // Upload area click (but not the button since it has its own handler)
    if (uploadArea) {
        uploadArea.addEventListener('click', (e) => {
            // Only trigger file input if clicking the area itself, not the button
            if (e.target === uploadArea || e.target.closest('.upload-icon, h3, p')) {
                fileInput.click();
            }
        });
    }
    
    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
    }
    
    // Player controls
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    if (prevBtn) prevBtn.addEventListener('click', previousPage);
    if (nextBtn) nextBtn.addEventListener('click', nextPage);
    if (backToLibraryBtn) backToLibraryBtn.addEventListener('click', showLibrary);
    if (textToggle) textToggle.addEventListener('click', toggleTextPanel);
    
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            audioElement.volume = e.target.value / 100;
        });
    }
    
    // Audio events - auto-update UI when audio state changes
    if (audioElement) {
        audioElement.addEventListener('play', () => {
            isPlaying = true;
            updatePlayButton(true);
        });
        
        audioElement.addEventListener('pause', () => {
            isPlaying = false;
            updatePlayButton(false);
        });
        
        audioElement.addEventListener('ended', nextPage);
    }
    
    // Audio events
    if (audioElement) {
        audioElement.addEventListener('timeupdate', updateAudioProgress);
        audioElement.addEventListener('ended', handleAudioEnded);
        audioElement.addEventListener('loadedmetadata', () => {
            if (totalTimeSpan) totalTimeSpan.textContent = formatTime(audioElement.duration);
        });
    }
}

// Library Management
async function loadLibrary() {
    try {
        const response = await fetch('/library');
        const data = await response.json();
        
        if (response.ok) {
            displayLibrary(data.books);
            updateStats(data.stats);
        } else {
            showError('Failed to load library');
        }
    } catch (error) {
        console.error('Error loading library:', error);
        showError('Failed to load library');
    }
}

function displayLibrary(books) {
    if (bookGrid) {
        bookGrid.innerHTML = '';
        
        if (books.length === 0) {
            if (emptyLibrary) emptyLibrary.classList.remove('hidden');
            return;
        }
        
        if (emptyLibrary) emptyLibrary.classList.add('hidden');
        
        books.forEach(book => {
            const bookCard = createBookCard(book);
            bookGrid.appendChild(bookCard);
        });
    }
}

function createBookCard(book) {
    const card = document.createElement('div');
    card.className = `book-card ${book.completed ? 'completed' : ''}`;
    
    const progressPercent = Math.round(book.progress_percent || 0);
    const lastRead = book.last_read ? new Date(book.last_read).toLocaleDateString() : 'Never';
    
    card.innerHTML = `
        <div class="book-cover" style="background: linear-gradient(135deg, ${getBookColor(book.filename)})">
            📖
        </div>
        <div class="book-title">${book.filename.replace(/\.(pdf|epub)$/i, '')}</div>
        <div class="book-progress">${progressPercent}% complete</div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="book-meta">
            <span class="book-date">${lastRead}</span>
            <button class="delete-btn" onclick="deleteBook('${book.id}')" title="Delete book">🗑</button>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-btn')) {
            openBook(book.id);
        }
    });
    
    return card;
}

function getBookColor(filename) {
    const colors = [
        '#FF6B6B, #4ECDC4',
        '#45B7D1, #96CEB4', 
        '#FECA57, #FF9FF3',
        '#54A0FF, #5F27CD',
        '#FF9F43, #10AC84',
        '#EE5A52, #0ABDE3'
    ];
    const hash = filename.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
}

function updateStats(stats) {
    if (totalBooksSpan) totalBooksSpan.textContent = stats.total_books;
    if (inProgressBooksSpan) inProgressBooksSpan.textContent = stats.in_progress;
    if (completedBooksSpan) completedBooksSpan.textContent = stats.completed_books;
}

// Modal Management
function openUploadModal() {
    if (uploadModal) uploadModal.classList.remove('hidden');
    if (uploadStatus) uploadStatus.classList.add('hidden');
    if (fileInput) fileInput.value = '';
}

function closeUploadModal() {
    if (uploadModal) uploadModal.classList.add('hidden');
}

// File Upload
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

async function handleFile(file) {
    const validExtensions = ['.pdf', '.epub'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValid) {
        showUploadError('Invalid file type. Please upload PDF or EPUB files only.');
        return;
    }
    
    showUploadStatus('Uploading...', 'uploading');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showUploadStatus(`✓ Added to library: ${data.filename}`, 'success');
            setTimeout(() => {
                closeUploadModal();
                loadLibrary();
            }, 1500);
        } else {
            showUploadError(data.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showUploadError('Upload failed. Please try again.');
    }
}

function showUploadStatus(message, type) {
    if (uploadStatus) {
        uploadStatus.textContent = message;
        uploadStatus.className = `upload-status ${type}`;
        uploadStatus.classList.remove('hidden');
    }
}

function showUploadError(message) {
    showUploadStatus(message, 'error');
}

// Book Management
async function openBook(bookId) {
    try {
        const response = await fetch(`/book/${bookId}/open`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            currentBook = data.book;
            totalPages = data.total_pages;
            currentPage = currentBook.current_page || 0;
            
            showPlayer();
            updatePlayerInfo();
            // Auto-play when opening book from library
            loadPage(currentPage, true);
        } else {
            showError(data.error || 'Failed to open book');
        }
    } catch (error) {
        console.error('Error opening book:', error);
        showError('Failed to open book');
    }
}

async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) {
        return;
    }
    
    try {
        const response = await fetch(`/book/${bookId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            loadLibrary();
        } else {
            showError(data.error || 'Failed to delete book');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        showError('Failed to delete book');
    }
}

// View Management
function showLibrary() {
    if (librarySection) librarySection.classList.remove('hidden');
    if (playerSection) playerSection.classList.add('hidden');
    
    // Stop current audio
    if (audioElement && !audioElement.paused) {
        audioElement.pause();
    }
    
    // Refresh library
    loadLibrary();
}

function showPlayer() {
    if (librarySection) librarySection.classList.add('hidden');
    if (playerSection) playerSection.classList.remove('hidden');
}

function updatePlayerInfo() {
    if (currentBook && bookTitle) {
        bookTitle.textContent = currentBook.filename.replace(/\.(pdf|epub)$/i, '');
    }
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
    updatePageInfo();
}

function updatePageInfo() {
    if (currentPageSpan) currentPageSpan.textContent = currentPage + 1;
    if (progressPercentSpan && totalPages > 0) {
        const percent = Math.round((currentPage / totalPages) * 100);
        progressPercentSpan.textContent = `${percent}%`;
    }
}

// Audio Player
async function loadPage(pageNum, autoPlay = false) {
    if (pageNum < 0 || pageNum >= totalPages) {
        console.log('Page out of range');
        return;
    }
    
    currentPage = pageNum;
    updatePageInfo();
    
    showProcessing(`Loading page ${pageNum + 1}...`);
    
    try {
        const response = await fetch(`/process/${pageNum}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Update translated text
            if (translatedText) {
                translatedText.textContent = data.translated_text;
            }
            
            // Load audio
            if (audioElement) {
                audioElement.src = data.audio_url;
                audioElement.load();
                
                // Auto-play if requested (when opening book from library)
                if (autoPlay) {
                    console.log('🎵 Auto-play requested for page', pageNum + 1);
                    // Wait for audio to be ready before playing
                    audioElement.addEventListener('canplay', function playOnReady() {
                        console.log('🎵 Audio ready, attempting auto-play...');
                        audioElement.play()
                            .then(() => {
                                console.log('✅ Auto-play successful');
                            })
                            .catch(err => {
                                console.log('⚠️ Auto-play prevented by browser (user interaction required):', err.message);
                            });
                        audioElement.removeEventListener('canplay', playOnReady);
                    }, { once: true });
                }
            }
            
            // Update progress
            await updateBookProgress(pageNum);
            
            hideProcessing();
        } else {
            hideProcessing();
            showError(data.error || 'Failed to load page');
        }
    } catch (error) {
        console.error('Error loading page:', error);
        hideProcessing();
        showError('Failed to load page');
    }
}

async function updateBookProgress(pageNum) {
    if (!currentBook) return;
    
    try {
        await fetch(`/book/${currentBook.id}/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_page: pageNum
            })
        });
    } catch (error) {
        console.error('Error updating progress:', error);
    }
}

function togglePlayPause() {
    if (!audioElement) return;
    
    if (audioElement.paused) {
        audioElement.play();
        isPlaying = true;
        updatePlayButton(true);
    } else {
        audioElement.pause();
        isPlaying = false;
        updatePlayButton(false);
    }
}

function updatePlayButton(playing) {
    if (playPauseBtn) {
        const icon = playPauseBtn.querySelector('.play-icon');
        if (icon) {
            icon.textContent = playing ? '⏸' : '▶';
        }
    }
}

function previousPage() {
    if (currentPage > 0) {
        loadPage(currentPage - 1);
    }
}

function nextPage() {
    if (currentPage < totalPages - 1) {
        loadPage(currentPage + 1);
    }
}

function handleAudioEnded() {
    isPlaying = false;
    updatePlayButton(false);
    
    // Auto-advance to next page
    if (currentPage < totalPages - 1) {
        setTimeout(() => {
            nextPage();
        }, 1000);
    }
}

function updateAudioProgress() {
    if (!audioElement || !currentTimeSpan) return;
    
    const currentTime = audioElement.currentTime;
    const duration = audioElement.duration;
    
    if (currentTimeSpan) currentTimeSpan.textContent = formatTime(currentTime);
    
    // Update progress ring
    if (progressRing && duration > 0) {
        const progress = (currentTime / duration) * 100;
        const circumference = 2 * Math.PI * 90; // radius = 90
        const offset = circumference - (progress / 100) * circumference;
        progressRing.style.strokeDashoffset = offset;
    }
}

function toggleTextPanel() {
    if (!translatedText || !textToggle) return;
    
    const isVisible = !translatedText.classList.contains('hidden');
    
    if (isVisible) {
        translatedText.classList.add('hidden');
        textToggle.textContent = 'Show';
    } else {
        translatedText.classList.remove('hidden');
        textToggle.textContent = 'Hide';
    }
}

// Utility Functions
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function showProcessing(message) {
    if (processingStatus) processingStatus.classList.remove('hidden');
    if (processingMessage) processingMessage.textContent = message;
}

function hideProcessing() {
    if (processingStatus) processingStatus.classList.add('hidden');
}

function showError(message) {
    console.error('Error:', message);
    if (errorDisplay) {
        const errorMessage = errorDisplay.querySelector('#error-message');
        if (errorMessage) errorMessage.textContent = message;
        errorDisplay.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDisplay.classList.add('hidden');
        }, 5000);
    }
}

// Global function for delete button (called from HTML)
window.deleteBook = deleteBook;